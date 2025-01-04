import { logMessage } from '../utils/logging';
import { PerformanceMonitor } from './performance';

export interface BatchConfig {
  maxSize: number;
  maxDelay: number;
  retryAttempts: number;
  retryDelay: number;
  onProgress?: (progress: number) => void;
}

export interface BatchMetrics {
  currentBatchSize: number;
  isProcessing: boolean;
  performance: {
    averageProcessingTime: number;
    maxProcessingTime: number;
    totalBatches: number;
    failedBatches: number;
  };
}

interface BatchItem<T, R> {
  item: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  addedAt: number;
}

const DEFAULT_CONFIG: Required<Omit<BatchConfig, 'onProgress'>> = {
  maxSize: 100,
  maxDelay: 1000,
  retryAttempts: 3,
  retryDelay: 1000
};

export class BatchProcessor<T, R> {
  private batch: BatchItem<T, R>[];
  private timer: ReturnType<typeof setTimeout> | null;
  private processing: boolean;
  private metrics: PerformanceMonitor;
  private retryMap: Map<T, number>;
  private config: Required<BatchConfig>;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    config: Partial<BatchConfig> = {}
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      onProgress: config.onProgress || (() => {})
    };
    this.batch = [];
    this.timer = null;
    this.processing = false;
    this.metrics = new PerformanceMonitor();
    this.retryMap = new Map();

    logMessage('map_command', {
      type: 'batch_processor_initialized',
      config: this.config
    });
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      try {
        const batchItem: BatchItem<T, R> = {
          item,
          resolve,
          reject,
          addedAt: Date.now()
        };

        this.batch.push(batchItem);
        this.scheduleProcessing();

        logMessage('map_command', {
          type: 'item_added_to_batch',
          batchSize: this.batch.length
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logMessage('error', {
          type: 'add_to_batch_error',
          error: errorMessage
        });
        reject(new Error(`Failed to add item to batch: ${errorMessage}`));
      }
    });
  }

  private scheduleProcessing() {
    try {
      if (this.batch.length >= this.config.maxSize) {
        this.processBatch();
      } else if (!this.timer) {
        this.timer = setTimeout(() => {
          this.processBatch();
        }, this.config.maxDelay);
      }
    } catch (error) {
      logMessage('error', {
        type: 'schedule_processing_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async processBatch() {
    if (this.processing || this.batch.length === 0) return;

    this.processing = true;
    const items = [...this.batch];
    this.batch = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const startTime = Date.now();

    try {
      const itemsToProcess = items.map(item => item.item);
      const results = await this.processWithRetry(itemsToProcess);

      this.metrics.trackOperation('batch_process', Date.now() - startTime, {
        batchSize: items.length,
        success: true
      });

      items.forEach((item, index) => {
        try {
          item.resolve(results[index]);
        } catch (error) {
          logMessage('error', {
            type: 'resolve_item_error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      logMessage('map_command', {
        type: 'batch_processed',
        itemCount: items.length,
        duration: Date.now() - startTime
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.trackOperation('batch_error', Date.now() - startTime, {
        error: errorMessage,
        batchSize: items.length
      });

      items.forEach(item => {
        try {
          item.reject(new Error(`Batch processing failed: ${errorMessage}`));
        } catch (error) {
          logMessage('error', {
            type: 'reject_item_error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      logMessage('error', {
        type: 'process_batch_error',
        error: errorMessage,
        itemCount: items.length
      });
    } finally {
      this.processing = false;
      this.scheduleProcessing();
    }
  }

  private async processWithRetry(items: T[]): Promise<R[]> {
    let lastError: Error | null = null;
    let attempt = 1;
    const maxAttempts = this.config.retryAttempts;

    while (attempt <= maxAttempts) {
      try {
        const startTime = Date.now();
        const results = await this.processor(items);

        if (attempt > 1) {
          this.metrics.trackOperation('retry_success', Date.now() - startTime, {
            attempt,
            itemCount: items.length
          });
        }

        return results;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        this.metrics.trackOperation('retry_attempt', 0, {
          attempt,
          error: lastError.message,
          itemCount: items.length
        });

        if (attempt < maxAttempts) {
          const delay = this.config.retryDelay * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('Processing failed after retries');
  }

  getMetrics(): BatchMetrics {
    try {
      const report = this.metrics.getReport('batch_process');
      return {
        currentBatchSize: this.batch.length,
        isProcessing: this.processing,
        performance: {
          averageProcessingTime: report.average,
          maxProcessingTime: report.max,
          totalBatches: report.count,
          failedBatches: report.thresholdViolations
        }
      };
    } catch (error) {
      logMessage('error', {
        type: 'get_metrics_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        currentBatchSize: 0,
        isProcessing: false,
        performance: {
          averageProcessingTime: 0,
          maxProcessingTime: 0,
          totalBatches: 0,
          failedBatches: 0
        }
      };
    }
  }

  dispose() {
    try {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.batch = [];
      this.processing = false;
      this.retryMap.clear();
      logMessage('map_command', { type: 'batch_processor_disposed' });
    } catch (error) {
      logMessage('error', {
        type: 'dispose_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
