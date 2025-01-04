import { useCallback, useEffect } from 'react';
import { LayerGroup, MapState } from '../types';
import { logMessage } from '../utils/logging';

const STORAGE_KEY = 'map-chat-state';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

interface UseMapPersistenceProps {
  onStateLoad?: (state: MapState) => void;
  onStateError?: (error: Error) => void;
}

export const useMapPersistence = ({
  onStateLoad,
  onStateError
}: UseMapPersistenceProps = {}) => {
  const saveState = useCallback((state: MapState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      logMessage('map_command', { 
        type: 'state_saved',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logMessage('error', { 
        type: 'state_save_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      onStateError?.(error instanceof Error ? error : new Error('Failed to save state'));
    }
  }, [onStateError]);

  const loadState = useCallback((): MapState | null => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) return null;

      const state = JSON.parse(savedState) as MapState;
      logMessage('map_command', { 
        type: 'state_loaded',
        timestamp: new Date().toISOString()
      });
      onStateLoad?.(state);
      return state;
    } catch (error) {
      logMessage('error', { 
        type: 'state_load_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      onStateError?.(error instanceof Error ? error : new Error('Failed to load state'));
      return null;
    }
  }, [onStateLoad, onStateError]);

  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      logMessage('map_command', { type: 'state_cleared' });
    } catch (error) {
      logMessage('error', { 
        type: 'state_clear_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      onStateError?.(error instanceof Error ? error : new Error('Failed to clear state'));
    }
  }, [onStateError]);

  const exportToJson = useCallback((state: MapState): string => {
    return JSON.stringify(state, null, 2);
  }, []);

  const importFromJson = useCallback((json: string): MapState => {
    try {
      const state = JSON.parse(json) as MapState;
      logMessage('map_command', { type: 'state_imported' });
      return state;
    } catch (error) {
      logMessage('error', { 
        type: 'state_import_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error instanceof Error ? error : new Error('Failed to import state');
    }
  }, []);

  const setupAutoSave = useCallback((getState: () => MapState) => {
    let lastSavedState = '';
    
    const intervalId = setInterval(() => {
      const currentState = getState();
      const currentStateString = JSON.stringify(currentState);
      
      // Only save if state has changed
      if (currentStateString !== lastSavedState) {
        saveState(currentState);
        lastSavedState = currentStateString;
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, []); // Remove saveState dependency since it's stable

  return {
    saveState,
    loadState,
    clearState,
    exportToJson,
    importFromJson,
    setupAutoSave
  };
};
