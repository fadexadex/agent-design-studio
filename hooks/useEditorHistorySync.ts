/**
 * useEditorHistorySync Hook
 * 
 * Synchronizes editor state changes to localStorage history.
 * Captures scene edits, version history, and undo/redo stacks.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useHistory } from '../contexts/HistoryContext';
import type { EditorState, EditorScene } from '../services/editorService';
import type { HistorySession, HistoryScene, EditorSnapshot, SceneVersion } from '../types/history';

interface UseEditorHistorySyncOptions {
  /** Debounce interval in ms for updates (default: 2000) */
  debounceMs?: number;
}

/**
 * Convert EditorScene to HistoryScene
 */
function mapEditorSceneToHistory(scene: EditorScene): HistoryScene {
  // Map versions
  const versions: SceneVersion[] = scene.versions?.map(v => ({
    id: v.id,
    timestamp: typeof v.timestamp === 'string' ? v.timestamp : v.timestamp.toISOString(),
    prompt: v.prompt,
    codeSnapshot: v.codeSnapshot,
    previewUrl: v.previewUrl,
  })) || [];

  return {
    id: scene.id,
    sceneNumber: scene.sceneNumber,
    title: scene.title || `Scene ${scene.sceneNumber}`,
    description: scene.description,
    frameRange: scene.frameRange,
    keyElements: [],
    status: scene.status === 'ready' ? 'complete' : scene.status === 'error' ? 'error' : 'generating',
    code: undefined, // Don't store code in history to save space
    codeFilePath: scene.codeFilePath,
    previewUrl: scene.previewUrl,
    versions,
    currentVersionId: scene.currentVersionId,
  };
}

/**
 * Hook to sync editor state to history
 */
export function useEditorHistorySync(
  jobId: string | null,
  editorState: EditorState | null,
  options: UseEditorHistorySyncOptions = {}
) {
  const { debounceMs = 2000 } = options;
  const { updateSession, getSessionById } = useHistory();
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Sync editor state to history
  const syncToHistory = useCallback((state: EditorState) => {
    if (!jobId) return;

    const session = getSessionById(jobId);
    if (!session) {
      console.warn(`[EditorHistorySync] Session ${jobId} not found`);
      return;
    }

    const now = new Date().toISOString();

    // Convert editor scenes to history scenes
    const updatedScenes = state.scenes.map(mapEditorSceneToHistory);

    // Build editor snapshot
    // Note: undoStack and redoStack are typed as unknown[] in EditorState
    // We only store metadata, not full state
    const editorSnapshot: EditorSnapshot = {
      scenes: updatedScenes,
      undoStack: (state.undoStack || []).map((op: any) => ({
        id: op?.id || '',
        type: op?.type || 'edit',
        sceneIds: op?.sceneIds || [],
        previousState: [],
        newState: [],
        timestamp: typeof op?.timestamp === 'string' ? op.timestamp : new Date().toISOString(),
        description: op?.description,
      })),
      redoStack: (state.redoStack || []).map((op: any) => ({
        id: op?.id || '',
        type: op?.type || 'edit',
        sceneIds: op?.sceneIds || [],
        previousState: [],
        newState: [],
        timestamp: typeof op?.timestamp === 'string' ? op.timestamp : new Date().toISOString(),
        description: op?.description,
      })),
      selectedSceneIds: state.selectedSceneIds || [],
      lastEditedAt: now,
    };

    // Build updates
    const updates: Partial<HistorySession> = {
      updatedAt: now,
      scenes: updatedScenes,
      editorSnapshot,
    };

    // Update output video path if export is complete
    if (state.exportStatus === 'complete' && state.exportedVideoPath) {
      updates.outputVideoPath = state.exportedVideoPath;
      updates.status = 'complete';
    }

    updateSession(jobId, updates);
  }, [jobId, getSessionById, updateSession]);

  // Effect to sync state changes with debounce
  useEffect(() => {
    if (!editorState || !jobId) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Clear any pending update
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= debounceMs) {
      lastUpdateRef.current = now;
      syncToHistory(editorState);
    } else {
      // Schedule update for later
      pendingUpdateRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        syncToHistory(editorState);
      }, debounceMs - timeSinceLastUpdate);
    }

    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, [editorState, jobId, debounceMs, syncToHistory]);

  // Always sync on export complete (no debounce)
  useEffect(() => {
    if (!editorState || !jobId) return;

    if (editorState.exportStatus === 'complete') {
      syncToHistory(editorState);
    }
  }, [editorState?.exportStatus, jobId, syncToHistory]);
}
