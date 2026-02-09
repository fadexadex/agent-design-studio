/**
 * Routes Module - All API route handlers
 * 
 * Centralized export of all route modules:
 * - Workflow routes (legacy orchestrator)
 * - Director routes (new Director-Agent architecture)
 * - Editor routes
 * - Script routes
 * - Video routes
 * - Upload routes (for media assets used in Remotion compositions)
 * - Utility routes
 * - Events routes (SSE for real-time updates)
 */

export { default as workflowRoutes, orchestratorMap } from './workflow.routes';
export { default as directorRoutes } from './director.routes';
export { default as editorRoutes, initEditorRoutes } from './editor.routes';
export { default as scriptRoutes } from './script.routes';
export { default as videoRoutes } from './video.routes';
export { default as uploadRoutes } from './upload.routes';
export { default as utilityRoutes } from './utility.routes';
export { default as eventsRoutes } from './events.routes';
