#!/usr/bin/env npx tsx
/**
 * End-to-End Test for Director-Agent Pipeline
 *
 * This script tests the complete video generation pipeline:
 * 1. Start a project via the Director API
 * 2. Monitor SSE events for real-time progress
 * 3. Poll status endpoint to verify state changes
 * 4. Verify video output is created
 *
 * Usage:
 *   npx tsx server/tests/e2e-director.test.ts
 *
 * Requirements:
 *   - Server running on http://localhost:3001
 *   - Redis connection available
 *   - GEMINI_API_KEY environment variable set
 */

import { EventSource } from 'eventsource';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const TEST_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max (to handle API rate limits)
const POLL_INTERVAL_MS = 2000;

// Test brand context
const TEST_BRAND = {
  name: 'TestBrand',
  industry: 'Technology',
  tagline: 'Innovation for Tomorrow',
  colors: {
    primary: '#4F46E5',
    secondary: '#10B981',
    accent: '#F59E0B',
  },
  style: 'dynamic' as const,
  aspectRatio: '16:9' as const,
  prompt: 'Create a simple 3-step tutorial video. Step 1: Connect. Step 2: Configure. Step 3: Launch.',
};

// ============================================================================
// Test Utilities
// ============================================================================

function log(message: string, type: 'info' | 'success' | 'error' | 'event' = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  const prefix = {
    info: '\x1b[36mℹ\x1b[0m',
    success: '\x1b[32m✓\x1b[0m',
    error: '\x1b[31m✗\x1b[0m',
    event: '\x1b[33m→\x1b[0m',
  }[type];
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// API Functions
// ============================================================================

async function startProject(): Promise<{ projectId: string; jobId: string }> {
  log('Starting project via POST /api/director/start');

  const response = await fetch(`${API_BASE}/api/director/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: TEST_BRAND,
      config: {
        maxGlobalIterations: 2,
        targetScore: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to start project: ${response.status} ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  log(`Project started: ${data.projectId}`, 'success');
  return data;
}

async function getStatus(projectId: string): Promise<{
  phase: string;
  progress: { scenesTotal: number; scenesCompleted: number; globalIteration: number };
  scenes: Array<{ id: string; title: string; status: string; version: number; score: number | null }>;
  error: { message: string } | null;
  output: { videoPath: string | null };
}> {
  const response = await fetch(`${API_BASE}/api/director/${projectId}/status`);

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.status}`);
  }

  return response.json();
}

async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/director/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// ============================================================================
// SSE Event Monitoring
// ============================================================================

interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  lastEventTime: number;
  firstEventTime: number;
}

