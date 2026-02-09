/**
 * useDirector Hook
 * 
 * React hook for managing Director-Agent video generation projects.
 * Provides project creation, status tracking, and SSE event streaming.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  directorService,
  DirectorBrandContext,
  DirectorConfig,
  ProjectStatus,
  StartProjectResponse,
} from '../services/DirectorService';

// ============================================================================
// Types
// ============================================================================

export type DirectorPhase =
  | 'idle'
  | 'starting'
  | 'planning'
  | 'generating'
  | 'evaluating_local'
  | 'evaluating_global'
  | 'iterating'
  | 'rendering_final'
  | 'completed'
  | 'failed';

export interface DirectorEvent {
  id: string;
  type: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface DirectorThought {
  id: string;
  thought: string;
  phase: 'planning' | 'coordinating' | 'evaluating' | 'deciding';
  timestamp: number;
}

export interface DirectorState {
  projectId: string | null;
  phase: DirectorPhase;
  status: ProjectStatus | null;
  events: DirectorEvent[];
  thoughts: DirectorThought[];
  isConnected: boolean;
  error: string | null;
}

export interface UseDirectorResult {
  state: DirectorState;
  startProject: (brand: DirectorBrandContext, config?: DirectorConfig) => Promise<string>;
  refreshStatus: () => Promise<void>;
  cancelProject: () => Promise<void>;
  getVideoUrl: () => string | null;
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDirector(): UseDirectorResult {
  const [state, setState] = useState<DirectorState>({
    projectId: null,
    phase: 'idle',
    status: null,
    events: [],
    thoughts: [],
    isConnected: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const statusPollRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clean up SSE connection and polling
   */
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
  }, []);

  /**
   * Connect to SSE events for a project
   */
  const connectToEvents = useCallback((projectId: string) => {
    cleanup();

    const eventsUrl = directorService.getEventsUrl(projectId, true);
    const eventSource = new EventSource(eventsUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`[Director] SSE connected for project ${projectId}`);
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    eventSource.onerror = (err) => {
      console.error(`[Director] SSE error for project ${projectId}`, err);
      setState(prev => ({ ...prev, isConnected: false }));
    };

    // Handle connected event
    eventSource.addEventListener('connected', () => {
      console.log(`[Director] SSE stream started`);
    });

    // Handle director thinking events
    eventSource.addEventListener('director:thinking', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const thought: DirectorThought = {
          id: data.id || Date.now().toString(),
          thought: data.data?.thought || 'Thinking...',
          phase: data.data?.phase || 'planning',
          timestamp: data.timestamp || Date.now(),
        };
        setState(prev => ({
          ...prev,
          thoughts: [...prev.thoughts.slice(-49), thought], // Keep last 50
        }));
      } catch (e) {
        console.error('[Director] Failed to parse director:thinking event', e);
      }
    });

    // Handle director decision events
    eventSource.addEventListener('director:decision', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        // Normalize for frontend - ensure we have consistent structure
        const eventData = {
          ...data,
          payload: data.data || data.payload // Handle both for safety
        };
        setState(prev => ({
          ...prev,
          events: [...prev.events.slice(-99), eventData],
        }));
      } catch (e) {
        console.error('[Director] Failed to parse director:decision event', e);
      }
    });

    // Handle scene events
    const sceneEventTypes = [
      'scene:queued',
      'scene:generating',
      'scene:generated',
      'scene:rendering',
      'scene:rendered',
      'scene:error',
    ];

    for (const eventType of sceneEventTypes) {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          const eventData = {
            ...data,
            payload: data.data || data.payload
          };
          setState(prev => ({
            ...prev,
            events: [...prev.events.slice(-99), eventData],
          }));
        } catch (e) {
          console.error(`[Director] Failed to parse ${eventType} event`, e);
        }
      });
    }

    // Handle evaluation events
    eventSource.addEventListener('evaluation:started', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const eventData = {
          ...data,
          payload: data.data || data.payload
        };
        setState(prev => ({
          ...prev,
          events: [...prev.events.slice(-99), eventData],
        }));
      } catch (e) {
        console.error('[Director] Failed to parse evaluation:started event', e);
      }
    });

    eventSource.addEventListener('evaluation:completed', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const eventData = {
          ...data,
          payload: data.data || data.payload
        };
        setState(prev => ({
          ...prev,
          events: [...prev.events.slice(-99), eventData],
        }));
      } catch (e) {
        console.error('[Director] Failed to parse evaluation:completed event', e);
      }
    });

    // Handle render events
    eventSource.addEventListener('render:started', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const eventData = {
          ...data,
          payload: data.data || data.payload
        };
        setState(prev => ({
          ...prev,
          events: [...prev.events.slice(-99), eventData],
          phase: data.data?.phase === 'final' ? 'rendering_final' : prev.phase,
        }));
      } catch (e) {
        console.error('[Director] Failed to parse render:started event', e);
      }
    });

    eventSource.addEventListener('render:completed', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const eventData = {
          ...data,
          payload: data.data || data.payload
        };
        setState(prev => ({
          ...prev,
          events: [...prev.events.slice(-99), eventData],
        }));
      } catch (e) {
        console.error('[Director] Failed to parse render:completed event', e);
      }
    });

    // Handle director completion
    eventSource.addEventListener('director:completed', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const eventData = {
          ...data,
          payload: data.data || data.payload
        };
        setState(prev => ({
          ...prev,
          phase: 'completed',
          events: [...prev.events.slice(-99), eventData],
        }));
        cleanup();
      } catch (e) {
        console.error('[Director] Failed to parse director:completed event', e);
      }
    });

    // Handle director error
    eventSource.addEventListener('director:error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const eventData = {
          ...data,
          payload: data.data || data.payload
        };
        setState(prev => ({
          ...prev,
          phase: 'failed',
          error: data.data?.error || 'Unknown error',
          events: [...prev.events.slice(-99), eventData],
        }));
        cleanup();
      } catch (e) {
        console.error('[Director] Failed to parse director:error event', e);
      }
    });

    // Handle generic error event
    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.error('[Director] SSE error event:', data);
      } catch {
        // Ignore parse errors for error events
      }
    });
  }, [cleanup]);

  /**
   * Start status polling (fallback for SSE issues)
   */
  const startStatusPolling = useCallback((projectId: string) => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
    }

    const poll = async () => {
      try {
        const status = await directorService.getStatus(projectId);
        setState(prev => ({
          ...prev,
          status,
          phase: status.phase as DirectorPhase,
          error: status.error?.message || null,
        }));

        // Stop polling if completed or failed
        if (status.phase === 'completed' || status.phase === 'failed') {
          cleanup();
        }
      } catch (e) {
        console.error('[Director] Status poll error:', e);
      }
    };

    // Initial poll
    poll();

    // Poll every 2 seconds
    statusPollRef.current = setInterval(poll, 2000);
  }, [cleanup]);

  /**
   * Start a new project
   */
  const startProject = useCallback(async (
    brand: DirectorBrandContext,
    config?: DirectorConfig
  ): Promise<string> => {
    setState(prev => ({
      ...prev,
      phase: 'starting',
      error: null,
      events: [],
      thoughts: [],
      status: null,
    }));

    try {
      const response: StartProjectResponse = await directorService.startProject(brand, config);

      setState(prev => ({
        ...prev,
        projectId: response.projectId,
        phase: 'planning',
      }));

      // Connect to SSE events
      connectToEvents(response.projectId);

      // Start status polling as fallback
      startStatusPolling(response.projectId);

      return response.projectId;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to start project';
      setState(prev => ({
        ...prev,
        phase: 'failed',
        error: errorMessage,
      }));
      throw e;
    }
  }, [connectToEvents, startStatusPolling]);

  /**
   * Manually refresh project status
   */
  const refreshStatus = useCallback(async () => {
    if (!state.projectId) return;

    try {
      const status = await directorService.getStatus(state.projectId);
      setState(prev => ({
        ...prev,
        status,
        phase: status.phase as DirectorPhase,
        error: status.error?.message || null,
      }));
    } catch (e) {
      console.error('[Director] Failed to refresh status:', e);
    }
  }, [state.projectId]);

  /**
   * Cancel/delete the current project
   */
  const cancelProject = useCallback(async () => {
    if (!state.projectId) return;

    cleanup();

    try {
      await directorService.deleteProject(state.projectId);
    } catch (e) {
      console.error('[Director] Failed to delete project:', e);
    }

    setState({
      projectId: null,
      phase: 'idle',
      status: null,
      events: [],
      thoughts: [],
      isConnected: false,
      error: null,
    });
  }, [state.projectId, cleanup]);

  /**
   * Get video URL for completed project
   */
  const getVideoUrl = useCallback((): string | null => {
    if (!state.projectId || state.phase !== 'completed') {
      return null;
    }
    return directorService.getVideoUrl(state.projectId);
  }, [state.projectId, state.phase]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    cleanup();
    setState({
      projectId: null,
      phase: 'idle',
      status: null,
      events: [],
      thoughts: [],
      isConnected: false,
      error: null,
    });
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    state,
    startProject,
    refreshStatus,
    cancelProject,
    getVideoUrl,
    reset,
  };
}

// ============================================================================
// Convenience Hook for Status Only
// ============================================================================

export function useDirectorStatus(projectId: string | null) {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setStatus(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await directorService.getStatus(projectId);
      setStatus(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get status');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, isLoading, error, refresh };
}
