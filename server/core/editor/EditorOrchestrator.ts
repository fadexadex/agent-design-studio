/**
 * Editor Orchestrator
 * 
 * Main coordinator for the scene editor functionality.
 * Handles:
 * - Loading editor state from completed workflows
 * - Processing scene edits via Gemini
 * - Adding/deleting scenes
 * - Reordering and trimming
 * - Version control and undo/redo
 * - Export to final video
 */

import fs from 'fs/promises';
import path from 'path';
import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  EditorState,
  EditorScene,
  SceneVersion,
  EditorOperation,
  createInitialEditorState,
  createVersion,
  createOperation,
  calculateTotalDuration,
  recalculateSceneOrders,
  cloneScene,
  generateId,
  EditorSSEEvent,
  BrandContext,
  GenerationConfig,
} from './EditorState';
import { EditorPersistence } from './EditorPersistence';
import { WorkflowState, SceneDescription } from '../workflow/state/WorkflowState';
import { RemotionRenderer } from '../renderer/remotionRenderer';
import { AI_MODELS } from '../agent/models';
import { buildSceneEditPrompt, buildAddScenePrompt, parseEditResponse, parseAddSceneResponse } from './editorPrompts';

/**
 * Path to generated scenes directory.
 */
const SCENES_DIR = path.join(process.cwd(), 'remotion', 'src', 'generated', 'scenes');

/**
 * Map of active editor sessions.
 */
const editorSessions = new Map<string, EditorOrchestrator>();

/**
 * Get or create an editor orchestrator for a job.
 */
export function getEditorOrchestrator(jobId: string): EditorOrchestrator {
  let orchestrator = editorSessions.get(jobId);
  if (!orchestrator) {
    orchestrator = new EditorOrchestrator(jobId);
    editorSessions.set(jobId, orchestrator);
  }
  return orchestrator;
}

/**
 * Remove an editor orchestrator from the cache.
 */
export function removeEditorOrchestrator(jobId: string): void {
  editorSessions.delete(jobId);
}

/**
 * EditorOrchestrator manages a single editor session.
 */
export class EditorOrchestrator {
  private jobId: string;
  private state: EditorState | null = null;
  private persistence: EditorPersistence;
  private ai: GoogleGenAI | null = null;
  private renderer: RemotionRenderer;
  private sseClients: Set<Response> = new Set();
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(jobId: string) {
    this.jobId = jobId;
    this.persistence = new EditorPersistence(jobId);
    this.renderer = new RemotionRenderer();
  }

