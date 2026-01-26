import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowState,
  Checkpoint,
  GeneratedFile,
  updateState
} from './WorkflowState';

/**
 * Maximum number of checkpoints to retain (to save memory)
 */
const MAX_CHECKPOINTS = 10;

/**
 * CheckpointManager handles saving and restoring workflow state.
 * Enables rollback functionality and state persistence across rounds.
 */
export class CheckpointManager {
  /**
   * Creates a new checkpoint from the current round's state
   */
  createCheckpoint(
    state: WorkflowState,
    description?: string
  ): { state: WorkflowState; checkpoint: Checkpoint } {
    const currentRound = state.rounds[state.currentRound - 1];

    if (!currentRound) {
      throw new Error('Cannot create checkpoint: no current round found');
    }

    const checkpoint: Checkpoint = {
      id: uuidv4(),
      roundNumber: state.currentRound,
      files: this.cloneFiles(currentRound.files),
      description: description || `Checkpoint at round ${state.currentRound}`,
      timestamp: new Date()
    };

    // Add checkpoint and enforce max limit
    let checkpoints = [...state.checkpoints, checkpoint];
    if (checkpoints.length > MAX_CHECKPOINTS) {
      checkpoints = checkpoints.slice(-MAX_CHECKPOINTS);
    }

    const updatedState = updateState(state, {
      checkpoints,
      activeCheckpointId: checkpoint.id
    });

    return { state: updatedState, checkpoint };
  }

  /**
   * Restores files from a specific checkpoint
   * Returns the files from the checkpoint
   */
  restoreCheckpoint(
    state: WorkflowState,
    checkpointId: string
  ): { files: GeneratedFile[]; checkpoint: Checkpoint } {
    const checkpoint = state.checkpoints.find(cp => cp.id === checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    return {
      files: this.cloneFiles(checkpoint.files),
      checkpoint
    };
  }

  /**
   * Gets the most recent checkpoint
   */
  getLatestCheckpoint(state: WorkflowState): Checkpoint | undefined {
    if (state.checkpoints.length === 0) {
      return undefined;
    }
    return state.checkpoints[state.checkpoints.length - 1];
  }

  /**
   * Gets all checkpoints for the workflow
   */
  getCheckpoints(state: WorkflowState): Checkpoint[] {
    return state.checkpoints;
  }

  /**
   * Gets checkpoint by round number
   */
  getCheckpointByRound(
    state: WorkflowState,
    roundNumber: number
  ): Checkpoint | undefined {
    return state.checkpoints.find(cp => cp.roundNumber === roundNumber);
  }

  /**
   * Removes a specific checkpoint
   */
  removeCheckpoint(
    state: WorkflowState,
    checkpointId: string
  ): WorkflowState {
    const checkpoints = state.checkpoints.filter(cp => cp.id !== checkpointId);

    return updateState(state, {
      checkpoints,
      activeCheckpointId:
        state.activeCheckpointId === checkpointId
          ? undefined
          : state.activeCheckpointId
    });
  }

  /**
   * Clears all checkpoints (useful when starting fresh)
   */
  clearCheckpoints(state: WorkflowState): WorkflowState {
    return updateState(state, {
      checkpoints: [],
      activeCheckpointId: undefined
    });
  }

  /**
   * Deep clones file array to prevent mutation
   */
  private cloneFiles(files: GeneratedFile[]): GeneratedFile[] {
    return files.map(file => ({
      filePath: file.filePath,
      content: file.content,
      sceneId: file.sceneId
    }));
  }

  /**
   * Computes a diff summary between two checkpoints
   */
  diffCheckpoints(
    older: Checkpoint,
    newer: Checkpoint
  ): CheckpointDiff {
    const olderPaths = new Set(older.files.map(f => f.filePath));
    const newerPaths = new Set(newer.files.map(f => f.filePath));

    const added = newer.files.filter(f => !olderPaths.has(f.filePath));
    const removed = older.files.filter(f => !newerPaths.has(f.filePath));
    const modified = newer.files.filter(f => {
      const oldFile = older.files.find(o => o.filePath === f.filePath);
      return oldFile && oldFile.content !== f.content;
    });

    return {
      added: added.map(f => f.filePath),
      removed: removed.map(f => f.filePath),
      modified: modified.map(f => f.filePath),
      summary: this.buildDiffSummary(added.length, removed.length, modified.length)
    };
  }

  private buildDiffSummary(
    added: number,
    removed: number,
    modified: number
  ): string {
    const parts: string[] = [];
    if (added > 0) parts.push(`${added} added`);
    if (removed > 0) parts.push(`${removed} removed`);
    if (modified > 0) parts.push(`${modified} modified`);
    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }
}

/**
 * Result of comparing two checkpoints
 */
export interface CheckpointDiff {
  added: string[];
  removed: string[];
  modified: string[];
  summary: string;
}

// Export singleton instance for convenience
export const checkpointManager = new CheckpointManager();
