
import { config } from 'dotenv';
config({ path: '.env.local' });

import { DirectorAgent } from '../agents/director/DirectorAgent.js';
import { BrandContext } from '../agents/types.js';
import { createDirectorState } from '../agents/director/DirectorState.js';
import { getRedisConnection, closeRedisConnections } from '../queues/redisConnection.js';

async function testDirectorPlanning() {
  console.log('Testing Director Planning...');

  const projectId = 'debug-test-' + Date.now();
  const brandContext: BrandContext = {
    name: 'DebugBrand',
    industry: 'Tech',
    colors: { primary: '#000000' },
    aspectRatio: '16:9',
    prompt: 'A simple 3-step tutorial video.',
    style: 'minimal'
  };

  const agent = new DirectorAgent(projectId);

  // Manually initialize state
  // We need to access private state or use a public method to set it
  // Since we can't easily access private state, we'll mimic handleStartProject logic
  // but we'll mock the queue calls to avoid needing workers

  console.log('Calling createVideoPlan (via private method access)...');

  // Access private method for testing
  await (agent as any).handleStartProject({
    type: 'START_PROJECT',
    projectId,
    payload: {
      brandContext,
      options: { maxGlobalIterations: 1 }
    }
  });

  const state = agent.getState();
  console.log('State after planning:', JSON.stringify(state?.videoPlan, null, 2));

  if (state?.videoPlan?.scenes.length) {
    console.log('SUCCESS: Plan created with', state.videoPlan.scenes.length, 'scenes');
  } else {
    console.log('FAILURE: No plan created');
  }

  await closeRedisConnections();
}

testDirectorPlanning().catch(console.error);
