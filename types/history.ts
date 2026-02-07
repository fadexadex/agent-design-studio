/**
 * History Types
 * 
 * Types for session history management with localStorage persistence.
 * Tracks complete workflow state, scenes, agent trace, and editor snapshots.
 */

import type {
  BrandContext,
  VideoConfig,
  VideoScript,
  AgentThought,
  WorkflowPhase,
  ImplementationPlan,
  ImplementationRound,
  Checkpoint,
  WorkflowProgress,
  SceneRenderStatus,
  MotionStyle,
} from '../types';

/**
 * Scene data stored in history - combines scene description with generated content
 */
export interface HistoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  frameRange: { start: number; end: number };
  keyElements: string[];
  status: 'pending' | 'generating' | 'complete' | 'error';
  
  // Generated code
  code?: string;
  codeFilePath?: string;
  
  // Preview
  previewUrl?: string;
  
  // Versions (if edited in editor)
  versions?: SceneVersion[];
  currentVersionId?: string;
}

/**
 * Scene version for tracking edits
 */
export interface SceneVersion {
  id: string;
  timestamp: string;
  prompt?: string;
  codeSnapshot: string;
  previewUrl?: string;
}

/**
 * Editor operation for undo/redo tracking
 */
export interface EditorOperation {
  id: string;
  type: 'edit' | 'add' | 'delete' | 'reorder' | 'trim' | 'revert';
  sceneIds: string[];
  previousState: Partial<HistoryScene>[];
  newState: Partial<HistoryScene>[];
  timestamp: string;
  description?: string;
}

/**
 * Snapshot of editor state for restoration
 */
export interface EditorSnapshot {
  scenes: HistoryScene[];
  undoStack: EditorOperation[];
  redoStack: EditorOperation[];
  selectedSceneIds: string[];
  lastEditedAt: string;
}

/**
 * Workflow state snapshot stored in history
 */
export interface WorkflowSnapshot {
  currentPhase: WorkflowPhase;
  plan?: ImplementationPlan;
  rounds: ImplementationRound[];
  currentRound: number;
  maxRounds: number;
  progress: WorkflowProgress;
  checkpoints: Checkpoint[];
}

/**
 * Summary data for quick list view rendering
 */
export interface SessionSummary {
  brandName: string;
  style: MotionStyle;
  aspectRatio: '16:9' | '9:16';
  thumbnailDataUrl?: string;
  sceneCount: number;
  duration: string; // e.g., "5 seconds"
}

/**
 * Complete session stored in history
 */
export interface HistorySession {
  id: string; // Same as jobId
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  status: 'in_progress' | 'complete' | 'error';
  
  // Summary (for list view)
  summary: SessionSummary;
  
  // Full Context
  brand: BrandContext;
  config: VideoConfig;
  script?: VideoScript;
  
  // Workflow State
  workflow: WorkflowSnapshot;
  
  // Scenes (complete scene data for browsing)
  scenes: HistoryScene[];
  
  // Agent Trace
  thoughts: AgentThought[];
  
  // Output
  outputVideoPath?: string;
  
  // Editor State (if edited)
  editorSnapshot?: EditorSnapshot;
}

/**
 * Storage settings for history management
 */
export interface HistorySettings {
  maxSessions: number; // Default: 50
  autoCleanupOlderThan?: number; // Days
}

/**
 * Root storage structure
 */
export interface HistoryStorage {
  version: number; // Schema version for migrations
  sessions: HistorySession[];
  settings: HistorySettings;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  used: number; // bytes
  available: number; // bytes
  percentage: number; // 0-100
}

/**
 * Sidebar view state for navigation
 */
export type SidebarView = 
  | { type: 'list' }
  | { type: 'session'; sessionId: string }
  | { type: 'scene'; sessionId: string; sceneId: string };

/**
 * Tab options in session detail view
 */
export type SessionDetailTab = 'overview' | 'scenes' | 'trace';
