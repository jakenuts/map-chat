import { useCallback, useEffect, useRef, useState } from 'react';
import { ThrottleManager, ThrottleConfig, ThrottleMetrics } from '../services/throttle';
import { logMessage } from '../utils/logging';

interface UseMapThrottleProps {
  config?: Partial<ThrottleConfig>;
  onError?: (error: Error) => void;
  onThrottle?: (queueSize: number) => void;
}

export const useMapThrottle = ({
  config,
  onError,
  onThrottle
}: UseMapThrottleProps = {}) => {
  const throttleManagerRef = useRef<ThrottleManager | null>(null);
  const [metrics, setMetrics] = useState<ThrottleMetrics>({
    activeOperations: 0,
    queueLength: 0,
    operationsPerSecond: 0,
    isCooling: false,
    performance: {
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      totalOperations: 0,
      throttledOperations: 0
    }
  });

  // Initialize throttle manager
  useEffect(() => {
    try {
      throttleManagerRef.current = new ThrottleManager({
        ...config,
        onThrottle: (queueSize: number) => {
          onThrottle?.(queueSize);
          logMessage('map_command', {
            type: 'operation_throttled',
            queueSize
          });
        }
      });

      logMessage('map_command', {
        type: 'throttle_manager_initialized',
        config
      });

      return () => {
        throttleManagerRef.current?.dispose();
        throttleManagerRef.current = null;
        logMessage('map_command', { type: 'throttle_manager_disposed' });
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'throttle_manager_initialization_error',
        error: errorMessage
      });
      onError?.(new Error(`Failed to initialize throttle manager: ${errorMessage}`));
      return undefined;
    }
  }, [config, onThrottle, onError]);

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      priority?: boolean;
      timeout?: number;
    }
  ): Promise<T> => {
    if (!throttleManagerRef.current) {
      throw new Error('Throttle manager not initialized');
    }

    try {
      let timeoutId: NodeJS.Timeout | undefined;
      const result = await Promise.race([
        throttleManagerRef.current.execute(operation),
        new Promise<never>((_, reject) => {
          if (options?.timeout) {
            timeoutId = setTimeout(() => {
              reject(new Error(`Operation timed out after ${options.timeout}ms`));
            }, options.timeout);
          }
        })
      ]);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      logMessage('map_command', {
        type: 'operation_completed',
        success: true
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'operation_error',
        error: errorMessage
      });
      onError?.(new Error(`Operation failed: ${errorMessage}`));
      throw error;
    }
  }, [onError]);

  const executeOperations = useCallback(async <T>(
    operations: Array<() => Promise<T>>,
    options?: {
      concurrency?: number;
      timeout?: number;
    }
  ): Promise<T[]> => {
    if (!throttleManagerRef.current) {
      throw new Error('Throttle manager not initialized');
    }

    try {
      const results: T[] = [];
      const errors: Error[] = [];

      // Process operations with throttling
      for (let i = 0; i < operations.length; i++) {
        try {
          const result = await executeOperation(operations[i], {
            timeout: options?.timeout
          });
          results.push(result);
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error('Unknown error'));
        }
      }

      if (errors.length > 0) {
        throw new Error(`${errors.length} operations failed: ${errors.map(e => e.message).join(', ')}`);
      }

      logMessage('map_command', {
        type: 'operations_completed',
        count: operations.length,
        success: true
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'operations_error',
        error: errorMessage
      });
      onError?.(new Error(`Operations failed: ${errorMessage}`));
      throw error;
    }
  }, [executeOperation, onError]);

  const updateMetrics = useCallback(() => {
    try {
      if (throttleManagerRef.current) {
        const newMetrics = throttleManagerRef.current.getMetrics();
        setMetrics(newMetrics);
        logMessage('map_command', {
          type: 'throttle_metrics_updated',
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

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return {
    executeOperation,
    executeOperations,
    metrics,
    updateMetrics,
    isInitialized: !!throttleManagerRef.current
  };
};
