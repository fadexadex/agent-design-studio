/**
 * Story-driven script type definitions
 * These types support the 5-act narrative structure with flexible scene count
 */

// ============================================================================
// TEXT CHOREOGRAPHY TYPES
// ============================================================================

export type TextAnimationType =
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'catch-up'
  | 'bounce'
  | 'word-by-word'
  | 'letter-by-letter'
  | 'fade'
  | 'fade-scale'
  | 'morph'
  | 'scale-up'
  | 'scale-down'
  | 'pop';

export type TextHoldAnimation = 'static' | 'breathe' | 'float' | 'pulse';

export type TextPersonality = 'playful' | 'bold' | 'calm' | 'energetic' | 'subtle';

export type TextPurpose =
  | 'headline'
  | 'feature'
  | 'instruction'
  | 'value-prop'
  | 'transition'
  | 'brand'
  | 'tagline';

export type EasingType =
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'spring'
  | 'linear';

export interface Position {
  x: number;
  y: number;
}

export interface TextPosition extends Position {
  align?: 'left' | 'center' | 'right';
}

export interface TextTypography {
  size: number;
  weight: number;
  color: string;
  font?: string;
  letterSpacing?: string;
}

export interface TextEntrance {
  type: TextAnimationType;
  duration: number; // in milliseconds
  delay?: number; // delay before entrance starts
  easing?: EasingType;
  startPosition?: Position;
  endPosition?: Position;
  startScale?: number;
  endScale?: number;
  startOpacity?: number;
  endOpacity?: number;
}

export interface TextHold {
  duration: number; // in milliseconds
  animation?: TextHoldAnimation;
}

export interface TextExit {
  type: TextAnimationType;
  duration: number;
  delay?: number;
  easing?: EasingType;
  endPosition?: Position;
  endScale?: number;
  endOpacity?: number;
}

export interface TextChoreography {
  entrance: TextEntrance;
  hold?: TextHold;
  exit?: TextExit;
}

export interface TextInteraction {
  with: string; // ID of element this text interacts with
  relationship:
    | 'makes-space-for'
    | 'aligns-with'
    | 'replaces'
    | 'bounces-with'
    | 'morphs-into'
    | 'follows';
  timing?: 'on-entrance' | 'on-exit' | 'simultaneous' | 'after';
  offset?: number; // timing offset in ms
}

export interface TextElement {
  id: string;
  sequence: number;
  content: string;
  typography: TextTypography;
  choreography: TextChoreography;
  position: TextPosition;
  layer: number;
  personality: TextPersonality;
  purpose: TextPurpose;
  interactions?: TextInteraction[];
}

// ============================================================================
// VISUAL ELEMENT TYPES
// ============================================================================

export type VisualElementType =
  | 'icon'
  | 'shape'
  | 'illustration'
  | 'device'
  | 'ui-component'
  | 'image'
  | 'logo';

export type ElementState = 'entering' | 'transforming' | 'static' | 'exiting';

export interface VisualElement {
  id: string;
  name: string;
  type: VisualElementType;
  state: ElementState;
  properties?: Record<string, unknown>;
}

// ============================================================================
// TRANSFORMATION & CAMERA TYPES
// ============================================================================

export type TransformationType =
  | 'morph'
  | 'split'
  | 'merge'
  | 'flow'
  | 'ripple'
  | 'bounce'
  | 'zoom'
  | 'bend'
  | 'rotate';

export interface Transformation {
  type: TransformationType;
  from: string;
  to: string;
  easing: EasingType;
  duration: number; // in frames
}

export type CameraType = 'zoom' | 'pan' | 'rotate' | 'dolly' | 'static';

export interface CameraMove {
  type: CameraType;
  target?: string;
  intensity: 'subtle' | 'medium' | 'dramatic';
  duration?: number;
}

// ============================================================================
// SOUND TYPES
// ============================================================================

export type SoundType = 'effect' | 'transition' | 'ambient';

export interface SoundCue {
  type: SoundType;
  description: string;
  timing: 'start' | 'middle' | 'end' | 'on-text-entrance';
  syncWith?: string; // ID of element to sync with
}

// ============================================================================
// MOMENT TYPES
// ============================================================================

export type EnergyLevel = 'intro' | 'building' | 'peak' | 'sustain' | 'resolution' | 'outro';

export type EmotionalTone = 'calm' | 'exciting' | 'satisfying' | 'dramatic' | 'playful';

export type StoryPurpose =
  | 'introduce-problem'
  | 'show-feature'
  | 'demonstrate-ease'
  | 'reveal-capability'
  | 'build-momentum'
  | 'transition'
  | 'brand-reveal'
  | 'hook';

export interface MomentTiming {
  startFrame: number;
  endFrame: number;
  durationMs: number;
}

export interface Moment {
  id: string;
  sequence: number;
  timing: MomentTiming;

  // Storytelling core
  narrative: string;
  visualAction: string;
  storyPurpose: StoryPurpose;

  // Text elements (PRIMARY - required)
  textElements: TextElement[];

  // Visual elements (supporting)
  visualElements: VisualElement[];

  // Motion choreography
  transformation?: Transformation;
  camera?: CameraMove;
  sound?: SoundCue[];

