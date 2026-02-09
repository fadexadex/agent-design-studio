import { Annotation } from '@langchain/langgraph';
import { BrandContext } from '../../types.js';

export interface SceneState {
  projectId: string;
  sceneId: string;
  sceneIndex: number;
  version: number;
  prompt: string;
  brandContext: BrandContext;
  durationFrames: number;
  
  code?: string;
  videoPath?: string;
  score?: number;
  feedback?: string;
  
  status: 'pending' | 'generating' | 'rendering' | 'evaluating' | 'passed' | 'failed';
  lastDecision?: 'pass' | 'refine' | 'fail';
  failureReason?: string;
  attempts: number;
}

export const SceneStateAnnotation = Annotation.Root({
  projectId: Annotation<string>,
  sceneId: Annotation<string>,
  sceneIndex: Annotation<number>,
  version: Annotation<number>,
  prompt: Annotation<string>,
  brandContext: Annotation<BrandContext>,
  durationFrames: Annotation<number>,
  
  code: Annotation<string>,
  videoPath: Annotation<string>,
  score: Annotation<number>,
  feedback: Annotation<string>,
  
  status: Annotation<string>,
  lastDecision: Annotation<string>,
  failureReason: Annotation<string>,
  attempts: Annotation<number>,

  // Output channel for aggregation in parent graph
  scenes: Annotation<SceneState[]>({
    reducer: (curr, next) => next,
    default: () => [],
  }),
});
