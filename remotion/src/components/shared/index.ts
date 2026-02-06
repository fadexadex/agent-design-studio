/**
 * Shared utilities for Remotion animation components.
 *
 * This module provides common configurations, interpolation helpers,
 * and type definitions used across animation components.
 *
 * @example
 * ```tsx
 * import {
 *   SPRING_CONFIGS,
 *   interpolateWithDelay,
 *   getProgress,
 * } from '@/components/shared';
 *
 * const progress = getProgress(frame, 10, 30, 'ease-out');
 * const scale = spring({ frame, fps, config: SPRING_CONFIGS.bouncy });
 * ```
 */

// Spring configurations
export { SPRING_CONFIGS } from "./springs";
export type { SpringConfig, SpringConfigName } from "./springs";

// Interpolation helpers
export {
  interpolateWithDelay,
  getProgress,
  mapProgress,
  getEasing,
} from "./interpolation";
export type { EasingType } from "./interpolation";

// Common types
export type {
  AnimationTiming,
  Position,
  AnimationValues,
  Direction,
} from "./types";
