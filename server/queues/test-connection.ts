/**
 * Redis Connection Test Script
 * 
 * Tests the Redis connection and basic queue operations.
 * Run with: npx tsx server/queues/test-connection.ts
 */

import { config as dotenvConfig } from 'dotenv';

// Load .env.local first
dotenvConfig({ path: '.env.local' });

import {
  getRedisConnection,
  checkRedisHealth,
  getConnectionInfo,
  closeRedisConnections,
} from './redisConnection.js';
import {
  getDirectorQueue,
  getSceneAgentQueue,
  getSceneEvaluationQueue,
  getGlobalEvaluationQueue,
  QUEUE_NAMES,
  closeAllQueues,
} from './definitions.js';
import { uiEvents, readProjectEvents } from '../events/index.js';

async function testRedisConnection() {
  console.log('='.repeat(60));
  console.log('Redis Connection Test');
  console.log('='.repeat(60));
  
  // Show connection info
  const info = getConnectionInfo();
  console.log('\nConnection Config:');
  console.log(`  Host: ${info.host}`);
  console.log(`  Port: ${info.port}`);
  console.log(`  Has Auth: ${info.hasAuth}`);
  console.log(`  Using URL: ${info.useUrl}`);
  
  // Test connection
  console.log('\n1. Testing Redis connection...');
  const health = await checkRedisHealth();
  
  if (health.connected) {
    console.log(`   ✓ Connected! Latency: ${health.latencyMs}ms`);
  } else {
    console.log(`   ✗ Connection failed: ${health.error}`);
    return false;
  }
  
  // Test basic operations
  console.log('\n2. Testing basic Redis operations...');
  const redis = getRedisConnection();
  
  const testKey = `test:${Date.now()}`;
  await redis.set(testKey, 'hello');
  const value = await redis.get(testKey);
  await redis.del(testKey);
  
  if (value === 'hello') {
    console.log('   ✓ SET/GET/DEL operations work');
  } else {
    console.log('   ✗ Basic operations failed');
    return false;
  }
  
  return true;
}

async function testQueues() {
  console.log('\n3. Testing BullMQ queues...');
  
  try {
    // Initialize all queues
    const directorQueue = getDirectorQueue();
    const sceneAgentQueue = getSceneAgentQueue();
    const sceneEvaluationQueue = getSceneEvaluationQueue();
    const globalEvaluationQueue = getGlobalEvaluationQueue();
    
    console.log(`   ✓ ${QUEUE_NAMES.DIRECTOR} initialized`);
    console.log(`   ✓ ${QUEUE_NAMES.SCENE_AGENT} initialized`);
    console.log(`   ✓ ${QUEUE_NAMES.SCENE_EVALUATION} initialized`);
    console.log(`   ✓ ${QUEUE_NAMES.GLOBAL_EVALUATION} initialized`);
    
    // Add a test job
    console.log('\n4. Testing job addition...');
    const testJob = await directorQueue.add('test-job', {
      projectId: 'test-project',
      command: 'test',
      payload: { test: true },
      timestamp: Date.now(),
    });
    
    console.log(`   ✓ Test job added: ${testJob.id}`);
    
    // Remove the test job
    await testJob.remove();
    console.log(`   ✓ Test job removed`);
    
    return true;
  } catch (error) {
    console.log(`   ✗ Queue test failed: ${error}`);
    return false;
  }
}

async function testUIEvents() {
  console.log('\n5. Testing UI Events (Redis Streams)...');
  
  try {
    const projectId = `test-${Date.now()}`;
    
    // Emit a test event
    const eventId = await uiEvents.directorStarted(projectId, {
      totalScenes: 3,
      config: { test: true },
    });
    
    console.log(`   ✓ Event emitted: ${eventId}`);
    
    // Read the event back
    const events = await readProjectEvents(projectId, '0', 10);
    
    if (events.length > 0) {
      console.log(`   ✓ Event read back: ${events[0].type}`);
    } else {
      console.log('   ✗ Could not read event back');
      return false;
    }
    
    // Clean up
    const redis = getRedisConnection();
    await redis.del(`ui-events:${projectId}`);
    console.log(`   ✓ Test stream cleaned up`);
    
    return true;
  } catch (error) {
    console.log(`   ✗ UI Events test failed: ${error}`);
    return false;
  }
}

async function main() {
  try {
    const redisOk = await testRedisConnection();
    if (!redisOk) {
      console.log('\n❌ Redis connection failed. Please check your configuration.');
      process.exit(1);
    }
    
    const queuesOk = await testQueues();
    if (!queuesOk) {
      console.log('\n❌ Queue tests failed.');
      process.exit(1);
    }
    
    const eventsOk = await testUIEvents();
    if (!eventsOk) {
      console.log('\n❌ UI Events tests failed.');
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! Infrastructure is ready.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\nCleaning up...');
    await closeAllQueues();
    await closeRedisConnections();
    console.log('Done.');
    process.exit(0);
  }
}

main();
