/**
 * Director Agent Test Script
 * 
 * Tests the Director agent initialization and basic operations.
 * Run with: npx tsx server/agents/director/test-director.ts
 */

import { config as dotenvConfig } from 'dotenv';

// Load .env.local first
dotenvConfig({ path: '.env.local' });

import {
  DirectorAgent,
  getDirectorAgent,
  startProject,
  createDirectorState,
  createCommand,
  type StartProjectCommand,
  type DirectorState,
} from './index.js';
import {
  calculateSceneScore,
  calculateGlobalScore,
  getScoreBreakdown,
  identifyWeakComponents,
} from '../evaluation/index.js';
import { type BrandContext } from '../types.js';
import { getRedisConnection, closeRedisConnections } from '../../queues/redisConnection.js';
import { closeAllQueues } from '../../queues/definitions.js';

// Test brand context
const testBrandContext: BrandContext = {
  name: 'TestBrand',
  industry: 'Technology',
  tagline: 'Innovation for tomorrow',
  colors: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#F59E0B',
    background: '#FFFFFF',
  },
  style: 'dynamic',
  aspectRatio: '16:9',
  prompt: 'Create an exciting product launch video showcasing our new AI platform',
};

async function testStateCreation() {
  console.log('\n1. Testing state creation...');
  
  const state = createDirectorState({
    projectId: 'test-project-1',
    brandContext: testBrandContext,
    maxGlobalIterations: 5,
  });
  
  if (state.projectId === 'test-project-1') {
    console.log('   ✓ State created with correct projectId');
  } else {
    console.log('   ✗ State projectId mismatch');
    return false;
  }
  
  if (state.phase === 'initializing') {
    console.log('   ✓ Initial phase is "initializing"');
  } else {
    console.log('   ✗ Initial phase should be "initializing"');
    return false;
  }
  
  if (state.stateVersion === 1) {
    console.log('   ✓ Initial state version is 1');
  } else {
    console.log('   ✗ Initial state version should be 1');
    return false;
  }
  
  if (!state.directorSatisfied) {
    console.log('   ✓ Director not satisfied initially');
  } else {
    console.log('   ✗ Director should not be satisfied initially');
    return false;
  }
  
  return true;
}

async function testScoreCalculation() {
  console.log('\n2. Testing score calculation...');
  
  // Test scene score
  const sceneScore = calculateSceneScore({
    codeQuality: 0.8,
    visualAppeal: 0.9,
    brandAlignment: 0.85,
    technicalCorrectness: 0.95,
  });
  
  console.log(`   Scene score: ${sceneScore.toFixed(3)}`);
  
  if (sceneScore > 0.8 && sceneScore < 0.95) {
    console.log('   ✓ Scene score in expected range');
  } else {
    console.log('   ✗ Scene score out of expected range');
    return false;
  }
  
  // Test global score
  const globalScore = calculateGlobalScore({
    narrativeCohesion: 0.85,
    brandConsistency: 0.9,
    sceneScores: [0.75, 0.85, 0.80],
  });
  
  console.log(`   Global score: ${globalScore.toFixed(3)}`);
  
  if (globalScore > 0.7 && globalScore < 0.9) {
    console.log('   ✓ Global score in expected range');
  } else {
    console.log('   ✗ Global score out of expected range');
    return false;
  }
  
  return true;
}

