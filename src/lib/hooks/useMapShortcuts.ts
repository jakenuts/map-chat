import { useEffect, useCallback } from 'react';
import { logMessage } from '../utils/logging';

interface ShortcutHandlers {
  onMeasure?: () => void;
  onBuffer?: () => void;
  onLayers?: () => void;
  onCancel?: () => void;
}

export const useMapShortcuts = ({
  onMeasure,
  onBuffer,
  onLayers,
  onCancel
}: ShortcutHandlers) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Ignore key events when typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'm':
        onMeasure?.();
        logMessage('map_command', { type: 'shortcut_measure' });
        break;
      case 'b':
        onBuffer?.();
        logMessage('map_command', { type: 'shortcut_buffer' });
        break;
      case 'l':
        onLayers?.();
        logMessage('map_command', { type: 'shortcut_layers' });
        break;
      case 'escape':
        onCancel?.();
        logMessage('map_command', { type: 'shortcut_cancel' });
        break;
    }
  }, [onMeasure, onBuffer, onLayers, onCancel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const getShortcutHint = useCallback((action: string): string => {
    switch (action.toLowerCase()) {
      case 'measure':
        return '(M)';
      case 'buffer':
        return '(B)';
      case 'layers':
        return '(L)';
      case 'cancel':
        return '(Esc)';
      default:
        return '';
    }
  }, []);

  return {
    getShortcutHint
  };
};
