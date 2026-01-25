/**
 * useKeyboardShortcuts Hook
 * 
 * Handles keyboard shortcuts for the scene editor.
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  onPlayPause?: () => void;
  onExport?: () => void;
  onNextScene?: () => void;
  onPrevScene?: () => void;
}

/**
 * Hook to handle keyboard shortcuts in the editor.
 * 
 * Shortcuts:
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 * - Delete/Backspace: Delete selected scene(s)
 * - Cmd/Ctrl+A: Select all scenes
 * - Escape: Deselect all / close modal
 * - Space: Play/pause preview
 * - Cmd/Ctrl+E: Export video
 * - Arrow Left: Previous scene
 * - Arrow Right: Next scene
 */
export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  enabled: boolean = true
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (event.key === 'Escape' && handlers.onEscape) {
          handlers.onEscape();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl+Z - Undo
      if (cmdOrCtrl && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        handlers.onUndo?.();
        return;
      }

      // Cmd/Ctrl+Shift+Z - Redo
      if (cmdOrCtrl && event.shiftKey && event.key === 'z') {
        event.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Cmd/Ctrl+Y - Redo (Windows style)
      if (cmdOrCtrl && event.key === 'y') {
        event.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Delete/Backspace - Delete
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handlers.onDelete?.();
        return;
      }

      // Cmd/Ctrl+A - Select all
      if (cmdOrCtrl && event.key === 'a') {
        event.preventDefault();
        handlers.onSelectAll?.();
        return;
      }

      // Escape - Deselect / close
      if (event.key === 'Escape') {
        event.preventDefault();
        handlers.onEscape?.();
        return;
      }

      // Space - Play/pause
      if (event.key === ' ') {
        event.preventDefault();
        handlers.onPlayPause?.();
        return;
      }

      // Cmd/Ctrl+E - Export
      if (cmdOrCtrl && event.key === 'e') {
        event.preventDefault();
        handlers.onExport?.();
        return;
      }

      // Arrow Left - Previous scene
      if (event.key === 'ArrowLeft' && !cmdOrCtrl) {
        event.preventDefault();
        handlers.onPrevScene?.();
        return;
      }

      // Arrow Right - Next scene
      if (event.key === 'ArrowRight' && !cmdOrCtrl) {
        event.preventDefault();
        handlers.onNextScene?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Get keyboard shortcut display string.
 */
export function getShortcutDisplay(key: string, withCmd: boolean = false, withShift: boolean = false): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];
  
  if (withCmd) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (withShift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  
  // Map special keys
  const keyMap: Record<string, string> = {
    'Delete': isMac ? '⌫' : 'Del',
    'Backspace': '⌫',
    'Escape': 'Esc',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    ' ': 'Space',
  };
  
  parts.push(keyMap[key] || key.toUpperCase());
  
  return parts.join(isMac ? '' : '+');
}
