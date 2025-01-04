import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerPool, WorkerMetrics } from '../services/worker';
import { logMessage } from '../utils/logging';

interface UseMapWorkerProps {
  workerScript: string;
  poolSize?: number;
  onError?: (error: Error) => void;
}

export const useMapWorker = ({
  workerScript,
  poolSize = navigator.hardwareConcurrency || 4,
  onError
}: UseMapWorkerProps) => {
  const workerPoolRef = useRef<WorkerPool | null>(null);
  const [metrics, setMetrics] = useState<WorkerMetrics>({
    queueLength: 0,
    activeWorkers: 0,
    performance: {
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      totalTasks: 0,
      failedTasks: 0
    }
  });

  // Initialize worker pool
  useEffect(() => {
    try {
      workerPoolRef.current = new WorkerPool(workerScript, poolSize);
      logMessage('map_command', {
        type: 'worker_pool_initialized',
        poolSize
      });

      return () => {
        workerPoolRef.current?.terminate();
        workerPoolRef.current = null;
        logMessage('map_command', { type: 'worker_pool_terminated' });
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'worker_pool_initialization_error',
        error: errorMessage
      });
      onError?.(new Error(`Failed to initialize worker pool: ${errorMessage}`));
      return undefined;
    }
  }, [workerScript, poolSize, onError]);

  const executeTask = useCallback(async <T>(
    type: string,
    data: any,
    options?: {
      priority?: boolean;
      timeout?: number;
    }
  ): Promise<T> => {
    if (!workerPoolRef.current) {
      throw new Error('Worker pool not initialized');
    }

    try {
      let timeoutId: NodeJS.Timeout | undefined;
      const result = await Promise.race([
        workerPoolRef.current.execute<T>(type, data),
        new Promise<never>((_, reject) => {
          if (options?.timeout) {
            timeoutId = setTimeout(() => {
              reject(new Error(`Task ${type} timed out after ${options.timeout}ms`));
            }, options.timeout);
          }
        })
      ]);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      logMessage('map_command', {
        type: 'worker_task_completed',
        taskType: type
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'worker_task_error',
        error: errorMessage,
        taskType: type
      });
      onError?.(new Error(`Worker task failed: ${errorMessage}`));
      throw error;
    }
  }, [onError]);

  const updateMetrics = useCallback(() => {
    try {
      if (workerPoolRef.current) {
        const newMetrics = workerPoolRef.current.getMetrics();
        setMetrics(newMetrics);
        logMessage('map_command', {
          type: 'worker_metrics_updated',
          metrics: newMetrics
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'update_metrics_error',
        error: errorMessage
      });
      onError?.(new Error(`Failed to update metrics: ${errorMessage}`));
    }
  }, [onError]);

  // Batch task execution
  const executeBatch = useCallback(async <T>(
    tasks: { type: string; data: any }[],
    options?: {
      concurrency?: number;
      timeout?: number;
    }
  ): Promise<T[]> => {
    if (!workerPoolRef.current) {
      throw new Error('Worker pool not initialized');
    }

    try {
      const concurrency = options?.concurrency || poolSize;
      const results: (T | null)[] = [];
      const errors: Error[] = [];

      // Process tasks in batches
      for (let i = 0; i < tasks.length; i += concurrency) {
        const batch = tasks.slice(i, i + concurrency);
        const batchPromises = batch.map(task =>
          executeTask<T>(task.type, task.data, {
            timeout: options?.timeout
          }).catch(error => {
            errors.push(error);
            return null;
          })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      if (errors.length > 0) {
        throw new Error(`${errors.length} tasks failed: ${errors.map(e => e.message).join(', ')}`);
      }

      logMessage('map_command', {
        type: 'batch_execution_completed',
        taskCount: tasks.length,
        successCount: results.length
      });

      return results.filter((result): result is T => result !== null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'batch_execution_error',
        error: errorMessage
      });
      onError?.(new Error(`Batch execution failed: ${errorMessage}`));
      throw error;
    }
  }, [executeTask, onError, poolSize]);

  return {
    executeTask,
    executeBatch,
    metrics,
    updateMetrics,
    isInitialized: !!workerPoolRef.current
  };
};
