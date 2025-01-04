import { useState, useCallback } from 'react';
import { GeoJSONFeature, Layer, LayerGroup } from '../types';
import { logMessage } from '../utils/logging';

export type OperationType = 'create' | 'modify' | 'delete' | 'style' | 'move';

interface MapOperation {
  type: OperationType;
  layerId: string;
  feature?: GeoJSONFeature;
  previousState?: any;
  newState?: any;
  timestamp: number;
}

interface UseMapHistoryProps {
  onUndo?: (operation: MapOperation) => void;
  onRedo?: (operation: MapOperation) => void;
  maxHistorySize?: number;
}

export const useMapHistory = ({
  onUndo,
  onRedo,
  maxHistorySize = 50
}: UseMapHistoryProps = {}) => {
  const [undoStack, setUndoStack] = useState<MapOperation[]>([]);
  const [redoStack, setRedoStack] = useState<MapOperation[]>([]);

  const pushOperation = useCallback((operation: Omit<MapOperation, 'timestamp'>) => {
    const newOperation = {
      ...operation,
      timestamp: Date.now()
    };

    setUndoStack(prev => {
      const newStack = [...prev, newOperation];
      if (newStack.length > maxHistorySize) {
        newStack.shift(); // Remove oldest operation
      }
      return newStack;
    });

    // Clear redo stack when new operation is performed
    setRedoStack([]);

    logMessage('map_command', {
      type: 'operation_recorded',
      operation: newOperation
    });
  }, [maxHistorySize]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const operation = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, operation]);

    onUndo?.(operation);
    logMessage('map_command', {
      type: 'operation_undone',
      operation
    });
  }, [undoStack, onUndo]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const operation = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, operation]);

    onRedo?.(operation);
    logMessage('map_command', {
      type: 'operation_redone',
      operation
    });
  }, [redoStack, onRedo]);

  const recordCreate = useCallback((layerId: string, feature: GeoJSONFeature) => {
    pushOperation({
      type: 'create',
      layerId,
      feature,
      newState: feature
    });
  }, [pushOperation]);

  const recordModify = useCallback((
    layerId: string,
    feature: GeoJSONFeature,
    previousState: any,
    newState: any
  ) => {
    pushOperation({
      type: 'modify',
      layerId,
      feature,
      previousState,
      newState
    });
  }, [pushOperation]);

  const recordDelete = useCallback((
    layerId: string,
    feature: GeoJSONFeature
  ) => {
    pushOperation({
      type: 'delete',
      layerId,
      feature,
      previousState: feature
    });
  }, [pushOperation]);

  const recordStyle = useCallback((
    layerId: string,
    feature: GeoJSONFeature,
    previousStyle: L.PathOptions,
    newStyle: L.PathOptions
  ) => {
    pushOperation({
      type: 'style',
      layerId,
      feature,
      previousState: previousStyle,
      newState: newStyle
    });
  }, [pushOperation]);

  const recordMove = useCallback((
    layerId: string,
    feature: GeoJSONFeature,
    previousCoords: number[][],
    newCoords: number[][]
  ) => {
    pushOperation({
      type: 'move',
      layerId,
      feature,
      previousState: previousCoords,
      newState: newCoords
    });
  }, [pushOperation]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    logMessage('map_command', { type: 'history_cleared' });
  }, []);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undo,
    redo,
    recordCreate,
    recordModify,
    recordDelete,
    recordStyle,
    recordMove,
    clearHistory,
    undoStackSize: undoStack.length,
    redoStackSize: redoStack.length
  };
};
