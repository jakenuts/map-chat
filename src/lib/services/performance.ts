import { logMessage } from '../utils/logging';

export interface Metric {
  timestamp: number;
  duration: number;
  metadata?: any;
  threshold?: number;
}

export interface PerformanceReport {
  name: string;
  count: number;
  average: number;
  p95: number;
  min: number;
  max: number;
  thresholdViolations: number;
}

export interface ThresholdViolation {
  type: 'threshold_violation';
  metric: Metric;
}

export class PerformanceMonitor {
  private metrics: Map<string, Metric[]>;
  private thresholds: Map<string, number>;
  private listeners: Set<(report: ThresholdViolation) => void>;

  constructor() {
    this.metrics = new Map();
    this.thresholds = new Map();
    this.listeners = new Set();
  }

  trackOperation(name: string, duration: number, metadata?: any) {
    try {
      const metric: Metric = {
        timestamp: Date.now(),
        duration,
        metadata,
        threshold: this.thresholds.get(name)
      };

      const metrics = this.metrics.get(name) || [];
      metrics.push(metric);
      this.metrics.set(name, metrics);

      logMessage('map_command', {
        type: 'operation_tracked',
        name,
        duration,
        metadata
      });

      if (this.isThresholdViolated(metric)) {
        const violation: ThresholdViolation = {
          type: 'threshold_violation',
          metric
        };
        this.notifyListeners(violation);
        logMessage('map_command', {
          type: 'threshold_violation',
          name,
          duration,
          threshold: metric.threshold
        });
      }
    } catch (error) {
      logMessage('error', {
        type: 'track_operation_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        name
      });
    }
  }

  private isThresholdViolated(metric: Metric): boolean {
    return !!metric.threshold && metric.duration > metric.threshold;
  }

  private notifyListeners(violation: ThresholdViolation) {
    this.listeners.forEach(listener => {
      try {
        listener(violation);
      } catch (error) {
        logMessage('error', {
          type: 'listener_notification_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private calculateAverage(metrics: Metric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + metric.duration, 0);
    return sum / metrics.length;
  }

  private calculatePercentile(metrics: Metric[], percentile: number): number {
    if (metrics.length === 0) return 0;
    const sorted = metrics.map(m => m.duration).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private calculateMin(metrics: Metric[]): number {
    if (metrics.length === 0) return 0;
    return Math.min(...metrics.map(m => m.duration));
  }

  private calculateMax(metrics: Metric[]): number {
    if (metrics.length === 0) return 0;
    return Math.max(...metrics.map(m => m.duration));
  }

  private countViolations(metrics: Metric[]): number {
    return metrics.filter(this.isThresholdViolated.bind(this)).length;
  }

  getReport(name: string): PerformanceReport {
    try {
      const metrics = this.metrics.get(name) || [];
      const report = {
        name,
        count: metrics.length,
        average: this.calculateAverage(metrics),
        p95: this.calculatePercentile(metrics, 95),
        min: this.calculateMin(metrics),
        max: this.calculateMax(metrics),
        thresholdViolations: this.countViolations(metrics)
      };

      logMessage('map_command', {
        type: 'performance_report',
        name,
        report
      });

      return report;
    } catch (error) {
      logMessage('error', {
        type: 'get_report_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        name
      });
      return {
        name,
        count: 0,
        average: 0,
        p95: 0,
        min: 0,
        max: 0,
        thresholdViolations: 0
      };
    }
  }

  getAllReports(): Record<string, PerformanceReport> {
    try {
      const reports: Record<string, PerformanceReport> = {};
      for (const name of this.metrics.keys()) {
        reports[name] = this.getReport(name);
      }
      return reports;
    } catch (error) {
      logMessage('error', {
        type: 'get_all_reports_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  setThreshold(name: string, threshold: number) {
    try {
      this.thresholds.set(name, threshold);
      logMessage('map_command', {
        type: 'threshold_set',
        name,
        threshold
      });
    } catch (error) {
      logMessage('error', {
        type: 'set_threshold_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        name,
        threshold
      });
    }
  }

  addListener(listener: (violation: ThresholdViolation) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (violation: ThresholdViolation) => void) {
    this.listeners.delete(listener);
  }

  clearMetrics(name?: string) {
    try {
      if (name) {
        this.metrics.delete(name);
        logMessage('map_command', {
          type: 'metrics_cleared',
          name
        });
      } else {
        this.metrics.clear();
        logMessage('map_command', {
          type: 'all_metrics_cleared'
        });
      }
    } catch (error) {
      logMessage('error', {
        type: 'clear_metrics_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        name
      });
    }
  }
}
