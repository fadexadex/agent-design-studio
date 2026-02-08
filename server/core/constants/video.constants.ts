/**
 * Centralized video configuration constants
 * All duration, timing, and frame calculations should use these values
 */

export const VIDEO_CONFIG = {
  // Core video settings
  DURATION_SECONDS: 30,
  FPS: 30,
  TOTAL_FRAMES: 900, // 30 seconds * 30 fps

  // Aspect ratio presets
  ASPECT_RATIOS: {
    LANDSCAPE: {
      ratio: '16:9',
      width: 1920,
      height: 1080,
    },
    PORTRAIT: {
      ratio: '9:16',
      width: 1080,
      height: 1920,
    },
  },

  // Resolution scales
  RESOLUTION_SCALES: {
    '1080p': 1.0,
    '720p': 0.667,
  },
} as const;

/**
 * Story phase timing configuration
 * These define the narrative structure percentage allocations
 * Actual scene count is flexible - scenes are tagged with their story phase
 */
export const STORY_PHASES = {
  PROBLEM: {
    id: 'problem',
    name: 'The Problem',
    description: 'Establish the user need or desire',
    percentageRange: { start: 0, end: 17 }, // 0-17% (~0-5s)
    timing: { startSecond: 0, endSecond: 5 },
    frames: { start: 0, end: 150 },
    brandAllowed: false,
  },
  SOLUTION: {
    id: 'solution',
    name: 'Simple Solution',
    description: 'Show how easy it is to use',
    percentageRange: { start: 17, end: 33 }, // 17-33% (~5-10s)
    timing: { startSecond: 5, endSecond: 10 },
    frames: { start: 150, end: 300 },
    brandAllowed: false,
  },
  MAGIC: {
    id: 'magic',
    name: 'The Magic',
    description: 'Reveal special capability or network effect',
    percentageRange: { start: 33, end: 53 }, // 33-53% (~10-16s)
    timing: { startSecond: 10, endSecond: 16 },
    frames: { start: 300, end: 480 },
    brandAllowed: false,
  },
  RESULT: {
    id: 'result',
    name: 'The Result',
    description: 'Show successful outcome',
    percentageRange: { start: 53, end: 70 }, // 53-70% (~16-21s)
    timing: { startSecond: 16, endSecond: 21 },
    frames: { start: 480, end: 630 },
    brandAllowed: false,
  },
  BRAND_REVEAL: {
    id: 'brand-reveal',
    name: 'Brand Reveal',
    description: 'Value summary + brand name appears',
    percentageRange: { start: 70, end: 100 }, // 70-100% (~21-30s)
    timing: { startSecond: 21, endSecond: 30 },
    frames: { start: 630, end: 900 },
    brandAllowed: true, // ONLY phase where brand name can appear
  },
} as const;

export type StoryPhaseId = keyof typeof STORY_PHASES;
export type StoryPhaseValue = (typeof STORY_PHASES)[StoryPhaseId];

/**
 * Get story phase by ID
 */
export function getStoryPhase(phaseId: string): StoryPhaseValue | undefined {
  const normalizedId = phaseId.toUpperCase().replace(/-/g, '_') as StoryPhaseId;
  return STORY_PHASES[normalizedId];
}

/**
 * Get all story phases in order
 */
export function getStoryPhasesInOrder(): StoryPhaseValue[] {
  return [
    STORY_PHASES.PROBLEM,
    STORY_PHASES.SOLUTION,
    STORY_PHASES.MAGIC,
    STORY_PHASES.RESULT,
    STORY_PHASES.BRAND_REVEAL,
  ];
}

/**
 * Convert seconds to frames
 */
export function secondsToFrames(seconds: number): number {
  return Math.round(seconds * VIDEO_CONFIG.FPS);
}

/**
 * Convert frames to seconds
 */
export function framesToSeconds(frames: number): number {
  return frames / VIDEO_CONFIG.FPS;
}

/**
 * Get frame range for a duration starting at a given frame
 */
export function getFrameRange(
  startFrame: number,
  durationSeconds: number
): { start: number; end: number } {
  const durationFrames = secondsToFrames(durationSeconds);
  return {
    start: startFrame,
    end: Math.min(startFrame + durationFrames - 1, VIDEO_CONFIG.TOTAL_FRAMES - 1),
  };
}
