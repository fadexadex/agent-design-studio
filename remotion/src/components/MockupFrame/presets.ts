import type {
  EntrancePresetType,
  ExitPresetType,
  EntrancePresetDefinition,
  ExitPresetDefinition,
  DeviceSpec,
  BlurAnimation,
  OpacityAnimation,
  ScaleAnimation,
  PositionAnimation,
  RotateAnimation,
} from "./types";
import { SPRING_CONFIGS } from "../Animation/springs";

// ===========================================
// DEVICE SPECIFICATIONS
// ===========================================

export const deviceSpecs: Record<string, DeviceSpec> = {
  iphone15: {
    bezelRadius: 55,
    aspectRatio: 19.5 / 9,
    defaultWidth: 280,
    defaultHeight: 606,
  },
  "iphone-notch": {
    bezelRadius: 47,
    aspectRatio: 19.5 / 9,
    defaultWidth: 280,
    defaultHeight: 606,
  },
  browser: {
    bezelRadius: 12,
    aspectRatio: 16 / 10,
    defaultWidth: 600,
    defaultHeight: 400,
  },
  card: {
    bezelRadius: 16,
    aspectRatio: 4 / 3,
    defaultWidth: 400,
    defaultHeight: 300,
  },
};

// ===========================================
// ENTRANCE ANIMATION PRESETS
// Uses SPRING_CONFIGS from Animation module
// ===========================================

export const entrancePresets: Record<
  EntrancePresetType,
  EntrancePresetDefinition
> = {
  fadeIn: {
    opacity: { from: 0, to: 1, duration: 20 },
    blur: { from: 10, to: 0, duration: 20 },
  },

  springIn: {
    scale: {
      from: 0.5,
      to: 1,
      easing: { type: "spring", ...SPRING_CONFIGS.bouncy },
    },
    opacity: { from: 0, to: 1, duration: 15 },
  },

  slideInUp: {
    position: {
      fromY: 60,
      toY: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInDown: {
    position: {
      fromY: -60,
      toY: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInLeft: {
    position: {
      fromX: -80,
      toX: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  slideInRight: {
    position: {
      fromX: 80,
      toX: 0,
      easing: { type: "spring", ...SPRING_CONFIGS.kinetic },
    },
    opacity: { from: 0, to: 1, duration: 12 },
  },

  rotateIn: {
    rotate: {
      fromY: -30,
      toY: 0,
      perspective: 1200,
      easing: { type: "spring", ...SPRING_CONFIGS.snappy },
    },
    opacity: { from: 0, to: 1, duration: 15 },
    blur: { from: 5, to: 0, duration: 15 },
  },

  none: {},
};

// ===========================================
// EXIT ANIMATION PRESETS
// Uses smooth spring for clean exits
// ===========================================

export const exitPresets: Record<ExitPresetType, ExitPresetDefinition> = {
  fadeOut: {
    opacity: { from: 1, to: 0, duration: 20 },
    blur: { from: 0, to: 10, duration: 20 },
  },

  slideOutLeft: {
    position: {
      fromX: 0,
      toX: -100,
      easing: { type: "spring", ...SPRING_CONFIGS.smooth },
    },
    opacity: { from: 1, to: 0, duration: 15 },
  },

  slideOutRight: {
    position: {
      fromX: 0,
      toX: 100,
      easing: { type: "spring", ...SPRING_CONFIGS.smooth },
    },
    opacity: { from: 1, to: 0, duration: 15 },
  },

  slideOutDown: {
    position: {
      fromY: 0,
      toY: 60,
      easing: { type: "spring", ...SPRING_CONFIGS.smooth },
    },
    opacity: { from: 1, to: 0, duration: 15 },
  },

  slideOutUp: {
    position: {
      fromY: 0,
      toY: -60,
      easing: { type: "spring", ...SPRING_CONFIGS.smooth },
    },
    opacity: { from: 1, to: 0, duration: 15 },
  },

  scaleDown: {
    scale: { from: 1, to: 0.8, duration: 20, easing: "easeIn" },
    opacity: { from: 1, to: 0, duration: 20 },
  },

  none: {},
};

// ===========================================
// DEFAULT VALUES
// ===========================================

export const DEFAULTS = {
  blur: {
    from: 10,
    to: 0,
    duration: 20,
    delay: 0,
  } as Required<BlurAnimation>,

  opacity: {
    from: 0,
    to: 1,
    duration: 20,
    delay: 0,
  } as Required<OpacityAnimation>,

  scale: {
    from: 1,
    to: 1,
    duration: 20,
    delay: 0,
  } as Omit<Required<ScaleAnimation>, "easing" | "origin">,

  position: {
    fromX: 0,
    toX: 0,
    fromY: 0,
    toY: 0,
    duration: 20,
    delay: 0,
  } as Omit<Required<PositionAnimation>, "easing">,

  rotate: {
    fromX: 0,
    toX: 0,
    fromY: 0,
    toY: 0,
    fromZ: 0,
    toZ: 0,
    perspective: 1200,
    duration: 20,
    delay: 0,
  } as Omit<Required<RotateAnimation>, "easing">,

  // Frame sequence defaults
  stagger: 15,
  startFrom: 0,

  // Exit animation start (frames before end)
  exitAnimationDuration: 30,
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get entrance preset definition by name
 */
export const getEntrancePreset = (
  presetName: EntrancePresetType,
): EntrancePresetDefinition => {
  return entrancePresets[presetName] || entrancePresets.none;
};

/**
 * Get exit preset definition by name
 */
export const getExitPreset = (
  presetName: ExitPresetType,
): ExitPresetDefinition => {
  return exitPresets[presetName] || exitPresets.none;
};

/**
 * Get device specification by type
 */
export const getDeviceSpec = (deviceType: string): DeviceSpec => {
  return (
    deviceSpecs[deviceType] || {
      bezelRadius: 0,
      aspectRatio: 16 / 9,
      defaultWidth: 400,
      defaultHeight: 300,
    }
  );
};
