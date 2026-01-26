/**
 * Editor State Types
 * 
 * Defines all interfaces for the scene editor functionality.
 */

import { BrandContext, VideoConfig } from '../agent/types';

// Re-export for convenience
export type { BrandContext, VideoConfig };
export type GenerationConfig = VideoConfig;

// ============================================================================
// Scene Version
// ============================================================================

/**
 * A snapshot of a scene's code at a point in time.
 */
export interface SceneVersion {
  id: string;
  timestamp: Date;
  /** The user prompt that created this version (null for initial version) */
  prompt?: string;
  /** The full scene code at this version */
  codeSnapshot: string;
  /** Preview video URL for this version (if rendered) */
  previewUrl?: string;
}

// ============================================================================
// Editor Scene
// ============================================================================

/**
 * Scene status in the editor.
 */
export type SceneStatus = 'ready' | 'generating' | 'regenerating' | 'rendering' | 'error';

/**
 * A scene in the editor with all its metadata.
 */
export interface EditorScene {
  /** Unique identifier */
  id: string;
  /** Scene number (1-indexed, used for file naming) */
  sceneNumber: number;
  /** Display title */
  title: string;
  /** Description of what the scene shows */
  description: string;
  
  // Timeline positioning
  /** Order in the timeline (0-indexed) */
  order: number;
  /** Frame range in the full composition */
  frameRange: { start: number; end: number };
  /** Trimmed frame range (if user has trimmed the scene) */
  trimmedRange?: { start: number; end: number };
  
  // Files
  /** Path to the scene's .tsx file */
  codeFilePath: string;
  /** Current preview video URL */
  previewUrl?: string;
  
  // Versioning
  /** All versions of this scene */
  versions: SceneVersion[];
  /** ID of the currently active version */
  currentVersionId: string;
  
  // Status
  /** Current status */
  status: SceneStatus;
  /** Error message if status is 'error' */
  error?: string;
}

// ============================================================================
// Editor Operations (for undo/redo)
// ============================================================================

/**
 * Types of operations that can be undone/redone.
 */
export type OperationType = 'edit' | 'add' | 'delete' | 'reorder' | 'trim' | 'revert';

/**
 * A recorded operation for undo/redo functionality.
 */
export interface EditorOperation {
  /** Unique identifier */
  id: string;
  /** Type of operation */
  type: OperationType;
  /** Scene IDs affected by this operation */
  sceneIds: string[];
  /** State of affected scenes before the operation */
  previousState: Partial<EditorScene>[];
  /** State of affected scenes after the operation */
  newState: Partial<EditorScene>[];
  /** When the operation occurred */
  timestamp: Date;
  /** Human-readable description */
  description?: string;
}

// ============================================================================
// Export Status
// ============================================================================

/**
 * Status of video export.
 */
export type ExportStatus = 'idle' | 'rendering' | 'complete' | 'error';

/**
 * Export progress information.
 */
export interface ExportProgress {
  status: ExportStatus;
  progress: number; // 0-100
  message?: string;
  videoPath?: string;
  error?: string;
}

// ============================================================================
// Editor State
// ============================================================================

/**
 * Complete editor state.
 */
export interface EditorState {
  /** Job ID this editor session is associated with */
  jobId: string;
  
  /** Brand context from the original generation */
  brand: BrandContext;
  
  /** Generation config from the original generation */
  config: GenerationConfig;
  
  // Timeline data
  /** All scenes in the editor */
  scenes: EditorScene[];
  /** Total duration in frames */
  totalDuration: number;
  
  // Selection (not persisted, managed by frontend)
  /** Currently selected scene IDs */
  selectedSceneIds: string[];
  
  // Version control
  /** Operations that can be undone */
  undoStack: EditorOperation[];
  /** Operations that can be redone */
  redoStack: EditorOperation[];
  /** Maximum number of operations to keep in history */
  maxHistorySize: number;
  
  // Export status
  /** Current export status */
  exportStatus: ExportStatus;
  /** Path to exported video (when complete) */
  exportedVideoPath?: string;
  /** Export progress percentage */
  exportProgress: number;
  
  // Timestamps
  /** When the editor state was created */
  createdAt: Date;
  /** When the editor state was last updated */
  updatedAt: Date;
}

// ============================================================================
// SSE Event Types
// ============================================================================

/**
 * Scene status change event.
 */
export interface SceneStatusEvent {
  type: 'sceneStatus';
  sceneId: string;
  status: SceneStatus;
  progress?: number;
  message?: string;
}

/**
 * Scene updated event (new preview ready).
 */
export interface SceneUpdatedEvent {
  type: 'sceneUpdated';
  sceneId: string;
  previewUrl: string;
  code: string;
  versionId: string;
}

