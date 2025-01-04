import { useCallback, useEffect, useRef, useState } from 'react';
import { PerformanceMonitor, PerformanceReport, ThresholdViolation } from '../services/performance';
import { logMessage } from '../utils/logging';

interface UseMapPerformanceProps {
  thresholds?: Record<string, number>;
  onViolation?: (violation: ThresholdViolation) => void;
}

export const useMapPerformance = ({
  thresholds = {},
  onViolation
}: UseMapPerformanceProps = {}) => {
  const monitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor());
  const [reports, setReports] = useState<Record<string, PerformanceReport>>({});

  // Initialize thresholds
  useEffect(() => {
    Object.entries(thresholds).forEach(([name, threshold]) => {
      monitorRef.current.setThreshold(name, threshold);
    });
  }, [thresholds]);

  // Set up violation listener
  useEffect(() => {
    if (onViolation) {
      monitorRef.current.addListener(onViolation);
      return () => monitorRef.current.removeListener(onViolation);
    }
  }, [onViolation]);

  const trackOperation = useCallback(<T>(
    name: string,
    operation: () => T,
    metadata?: any
  ): T => {
    try {
      const startTime = performance.now();
      const result = operation();
      const duration = performance.now() - startTime;

      monitorRef.current.trackOperation(name, duration, metadata);
      return result;
    } catch (error) {
      logMessage('error', {
        type: 'track_operation_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        name
      });
      throw error;
    }
  }, []);

  const trackAsyncOperation = useCallback(<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();

      operation()
        .then(result => {
          const duration = performance.now() - startTime;
          monitorRef.current.trackOperation(name, duration, metadata);
          resolve(result);
        })
        .catch(error => {
          const duration = performance.now() - startTime;
          monitorRef.current.trackOperation(name, duration, {
            ...metadata,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          reject(error);
        });
    });
  }, []);

  const getReport = useCallback((name: string): PerformanceReport => {
    try {
      return monitorRef.current.getReport(name);
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
  }, []);

  const updateReports = useCallback(() => {
    try {
      const allReports = monitorRef.current.getAllReports();
      setReports(allReports);
      logMessage('map_command', {
        type: 'performance_reports_updated',
        reportCount: Object.keys(allReports).length
      });
    } catch (error) {
      logMessage('error', {
        type: 'update_reports_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  const clearMetrics = useCallback((name?: string) => {
    try {
      monitorRef.current.clearMetrics(name);
      updateReports();
      logMessage('map_command', {
        type: 'metrics_cleared',
        name: name || 'all'
      });
    } catch (error) {
      logMessage('error', {
        type: 'clear_metrics_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        name
      });
    }
  }, [updateReports]);

  // Performance monitoring wrappers
  const withPerformance = useCallback(<T>(
    name: string,
    operation: () => T,
    metadata?: any
  ): T => {
    return trackOperation(name, operation, metadata);
  }, [trackOperation]);

  const withAsyncPerformance = useCallback(<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: any
  ): Promise<T> => {
    return trackAsyncOperation(name, operation, metadata);
  }, [trackAsyncOperation]);

  return {
    reports,
    trackOperation,
    trackAsyncOperation,
    getReport,
    updateReports,
    clearMetrics,
    withPerformance,
    withAsyncPerformance
  };
};
