/**
 * Events Routes - Server-Sent Events endpoint for real-time UI updates
 * 
 * Provides SSE streaming of Redis Stream events to the frontend.
 * Uses XREAD with blocking for efficient event delivery.
 */

import { Router, Request, Response } from 'express';
import { createNewConnection } from '../../queues/redisConnection.js';
import { STREAM_KEYS, parseStreamEntry, StreamEntry } from '../../events/index.js';

const router = Router();

/**
 * SSE endpoint for project events
 * 
 * GET /api/events/:projectId
 * 
 * Query params:
 * - lastEventId: Start reading from this event ID (default: '$' for new events only)
 * - includeHistory: If 'true', start from beginning (default: false)
 */
router.get('/:projectId', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { lastEventId, includeHistory } = req.query;
  
  // Validate projectId
  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ error: 'Invalid projectId' });
    return;
  }

  console.log(`[SSE] Client connected for project: ${projectId}`);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Create a dedicated Redis connection for this SSE stream
  // This is important because XREAD BLOCK is blocking
  const redis = createNewConnection(`sse-${projectId}`);
  
  // Determine starting position
  let currentId = includeHistory === 'true' 
    ? '0'  // Start from beginning
    : (lastEventId as string) || '$'; // New events only or from specified ID

  const streamKey = STREAM_KEYS.projectEvents(projectId);
  let isConnected = true;
  
  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ projectId, streamKey })}\n\n`);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (isConnected) {
      res.write(`: heartbeat\n\n`);
    }
  }, 15000); // Every 15 seconds

  // Event reading loop
  const readEvents = async () => {
    while (isConnected) {
      try {
        // XREAD with 5 second block timeout
        const result = await redis.call(
          'XREAD',
          'BLOCK',
          '5000',
          'COUNT',
          '100',
          'STREAMS',
          streamKey,
          currentId
        ) as [string, [string, string[]][]][] | null;

        if (!isConnected) break;

        if (result && result.length > 0) {
          const [, entries] = result[0];
          
          for (const [id, fields] of entries) {
            if (!isConnected) break;
            
            const event = parseStreamEntry(id, fields);
            
            // Send event to client
            res.write(`id: ${id}\n`);
            res.write(`event: ${event.type}\n`);
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            
            // Update current position
            currentId = id;
          }
        }
        // If result is null, it was a timeout - just continue the loop
      } catch (error) {
        if (!isConnected) break;
        
        console.error(`[SSE] Error reading stream for ${projectId}:`, error);
        
        // Send error event to client
        res.write(`event: error\ndata: ${JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Stream read error' 
        })}\n\n`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // Start reading events
  readEvents();

  // Handle client disconnect
  req.on('close', () => {
    console.log(`[SSE] Client disconnected from project: ${projectId}`);
    isConnected = false;
    clearInterval(heartbeatInterval);
    redis.quit().catch(() => {}); // Ignore errors on cleanup
  });

  req.on('error', (err) => {
    console.error(`[SSE] Request error for ${projectId}:`, err);
    isConnected = false;
    clearInterval(heartbeatInterval);
    redis.quit().catch(() => {});
  });
});

/**
 * Get historical events for a project
 * 
 * GET /api/events/:projectId/history
 * 
 * Query params:
 * - from: Start from this event ID (default: '0' for all)
 * - count: Max number of events to return (default: 100, max: 1000)
 */
router.get('/:projectId/history', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { from = '0', count = '100' } = req.query;
  
  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ error: 'Invalid projectId' });
    return;
  }

  const maxCount = Math.min(parseInt(count as string, 10) || 100, 1000);
  const streamKey = STREAM_KEYS.projectEvents(projectId);

  try {
    const { getRedisConnection } = await import('../../queues/redisConnection.js');
    const redis = getRedisConnection();
    
    const result = await redis.xread(
      'COUNT',
      maxCount.toString(),
      'STREAMS',
      streamKey,
      from as string
    ) as [string, [string, string[]][]][] | null;

    if (!result || result.length === 0) {
      res.json({ 
        projectId, 
        events: [],
        lastEventId: null,
      });
      return;
    }

    const [, entries] = result[0];
    const events: StreamEntry[] = entries.map(([id, fields]) => 
      parseStreamEntry(id, fields)
    );

    res.json({
      projectId,
      events,
      lastEventId: events.length > 0 ? events[events.length - 1].id : null,
      hasMore: events.length === maxCount,
    });
  } catch (error) {
    console.error(`[Events] Error fetching history for ${projectId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch event history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get stream info for a project
 * 
 * GET /api/events/:projectId/info
 */
router.get('/:projectId/info', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  
  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ error: 'Invalid projectId' });
    return;
  }

  const streamKey = STREAM_KEYS.projectEvents(projectId);

  try {
    const { getRedisConnection } = await import('../../queues/redisConnection.js');
    const redis = getRedisConnection();
    
    const info = await redis.xinfo('STREAM', streamKey).catch(() => null);
    
    if (!info) {
      res.json({
        projectId,
        exists: false,
        length: 0,
        firstEntry: null,
        lastEntry: null,
      });
      return;
    }

    // Parse XINFO STREAM response
    const infoMap: Record<string, unknown> = {};
    const infoArray = info as unknown[];
    for (let i = 0; i < infoArray.length; i += 2) {
      infoMap[infoArray[i] as string] = infoArray[i + 1];
    }

    res.json({
      projectId,
      exists: true,
      length: infoMap['length'],
      firstEntryId: infoMap['first-entry'] ? (infoMap['first-entry'] as string[])[0] : null,
      lastEntryId: infoMap['last-entry'] ? (infoMap['last-entry'] as string[])[0] : null,
      lastGeneratedId: infoMap['last-generated-id'],
    });
  } catch (error) {
    console.error(`[Events] Error fetching stream info for ${projectId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch stream info',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