async function testDirectorAgentPersistence() {
  console.log('\n3. Testing Director agent persistence...');
  
  const projectId = `test-${Date.now()}`;
  
  try {
    // Create and initialize agent
    const agent = new DirectorAgent(projectId);
    
    // Manually create and save state (not using startProject which queues jobs)
    const state = createDirectorState({
      projectId,
      brandContext: testBrandContext,
    });
    
    // Access private state via any cast for testing
    (agent as any).state = state;
    await (agent as any).saveState();
    
    console.log('   ✓ State saved to Redis');
    
    // Create new agent and load state
    const agent2 = new DirectorAgent(projectId);
    const loadedState = await agent2.loadState();
    
    if (loadedState) {
      console.log('   ✓ State loaded from Redis');
    } else {
      console.log('   ✗ Failed to load state from Redis');
      return false;
    }
    
    if (loadedState.projectId === projectId) {
      console.log('   ✓ Loaded state has correct projectId');
    } else {
      console.log('   ✗ Loaded state has wrong projectId');
      return false;
    }
    
    if (loadedState.brandContext.name === 'TestBrand') {
      console.log('   ✓ Brand context preserved');
    } else {
      console.log('   ✗ Brand context not preserved');
      return false;
    }
    
    // Cleanup
    const redis = getRedisConnection();
    await redis.del(`director:${projectId}`);
    console.log('   ✓ Test state cleaned up');
    
    return true;
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
    return false;
  }
}

async function testScoreBreakdown() {
  console.log('\n4. Testing score breakdown...');
  
  // Create a mock state with scenes
  const state = createDirectorState({
    projectId: 'test-breakdown',
    brandContext: testBrandContext,
  });
  
  // Add mock scenes with scores (180 frames each for 30-second video)
  state.scenes = {
    'scene-0': {
      definition: { id: 'scene-0', index: 0, title: 'Opening', description: '', durationFrames: 180, startFrame: 0 },
      version: 1,
      status: 'passed',
      localAttempts: 1,
      totalAttempts: 1,
      scoreHistory: [0.75],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    'scene-1': {
      definition: { id: 'scene-1', index: 1, title: 'Main', description: '', durationFrames: 180, startFrame: 180 },
      version: 1,
      status: 'passed',
      localAttempts: 2,
      totalAttempts: 2,
      scoreHistory: [0.55, 0.85],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    'scene-2': {
      definition: { id: 'scene-2', index: 2, title: 'Closing', description: '', durationFrames: 180, startFrame: 360 },
      version: 1,
      status: 'passed',
      localAttempts: 1,
      totalAttempts: 1,
      scoreHistory: [0.80],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
  
  const breakdown = getScoreBreakdown(state, 0.85, 0.90);
  
  console.log(`   Global score: ${breakdown.globalScore.toFixed(3)}`);
  console.log(`   Weighted mean scene score: ${breakdown.weightedMeanSceneScore.toFixed(3)}`);
  console.log(`   Mean scene score: ${breakdown.meanSceneScore.toFixed(3)}`);
  console.log(`   Min scene score: ${breakdown.minSceneScore.toFixed(3)}`);
  console.log(`   Passed scenes: ${breakdown.passedSceneCount}/${breakdown.sceneCount}`);
  
  if (breakdown.sceneCount === 3) {
    console.log('   ✓ Correct scene count');
  } else {
    console.log('   ✗ Wrong scene count');
    return false;
  }
  
  // Test weak component identification
  const weakComponents = identifyWeakComponents(breakdown);
  console.log(`   Weakest component: ${weakComponents[0].component} (potential: ${(weakComponents[0].potential * 100).toFixed(1)}%)`);
  
  if (weakComponents.length === 3) {
    console.log('   ✓ All components analyzed');
  } else {
    console.log('   ✗ Missing components in analysis');
    return false;
  }
  
  return true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Director Agent Test');
  console.log('='.repeat(60));
  
  try {
    const tests = [
      testStateCreation,
      testScoreCalculation,
      testDirectorAgentPersistence,
      testScoreBreakdown,
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    if (failed === 0) {
      console.log(`✅ All ${passed} tests passed!`);
    } else {
      console.log(`❌ ${failed} tests failed, ${passed} passed`);
    }
    console.log('='.repeat(60));
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  } finally {
    console.log('\nCleaning up...');
    await closeAllQueues();
    await closeRedisConnections();
    console.log('Done.');
  }
}

main();
