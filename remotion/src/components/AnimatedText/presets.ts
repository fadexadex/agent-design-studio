import type { PresetDefinition, PresetType } from "./types";

/**
 * Animation preset definitions
 * Each preset defines default values for various animation properties
 *
 * NOTE: Slide presets use springs for that magnetic "snap" at the end.
 * This is the key difference between "smooth but soft" and "snappy and kinetic".
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
      easing: { type: "spring", damping: 12, stiffness: 100 },
    },
    opacity: { from: 0, to: 1, duration: 15 },
  },

  // KINETIC SLIDE PRESETS - Using springs for magnetic "snap"
  // High damping (18-20) = quick settle, minimal overshoot
  // High stiffness (200-250) = fast, snappy movement
  slideInLeft: {
    position: {
      fromX: -50,
      toX: 0,
      easing: { type: "spring", damping: 18, stiffness: 220 },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInRight: {
    position: {
      fromX: 50,
      toX: 0,
      easing: { type: "spring", damping: 18, stiffness: 220 },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInUp: {
    position: {
      fromY: 40,
      toY: 0,
      easing: { type: "spring", damping: 18, stiffness: 220 },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInDown: {
    position: {
      fromY: -40,
      toY: 0,
      easing: { type: "spring", damping: 18, stiffness: 220 },
    },
    opacity: { from: 0, to: 1, duration: 12 },
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
