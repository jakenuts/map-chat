import { useCallback, useEffect, useRef, useState } from 'react';
import { BatchProcessor, BatchConfig, BatchMetrics } from '../services/batch';
import { logMessage } from '../utils/logging';

interface UseMapBatchProps<T, R> {
  processor: (items: T[]) => Promise<R[]>;
  config?: Partial<BatchConfig>;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export const useMapBatch = <T, R>({
  processor,
  config,
  onError,
  onProgress
}: UseMapBatchProps<T, R>) => {
  const batchProcessorRef = useRef<BatchProcessor<T, R> | null>(null);
  const [metrics, setMetrics] = useState<BatchMetrics>({
    currentBatchSize: 0,
    isProcessing: false,
    performance: {
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      totalBatches: 0,
      failedBatches: 0
    }
  });

  // Initialize batch processor
  useEffect(() => {
    try {
      batchProcessorRef.current = new BatchProcessor(processor, {
        ...config,
        onProgress
      });

      logMessage('map_command', {
        type: 'batch_processor_initialized',
        config
      });

      return () => {
        batchProcessorRef.current?.dispose();
        batchProcessorRef.current = null;
        logMessage('map_command', { type: 'batch_processor_disposed' });
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'batch_processor_initialization_error',
        error: errorMessage
      });
      onError?.(new Error(`Failed to initialize batch processor: ${errorMessage}`));
      return undefined;
    }
  }, [processor, config, onProgress, onError]);

  const addItem = useCallback(async (item: T): Promise<R> => {
    if (!batchProcessorRef.current) {
      throw new Error('Batch processor not initialized');
    }

    try {
      const result = await batchProcessorRef.current.add(item);
      logMessage('map_command', {
        type: 'item_processed',
        success: true
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'item_processing_error',
        error: errorMessage
      });
      onError?.(new Error(`Failed to process item: ${errorMessage}`));
      throw error;
    }
  }, [onError]);

  const addItems = useCallback(async (items: T[]): Promise<R[]> => {
    if (!batchProcessorRef.current) {
      throw new Error('Batch processor not initialized');
    }

    try {
      const results = await Promise.all(items.map(item => addItem(item)));
      logMessage('map_command', {
        type: 'items_processed',
        count: items.length,
        success: true
      });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logMessage('error', {
        type: 'items_processing_error',
        error: errorMessage,
        count: items.length
      });
      onError?.(new Error(`Failed to process items: ${errorMessage}`));
      throw error;
    }
  }, [addItem, onError]);

  const updateMetrics = useCallback(() => {
    try {
      if (batchProcessorRef.current) {
        const newMetrics = batchProcessorRef.current.getMetrics();
        setMetrics(newMetrics);
        logMessage('map_command', {
          type: 'batch_metrics_updated',
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
    addItem,
    addItems,
    metrics,
    updateMetrics,
    isInitialized: !!batchProcessorRef.current
  };
};
