/**
 * Editor Service
 * 
 * API client for the scene editor endpoints.
 */

// Types matching server/editor/EditorState.ts
export interface SceneVersion {
  id: string;
  timestamp: Date;
  prompt?: string;
  codeSnapshot: string;
  previewUrl?: string;
}

export type SceneStatus = 'ready' | 'generating' | 'regenerating' | 'rendering' | 'error';

export interface EditorScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  order: number;
  frameRange: { start: number; end: number };
  trimmedRange?: { start: number; end: number };
  codeFilePath: string;
  previewUrl?: string;
  versions: SceneVersion[];
  currentVersionId: string;
  status: SceneStatus;
  error?: string;
}

export type ExportStatus = 'idle' | 'rendering' | 'complete' | 'error';

export interface EditorState {
  jobId: string;
  brand: {
    name: string;
    industry: string;
    colors: string[];
    tagline: string;
    logoUrl?: string;
  };
  config: {
    style: string;
    aspectRatio: string;
  };
  scenes: EditorScene[];
  totalDuration: number;
  selectedSceneIds: string[];
  undoStack: unknown[];
  redoStack: unknown[];
  maxHistorySize: number;
  exportStatus: ExportStatus;
  exportedVideoPath?: string;
  exportProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

// SSE Event Types
export interface SceneStatusEvent {
  type: 'sceneStatus';
  sceneId: string;
  status: SceneStatus;
  progress?: number;
  message?: string;
}

export interface SceneUpdatedEvent {
  type: 'sceneUpdated';
  sceneId: string;
  previewUrl: string;
  code: string;
  versionId: string;
}

export interface ThinkingEvent {
  type: 'thinking';
  message: string;
  detail?: string;
}

export interface ExportProgressEvent {
  type: 'exportProgress';
  progress: number;
  status: string;
}

export interface ExportCompleteEvent {
  type: 'exportComplete';
  videoPath: string;
}

export interface EditorErrorEvent {
  type: 'error';
  sceneId?: string;
  message: string;
}

export interface StateSyncEvent {
  type: 'stateSync';
  state: EditorState;
}

export type EditorSSEEvent =
  | SceneStatusEvent
  | SceneUpdatedEvent
  | ThinkingEvent
  | ExportProgressEvent
  | ExportCompleteEvent
  | EditorErrorEvent
  | StateSyncEvent;

const API_BASE = '/api/editor';

/**
 * Fetch the editor state (loads or initializes from workflow).
 */
export async function fetchEditorState(jobId: string): Promise<EditorState> {
  const response = await fetch(`${API_BASE}/${jobId}/state`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to load editor state');
  }
  const data = await response.json();
  // Parse dates
  data.createdAt = new Date(data.createdAt);
  data.updatedAt = new Date(data.updatedAt);
  for (const scene of data.scenes) {
    for (const version of scene.versions) {
      version.timestamp = new Date(version.timestamp);
    }
  }
  return data;
}

/**
 * Edit selected scenes with a prompt.
 */
export async function editScenes(
  jobId: string,
  sceneIds: string[],
  prompt: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneIds, prompt }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to edit scenes');
  }
}

/**
 * Add a new scene.
 */
export async function addScene(
  jobId: string,
  prompt: string,
  afterSceneId?: string
): Promise<{ sceneId: string }> {
  const response = await fetch(`${API_BASE}/${jobId}/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, afterSceneId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to add scene');
  }
  return response.json();
}

/**
 * Delete a scene.
 */
export async function deleteScene(jobId: string, sceneId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/scenes/${sceneId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to delete scene');
  }
}

/**
 * Reorder scenes.
 */
export async function reorderScenes(jobId: string, sceneOrder: string[]): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneOrder }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to reorder scenes');
  }
}

/**
 * Trim a scene's duration.
 */
export async function trimScene(
  jobId: string,
  sceneId: string,
  frameRange: { start: number; end: number }
): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneId, frameRange }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to trim scene');
  }
}

/**
 * Revert a scene to a previous version.
 */
export async function revertScene(
  jobId: string,
  sceneId: string,
  versionId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/revert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneId, versionId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to revert scene');
  }
}

/**
 * Undo the last operation.
 */
export async function undo(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/undo`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to undo');
  }
}

/**
 * Redo the last undone operation.
 */
export async function redo(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/redo`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to redo');
  }
}

/**
 * Start exporting the video.
 */
export async function startExport(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${jobId}/export`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to start export');
  }
}

/**
 * Get export status.
 */
export async function getExportStatus(jobId: string): Promise<{
  status: ExportStatus;
  progress: number;
  videoPath?: string;
}> {
  const response = await fetch(`${API_BASE}/${jobId}/export/status`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to get export status');
  }
  return response.json();
}

/**
 * Create an SSE connection for real-time updates.
 */
export function createEditorStream(
  jobId: string,
  onEvent: (event: EditorSSEEvent) => void,
  onError?: (error: Event) => void
): EventSource {
  const eventSource = new EventSource(`${API_BASE}/${jobId}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Parse dates in stateSync events
      if (data.type === 'stateSync' && data.state) {
        data.state.createdAt = new Date(data.state.createdAt);
        data.state.updatedAt = new Date(data.state.updatedAt);
        for (const scene of data.state.scenes) {
          for (const version of scene.versions) {
            version.timestamp = new Date(version.timestamp);
          }
        }
      }
      onEvent(data);
    } catch (e) {
      console.error('Failed to parse SSE event:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    onError?.(error);
  };

  return eventSource;
}
