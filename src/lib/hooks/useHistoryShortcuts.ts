import { useEffect, useCallback } from 'react';
import { logMessage } from '../utils/logging';

interface UseHistoryShortcutsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  enabled?: boolean;
}

export const useHistoryShortcuts = ({
  onUndo,
  onRedo,
  enabled = true
}: UseHistoryShortcutsProps = {}) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore key events when typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Check for undo/redo shortcuts
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          onUndo?.();
          logMessage('map_command', { type: 'shortcut_undo' });
          break;
        case 'y':
          event.preventDefault();
          onRedo?.();
          logMessage('map_command', { type: 'shortcut_redo' });
          break;
      }
    }
    // Alternative redo shortcut (Ctrl+Shift+Z)
    else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      onRedo?.();
      logMessage('map_command', { type: 'shortcut_redo' });
    }
  }, [enabled, onUndo, onRedo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const getShortcutHint = useCallback((action: string): string => {
    switch (action.toLowerCase()) {
      case 'undo':
        return '(Ctrl+Z)';
      case 'redo':
        return '(Ctrl+Y or Ctrl+Shift+Z)';
      default:
        return '';
    }
  }, []);

  return {
    getShortcutHint
  };
};
