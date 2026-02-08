/**
 * LangEase Motion Components
 *
 * A collection of Remotion-based animation components for creating
 * fast-paced, unique SaaS motion design videos.
 *
 * Note: For detailed type imports, import directly from specific modules:
 * - `@/components/AnimatedText` for text animation types
 * - `@/components/MockupFrame` for frame/mockup types
 * - `@/components/Global` for background types
 * - `@/components/shared` for shared utility types
 *
 * @example
 * ```tsx
 * import {
 *   AnimatedText,
 *   MockupFrame,
 *   DynamicCursor,
 *   CameraRig,
 *   Background,
 *   MotionContainer,
 *   BentoGrid,
 *   TransitionSeries,
 * } from '@/components';
 * ```
 */

// ============================================
// AnimatedText - Text animation components
// ============================================
export {
  AnimatedText,
  LayoutGrid,
  TextSequence,
  presets as textPresets,
  getPreset as getTextPreset,
  DEFAULTS as TEXT_DEFAULTS,
  usePositioning,
} from "./AnimatedText";

export type {
  AnimatedTextProps,
  TextSequenceItemProps,
  TypewriterConfig,
  ExitAnimation,
  StaggerConfig,
  GradientConfig,
  PresetType,
  AnimationUnit,
  AnchorPosition,
  AnchorAnimation,
  PositioningProps,
  PositioningResult,
  LayoutGridProps,
  TextSequenceProps,
} from "./AnimatedText";

// ============================================
// MockupFrame - Device mockup components
// ============================================
export {
  MockupFrame,
  FrameSequence,
  entrancePresets,
  exitPresets,
  deviceSpecs,
  getEntrancePreset,
  getExitPreset,
  getDeviceSpec,
  DEFAULTS as FRAME_DEFAULTS,
  getGlassStyles,
  getGlareStyles,
  getFrameShadowStyles,
  BrowserFrame,
  IPhoneFrame,
  CardFrame,
  useFrameRenderer,
  useAnimationCalculator as useFrameAnimationCalculator,
  useStyleComposer,
  getScaleOrigin,
  getPerspective,
} from "./MockupFrame";

export type {
  MockupFrameProps,
  FrameSequenceProps,
  FrameType,
  ThemeType,
  RotateAnimation,
  EntrancePresetType,
  ExitPresetType,
  GlassConfig,
  BrowserConfig,
  DeviceFrameProps,
  BrowserFrameProps,
  IPhoneFrameProps,
  CardFrameProps,
  DeviceSpec,
} from "./MockupFrame";

// ============================================
// DynamicCursor - Cursor animation components
// ============================================
export { DynamicCursor, CursorPath } from "./DynamicCursor";

export type {
  DynamicCursorProps,
  CursorVariant,
  CursorPathProps,
} from "./DynamicCursor";

// ============================================
// Camera - Virtual camera components
// ============================================
export { CameraRig } from "./Camera";
export type { CameraRigProps } from "./Camera";

// ============================================
// Global - Background and scene components
// ============================================
// New Background system (recommended)
export {
  Background,
  backgroundPresets,
  getBackgroundPreset,
  getRandomBackgroundPreset,
  listBackgroundPresets,
  getTypeVariantLayers,
  useAnimationEngine,
  // Individual layers
  SolidLayer,
  LinearGradientLayer,
  RadialGradientLayer,
  MeshGradientLayer,
  NoiseLayer,
  BlurLayer,
  VignetteLayer,
  GlowLayer,
  GridLayer,
  // Layer defaults
  SOLID_DEFAULTS,
  LINEAR_DEFAULTS,
  RADIAL_DEFAULTS,
  MESH_DEFAULTS,
  NOISE_DEFAULTS,
  BLUR_DEFAULTS,
  VIGNETTE_DEFAULTS,
  GLOW_DEFAULTS,
  GRID_DEFAULTS,
} from "./Global";

export type {
  BackgroundProps,
  BackgroundPreset,
  BackgroundLayerConfig,
  BaseLayerConfig,
  SolidLayerConfig,
  LinearGradientLayerConfig,
  RadialGradientLayerConfig,
  MeshGradientLayerConfig,
  NoiseLayerConfig,
  BlurLayerConfig,
  VignetteLayerConfig,
  GlowLayerConfig,
  GridLayerConfig,
  BackgroundType,
  BackgroundVariant,
} from "./Global";

// Legacy BackgroundRig (deprecated - use Background instead)
export { BackgroundRig } from "./Global";
export type { BackgroundRigProps } from "./Global";

// ============================================
// Layout - Motion containers and grids
// ============================================
export { MotionContainer, BentoGrid, BentoItem } from "./Layout";

export type {
  MotionContainerProps,
  InitialState,
  ExitState,
  BentoGridProps,
  BentoItemProps,
} from "./Layout";

// ============================================
// Transitions - Scene transition components
// ============================================
export {
  TransitionSeries,
  linearTiming,
  springTiming,
  IrisTransition,
} from "./Transitions";

export type { IrisTransitionProps, IrisMode } from "./Transitions";

// ============================================
// Shared - Utility functions and configs
// ============================================
export {
  SPRING_CONFIGS,
  interpolateWithDelay,
  getProgress,
  mapProgress,
  getEasing,
} from "./shared";

export type {
  SpringConfig,
  SpringConfigName,
  EasingType,
  AnimationTiming,
  Position,
  AnimationValues,
  Direction,
} from "./shared";

// ============================================
// Animation - Declarative animation utilities
// ============================================
// Re-exports from remotion-animated, remotion-time, and custom presets
export {
  // Core remotion-animated components
  Animated,
  Move,
  Scale,
  Fade,
  Rotate,
  Size,
  // Animation presets object (use as PRESETS.slideUp(), PRESETS.fadeIn(), etc.)
  PRESETS,
  // Spring configuration presets (use as SPRING_CONFIGS.bouncy, etc.)
  SPRING_CONFIGS as ANIMATION_SPRINGS,
  getSpringConfig,
  // Time utilities from remotion-time
  useTime,
  useTimeConfig,
  useInterpolate,
  // Text animation from remotion-animate-text
  TextAnimator,
} from "./Animation";

export type {
  Animation,
  PresetName,
  SpringPreset,
} from "./Animation";