  /**
   * Get the Gemini AI client.
   */
  private getAI(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  /**
   * Add an SSE client for real-time updates.
   */
  addSSEClient(res: Response): void {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  /**
   * Remove an SSE client.
   */
  removeSSEClient(res: Response): void {
    this.sseClients.delete(res);
  }

  /**
   * Emit an SSE event to all connected clients.
   */
  private emit(event: EditorSSEEvent): void {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      client.write(data);
    }
  }

  /**
   * Get the current editor state.
   */
  getState(): EditorState | null {
    return this.state;
  }

  /**
   * Load or initialize editor state.
   * If persisted state exists, load it.
   * Otherwise, initialize from workflow state.
   */
  async loadState(workflowState?: WorkflowState): Promise<EditorState> {
    // Try to load persisted state first
    const persisted = await this.persistence.loadState();
    if (persisted) {
      this.state = persisted;
      return persisted;
    }

    // No persisted state - need workflow state to initialize
    if (!workflowState) {
      throw new Error('No editor state found and no workflow state provided');
    }

    // Initialize from workflow state
    this.state = await this.initializeFromWorkflow(workflowState);
    await this.persistence.saveState(this.state);
    return this.state;
  }

  /**
   * Initialize editor state from a completed workflow.
   */
  private async initializeFromWorkflow(workflowState: WorkflowState): Promise<EditorState> {
    const { brand, config, plan, sceneStatuses } = workflowState;

    if (!plan?.sceneBreakdown?.length) {
      throw new Error('Workflow has no scene plan');
    }

    // Build scenes from the plan and generated files
    const scenes: EditorScene[] = [];

    for (let i = 0; i < plan.sceneBreakdown.length; i++) {
      const sceneDesc = plan.sceneBreakdown[i];
      const sceneNumber = sceneDesc.sceneNumber || i + 1;
      const filePath = path.join(SCENES_DIR, `Scene${sceneNumber}.tsx`);

      // Try to read the scene code
      let code = '';
      try {
        code = await fs.readFile(filePath, 'utf-8');
      } catch {
        console.warn(`Could not read scene file: ${filePath}`);
        continue;
      }

      // Find preview URL from workflow state
      const sceneStatus = sceneStatuses?.find(s => s.sceneNumber === sceneNumber);
      const previewUrl = sceneStatus?.previewUrl;

      // Create initial version
      const initialVersion = createVersion(code, undefined, previewUrl);

      const scene: EditorScene = {
        id: sceneDesc.id || generateId('scene'),
        sceneNumber,
        title: `Scene ${sceneNumber}`,
        description: sceneDesc.description,
        order: i,
        frameRange: sceneDesc.frameRange,
        codeFilePath: filePath,
        previewUrl,
        versions: [initialVersion],
        currentVersionId: initialVersion.id,
        status: 'ready',
      };

      scenes.push(scene);
    }

    if (scenes.length === 0) {
      throw new Error('No valid scenes found in workflow');
    }

    return createInitialEditorState(this.jobId, brand, config, scenes);
  }

  /**
   * Save the current state.
   */
  async saveState(): Promise<void> {
    if (this.state) {
      this.state.updatedAt = new Date();
      await this.persistence.saveState(this.state);
    }
  }

  /**
   * Queue an operation to ensure sequential execution.
   */
  private queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operationQueue = this.operationQueue
        .then(() => operation())
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Push an operation to the undo stack.
   */
  private pushToUndoStack(operation: EditorOperation): void {
    if (!this.state) return;

    this.state.undoStack.push(operation);

    // Trim if exceeds max size
    if (this.state.undoStack.length > this.state.maxHistorySize) {
      this.state.undoStack.shift();
    }

    // Clear redo stack on new operation
    this.state.redoStack = [];
  }

  /**
   * Process an edit request for selected scenes.
   */
  async processEdit(sceneIds: string[], prompt: string): Promise<void> {
    return this.queueOperation(async () => {
      if (!this.state) throw new Error('Editor not initialized');

      // Find the scenes to edit
      const scenes = this.state.scenes.filter(s => sceneIds.includes(s.id));
      if (scenes.length === 0) {
        throw new Error('No valid scenes selected');
      }

      this.emit({ type: 'thinking', message: 'Analyzing your request...' });

      // Mark scenes as regenerating
      for (const scene of scenes) {
        scene.status = 'regenerating';
        this.emit({ type: 'sceneStatus', sceneId: scene.id, status: 'regenerating', message: 'Preparing edit...' });
      }

      try {
        // Get adjacent scenes for context
        const sceneCodes: { [key: number]: string } = {};
        for (const scene of this.state.scenes) {
          try {
            sceneCodes[scene.sceneNumber] = await fs.readFile(scene.codeFilePath, 'utf-8');
          } catch {
            // Skip if can't read
          }
        }

        // Build and send prompt to Gemini
        this.emit({ type: 'thinking', message: 'Generating updated code...' });

        const editPrompt = buildSceneEditPrompt(
          this.state.brand,
          this.state.config,
          scenes,
          sceneCodes,
          prompt
        );

        const ai = this.getAI();
        const response = await ai.models.generateContent({
          model: AI_MODELS.SMART,
          contents: [{ role: 'user', parts: [{ text: editPrompt }] }],
          config: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });

        const responseText = response.text || '';
        const editResult = parseEditResponse(responseText);

        if (!editResult.scenesToUpdate || editResult.scenesToUpdate.length === 0) {
          throw new Error('AI did not return any scene updates');
        }

        this.emit({ type: 'thinking', message: `Updating ${editResult.scenesToUpdate.length} scene(s)...`, detail: editResult.reasoning });

        // Store previous state for undo
        const previousStates: Partial<EditorScene>[] = [];
        const newStates: Partial<EditorScene>[] = [];

        // Apply updates
        for (const update of editResult.scenesToUpdate) {
          const scene = this.state.scenes.find(s => s.sceneNumber === update.sceneNumber);
          if (!scene) continue;

          // Store previous state
          previousStates.push(cloneScene(scene));

          // Create new version
          const newVersion = createVersion(update.code, prompt);
          scene.versions.push(newVersion);
          scene.currentVersionId = newVersion.id;

          // Write the new code to file
          await fs.writeFile(scene.codeFilePath, update.code, 'utf-8');

          // Mark as rendering
          scene.status = 'rendering';
          this.emit({ type: 'sceneStatus', sceneId: scene.id, status: 'rendering', message: 'Rendering preview...', progress: 0 });

          // Render preview
          try {
            const previewResult = await this.renderer.renderScenePreview(
              scene.sceneNumber,
              scene.frameRange.end - scene.frameRange.start + 1,
              this.state.config,
              (progress) => {
                this.emit({ type: 'sceneStatus', sceneId: scene.id, status: 'rendering', progress: Math.round(progress * 100), message: `Rendering: ${Math.round(progress * 100)}%` });
              }
            );

            // Update preview URL
            scene.previewUrl = `/api/preview/${path.basename(previewResult.videoPath)}`;
            newVersion.previewUrl = scene.previewUrl;
            scene.status = 'ready';

            this.emit({
              type: 'sceneUpdated',
              sceneId: scene.id,
              previewUrl: scene.previewUrl,
              code: update.code,
              versionId: newVersion.id,
            });
          } catch (renderError) {
            console.error(`Failed to render preview for scene ${scene.sceneNumber}:`, renderError);
            scene.status = 'ready'; // Still mark as ready, just without new preview
            this.emit({
              type: 'sceneUpdated',
              sceneId: scene.id,
              previewUrl: scene.previewUrl || '',
              code: update.code,
              versionId: newVersion.id,
            });
          }

          // Store new state
          newStates.push(cloneScene(scene));
        }

        // Create undo operation
        const operation = createOperation(
          'edit',
          scenes.map(s => s.id),
          previousStates,
          newStates,
          `Edit: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`
        );
        this.pushToUndoStack(operation);

        // Save state
        await this.saveState();

        this.emit({ type: 'thinking', message: 'Edit complete!' });
      } catch (error) {
        // Reset scene statuses on error
        for (const scene of scenes) {
          scene.status = 'ready';
          this.emit({ type: 'sceneStatus', sceneId: scene.id, status: 'ready' });
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.emit({ type: 'error', message: `Edit failed: ${errorMessage}` });
        throw error;
      }
    });
  }

  /**
   * Add a new scene.
   */
  async addScene(afterSceneId: string | undefined, prompt: string): Promise<string> {
    return this.queueOperation(async () => {
      if (!this.state) throw new Error('Editor not initialized');

      try {
        this.emit({ type: 'thinking', message: 'Creating new scene...' });

      // Determine insert position
      let insertIndex = this.state.scenes.length;
      if (afterSceneId) {
        const afterIndex = this.state.scenes.findIndex(s => s.id === afterSceneId);
        if (afterIndex !== -1) {
          insertIndex = afterIndex + 1;
        }
      }

      // Determine scene number (use max + 1)
      const maxSceneNumber = Math.max(...this.state.scenes.map(s => s.sceneNumber), 0);
      const newSceneNumber = maxSceneNumber + 1;

      // Get adjacent scenes for context
      const prevScene = insertIndex > 0 ? this.state.scenes[insertIndex - 1] : undefined;
      const nextScene = insertIndex < this.state.scenes.length ? this.state.scenes[insertIndex] : undefined;

      let prevCode = '';
      let nextCode = '';
      if (prevScene) {
        try {
          prevCode = await fs.readFile(prevScene.codeFilePath, 'utf-8');
        } catch { /* ignore */ }
      }
      if (nextScene) {
        try {
          nextCode = await fs.readFile(nextScene.codeFilePath, 'utf-8');
        } catch { /* ignore */ }
      }

      // Generate scene code
      const addPrompt = buildAddScenePrompt(
        this.state.brand,
        this.state.config,
        this.state.scenes,
        prevScene?.sceneNumber,
        prevCode,
        nextCode,
        prompt
      );

      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: AI_MODELS.SMART,
        contents: [{ role: 'user', parts: [{ text: addPrompt }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const responseText = response.text || '';
      const addResult = parseAddSceneResponse(responseText);

      if (!addResult.code) {
        throw new Error('AI did not generate scene code');
      }

      // Calculate frame range
      const duration = addResult.suggestedDuration || 200;
      let frameStart = 0;
      if (prevScene) {
        const prevRange = prevScene.trimmedRange || prevScene.frameRange;
        frameStart = prevRange.end + 1;
      }

      // Create new scene
      const newSceneId = generateId('scene');
      const filePath = path.join(SCENES_DIR, `Scene${newSceneNumber}.tsx`);
      const initialVersion = createVersion(addResult.code, prompt);

      const newScene: EditorScene = {
        id: newSceneId,
        sceneNumber: newSceneNumber,
        title: addResult.title || `Scene ${newSceneNumber}`,
        description: addResult.description || prompt,
        order: insertIndex,
        frameRange: { start: frameStart, end: frameStart + duration - 1 },
        codeFilePath: filePath,
        versions: [initialVersion],
        currentVersionId: initialVersion.id,
        status: 'rendering',
      };

      // Write scene file
      await fs.writeFile(filePath, addResult.code, 'utf-8');

      // Insert into scenes array
      this.state.scenes.splice(insertIndex, 0, newScene);
      this.state.scenes = recalculateSceneOrders(this.state.scenes);
      this.state.totalDuration = calculateTotalDuration(this.state.scenes);

      // Get the scene reference from the array (recalculateSceneOrders creates new objects)
      const sceneInArray = this.state.scenes.find(s => s.id === newSceneId)!;

      this.emit({ type: 'sceneStatus', sceneId: newSceneId, status: 'rendering', message: 'Rendering preview...', progress: 0 });

      // Render preview
      try {
        const previewResult = await this.renderer.renderScenePreview(
          newSceneNumber,
          duration,
          this.state.config,
          (progress) => {
            this.emit({ type: 'sceneStatus', sceneId: newSceneId, status: 'rendering', progress: Math.round(progress * 100), message: `Rendering: ${Math.round(progress * 100)}%` });
          }
        );

        sceneInArray.previewUrl = `/api/preview/${path.basename(previewResult.videoPath)}`;
        // Update the version's previewUrl too
        const versionInArray = sceneInArray.versions.find(v => v.id === sceneInArray.currentVersionId);
        if (versionInArray) {
          versionInArray.previewUrl = sceneInArray.previewUrl;
        }
        sceneInArray.status = 'ready';

        this.emit({
          type: 'sceneUpdated',
          sceneId: newSceneId,
          previewUrl: sceneInArray.previewUrl,
          code: addResult.code,
          versionId: sceneInArray.currentVersionId,
        });
      } catch (renderError) {
        console.error(`Failed to render preview for new scene:`, renderError);
        sceneInArray.status = 'ready';
      }

      // Update MainComposition
      await this.regenerateMainComposition();

      // Create undo operation
      const operation = createOperation(
        'add',
        [newSceneId],
        [],
        [cloneScene(sceneInArray)],
        `Add scene: ${prompt.substring(0, 30)}...`
      );
      this.pushToUndoStack(operation);

      // Save state
      await this.saveState();
      
      // Emit full state sync
      this.emit({ type: 'stateSync', state: this.state });

      return newSceneId;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[EditorOrchestrator] addScene failed:', errorMessage);
        this.emit({ type: 'error', message: `Failed to add scene: ${errorMessage}` });
        throw error;
      }
    });
  }

  /**
   * Delete a scene.
   */
  async deleteScene(sceneId: string): Promise<void> {
    return this.queueOperation(async () => {
      if (!this.state) throw new Error('Editor not initialized');

      const sceneIndex = this.state.scenes.findIndex(s => s.id === sceneId);
      if (sceneIndex === -1) {
        throw new Error('Scene not found');
      }

      const scene = this.state.scenes[sceneIndex];

      // Store for undo
      const previousState = cloneScene(scene);

      // Remove from array
      this.state.scenes.splice(sceneIndex, 1);
      this.state.scenes = recalculateSceneOrders(this.state.scenes);
      this.state.totalDuration = calculateTotalDuration(this.state.scenes);

      // Note: We don't delete the file immediately (for undo purposes)
      // File cleanup happens later

      // Update MainComposition
      await this.regenerateMainComposition();

      // Create undo operation
      const operation = createOperation(
        'delete',
        [sceneId],
        [previousState],
        [],
        `Delete scene ${scene.sceneNumber}`
      );
      this.pushToUndoStack(operation);

      // Save state
      await this.saveState();

      // Emit full state sync
      this.emit({ type: 'stateSync', state: this.state });
    });
  }

  /**
   * Reorder scenes.
   */
  async reorderScenes(newOrder: string[]): Promise<void> {
    return this.queueOperation(async () => {
      if (!this.state) throw new Error('Editor not initialized');

      // Validate all IDs exist
      for (const id of newOrder) {
        if (!this.state.scenes.find(s => s.id === id)) {
          throw new Error(`Scene ${id} not found`);
        }
      }

      // Store previous order for undo
      const previousStates = this.state.scenes.map(s => cloneScene(s));

      // Reorder scenes
      const reorderedScenes: EditorScene[] = [];
      for (const id of newOrder) {
        const scene = this.state.scenes.find(s => s.id === id)!;
        reorderedScenes.push(scene);
      }

      this.state.scenes = recalculateSceneOrders(reorderedScenes);
      this.state.totalDuration = calculateTotalDuration(this.state.scenes);

      // Update MainComposition
      await this.regenerateMainComposition();

      // Create undo operation
      const operation = createOperation(
        'reorder',
        newOrder,
        previousStates,
        this.state.scenes.map(s => cloneScene(s)),
        'Reorder scenes'
      );
      this.pushToUndoStack(operation);

      // Save state
      await this.saveState();

      // Emit full state sync
      this.emit({ type: 'stateSync', state: this.state });
    });
  }

  /**
   * Trim a scene's frame range.
   */
  async trimScene(sceneId: string, frameRange: { start: number; end: number }): Promise<void> {
    return this.queueOperation(async () => {
      if (!this.state) throw new Error('Editor not initialized');

      const scene = this.state.scenes.find(s => s.id === sceneId);
      if (!scene) {
        throw new Error('Scene not found');
      }

      // Validate frame range
      const originalDuration = scene.frameRange.end - scene.frameRange.start + 1;
      const newDuration = frameRange.end - frameRange.start + 1;
      if (newDuration < 30) {
        throw new Error('Scene must be at least 1 second (30 frames)');
      }
      if (newDuration > originalDuration) {
        throw new Error('Cannot extend beyond original scene duration');
      }

      // Store previous state
      const previousState = cloneScene(scene);

      // Apply trim
      scene.trimmedRange = frameRange;
      this.state.totalDuration = calculateTotalDuration(this.state.scenes);

      // Update MainComposition
      await this.regenerateMainComposition();

      // Create undo operation
      const operation = createOperation(
        'trim',
        [sceneId],
        [previousState],
        [cloneScene(scene)],
        `Trim scene ${scene.sceneNumber}`
      );
      this.pushToUndoStack(operation);

      // Save state
      await this.saveState();

      // Emit update
      this.emit({ type: 'stateSync', state: this.state });
    });
  }

  /**
   * Revert a scene to a previous version.
   */
  async revertScene(sceneId: string, versionId: string): Promise<void> {
    return this.queueOperation(async () => {
      if (!this.state) throw new Error('Editor not initialized');

      const scene = this.state.scenes.find(s => s.id === sceneId);
      if (!scene) {
        throw new Error('Scene not found');
      }

      const version = scene.versions.find(v => v.id === versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // Store previous state
      const previousState = cloneScene(scene);

      // Apply revert
      scene.currentVersionId = versionId;
      scene.status = 'rendering';

      // Write the code to file
      await fs.writeFile(scene.codeFilePath, version.codeSnapshot, 'utf-8');

      this.emit({ type: 'sceneStatus', sceneId, status: 'rendering', message: 'Rendering reverted version...' });

      // Render preview
      try {
        const duration = (scene.trimmedRange || scene.frameRange).end - (scene.trimmedRange || scene.frameRange).start + 1;
        const previewResult = await this.renderer.renderScenePreview(
          scene.sceneNumber,
          duration,
          this.state.config,
          (progress) => {
            this.emit({ type: 'sceneStatus', sceneId, status: 'rendering', progress: Math.round(progress * 100) });
          }
        );

        scene.previewUrl = `/api/preview/${path.basename(previewResult.videoPath)}`;
        scene.status = 'ready';

        this.emit({
          type: 'sceneUpdated',
          sceneId,
          previewUrl: scene.previewUrl,
          code: version.codeSnapshot,
          versionId,
        });
      } catch (error) {
        scene.status = 'ready';
        console.error('Failed to render reverted scene:', error);
      }

      // Create undo operation
      const operation = createOperation(
        'revert',
        [sceneId],
        [previousState],
        [cloneScene(scene)],
        `Revert scene ${scene.sceneNumber} to previous version`
      );
      this.pushToUndoStack(operation);

      // Save state
      await this.saveState();
    });
  }

  /**
   * Undo the last operation.
   */
  async undo(): Promise<EditorOperation | null> {
    return this.queueOperation(async () => {
      if (!this.state || this.state.undoStack.length === 0) {
        return null;
      }

      const operation = this.state.undoStack.pop()!;

      // Apply the reverse of the operation
      await this.applyOperationReverse(operation);

      // Move to redo stack
      this.state.redoStack.push(operation);

      // Save state
      await this.saveState();

      // Emit full state sync
      this.emit({ type: 'stateSync', state: this.state });

      return operation;
    });
  }

  /**
   * Redo the last undone operation.
   */
  async redo(): Promise<EditorOperation | null> {
    return this.queueOperation(async () => {
      if (!this.state || this.state.redoStack.length === 0) {
        return null;
      }

      const operation = this.state.redoStack.pop()!;

      // Apply the operation
      await this.applyOperation(operation);

      // Move back to undo stack
      this.state.undoStack.push(operation);

      // Save state
      await this.saveState();

      // Emit full state sync
      this.emit({ type: 'stateSync', state: this.state });

      return operation;
    });
  }

  /**
   * Apply an operation (for redo).
   */
  private async applyOperation(operation: EditorOperation): Promise<void> {
    if (!this.state) return;

    switch (operation.type) {
      case 'edit':
      case 'revert':
        // Restore new state
        for (let i = 0; i < operation.sceneIds.length; i++) {
          const scene = this.state.scenes.find(s => s.id === operation.sceneIds[i]);
          if (scene && operation.newState[i]) {
            Object.assign(scene, operation.newState[i]);
            // Write code to file if we have it
            const currentVersion = scene.versions.find(v => v.id === scene.currentVersionId);
            if (currentVersion) {
              await fs.writeFile(scene.codeFilePath, currentVersion.codeSnapshot, 'utf-8');
            }
          }
        }
        break;

      case 'add':
        // Re-add the scene
        if (operation.newState[0]) {
          const newScene = operation.newState[0] as EditorScene;
          this.state.scenes.push(newScene);
          this.state.scenes = recalculateSceneOrders(this.state.scenes);
          const currentVersion = newScene.versions.find(v => v.id === newScene.currentVersionId);
          if (currentVersion) {
            await fs.writeFile(newScene.codeFilePath, currentVersion.codeSnapshot, 'utf-8');
          }
        }
        break;

      case 'delete':
        // Remove the scene again
        this.state.scenes = this.state.scenes.filter(s => !operation.sceneIds.includes(s.id));
        this.state.scenes = recalculateSceneOrders(this.state.scenes);
        break;

      case 'reorder':
        // Apply new order
        const reordered: EditorScene[] = [];
        for (let i = 0; i < operation.newState.length; i++) {
          const scene = this.state.scenes.find(s => s.id === operation.sceneIds[i]);
          if (scene) {
            reordered.push({ ...scene, order: i });
          }
        }
        this.state.scenes = reordered;
        break;

      case 'trim':
        // Apply new trim
        for (let i = 0; i < operation.sceneIds.length; i++) {
          const scene = this.state.scenes.find(s => s.id === operation.sceneIds[i]);
          if (scene && operation.newState[i]) {
            scene.trimmedRange = (operation.newState[i] as EditorScene).trimmedRange;
          }
        }
        break;
    }

    this.state.totalDuration = calculateTotalDuration(this.state.scenes);
    await this.regenerateMainComposition();
  }

  /**
   * Apply the reverse of an operation (for undo).
   */
  private async applyOperationReverse(operation: EditorOperation): Promise<void> {
    if (!this.state) return;

    switch (operation.type) {
      case 'edit':
      case 'revert':
        // Restore previous state
        for (let i = 0; i < operation.sceneIds.length; i++) {
          const scene = this.state.scenes.find(s => s.id === operation.sceneIds[i]);
          if (scene && operation.previousState[i]) {
            Object.assign(scene, operation.previousState[i]);
            // Write previous code to file
            const currentVersion = scene.versions.find(v => v.id === scene.currentVersionId);
            if (currentVersion) {
              await fs.writeFile(scene.codeFilePath, currentVersion.codeSnapshot, 'utf-8');
            }
          }
        }
        break;

      case 'add':
        // Remove the added scene
        this.state.scenes = this.state.scenes.filter(s => !operation.sceneIds.includes(s.id));
        this.state.scenes = recalculateSceneOrders(this.state.scenes);
        break;

      case 'delete':
        // Re-add the deleted scene
        for (const prevState of operation.previousState) {
          if (prevState) {
            this.state.scenes.push(prevState as EditorScene);
            const scene = prevState as EditorScene;
            const currentVersion = scene.versions.find(v => v.id === scene.currentVersionId);
            if (currentVersion) {
              await fs.writeFile(scene.codeFilePath, currentVersion.codeSnapshot, 'utf-8');
            }
          }
        }
        this.state.scenes = recalculateSceneOrders(this.state.scenes);
        break;

      case 'reorder':
        // Restore previous order
        const reordered: EditorScene[] = [];
        for (let i = 0; i < operation.previousState.length; i++) {
          const prevScene = operation.previousState[i] as EditorScene;
          const scene = this.state.scenes.find(s => s.id === prevScene.id);
          if (scene) {
            reordered.push({ ...scene, order: prevScene.order });
          }
        }
        reordered.sort((a, b) => a.order - b.order);
        this.state.scenes = reordered;
        break;

      case 'trim':
        // Restore previous trim
        for (let i = 0; i < operation.sceneIds.length; i++) {
          const scene = this.state.scenes.find(s => s.id === operation.sceneIds[i]);
          if (scene && operation.previousState[i]) {
            scene.trimmedRange = (operation.previousState[i] as EditorScene).trimmedRange;
          }
        }
        break;
    }

    this.state.totalDuration = calculateTotalDuration(this.state.scenes);
    await this.regenerateMainComposition();
  }

  /**
   * Regenerate the MainComposition file based on current scene order.
   */
  private async regenerateMainComposition(): Promise<void> {
    if (!this.state) return;

    const scenes = this.state.scenes.sort((a, b) => a.order - b.order);

    // Generate imports
    const imports = scenes
      .map(s => `import { Scene${s.sceneNumber} } from './Scene${s.sceneNumber}';`)
      .join('\n');

    // Generate series items
    const seriesItems = scenes
      .map(s => {
        const range = s.trimmedRange || s.frameRange;
        const duration = range.end - range.start + 1;
        return `      <Series.Sequence durationInFrames={${duration}}>
        <Scene${s.sceneNumber} />
      </Series.Sequence>`;
      })
      .join('\n');

    // Calculate total duration for audio
    const totalDuration = scenes.reduce((sum, s) => {
      const range = s.trimmedRange || s.frameRange;
      return sum + (range.end - range.start + 1);
    }, 0);

    // Default background music
    const musicFile = 'tunetank-inspiring-cinematic-music-409347.mp3';

    const mainComposition = `import React from 'react';
import { AbsoluteFill, Series, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
${imports}

/**
 * MainComposition sequences all generated scenes with background music.
 * Total duration: ${totalDuration} frames (${(totalDuration / 30).toFixed(1)} seconds at 30fps)
 */
export const MainComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Audio fade in/out for smooth transitions
  const fadeInDuration = 0.5 * fps; // 0.5 second fade in
  const fadeOutDuration = 1 * fps; // 1 second fade out
  const fadeOutStart = durationInFrames - fadeOutDuration;

  return (
    <AbsoluteFill>
      {/* Background Music */}
      <Audio
        src={staticFile('audio/${musicFile}')}
        volume={(f) => {
          // Fade in
          if (f < fadeInDuration) {
            return interpolate(f, [0, fadeInDuration], [0, 0.3], { extrapolateRight: 'clamp' });
          }
          // Fade out
          if (f >= fadeOutStart) {
            return interpolate(f, [fadeOutStart, durationInFrames], [0.3, 0], { extrapolateRight: 'clamp' });
          }
          // Normal volume
          return 0.3;
        }}
        loop
      />
      
      {/* Scene Sequence */}
      <Series>
${seriesItems}
      </Series>
    </AbsoluteFill>
  );
};
`;

    await fs.writeFile(
      path.join(SCENES_DIR, 'MainComposition.tsx'),
      mainComposition,
      'utf-8'
    );
  }

  /**
   * Export the final video.
   */
  async exportVideo(): Promise<string> {
    return this.queueOperation(async () => {
      if (!this.state) throw new Error('Editor not initialized');

      this.state.exportStatus = 'rendering';
      this.state.exportProgress = 0;
      this.emit({ type: 'exportProgress', progress: 0, status: 'Starting export...' });

      try {
        // Ensure MainComposition is up to date
        await this.regenerateMainComposition();

        // Render the full video using the renderer's render method
        const mainCompositionPath = path.join(SCENES_DIR, 'MainComposition.tsx');
        const videoPath = await this.renderer.render(
          mainCompositionPath,
          this.state.config,
          (progress) => {
            this.state!.exportProgress = Math.round(progress * 100);
            this.emit({ type: 'exportProgress', progress: Math.round(progress * 100), status: `Rendering: ${Math.round(progress * 100)}%` });
          }
        );

        this.state.exportStatus = 'complete';
        this.state.exportedVideoPath = videoPath;
        this.state.exportProgress = 100;

        await this.saveState();

        this.emit({ type: 'exportComplete', videoPath });

        return videoPath;
      } catch (error) {
        this.state.exportStatus = 'error';
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.emit({ type: 'error', message: `Export failed: ${errorMessage}` });
        throw error;
      }
    });
  }
}