function connectToSSE(projectId: string): Promise<{
  eventSource: EventSource;
  stats: EventStats;
  waitForCompletion: () => Promise<boolean>;
  maxConcurrentGenerations: number;
}> {
  return new Promise((resolve) => {
    const stats: EventStats = {
      totalEvents: 0,
      eventsByType: {},
      lastEventTime: Date.now(),
      firstEventTime: Date.now(),
    };

    let completionResolver: ((success: boolean) => void) | null = null;
    const completionPromise = new Promise<boolean>((res) => {
      completionResolver = res;
    });

    const eventsUrl = `${API_BASE}/api/events/${projectId}?includeHistory=true`;
    log(`Connecting to SSE: ${eventsUrl}`);

    const eventSource = new EventSource(eventsUrl);

    // Track parallel execution
    let maxConcurrentGenerations = 0;
    let currentGenerations = 0;
    const sceneGenerations = new Set<string>();

    // Return object to be populated
    const resultObj = {
      eventSource,
      stats,
      waitForCompletion: () => completionPromise,
      maxConcurrentGenerations: 0,
    };

    eventSource.onopen = () => {
      log('SSE connection established', 'success');
      stats.firstEventTime = Date.now();
      resolve(resultObj);
    };

    eventSource.onerror = (err) => {
      log(`SSE connection error: ${JSON.stringify(err)}`, 'error');
    };

    // Track all events
    const trackEvent = (type: string, data: unknown) => {
      stats.totalEvents++;
      stats.eventsByType[type] = (stats.eventsByType[type] || 0) + 1;
      stats.lastEventTime = Date.now();

      // Track concurrency
      if (type === 'scene:generating') {
        const payload = (data as { data?: { sceneId?: string } }).data;
        if (payload?.sceneId) {
          sceneGenerations.add(payload.sceneId);
          currentGenerations = sceneGenerations.size;
          maxConcurrentGenerations = Math.max(maxConcurrentGenerations, currentGenerations);
          resultObj.maxConcurrentGenerations = maxConcurrentGenerations;
          log(`Concurrency check: ${currentGenerations} scenes generating simultaneously (Max: ${maxConcurrentGenerations})`, 'info');
        }
      } else if (type === 'scene:generated' || type === 'scene:error') {
        const payload = (data as { data?: { sceneId?: string } }).data;
        if (payload?.sceneId) {
          sceneGenerations.delete(payload.sceneId);
          currentGenerations = sceneGenerations.size;
          log(`Concurrency check: ${currentGenerations} scenes generating simultaneously`, 'info');
        }
      }

      // Log important events
      if (type === 'director:thinking') {
        const payload = (data as { data?: { thought?: string } }).data;
        log(`Director: ${payload?.thought || 'thinking...'}`, 'event');
      } else if (type === 'director:decision') {
        const payload = (data as { data?: { decision?: string } }).data;
        log(`Decision: ${payload?.decision || 'made decision'}`, 'event');
      } else if (type.startsWith('scene:')) {
        const payload = (data as { data?: { sceneIndex?: number; sceneNumber?: number; version?: number } }).data;
        log(`${type}: scene ${payload?.sceneNumber || (payload?.sceneIndex !== undefined ? payload.sceneIndex + 1 : '?')} v${payload?.version}`, 'event');
      } else if (type === 'evaluation:completed') {
        const payload = (data as { data?: { tier?: number; score?: number; passed?: boolean; sceneNumber?: number } }).data;
        if (payload?.tier === 1) {
          log(`Evaluation Tier 1: Scene ${payload?.sceneNumber} score=${payload?.score?.toFixed(2)}, passed=${payload?.passed}`, 'event');
        } else {
          log(`Evaluation Tier 2: score=${payload?.score?.toFixed(2)}, passed=${payload?.passed}`, 'event');
        }
      }
    };

    // Listen for all event types
    const eventTypes = [
      'connected',
      'director:started',
      'director:thinking',
      'director:decision',
      'director:completed',
      'director:error',
      'scene:queued',
      'scene:generating',
      'scene:generated',
      'scene:rendering',
      'scene:rendered',
      'scene:error',
      'evaluation:started',
      'evaluation:completed',
      'evaluation:escalated',
      'render:started',
      'render:progress',
      'render:completed',
      'render:error',
    ];

    for (const type of eventTypes) {
      eventSource.addEventListener(type, (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          trackEvent(type, data);

          if (type === 'director:completed') {
            log('Project completed!', 'success');
            completionResolver?.(true);
          } else if (type === 'director:error') {
            log(`Project failed: ${data.data?.error}`, 'error');
            completionResolver?.(false);
          }
        } catch (e) {
          log(`Failed to parse ${type} event`, 'error');
        }
      });
    }
  });
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTest(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       Director-Agent E2E Test                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check health first
  log('Checking system health...');
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    log('System is not healthy. Is the server running?', 'error');
    log(`Make sure the server is running: npm run server`, 'info');
    process.exit(1);
  }
  log('System is healthy', 'success');

  // Start the project
  const { projectId } = await startProject();

  // Connect to SSE
  const sseResult = await connectToSSE(projectId);
  const { eventSource, stats, waitForCompletion } = sseResult;

  // Set up timeout
  const timeoutPromise = sleep(TEST_TIMEOUT_MS).then(() => {
    log(`Test timed out after ${TEST_TIMEOUT_MS / 1000}s`, 'error');
    return false;
  });

  // Also poll status periodically
  const pollInterval = setInterval(async () => {
    try {
      const status = await getStatus(projectId);
      log(`Status: phase=${status.phase}, scenes=${status.progress.scenesCompleted}/${status.progress.scenesTotal}`);
    } catch (e) {
      // Ignore poll errors
    }
  }, POLL_INTERVAL_MS);

  // Wait for completion or timeout
  log('Waiting for project completion...');
  const success = await Promise.race([
    waitForCompletion(),
    timeoutPromise,
  ]);

  // Cleanup
  clearInterval(pollInterval);
  eventSource.close();

  // Final status check
  const finalStatus = await getStatus(projectId);

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       Test Results                                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  log(`Project ID: ${projectId}`);
  log(`Final Phase: ${finalStatus.phase}`);
  log(`Total Events: ${stats.totalEvents}`);
  log(`Event Types: ${Object.keys(stats.eventsByType).length}`);
  log(`Duration: ${((stats.lastEventTime - stats.firstEventTime) / 1000).toFixed(1)}s`);

  console.log('\nEvent breakdown:');
  for (const [type, count] of Object.entries(stats.eventsByType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\nScenes:');
  for (const scene of finalStatus.scenes) {
    console.log(`  ${scene.title}: ${scene.status} (v${scene.version || 0}, score=${scene.score?.toFixed(2) || 'N/A'})`);
  }

  if (finalStatus.error) {
    log(`Error: ${finalStatus.error.message}`, 'error');
  }

  if (finalStatus.output.videoPath) {
    log(`Video Output: ${finalStatus.output.videoPath}`, 'success');
  }

  // Check parallel execution
  // We expect at least 2 scenes to be generating simultaneously
  // (In ideal conditions all 3, but network/timing might serialize slightly)
  if (sseResult.maxConcurrentGenerations >= 2) {
      log(`Parallel execution verified: Max concurrency was ${sseResult.maxConcurrentGenerations}`, 'success');
  } else {
      log(`Parallel execution warning: Max concurrency was only ${sseResult.maxConcurrentGenerations}`, 'error');
  }

  // Final verdict
  console.log('\n');
  if (success && finalStatus.phase === 'completed' && finalStatus.output.videoPath) {
    log('TEST PASSED - Video generated successfully!', 'success');
    process.exit(0);
  } else if (finalStatus.phase === 'failed') {
    log('TEST FAILED - Project encountered an error', 'error');
    process.exit(1);
  } else {
    log('TEST INCOMPLETE - Project did not complete in time', 'error');
    process.exit(1);
  }
}

// ============================================================================
// Run
// ============================================================================

runTest().catch((error) => {
  log(`Test error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
