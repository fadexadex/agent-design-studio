/**
 * Routes Module - All API route handlers
 * 
 * Centralized export of all route modules:
 * - Workflow routes
 * - Editor routes
 * - Script routes
 * - Video routes
 * - Utility routes
 */

export { default as workflowRoutes, orchestratorMap } from './workflow.routes';
export { default as editorRoutes, initEditorRoutes } from './editor.routes';
export { default as scriptRoutes } from './script.routes';
export { default as videoRoutes } from './video.routes';
export { default as utilityRoutes } from './utility.routes';
