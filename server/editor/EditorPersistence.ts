/**
 * Editor Persistence
 * 
 * Handles file-based persistence of editor state.
 * Stores state as JSON files in output/editor/{jobId}/
 */

import fs from 'fs/promises';
import path from 'path';
import {
  EditorState,
  EditorScene,
  SceneVersion,
  EditorOperation,
} from './EditorState';

/**
 * Base directory for editor data.
 */
const EDITOR_BASE_DIR = path.join(process.cwd(), 'output', 'editor');

/**
 * EditorPersistence handles saving and loading editor state to/from disk.
 */
export class EditorPersistence {
  private jobId: string;
  private baseDir: string;
  private versionsDir: string;

  constructor(jobId: string) {
    this.jobId = jobId;
    this.baseDir = path.join(EDITOR_BASE_DIR, jobId);
    this.versionsDir = path.join(this.baseDir, 'versions');
  }

  /**
   * Ensure the editor directories exist.
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.mkdir(this.versionsDir, { recursive: true });
  }

  /**
   * Get the path to the state file.
   */
  private getStatePath(): string {
    return path.join(this.baseDir, 'state.json');
  }

  /**
   * Get the path to a version file.
   */
  private getVersionPath(sceneId: string, versionId: string): string {
    return path.join(this.versionsDir, `${sceneId}_${versionId}.tsx`);
  }

  /**
   * Check if editor state exists for this job.
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.getStatePath());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save the complete editor state.
   */
  async saveState(state: EditorState): Promise<void> {
    await this.ensureDirectories();

    // Create a serializable version of the state
    const serializable = {
      ...state,
      // Convert dates to ISO strings
      createdAt: state.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      // Don't persist selection (frontend-only state)
      selectedSceneIds: [],
      // Serialize scenes with date conversion
      scenes: state.scenes.map(scene => ({
        ...scene,
        versions: scene.versions.map(v => ({
          ...v,
          timestamp: v.timestamp instanceof Date ? v.timestamp.toISOString() : v.timestamp,
        })),
      })),
      // Serialize operations with date conversion
      undoStack: state.undoStack.map(op => ({
        ...op,
        timestamp: op.timestamp instanceof Date ? op.timestamp.toISOString() : op.timestamp,
      })),
      redoStack: state.redoStack.map(op => ({
        ...op,
        timestamp: op.timestamp instanceof Date ? op.timestamp.toISOString() : op.timestamp,
      })),
    };

    await fs.writeFile(
      this.getStatePath(),
      JSON.stringify(serializable, null, 2),
      'utf-8'
    );
  }

  /**
   * Load editor state from disk.
   * Returns null if no state exists.
   */
  async loadState(): Promise<EditorState | null> {
    try {
      const data = await fs.readFile(this.getStatePath(), 'utf-8');
      const parsed = JSON.parse(data);

      // Convert dates back from ISO strings
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        scenes: parsed.scenes.map((scene: EditorScene & { versions: Array<SceneVersion & { timestamp: string }> }) => ({
          ...scene,
          versions: scene.versions.map(v => ({
            ...v,
            timestamp: new Date(v.timestamp),
          })),
        })),
        undoStack: parsed.undoStack.map((op: EditorOperation & { timestamp: string }) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        })),
        redoStack: parsed.redoStack.map((op: EditorOperation & { timestamp: string }) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        })),
      } as EditorState;
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Save a scene version's code to disk.
   * This allows storing large code snapshots outside the main state file.
   */
  async saveVersion(sceneId: string, version: SceneVersion): Promise<void> {
    await this.ensureDirectories();
    await fs.writeFile(
      this.getVersionPath(sceneId, version.id),
      version.codeSnapshot,
      'utf-8'
    );
  }

  /**
   * Load a scene version's code from disk.
   */
  async loadVersion(sceneId: string, versionId: string): Promise<string | null> {
    try {
      return await fs.readFile(
        this.getVersionPath(sceneId, versionId),
        'utf-8'
      );
    } catch {
      return null;
    }
  }

  /**
   * Delete a scene version file.
   */
  async deleteVersion(sceneId: string, versionId: string): Promise<void> {
    try {
      await fs.unlink(this.getVersionPath(sceneId, versionId));
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * List all version files for a scene.
   */
  async listVersions(sceneId: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.versionsDir);
      return files
        .filter(f => f.startsWith(`${sceneId}_`) && f.endsWith('.tsx'))
        .map(f => f.replace(`${sceneId}_`, '').replace('.tsx', ''));
    } catch {
      return [];
    }
  }

  /**
   * Delete all editor data for this job.
   */
  async deleteAll(): Promise<void> {
    try {
      await fs.rm(this.baseDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  }

  /**
   * Get disk usage for this editor session.
   */
  async getDiskUsage(): Promise<{ stateSize: number; versionsSize: number; totalSize: number }> {
    let stateSize = 0;
    let versionsSize = 0;

    try {
      const stateStat = await fs.stat(this.getStatePath());
      stateSize = stateStat.size;
    } catch {
      // File doesn't exist
    }

    try {
      const versionFiles = await fs.readdir(this.versionsDir);
      for (const file of versionFiles) {
        const stat = await fs.stat(path.join(this.versionsDir, file));
        versionsSize += stat.size;
      }
    } catch {
      // Directory doesn't exist
    }

    return {
      stateSize,
      versionsSize,
      totalSize: stateSize + versionsSize,
    };
  }
}

/**
 * Clean up old editor sessions that haven't been updated in a while.
 * @param maxAgeMs Maximum age in milliseconds (default: 7 days)
 */
export async function cleanupOldEditorSessions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<string[]> {
  const deleted: string[] = [];

  try {
    const jobDirs = await fs.readdir(EDITOR_BASE_DIR);
    const now = Date.now();

    for (const jobId of jobDirs) {
      const statePath = path.join(EDITOR_BASE_DIR, jobId, 'state.json');
      try {
        const stat = await fs.stat(statePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.rm(path.join(EDITOR_BASE_DIR, jobId), { recursive: true, force: true });
          deleted.push(jobId);
        }
      } catch {
        // Skip if state file doesn't exist
      }
    }
  } catch {
    // Base directory doesn't exist
  }

  return deleted;
}

/**
 * Get all editor sessions.
 */
export async function listEditorSessions(): Promise<string[]> {
  try {
    return await fs.readdir(EDITOR_BASE_DIR);
  } catch {
    return [];
  }
}