  // Emotional beat
  energyLevel: EnergyLevel;
  emotionalTone: EmotionalTone;
}

// ============================================================================
// SCENE TYPES
// ============================================================================

export type StoryPhase = 'problem' | 'solution' | 'magic' | 'result' | 'brand-reveal';

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  purpose: string;

  // Story phase this scene belongs to (flexible - multiple scenes can be in same phase)
  storyPhase: StoryPhase;

  // Visual and text themes
  visualTheme: string;
  textTheme: string;
  dominantColor?: string;

  // Moments within the scene
  moments: Moment[];

  // Frame range (calculated from moments)
  frameRange: {
    start: number;
    end: number;
  };
}

// ============================================================================
// STORY SCRIPT (TOP LEVEL)
// ============================================================================

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

export interface StoryScript {
  title: string;
  totalDuration: number; // Always 30 seconds
  totalFrames: number; // Always 900 frames
  fps: number; // Always 30

  // Narrative summaries
  narrative: StoryNarrative;
  textNarrative: TextNarrative;

  // Scenes (flexible count, each tagged with story phase)
  scenes: Scene[];

  // Optional metadata
  recurringMotifs?: string[];
  colorJourney?: string[];
  audioNarrative?: string;
}

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Legacy scene format for backward compatibility
 * Used when interfacing with older parts of the system
 */
export interface LegacySceneDescription {
  id: string;
  sceneNumber: number;
  description: string;
  frameRange: { start: number; end: number };
  keyElements: string[];
  visualStyle?:
    | 'kinetic_typography'
    | 'app_demo'
    | 'abstract_shape'
    | 'logo_reveal'
    | '3d_product_showcase'
    | 'abstract_ui'
    | '3d_grid_view';
  energyLevel?: 'high' | 'medium' | 'low';
  suggestedDuration?: number;
  textOverlay?: string[];
  cameraMovement?: string;
  assets?: string[];
}

export interface LegacyVideoScript {
  script: string;
  scenes: LegacySceneDescription[];
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert new StoryScript to legacy format for backward compatibility
 */
export function storyScriptToLegacy(storyScript: StoryScript): LegacyVideoScript {
  const legacyScenes: LegacySceneDescription[] = storyScript.scenes.map((scene) => {
    // Extract key text content from moments
    const textOverlay = scene.moments.flatMap((m) => m.textElements.map((t) => t.content));

    // Extract key elements from visual elements and text purposes
    const keyElements = [
      ...scene.moments.flatMap((m) => m.visualElements.map((v) => v.name)),
      ...scene.moments.flatMap((m) => m.textElements.map((t) => t.purpose)),
    ].filter((v, i, a) => a.indexOf(v) === i); // unique

    // Build description from moment narratives
    const description = scene.moments.map((m) => m.visualAction).join(' ');

    // Map energy level
    const avgEnergy = scene.moments.reduce((acc, m) => {
      const energyMap: Record<EnergyLevel, number> = {
        intro: 1,
        building: 2,
        peak: 3,
        sustain: 2,
        resolution: 1,
        outro: 1,
      };
      return acc + energyMap[m.energyLevel];
    }, 0) / scene.moments.length;

    const energyLevel: 'high' | 'medium' | 'low' =
      avgEnergy > 2.5 ? 'high' : avgEnergy > 1.5 ? 'medium' : 'low';

    return {
      id: scene.id,
      sceneNumber: scene.sceneNumber,
      description,
      frameRange: scene.frameRange,
      keyElements,
      visualStyle: 'kinetic_typography' as const,
      energyLevel,
      suggestedDuration: (scene.frameRange.end - scene.frameRange.start + 1) / 30,
      textOverlay,
    };
  });

  return {
    script: `${storyScript.narrative.hook} ${storyScript.narrative.journey} ${storyScript.narrative.resolution}`,
    scenes: legacyScenes,
  };
}

/**
 * Get scenes grouped by story phase
 */
export function groupScenesByPhase(scenes: Scene[]): Record<StoryPhase, Scene[]> {
  const grouped: Record<StoryPhase, Scene[]> = {
    problem: [],
    solution: [],
    magic: [],
    result: [],
    'brand-reveal': [],
  };

  for (const scene of scenes) {
    grouped[scene.storyPhase].push(scene);
  }

  return grouped;
}

/**
 * Calculate total moments across all scenes
 */
export function getTotalMoments(scenes: Scene[]): number {
  return scenes.reduce((sum, scene) => sum + scene.moments.length, 0);
}

/**
 * Validate that brand name only appears in brand-reveal phase
 */
export function validateBrandPlacement(script: StoryScript, brandName: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const brandNameLower = brandName.toLowerCase();

  for (const scene of script.scenes) {
    if (scene.storyPhase === 'brand-reveal') continue;

    for (const moment of scene.moments) {
      for (const textEl of moment.textElements) {
        if (textEl.content.toLowerCase().includes(brandNameLower)) {
          violations.push(
            `Brand name "${brandName}" found in ${scene.storyPhase} phase (Scene ${scene.sceneNumber}, Moment ${moment.sequence})`
          );
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
