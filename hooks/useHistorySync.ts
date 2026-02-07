/**
 * useHistorySync Hook
 * 
 * Synchronizes workflow state changes to localStorage history.
 * Should be called alongside useWorkflowStream to persist state.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useHistory } from '../contexts/HistoryContext';
import type { WorkflowState, SceneRenderStatus, AgentThought } from '../types';
import type { HistorySession, HistoryScene, WorkflowSnapshot } from '../types/history';

interface UseHistorySyncOptions {
  /** Debounce interval in ms for updates (default: 1000) */
  debounceMs?: number;
  /** Whether to save generated code content (can be large) */
  saveCodeContent?: boolean;
}

/**
 * Convert SceneRenderStatus to HistoryScene updates
 */
function mapSceneStatus(status: SceneRenderStatus): Partial<HistoryScene> {
  return {
    status: status.status === 'rendering' ? 'generating' : status.status,
    previewUrl: status.previewUrl,
  };
}

/**
 * Convert WorkflowState to WorkflowSnapshot for history
 */
function mapWorkflowSnapshot(state: WorkflowState): WorkflowSnapshot {
  return {
    currentPhase: state.currentPhase,
    plan: state.plan,
    rounds: state.rounds.map(round => ({
      ...round,
      // Optionally strip large code content
      files: round.files.map(f => ({
        filePath: f.filePath,
        content: '', // Don't store full code in history by default
        sceneId: f.sceneId,
      })),
    })),
    currentRound: state.currentRound,
    maxRounds: state.maxRounds,
    progress: state.progress,
    checkpoints: state.checkpoints,
  };
}

/**
 * Hook to sync workflow state to history
 */
export function useHistorySync(
  jobId: string | null,
  workflowState: WorkflowState | null,
  options: UseHistorySyncOptions = {}
) {
  const { debounceMs = 1000, saveCodeContent = false } = options;
  const { updateSession, getSessionById } = useHistory();
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced update function
  const syncToHistory = useCallback((state: WorkflowState) => {
    if (!jobId) return;

    const session = getSessionById(jobId);
    if (!session) {
      console.warn(`[HistorySync] Session ${jobId} not found`);
      return;
    }

    // Build updates
    const now = new Date().toISOString();
    
    // Determine session status
    let status: HistorySession['status'] = 'in_progress';
    if (state.currentPhase === 'complete') {
      status = 'complete';
    } else if (state.currentPhase === 'error') {
      status = 'error';
    }

    // Update scenes from sceneStatuses
    let updatedScenes = [...session.scenes];
    if (state.sceneStatuses) {
      state.sceneStatuses.forEach(sceneStatus => {
        const idx = updatedScenes.findIndex(s => s.id === sceneStatus.sceneId);
        if (idx >= 0) {
          updatedScenes[idx] = {
            ...updatedScenes[idx],
            ...mapSceneStatus(sceneStatus),
          };
        }
      });
    }

    // Update scene code from rounds if available and enabled
    if (saveCodeContent && state.rounds.length > 0) {
      const latestRound = state.rounds[state.rounds.length - 1];
      latestRound.files.forEach(file => {
        if (file.sceneId) {
          const idx = updatedScenes.findIndex(s => s.id === file.sceneId);
          if (idx >= 0) {
            updatedScenes[idx] = {
              ...updatedScenes[idx],
              code: file.content,
              codeFilePath: file.filePath,
            };
          }
        }
      });
    }

    // Calculate completed scenes
    const sceneCount = updatedScenes.length;

    // Build the update object
    const updates: Partial<HistorySession> = {
      status,
      updatedAt: now,
      workflow: mapWorkflowSnapshot(state),
      scenes: updatedScenes,
      thoughts: state.thoughts,
      summary: {
        ...session.summary,
        sceneCount,
      },
    };

    // Add video path if complete
    if (state.outputVideoPath) {
      updates.outputVideoPath = state.outputVideoPath;
    }

    updateSession(jobId, updates);
  }, [jobId, getSessionById, updateSession, saveCodeContent]);

  // Effect to sync state changes
  useEffect(() => {
    if (!workflowState || !jobId) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Clear any pending update
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= debounceMs) {
      lastUpdateRef.current = now;
      syncToHistory(workflowState);
    } else {
      // Schedule update for later
      pendingUpdateRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        syncToHistory(workflowState);
      }, debounceMs - timeSinceLastUpdate);
    }

    // Cleanup
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, [workflowState, jobId, debounceMs, syncToHistory]);

  // Always sync on complete or error (no debounce)
  useEffect(() => {
    if (!workflowState || !jobId) return;

    if (
      workflowState.currentPhase === 'complete' ||
      workflowState.currentPhase === 'error'
    ) {
      // Force immediate sync
      syncToHistory(workflowState);
    }
  }, [workflowState?.currentPhase, jobId, syncToHistory]);
}
