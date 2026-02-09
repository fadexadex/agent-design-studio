import { StateGraph, START, END } from '@langchain/langgraph';
import { SceneStateAnnotation, SceneState } from '../state/SceneState.js';
import { generateSceneNode, renderSceneNode } from '../nodes/sceneNodes.js';

/**
 * Scene Graph Workflow (Simplified)
 * 
 * Flow: generate -> render -> finalize
 * 
 * Per-scene evaluation has been removed. The Director will do a global
 * review of all scenes at the end instead of per-scene quality checks.
 * This simplifies the workflow and reduces redundant API calls.
 */

// Node to format output for parent graph aggregation
const finalizeNode = (state: typeof SceneStateAnnotation.State) => {
  // Determine final status based on whether we have code and video
  // Without per-scene evaluation, success means we generated code and rendered
  let finalStatus: 'passed' | 'failed' = 'failed';
  
  if (state.code && state.videoPath && state.status !== 'failed') {
    finalStatus = 'passed';
  }

  const currentSceneState: SceneState = {
    projectId: state.projectId,
    sceneId: state.sceneId,
    sceneIndex: state.sceneIndex,
    version: state.version,
    prompt: state.prompt,
    brandContext: state.brandContext,
    durationFrames: state.durationFrames,
    code: state.code,
    videoPath: state.videoPath,
    score: state.score,
    feedback: state.feedback,
    status: finalStatus,
    lastDecision: finalStatus === 'passed' ? 'pass' : 'fail',
    failureReason: state.failureReason,
    attempts: state.attempts,
  };

  // Return scenes array for parent graph aggregation
  return {
    scenes: [currentSceneState],
    status: finalStatus,
    lastDecision: finalStatus === 'passed' ? 'pass' : 'fail',
  };
};

// Conditional edge functions
const afterGeneration = (state: typeof SceneStateAnnotation.State) => {
  if (state.lastDecision === 'fail' || state.status === 'failed') {
    return 'finalize';
  }
  return 'render';
};

const afterRender = (state: typeof SceneStateAnnotation.State) => {
  // After render, go straight to finalize (no per-scene evaluation)
  // Director will do global review later
  return 'finalize';
};

// Build the graph (simplified: no evaluate node)
const workflow = new StateGraph(SceneStateAnnotation)
  .addNode('generate', generateSceneNode)
  .addNode('render', renderSceneNode)
  .addNode('finalize', finalizeNode)
  
  .addEdge(START, 'generate')
  
  .addConditionalEdges('generate', afterGeneration, {
    render: 'render',
    finalize: 'finalize'
  })
  
  // Render goes straight to finalize (no evaluation loop)
  .addEdge('render', 'finalize')
  
  .addEdge('finalize', END);

export const sceneGraph = workflow.compile();
