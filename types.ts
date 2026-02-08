
export type MotionStyle = 'fluid' | 'geometric' | 'minimalist' | 'brutalist' | 'cinematic';

export interface BrandContext {
  name: string;
  industry: string;
  colors: string[];
  logoBase64?: string;
  /**
   * Path to the logo file in the Remotion public folder (e.g., "uploads/logo-abc123.png").
   * Use this with staticFile() in Remotion compositions: <Img src={staticFile("uploads/logo-abc123.png")} />
   */
  logoPath?: string;
  tagline: string;
}

export interface VideoConfig {
  style: MotionStyle;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  prompt: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progressMessage: string;
  videoUrl?: string;
  error?: string;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
}

// Workflow Types
export interface AgentThought {
  type: 'reason' | 'act' | 'observe';
  content: string;
  timestamp: string | Date;
  /**
   * The model's actual thinking summary from Gemini (when includeThoughts is enabled).
   * This is the human-readable summary of the model's internal reasoning process.
   */
  modelThinking?: string;
  /**
   * Opaque thought signature from Gemini for maintaining reasoning context across turns.
   * This should be passed back to the API but not displayed to users.
   */
  thoughtSignature?: string;
}

export enum WorkflowPhase {
  INITIALIZATION = 'initialization',
  QUERY_ENHANCEMENT = 'query_enhancement',
  PLANNING = 'planning',
  IMPLEMENTATION = 'implementation',
  CHECKPOINT = 'checkpoint',
  EVALUATION = 'evaluation',
  ITERATION_DECISION = 'iteration_decision',
  AWAITING_FEEDBACK = 'awaiting_feedback',
  RENDERING = 'rendering',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export interface SceneDescription {
  id: string;
  sceneNumber: number;
  description: string;
  frameRange: { start: number; end: number };
  keyElements: string[];

  // Timeline architecture fields (optional for backward compatibility)
  visualStyle?: 'kinetic_typography' | 'app_demo' | 'abstract_shape' | 'logo_reveal' | '3d_product_showcase' | 'abstract_ui' | '3d_grid_view';
  energyLevel?: 'high' | 'medium' | 'low';
  suggestedDuration?: number; // in seconds (AI-suggested, normalized later)
  textOverlay?: string[];    // text to display on screen
  cameraMovement?: string;   // e.g., "Zoom in", "Pan left"
  assets?: string[];         // referenced assets
}

/**
 * Script data containing narrative and scene breakdown.
 * This is required when starting a workflow.
 */
export interface VideoScript {
  script: string; // The narrative script
  scenes: SceneDescription[];
}

// ============================================================================
// STORY-DRIVEN SCRIPT TYPES (30-second videos)
// ============================================================================

export type StoryPhase = 'problem' | 'solution' | 'magic' | 'result' | 'brand-reveal';

export type TextAnimationType =
  | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'catch-up' | 'bounce' | 'word-by-word' | 'letter-by-letter'
  | 'fade' | 'fade-scale' | 'morph' | 'scale-up' | 'scale-down' | 'pop';

export type TextPersonality = 'playful' | 'bold' | 'calm' | 'energetic' | 'subtle';

export type TextPurpose = 'headline' | 'feature' | 'instruction' | 'value-prop' | 'transition' | 'brand' | 'tagline';

export type EnergyLevel = 'intro' | 'building' | 'peak' | 'sustain' | 'resolution' | 'outro';

export type EmotionalTone = 'calm' | 'exciting' | 'satisfying' | 'dramatic' | 'playful';

export interface TextTypography {
  size: number;
  weight: number;
  color: string;
  font?: string;
  letterSpacing?: string;
}

export interface TextChoreography {
  entrance: {
    type: TextAnimationType;
    duration: number;
    delay?: number;
    easing?: string;
    startPosition?: { x: number; y: number };
    endPosition?: { x: number; y: number };
    startScale?: number;
    endScale?: number;
    startOpacity?: number;
    endOpacity?: number;
  };
  hold?: {
    duration: number;
    animation?: 'static' | 'breathe' | 'float' | 'pulse';
  };
  exit?: {
    type: TextAnimationType;
    duration: number;
    delay?: number;
    easing?: string;
    endPosition?: { x: number; y: number };
    endScale?: number;
    endOpacity?: number;
  };
}

export interface StoryTextElement {
  id: string;
  sequence: number;
  content: string;
  typography: TextTypography;
  choreography: TextChoreography;
  position: { x: number; y: number; align?: 'left' | 'center' | 'right' };
  layer: number;
  personality: TextPersonality;
  purpose: TextPurpose;
  interactions?: {
    with: string;
    relationship: 'makes-space-for' | 'aligns-with' | 'replaces' | 'bounces-with' | 'morphs-into' | 'follows';
    timing?: 'on-entrance' | 'on-exit' | 'simultaneous' | 'after';
    offset?: number;
  }[];
}

export interface StoryVisualElement {
  id: string;
  name: string;
  type: 'icon' | 'shape' | 'illustration' | 'device' | 'ui-component' | 'image' | 'logo';
  state: 'entering' | 'transforming' | 'static' | 'exiting';
  properties?: Record<string, unknown>;
}

export interface StorySoundCue {
  type: 'effect' | 'transition' | 'ambient';
  description: string;
  timing: 'start' | 'middle' | 'end' | 'on-text-entrance';
  syncWith?: string;
}

export interface StoryMoment {
  id: string;
  sequence: number;
  timing: {
    startFrame: number;
    endFrame: number;
    durationMs: number;
  };
  narrative: string;
  visualAction: string;
  storyPurpose: string;
  textElements: StoryTextElement[];
  visualElements: StoryVisualElement[];
  transformation?: {
    type: string;
    from: string;
    to: string;
    easing: string;
    duration: number;
  };
  camera?: {
    type: 'zoom' | 'pan' | 'rotate' | 'dolly' | 'static';
    target?: string;
    intensity: 'subtle' | 'medium' | 'dramatic';
    duration?: number;
  };
  sound?: StorySoundCue[];
  energyLevel: EnergyLevel;
  emotionalTone: EmotionalTone;
}

export interface StoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  purpose: string;
  storyPhase: StoryPhase;
  visualTheme: string;
  textTheme: string;
  dominantColor?: string;
  moments: StoryMoment[];
  frameRange: {
    start: number;
    end: number;
  };
}

