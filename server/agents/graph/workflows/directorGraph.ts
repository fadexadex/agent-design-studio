import { StateGraph, START, END, Send } from '@langchain/langgraph';
import { DirectorStateAnnotation } from '../state/DirectorState.js';
import { plannerNode, finalProducerNode, globalReviewNode } from '../nodes/directorNodes.js';
import { sceneGraph } from './sceneGraph.js';

/**
 * Director Graph Workflow
 * 
 * Flow: planner -> dispatch scenes -> scene_processor (parallel) -> aggregator -> global_review -> final_producer
 * 
 * The global_review node allows the Director to evaluate all scenes together
 * and decide whether the overall video meets quality standards.
 */

// Conditional edge to dispatch scenes
const dispatchScenes = (state: typeof DirectorStateAnnotation.State) => {
  if (state.status === 'failed') {
    return '__end__';
  }
  
  // Find scenes that need processing (pending status)
  // SceneGraph handles generation and rendering internally
  const scenesToDispatch = state.scenes.filter(s => s.status === 'pending');
  
  if (scenesToDispatch.length > 0) {
    console.log(`[Graph:Director] Dispatching ${scenesToDispatch.length} scenes...`);
    return scenesToDispatch.map(s => new Send('scene_processor', s));
  }
  
  // If no scenes pending, move to aggregator
  return 'aggregator';
};

// Aggregator node (synchronization point after parallel scene processing)
const aggregatorNode = async (state: typeof DirectorStateAnnotation.State) => {
  // State is already merged by reducer
  // Just log the aggregation
  const passedCount = state.scenes.filter(s => s.status === 'passed' || s.lastDecision === 'pass').length;
  const failedCount = state.scenes.filter(s => s.status === 'failed' || s.lastDecision === 'fail').length;
  
  console.log(`[Graph:Director] Aggregation complete: ${passedCount} passed, ${failedCount} failed out of ${state.scenes.length} total`);
  
  return {};
};

// Check if all scenes completed
const checkCompletion = (state: typeof DirectorStateAnnotation.State) => {
  if (state.scenes.length === 0) return '__end__';

  const allDone = state.scenes.every(s =>
    s.status === 'passed' || s.status === 'failed' || s.lastDecision === 'fail' || s.lastDecision === 'pass'
  );

  if (allDone) {
    console.log(`[Graph:Director] All scenes completed. Proceeding to global review.`);
    return 'global_review';
  }

  // Still waiting for other branches
  return '__end__';
};

// After global review, decide whether to produce or end
const afterGlobalReview = (state: typeof DirectorStateAnnotation.State) => {
  // If global review passed or we have at least some passed scenes, produce final video
  const passedScenes = state.scenes.filter(s => s.status === 'passed' || s.lastDecision === 'pass');
  
  if (passedScenes.length > 0) {
    console.log(`[Graph:Director] Global review complete. Producing final video with ${passedScenes.length} scenes.`);
    return 'final_producer';
  }
  
  console.log(`[Graph:Director] No scenes passed. Ending workflow.`);
  return '__end__';
};

const workflow = new StateGraph(DirectorStateAnnotation)
  .addNode('planner', plannerNode)
  .addNode('scene_processor', sceneGraph)
  .addNode('aggregator', aggregatorNode)
  .addNode('global_review', globalReviewNode)
  .addNode('final_producer', finalProducerNode)
  
  .addEdge(START, 'planner')
  
  .addConditionalEdges('planner', dispatchScenes, {
    scene_processor: 'scene_processor',
    aggregator: 'aggregator',
    __end__: END
  } as any)

  .addEdge('scene_processor', 'aggregator')

  .addConditionalEdges('aggregator', checkCompletion, {
    global_review: 'global_review',
    __end__: END
  })
  
  .addConditionalEdges('global_review', afterGlobalReview, {
    final_producer: 'final_producer',
    __end__: END
  })
  
  .addEdge('final_producer', END);

export const directorGraph = workflow.compile();
