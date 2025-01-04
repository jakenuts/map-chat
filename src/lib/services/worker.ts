import { logMessage } from '../utils/logging';
import { PerformanceMonitor } from './performance';

export interface WorkerMessage {
  type: string;
  payload: any;
  taskId: string;
}

export interface WorkerTask {
  id: string;
  type: string;
  data: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  startTime: number;
}

export interface WorkerMetrics {
  queueLength: number;
  activeWorkers: number;
  performance: {
    averageProcessingTime: number;
    maxProcessingTime: number;
    totalTasks: number;
    failedTasks: number;
  };
}

export class WorkerPool {
  private workers: Worker[];
  private queue: WorkerTask[];
  private active: Map<number, WorkerTask>;
  private metrics: PerformanceMonitor;

  constructor(workerScript: string, poolSize: number) {
    this.workers = Array.from(
      { length: poolSize },
      () => new Worker(workerScript)
    );
    this.queue = [];
    this.active = new Map();
    this.metrics = new PerformanceMonitor();

    this.workers.forEach((worker, index) => {
      worker.onmessage = (e) => this.handleMessage(index, e.data);
      worker.onerror = (e) => this.handleError(index, e);
    });

    logMessage('map_command', {
      type: 'worker_pool_initialized',
      poolSize
    });
  }

  private handleMessage(workerId: number, message: WorkerMessage) {
    try {
      const task = this.active.get(workerId);
      if (!task) {
        throw new Error(`No active task found for worker ${workerId}`);
      }

      if (message.taskId !== task.id) {
        throw new Error(`Task ID mismatch: expected ${task.id}, got ${message.taskId}`);
      }

      const duration = Date.now() - task.startTime;
      this.metrics.trackOperation('worker_task', duration, {
        workerId,
        taskType: task.type,
        success: true
      });

      this.active.delete(workerId);
      task.resolve(message.payload);
      this.processQueue();

      logMessage('map_command', {
        type: 'worker_task_completed',
        workerId,
        taskId: task.id,
        duration
      });
    } catch (error) {
      logMessage('error', {
        type: 'worker_message_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        workerId,
        message
      });
    }
  }

  private handleError(workerId: number, error: ErrorEvent) {
    try {
      const task = this.active.get(workerId);
      if (!task) {
        throw new Error(`No active task found for worker ${workerId}`);
      }

      const duration = Date.now() - task.startTime;
      this.metrics.trackOperation('worker_task', duration, {
        workerId,
        taskType: task.type,
        success: false,
        error: error.message
      });

      this.active.delete(workerId);
      task.reject(new Error(error.message));
      this.processQueue();

      logMessage('error', {
        type: 'worker_task_error',
        workerId,
        taskId: task.id,
        error: error.message,
        duration
      });
    } catch (error) {
      logMessage('error', {
        type: 'worker_error_handler_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        workerId
      });
    }
  }

  private processQueue() {
    try {
      while (this.queue.length > 0) {
        const availableWorker = this.workers.findIndex(
          (_, index) => !this.active.has(index)
        );

        if (availableWorker === -1) break;

        const task = this.queue.shift()!;
        this.active.set(availableWorker, task);

        const message: WorkerMessage = {
          type: task.type,
          payload: task.data,
          taskId: task.id
        };

        this.workers[availableWorker].postMessage(message);

        logMessage('map_command', {
          type: 'worker_task_started',
          workerId: availableWorker,
          taskId: task.id,
          taskType: task.type
        });
      }
    } catch (error) {
      logMessage('error', {
        type: 'process_queue_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  execute<T>(type: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const task: WorkerTask = {
          id: crypto.randomUUID(),
          type,
          data,
          resolve,
          reject,
          startTime: Date.now()
        };

        this.queue.push(task);
        this.processQueue();

        logMessage('map_command', {
          type: 'worker_task_queued',
          taskId: task.id,
          taskType: type,
          queueLength: this.queue.length
        });
      } catch (error) {
        logMessage('error', {
          type: 'execute_task_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          taskType: type
        });
        reject(error);
      }
    });
  }

  getMetrics(): WorkerMetrics {
    try {
      const report = this.metrics.getReport('worker_task');
      return {
        queueLength: this.queue.length,
        activeWorkers: this.active.size,
        performance: {
          averageProcessingTime: report.average,
          maxProcessingTime: report.max,
          totalTasks: report.count,
          failedTasks: report.thresholdViolations
        }
      };
    } catch (error) {
      logMessage('error', {
        type: 'get_metrics_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        queueLength: 0,
        activeWorkers: 0,
        performance: {
          averageProcessingTime: 0,
          maxProcessingTime: 0,
          totalTasks: 0,
          failedTasks: 0
        }
      };
    }
  }

  terminate() {
    try {
      this.workers.forEach(worker => worker.terminate());
      this.queue = [];
      this.active.clear();
      logMessage('map_command', { type: 'worker_pool_terminated' });
    } catch (error) {
      logMessage('error', {
        type: 'terminate_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
