import { Request, Response } from 'express';
import { getPreviewPath } from '../services/file.service';
import { checkRedisHealth, getConnectionStatus, getConnectionInfo } from '../../queues/redisConnection';

/**
 * GET /api/preview/:filename
 * GET /api/preview/:projectId/:filename
 * Stream scene preview video file
 */
export const getPreview = (req: Request, res: Response) => {
    const { projectId, filename } = req.params;

    // Build path: either "projectId/filename" or just "filename"
    const filePath = projectId && filename 
        ? `${projectId}/${filename}` 
        : projectId; // When only one param, it's in projectId position

    const previewPath = getPreviewPath(filePath);

    if (previewPath) {
        res.sendFile(previewPath);
    } else {
        res.status(404).json({ error: 'Preview not found' });
    }
};

/**
 * GET /api/health
 * Health check endpoint with Redis status
 */
export const healthCheck = async (req: Request, res: Response) => {
    try {
        const redisHealth = await checkRedisHealth();
        const connectionStatus = getConnectionStatus();
        const connectionInfo = getConnectionInfo();
        
        const isHealthy = redisHealth.connected;
        
        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                redis: {
                    connected: redisHealth.connected,
                    latencyMs: redisHealth.latencyMs,
                    error: redisHealth.error,
                    status: connectionStatus,
                    config: {
                        host: connectionInfo.host,
                        port: connectionInfo.port,
                        hasAuth: connectionInfo.hasAuth,
                    },
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
