import type { PresetDefinition, PresetType } from "./types";
import { SPRING_CONFIGS } from "../Animation/springs";

/**
 * Animation preset definitions
 * Each preset defines default values for various animation properties
 *
 * NOTE: Slide presets use springs for that magnetic "snap" at the end.
 * This is the key difference between "smooth but soft" and "snappy and kinetic".
 * 
 * Spring presets used:
 * - kinetic: Quick settle with subtle overshoot for slides
 * - bouncy: Playful oscillation for attention-grabbing animations
 * - pop: Quick scale with slight bounce for icons/badges
 */
export const presets: Record<PresetType, PresetDefinition> = {
  fadeBlurIn: {
    blur: { from: 20, to: 0, duration: 15 },
    opacity: { from: 0, to: 1, duration: 15 },
  },

  fadeBlurOut: {
    blur: { from: 0, to: 20, duration: 15 },
    opacity: { from: 1, to: 0, duration: 15 },
  },

  scaleIn: {
    scale: { from: 0.8, to: 1, duration: 22, easing: "backOut" },
    opacity: { from: 0, to: 1, duration: 18 },
    blur: { from: 10, to: 0, duration: 18 },
  },

  springIn: {
    scale: {
      from: 0,
      to: 1,
      easing: { type: "spring", ...SPRING_CONFIGS.bouncy },
    },
    opacity: { from: 0, to: 1, duration: 15 },
  },

  // KINETIC SLIDE PRESETS - Using springs for magnetic "snap"
  // Uses kinetic preset: quick settle with subtle overshoot
  slideInLeft: {
    position: {
      fromX: -50,
      toX: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInRight: {
    position: {
      fromX: 50,
      toX: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInUp: {
    position: {
      fromY: 40,
      toY: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInDown: {
    position: {
      fromY: -40,
      toY: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  // MASKED SLIDE PRESETS - Text slides in from behind a clip mask
  // Uses snappy preset: quick with minimal overshoot
  maskSlideUp: {
    position: {
      fromY: 50,
      toY: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.snappy },
    },
    opacity: { from: 0, to: 1, duration: 8 },
  },

  maskSlideDown: {
    position: {
      fromY: -50,
      toY: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.snappy },
    },
    opacity: { from: 0, to: 1, duration: 8 },
  },

  maskSlideLeft: {
    position: {
      fromX: 60,
      toX: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.snappy },
    },
    opacity: { from: 0, to: 1, duration: 8 },
  },

  maskSlideRight: {
    position: {
      fromX: -60,
      toX: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.snappy },
    },
    opacity: { from: 0, to: 1, duration: 8 },
  },

  // GLITCH REVEAL - Chaotic, tech-inspired reveal
  glitchReveal: {
    scale: {
      from: 1.1,
      to: 1,
      duration: 18,
      easing: "backOut",
    },
    blur: { from: 8, to: 0, duration: 12 },
    opacity: { from: 0, to: 1, duration: 6 },
  },

  typewriter: {
    typewriter: { cursor: true, cursorChar: "|", cursorBlinkSpeed: 16 },
    animationUnit: "character",
  },

  none: {},
};

/**
 * Get preset definition by name
 */
export const getPreset = (presetName: PresetType): PresetDefinition => {
  return presets[presetName] || presets.none;
};

/**
 * Default animation durations
 */
export const DEFAULTS = {
  blur: {
    from: 20,
    to: 0,
    duration: 15,
    delay: 0,
  },
  opacity: {
    from: 0,
    to: 1,
    duration: 15,
    delay: 0,
  },
  scale: {
    from: 1,
    to: 1,
    duration: 20,
    delay: 0,
  },
  position: {
    fromX: 0,
    toX: 0,
    fromY: 0,
    toY: 0,
    duration: 20,
    delay: 0,
  },
  typewriter: {
    cursor: true,
    cursorChar: "|",
    cursorBlinkSpeed: 16,
  },
  stagger: {
    delay: 5,
    reverse: false,
  },
};