/**
 * Agent thinking/progress event.
 */
export interface ThinkingEvent {
  type: 'thinking';
  message: string;
  detail?: string;
}

/**
 * Export progress event.
 */
export interface ExportProgressEvent {
  type: 'exportProgress';
  progress: number;
  status: string;
}

/**
 * Export complete event.
 */
export interface ExportCompleteEvent {
  type: 'exportComplete';
  videoPath: string;
}

/**
 * Error event.
 */
export interface EditorErrorEvent {
  type: 'error';
  sceneId?: string;
  message: string;
}

/**
 * State sync event (full state update).
 */
export interface StateSyncEvent {
  type: 'stateSync';
  state: EditorState;
}

/**
 * All possible SSE events.
 */
export type EditorSSEEvent =
  | SceneStatusEvent
  | SceneUpdatedEvent
  | ThinkingEvent
  | ExportProgressEvent
  | ExportCompleteEvent
  | EditorErrorEvent
  | StateSyncEvent;

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to edit scene(s).
 */
export interface EditRequest {
  sceneIds: string[];
  prompt: string;
}

/**
 * Request to add a new scene.
 */
export interface AddSceneRequest {
  /** Scene ID to insert after (null = append at end) */
  afterSceneId?: string;
  /** User prompt describing the new scene */
  prompt: string;
}

/**
 * Request to reorder scenes.
 */
export interface ReorderRequest {
  /** New order of scene IDs */
  sceneOrder: string[];
}

/**
 * Request to trim a scene.
 */
export interface TrimRequest {
  sceneId: string;
  frameRange: { start: number; end: number };
}

/**
 * Request to revert a scene to a previous version.
 */
export interface RevertRequest {
  sceneId: string;
  versionId: string;
}

/**
 * Generic success response.
 */
export interface SuccessResponse {
  success: true;
}

/**
 * Error response.
 */
export interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * Response for add scene request.
 */
export interface AddSceneResponse {
  success: true;
  sceneId: string;
}

/**
 * Response for undo/redo request.
 */
export interface UndoRedoResponse {
  success: true;
  operation: EditorOperation;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID.
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new scene version.
 */
export function createVersion(
  code: string,
  prompt?: string,
  previewUrl?: string
): SceneVersion {
  return {
    id: generateId('v'),
    timestamp: new Date(),
    prompt,
    codeSnapshot: code,
    previewUrl,
  };
}

/**
 * Create a new editor operation.
 */
export function createOperation(
  type: OperationType,
  sceneIds: string[],
  previousState: Partial<EditorScene>[],
  newState: Partial<EditorScene>[],
  description?: string
): EditorOperation {
  return {
    id: generateId('op'),
    type,
    sceneIds,
    previousState,
    newState,
    timestamp: new Date(),
    description,
  };
}

/**
 * Create initial editor state.
 */
export function createInitialEditorState(
  jobId: string,
  brand: BrandContext,
  config: GenerationConfig,
  scenes: EditorScene[] = []
): EditorState {
  return {
    jobId,
    brand,
    config,
    scenes,
    totalDuration: calculateTotalDuration(scenes),
    selectedSceneIds: [],
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,
    exportStatus: 'idle',
    exportProgress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Calculate total duration from scenes.
 */
export function calculateTotalDuration(scenes: EditorScene[]): number {
  return scenes.reduce((sum, scene) => {
    const range = scene.trimmedRange || scene.frameRange;
    return sum + (range.end - range.start + 1);
  }, 0);
}

/**
 * Get effective frame range for a scene (considering trimming).
 */
export function getEffectiveFrameRange(scene: EditorScene): { start: number; end: number } {
  return scene.trimmedRange || scene.frameRange;
}

/**
 * Get scene duration in frames.
 */
export function getSceneDuration(scene: EditorScene): number {
  const range = getEffectiveFrameRange(scene);
  return range.end - range.start + 1;
}

/**
 * Get scene duration in seconds (assuming 30fps).
 */
export function getSceneDurationSeconds(scene: EditorScene, fps: number = 30): number {
  return getSceneDuration(scene) / fps;
}

/**
 * Recalculate scene orders after reordering.
 */
export function recalculateSceneOrders(scenes: EditorScene[]): EditorScene[] {
  return scenes.map((scene, index) => ({
    ...scene,
    order: index,
  }));
}

/**
 * Deep clone an editor scene (for undo/redo state snapshots).
 */
export function cloneScene(scene: EditorScene): EditorScene {
  return {
    ...scene,
    frameRange: { ...scene.frameRange },
    trimmedRange: scene.trimmedRange ? { ...scene.trimmedRange } : undefined,
    versions: scene.versions.map(v => ({ ...v, timestamp: new Date(v.timestamp) })),
  };
}