export interface StoryNarrative {
  hook: string;
  journey: string;
  resolution: string;
}

export interface TextNarrative {
  openingMessage: string;
  coreFeatures: string[];
  closingMessage: string;
}

/**
 * Story-driven script format for 30-second videos
 * Uses 5-act narrative structure with flexible scene count
 */
export interface StoryScript {
  title: string;
  totalDuration: number; // Always 30 seconds
  totalFrames: number; // Always 900 frames (30fps)
  fps: number; // Always 30
  narrative: StoryNarrative;
  textNarrative: TextNarrative;
  scenes: StoryScene[];
  recurringMotifs?: string[];
  colorJourney?: string[];
  audioNarrative?: string;
}

/**
 * Story phase metadata for UI display
 */
export interface StoryPhaseInfo {
  id: StoryPhase;
  name: string;
  timing: { start: number; end: number }; // in seconds
  scenes: StoryScene[];
}

/**
 * Helper to group scenes by story phase for UI display
 */
export function groupScenesByPhase(scenes: StoryScene[]): StoryPhaseInfo[] {
  const phaseConfig: { id: StoryPhase; name: string; timing: { start: number; end: number } }[] = [
    { id: 'problem', name: 'The Problem', timing: { start: 0, end: 5 } },
    { id: 'solution', name: 'Simple Solution', timing: { start: 5, end: 10 } },
    { id: 'magic', name: 'The Magic', timing: { start: 10, end: 16 } },
    { id: 'result', name: 'The Result', timing: { start: 16, end: 21 } },
    { id: 'brand-reveal', name: 'Brand Reveal', timing: { start: 21, end: 30 } },
  ];

  return phaseConfig.map(phase => ({
    ...phase,
    scenes: scenes.filter(s => s.storyPhase === phase.id),
  }));
}

/**
 * Calculate total moments in a StoryScript
 */
export function getTotalStoryMoments(script: StoryScript): number {
  return script.scenes.reduce((sum, scene) => sum + scene.moments.length, 0);
}

export interface ImplementationPlan {
  approach: string;
  sceneBreakdown: SceneDescription[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  createdAt: string | Date;
}

export interface GeneratedFile {
  filePath: string;
  content: string;
  sceneId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImplementationRound {
  roundNumber: number;
  files: GeneratedFile[];
  validationResult: ValidationResult;
  issues: string[];
  thoughts: AgentThought[];
  startedAt: string | Date;
  completedAt?: string | Date;
}

export interface Checkpoint {
  id: string;
  roundNumber: number;
  files: GeneratedFile[];
  description: string;
  timestamp: string | Date;
}

export interface ErrorRecord {
  id: string;
  roundNumber: number;
  errorType: 'validation' | 'runtime' | 'generation' | 'render';
  errorMessage: string;
  context?: string;
  resolved: boolean;
  resolvedAt?: string | Date;
}

export interface WorkflowProgress {
  currentPhase: WorkflowPhase;
  phaseProgress: number;
  currentMessage: string;
  subStep?: string;
}

/**
 * Scene render status for tracking individual scene generation and rendering progress.
 * Used for incremental UI updates during the implementation phase.
 */
export interface SceneRenderStatus {
  sceneNumber: number;
  sceneId: string;
  status: 'pending' | 'generating' | 'rendering' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  previewUrl?: string;
  error?: string;
}

export interface SceneScoreRef {
  sceneId: string;
  sceneNumber: number;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface EvaluationResultRef {
  score: number;
  compilability: number;
  visualFidelity: number;
  animationSmoothness: number;
  brandConsistency: number;
  sceneScores: SceneScoreRef[];
  feedback: string;
  globalSuggestions: string[];
  passesThreshold: boolean;
  needsUserFeedback: boolean;
}

export interface WorkflowState {
  jobId: string;
  currentPhase: WorkflowPhase;
  brand: BrandContext;
  config: VideoConfig;
  plan?: ImplementationPlan;
  currentRound: number;
  maxRounds: number;
  rounds: ImplementationRound[];
  sceneStatuses?: SceneRenderStatus[];
  lastEvaluation?: EvaluationResultRef;
  nextRoundTargets?: string[];
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;
  errorHistory: ErrorRecord[];
  thoughts: AgentThought[];
  progress: WorkflowProgress;
  outputVideoPath?: string;
  updatedAt: string | Date;
  createdAt: string | Date;
}

