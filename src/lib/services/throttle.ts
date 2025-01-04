import { logMessage } from '../utils/logging';
import { PerformanceMonitor } from './performance';

export interface ThrottleConfig {
  maxConcurrent: number;
  maxPerSecond: number;
  maxBurstSize: number;
  cooldownPeriod: number;
  onThrottle?: (queueSize: number) => void;
}

export interface ThrottleMetrics {
  activeOperations: number;
  queueLength: number;
  operationsPerSecond: number;
  isCooling: boolean;
  performance: {
    averageProcessingTime: number;
    maxProcessingTime: number;
    totalOperations: number;
    throttledOperations: number;
  };
}

const DEFAULT_CONFIG: Required<Omit<ThrottleConfig, 'onThrottle'>> = {
  maxConcurrent: 5,
  maxPerSecond: 10,
  maxBurstSize: 20,
  cooldownPeriod: 1000
};

export class ThrottleManager {
  private active: number;
  private queue: Array<() => void>;
  private lastExecutions: number[];
  private cooldown: boolean;
  private metrics: PerformanceMonitor;
  private config: Required<ThrottleConfig>;

  constructor(config: Partial<ThrottleConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      onThrottle: config.onThrottle || (() => {})
    };
    this.active = 0;
    this.queue = [];
    this.lastExecutions = [];
    this.cooldown = false;
    this.metrics = new PerformanceMonitor();

    logMessage('map_command', {
      type: 'throttle_manager_initialized',
      config: this.config
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.shouldThrottle()) {
      await this.waitForCapacity();
    }

    this.active++;
    this.lastExecutions.push(Date.now());
    const startTime = Date.now();

    try {
      const result = await operation();
      this.metrics.trackOperation('throttled_operation', Date.now() - startTime, {
        success: true
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.trackOperation('throttle_error', Date.now() - startTime, {
        error: errorMessage
      });
      throw error;
    } finally {
      this.active--;
      this.processQueue();
    }
  }

  private shouldThrottle(): boolean {
    try {
      const now = Date.now();
      this.lastExecutions = this.lastExecutions.filter(
        time => now - time < 1000
      );

      const shouldThrottle = (
        this.active >= this.config.maxConcurrent ||
        this.lastExecutions.length >= this.config.maxPerSecond ||
        this.cooldown
      );

      if (shouldThrottle) {
        logMessage('map_command', {
          type: 'operation_throttled',
          active: this.active,
          executionsPerSecond: this.lastExecutions.length,
          isCooling: this.cooldown
        });
      }

      return shouldThrottle;
    } catch (error) {
      logMessage('error', {
        type: 'throttle_check_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return true; // Throttle on error to be safe
    }
  }

  private async waitForCapacity(): Promise<void> {
    return new Promise(resolve => {
      try {
        this.queue.push(resolve);
        this.config.onThrottle?.(this.queue.length);

        logMessage('map_command', {
          type: 'waiting_for_capacity',
          queueLength: this.queue.length
        });
      } catch (error) {
        logMessage('error', {
          type: 'wait_for_capacity_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private processQueue() {
    try {
      while (this.queue.length > 0 && !this.shouldThrottle()) {
        const next = this.queue.shift();
        next?.();
      }

      if (this.lastExecutions.length >= this.config.maxBurstSize && !this.cooldown) {
        this.cooldown = true;
        logMessage('map_command', {
          type: 'cooldown_started',
          burstSize: this.lastExecutions.length
        });

        setTimeout(() => {
          this.cooldown = false;
          logMessage('map_command', { type: 'cooldown_ended' });
          this.processQueue();
        }, this.config.cooldownPeriod);
      }
    } catch (error) {
      logMessage('error', {
        type: 'process_queue_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getMetrics(): ThrottleMetrics {
    try {
      const report = this.metrics.getReport('throttled_operation');
      return {
        activeOperations: this.active,
        queueLength: this.queue.length,
        operationsPerSecond: this.lastExecutions.length,
        isCooling: this.cooldown,
        performance: {
          averageProcessingTime: report.average,
          maxProcessingTime: report.max,
          totalOperations: report.count,
          throttledOperations: report.thresholdViolations
        }
      };
    } catch (error) {
      logMessage('error', {
        type: 'get_metrics_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
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
      };
    }
  }

  dispose() {
    try {
      this.queue = [];
      this.lastExecutions = [];
      this.active = 0;
      this.cooldown = false;
      logMessage('map_command', { type: 'throttle_manager_disposed' });
    } catch (error) {
      logMessage('error', {
        type: 'dispose_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
