/**
 * Shared type definitions for animation components.
 */

import type { SpringConfig } from "./springs";

/**
 * Animation timing configuration.
 */
export interface AnimationTiming {
  /**
   * Delay before animation starts (in frames).
   */
  delay?: number;
  /**
   * Duration of the animation (in frames).
   */
  duration?: number;
}

/**
 * Position values for transform animations.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Animation state with all computed values.
 */
export interface AnimationValues {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
  blur: number;
  rotation?: number;
}

/**
 * Direction for slide/wipe animations.
 */
export type Direction = "up" | "down" | "left" | "right";

/**
 * Re-export SpringConfig for convenience.
 */
export type { SpringConfig };
