// Main components
export { MockupFrame } from "./MockupFrame";
export { FrameSequence } from "./FrameSequence";

// Types
export type {
  // Core types
  MockupFrameProps,
  FrameSequenceProps,
  FrameType,
  ThemeType,
  // Animation types
  BlurAnimation,
  OpacityAnimation,
  ScaleAnimation,
  PositionAnimation,
  RotateAnimation,
  EntrancePresetType,
  ExitPresetType,
  EasingType,
  SpringConfig,
  // Configuration types
  GlassConfig,
  BrowserConfig,
  // Internal types (for advanced usage)
  AnimationValues,
  DeviceFrameProps,
  BrowserFrameProps,
  IPhoneFrameProps,
  CardFrameProps,
  DeviceSpec,
} from "./types";

// Presets and utilities
export {
  entrancePresets,
  exitPresets,
  deviceSpecs,
  getEntrancePreset,
  getExitPreset,
  getDeviceSpec,
  DEFAULTS,
} from "./presets";

// Glass effects utilities
export {
  getGlassStyles,
  getGlareStyles,
  getFrameShadowStyles,
} from "./utils/glassEffects";

// Device frame components (for advanced customization)
export { BrowserFrame } from "./utils/deviceFrames/BrowserFrame";
export { IPhoneFrame } from "./utils/deviceFrames/IPhoneFrame";
export { CardFrame } from "./utils/deviceFrames/CardFrame";

// Hooks (for advanced customization)
export { useFrameRenderer } from "./hooks/useFrameRenderer";
export { useAnimationCalculator } from "./hooks/useAnimationCalculator";
export {
  useStyleComposer,
  getScaleOrigin,
  getPerspective,
} from "./hooks/useStyleComposer";
