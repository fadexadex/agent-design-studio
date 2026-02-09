/**
 * Agent Design Studio - Backend Server
 * 
 * Main entry point for the backend application.
 * 
 * Architecture:
 * - /api - API layer (routes, middleware, server config)
 * - /core - Business logic (agent, workflow, editor, controllers, services)
 * - /shared - Shared utilities (types, constants, helpers, config)
 * - /workers - BullMQ workers for Director-Agent architecture
 */

import { loadConfig, getConfig } from './shared/config';
import { createApp } from './api/server';
import { startWorkers } from './workers/startWorkers';

// Load environment configuration
loadConfig();

// Get application config
const config = getConfig();

// Create Express application
const app = createApp();

// Start server
app.listen(config.port, async () => {
    console.log(`🎬 Agent Design Studio Backend new running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Health check: http://localhost:${config.port}/api/health`);
    
    // Start Director-Agent workers
    try {
        await startWorkers({
            directorConcurrency: 1,      // Single director
            sceneGeneratorConcurrency: 10, // High parallelism
            sceneRenderConcurrency: 5,
            sceneEvaluatorConcurrency: 5,
            globalEvaluatorConcurrency: 1,
            enableGracefulShutdown: true,
        });
        console.log(`   Workers: Started successfully`);
    } catch (error) {
        console.error(`   Workers: Failed to start -`, error);
    }
});

export default app;
