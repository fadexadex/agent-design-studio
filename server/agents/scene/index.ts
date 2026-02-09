/**
 * Scene Module
 * 
 * Exports scene-related functionality for the Director-Agent architecture.
 */

// Scene Task Types and Utilities
export type {
  SceneGenerationTask,
  SceneGenerationResult,
  SceneRenderTask,
  SceneRenderResult,
  CodeValidationResult,
} from './SceneTask.js';

export {
  validateSceneCode,
  extractCodeFromResponse,
  getSceneCodePath,
  getSceneVideoPath,
  getScenePreviewWrapperPath,
} from './SceneTask.js';

// Scene Prompt Building
export {
  buildScenePrompt,
  buildSceneCorrectionPrompt,
  buildRenderErrorPrompt,
} from './ScenePromptBuilder.js';

// Scene Generator Worker
export type { SceneGeneratorWorkerOptions } from './SceneGeneratorWorker.js';

export {
  createSceneGeneratorWorker,
  validateGeneratedCode,
  autoFixCode,
  saveSceneCode,
  createScenePreviewWrapper,
} from './SceneGeneratorWorker.js';

// Scene Render Worker
export type {
  SceneRenderJobData,
  SceneRenderJobResult,
  SceneRenderWorkerOptions,
} from './SceneRenderWorker.js';

export {
  createSceneRenderWorker,
  renderScenePreview,
} from './SceneRenderWorker.js';
