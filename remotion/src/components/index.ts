/**
 * LangEase Motion Components
 *
 * A collection of Remotion-based animation components for creating
 * fast-paced, unique SaaS motion design videos.
 *
 * Note: For detailed type imports, import directly from specific modules:
 * - `@/components/AnimatedText` for text animation types
 * - `@/components/MockupFrame` for frame/mockup types
 * - `@/components/shared` for shared utility types
 *
 * @example
 * ```tsx
 * import {
 *   AnimatedText,
 *   MockupFrame,
 *   DynamicCursor,
 *   CameraRig,
 *   BackgroundRig,
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
export { BackgroundRig } from "./Global";
export type {
  BackgroundRigProps,
  BackgroundType,
  BackgroundVariant,
} from "./Global";

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
