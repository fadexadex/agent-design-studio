/**
 * Agent Design Studio - Backend Server
 * 
 * Main entry point for the backend application.
 * 
 * Architecture:
 * - /api - API layer (routes, middleware, server config)
 * - /core - Business logic (agent, workflow, editor, controllers, services)
 * - /shared - Shared utilities (types, constants, helpers, config)
 */

import { loadConfig, getConfig } from './shared/config';
import { createApp } from './api/server';

// Load environment configuration
loadConfig();

// Get application config
const config = getConfig();

// Create Express application
const app = createApp();

// Start server
app.listen(config.port, () => {
    console.log(`🎬 Agent Design Studio Backend new running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Health check: http://localhost:${config.port}/api/health`);
});

export default app;
