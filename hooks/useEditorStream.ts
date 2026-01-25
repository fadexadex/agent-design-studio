/**
 * useEditorStream Hook
 * 
 * Manages SSE connection for real-time editor updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  EditorState,
  EditorScene,
  EditorSSEEvent,
  SceneStatus,
  createEditorStream,
  fetchEditorState,
} from '../services/editorService';

export interface UseEditorStreamResult {
  // State
  state: EditorState | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Thinking/progress
  thinkingMessage: string | null;
  thinkingDetail: string | null;
  
  // Actions
  refreshState: () => Promise<void>;
  updateSceneLocally: (sceneId: string, updates: Partial<EditorScene>) => void;
  setSelectedScenes: (sceneIds: string[]) => void;
}

export function useEditorStream(jobId: string): UseEditorStreamResult {
  const [state, setState] = useState<EditorState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);
  const [thinkingDetail, setThinkingDetail] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  // Handle SSE events
  const handleEvent = useCallback((event: EditorSSEEvent) => {
    switch (event.type) {
      case 'stateSync':
        setState(event.state);
        setThinkingMessage(null);
        setThinkingDetail(null);
        break;

      case 'sceneStatus':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((scene) =>
              scene.id === event.sceneId
                ? { ...scene, status: event.status as SceneStatus }
                : scene
            ),
          };
        });
        if (event.message) {
          setThinkingMessage(event.message);
        }
        break;

      case 'sceneUpdated':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((scene) =>
              scene.id === event.sceneId
                ? {
                    ...scene,
                    previewUrl: event.previewUrl,
                    currentVersionId: event.versionId,
                    status: 'ready' as SceneStatus,
                  }
                : scene
            ),
          };
        });
        setThinkingMessage(null);
        break;

      case 'thinking':
        setThinkingMessage(event.message);
        setThinkingDetail(event.detail || null);
        break;

      case 'exportProgress':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            exportStatus: 'rendering',
            exportProgress: event.progress,
          };
        });
        setThinkingMessage(event.status);
        break;

      case 'exportComplete':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            exportStatus: 'complete',
            exportProgress: 100,
            exportedVideoPath: event.videoPath,
          };
        });
        setThinkingMessage(null);
        break;

      case 'error':
        setError(event.message);
        if (event.sceneId) {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              scenes: prev.scenes.map((scene) =>
                scene.id === event.sceneId
                  ? { ...scene, status: 'error' as SceneStatus, error: event.message }
                  : scene
              ),
            };
          });
        }
        setThinkingMessage(null);
        break;
    }
  }, []);

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = createEditorStream(
      jobId,
      handleEvent,
      (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts.current);
        } else {
          setError('Lost connection to server. Please refresh the page.');
        }
      }
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    };

    eventSourceRef.current = eventSource;
  }, [jobId, handleEvent]);

  // Fetch initial state
  const refreshState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEditorState(jobId);
      setState(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load editor state';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // Update scene locally (for optimistic updates)
  const updateSceneLocally = useCallback((sceneId: string, updates: Partial<EditorScene>) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenes: prev.scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, ...updates } : scene
        ),
      };
    });
  }, []);

  // Update selected scenes
  const setSelectedScenes = useCallback((sceneIds: string[]) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedSceneIds: sceneIds,
      };
    });
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshState();
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [refreshState, connect]);

  return {
    state,
    isLoading,
    isConnected,
    error,
    thinkingMessage,
    thinkingDetail,
    refreshState,
    updateSceneLocally,
    setSelectedScenes,
  };
}
