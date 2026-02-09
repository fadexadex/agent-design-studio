/**
 * Director Service
 * 
 * API client for the Director-Agent architecture.
 * Handles project creation, status polling, and video retrieval.
 */

import { buildApiUrl, buildSseUrl } from '../lib/api';

const API_BASE = '/api/director';
const EVENTS_BASE = '/api/events';

// ============================================================================
// Types
// ============================================================================

export interface DirectorBrandContext {
  name: string;
  industry?: string;
  tagline?: string;
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };
  logo?: string;
  style?: 'minimal' | 'bold' | 'elegant' | 'playful' | 'corporate' | 'dynamic';
  aspectRatio: '16:9' | '9:16';
  prompt: string;
}

export interface DirectorConfig {
  maxGlobalIterations?: number;
  targetScore?: number;
}

export interface StartProjectResponse {
  projectId: string;
  jobId: string;
  message: string;
  links: {
    status: string;
    events: string;
    video: string;
  };
}

export interface SceneStatus {
  id: string;
  index: number;
  sceneNumber: number;
  title: string;
  status: string;
  version: number;
  score: number | null;
}

export interface ProjectProgress {
  currentPhase: string;
  scenesTotal: number;
  scenesCompleted: number;
  globalIteration: number;
  maxGlobalIterations: number;
}

export interface GlobalEvaluation {
  score: number;
  narrativeCohesion: number;
  brandConsistency: number;
}

export interface ProjectError {
  message: string;
  code: string;
  recoverable: boolean;
}

export interface ProjectStatus {
  projectId: string;
  phase: string;
  progress: ProjectProgress;
  scenes: SceneStatus[];
  globalEvaluation: GlobalEvaluation | null;
  error: ProjectError | null;
  output: {
    videoPath: string | null;
    completedAt: number | null;
  };
  timestamps: {
    createdAt: number;
    updatedAt: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'error';
  workers: {
    started: boolean;
    shuttingDown: boolean;
    workers: string[];
  };
  redis: {
    main: string;
    subscriber: string;
  };
  timestamp: number;
}

// ============================================================================
// Director Service
// ============================================================================

class DirectorService {
  /**
   * Start a new video generation project
   */
  async startProject(
    brand: DirectorBrandContext,
    config?: DirectorConfig
  ): Promise<StartProjectResponse> {
    const response = await fetch(buildApiUrl(`${API_BASE}/start`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brand, config }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.details || 'Failed to start project');
    }

    return response.json();
  }

  /**
   * Get project status
   */
  async getStatus(projectId: string): Promise<ProjectStatus> {
    const response = await fetch(buildApiUrl(`${API_BASE}/${projectId}/status`));

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to get project status');
    }

    return response.json();
  }

  /**
   * Get video URL for a completed project
   */
  getVideoUrl(projectId: string): string {
    return buildApiUrl(`${API_BASE}/${projectId}/video`);
  }

  /**
   * Delete/cancel a project
   */
  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(buildApiUrl(`${API_BASE}/${projectId}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to delete project');
    }
  }

  /**
   * Check system health
   */
  async getHealth(): Promise<HealthStatus> {
    const response = await fetch(buildApiUrl(`${API_BASE}/health`));
    return response.json();
  }

  /**
   * Get SSE events URL for a project
   */
  getEventsUrl(projectId: string, includeHistory = false): string {
    const params = includeHistory ? '?includeHistory=true' : '';
    return buildSseUrl(`${EVENTS_BASE}/${projectId}${params}`);
  }

  /**
   * Get event history for a project
   */
  async getEventHistory(projectId: string, from = '0', count = 100): Promise<{
    projectId: string;
    events: Array<{
      id: string;
      type: string;
      timestamp: number;
      payload: unknown;
    }>;
    lastEventId: string | null;
    hasMore: boolean;
  }> {
    const response = await fetch(
      buildApiUrl(`${EVENTS_BASE}/${projectId}/history?from=${from}&count=${count}`)
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to get event history');
    }

    return response.json();
  }
}

export const directorService = new DirectorService();
