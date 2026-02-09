import { Annotation } from '@langchain/langgraph';
import { BrandContext, VideoPlan } from '../../types.js';
import { SceneState } from './SceneState.js';

export interface DirectorState {
  projectId: string;
  brandContext: BrandContext;
  videoPlan?: VideoPlan;
  scenes: SceneState[];
  finalOutput?: string;
  status: 'planning' | 'generating' | 'rendering' | 'completed' | 'failed';
  error?: string;
}

export const DirectorStateAnnotation = Annotation.Root({
  // Use reducers for fields that may receive concurrent updates from parallel subgraphs
  projectId: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => '',
  }),
  brandContext: Annotation<BrandContext>({
    reducer: (curr, next) => next ?? curr,
    default: () => ({} as BrandContext),
  }),
  videoPlan: Annotation<VideoPlan>({
    reducer: (curr, next) => next ?? curr,
    default: () => undefined as unknown as VideoPlan,
  }),
  
  scenes: Annotation<SceneState[]>({
    reducer: (curr, next) => {
      // Create a map from current scenes
      const map = new Map(curr.map(s => [s.sceneId, s]));
      
      // Merge updates
      // Note: next is the update payload. Since we defined scenes as SceneState[],
      // LangGraph expects next to be SceneState[].
      // When a node returns { scenes: [s1] }, next is [s1].
      next.forEach(s => map.set(s.sceneId, s));
      
      return Array.from(map.values()).sort((a, b) => a.sceneIndex - b.sceneIndex);
    },
    default: () => [],
  }),
  
  finalOutput: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => '',
  }),
  status: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => 'planning',
  }),
  error: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => '',
  }),
});
