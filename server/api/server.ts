/**
 * Express Server Configuration
 * 
 * Configures and exports the Express application.
 */

import express from 'express';
import { corsConfig, errorHandler } from './middleware';
import {
    workflowRoutes,
    editorRoutes,
    scriptRoutes,
    videoRoutes,
    uploadRoutes,
    utilityRoutes,
    orchestratorMap,
    initEditorRoutes
} from './routes';
import {
    generateScript,
    generateScriptLegacy,
    transformScript,
    generateVideo,
    getJobStatus,
    getVideo,
    getPreview,
    healthCheck
} from '../core/controllers';

/**
 * Create and configure Express application
 */
export const createApp = (): express.Application => {
    const app = express();

    // Middleware
    app.use(corsConfig);
    app.use(express.json({ limit: '10mb' }));

    // === New RESTful Routes ===
    app.use('/api/workflow', workflowRoutes);
    app.use('/api/editor', initEditorRoutes(orchestratorMap));
    app.use('/api/script', scriptRoutes);
    app.use('/api/video', videoRoutes);
    app.use('/api/upload', uploadRoutes);

    // === Legacy Routes (backward compatibility) ===
    // These match the old API endpoints the frontend expects
    app.post('/api/generate-script', generateScriptLegacy);
    app.post('/api/generate', generateVideo);
    app.get('/api/status/:jobId', getJobStatus);
    app.get('/api/video/:jobId', getVideo);
    app.get('/api/preview/:filename', getPreview);
    app.get('/api/health', healthCheck);

    // Error handler (must be last)
    app.use(errorHandler);

    return app;
};

export { orchestratorMap };
