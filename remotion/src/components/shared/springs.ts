/**
 * Common spring configurations for consistent animation feel.
 *
 * Based on Remotion best practices:
 * - Default: `mass: 1, damping: 10, stiffness: 100` (has bounce)
 * - Smooth: `damping: 200` (no bounce, natural motion)
 *
 * @example
 * ```tsx
 * import { spring } from 'remotion';
 * import { SPRING_CONFIGS } from '@/components/shared';
 *
 * const scale = spring({
 *   frame,
 *   fps,
 *   config: SPRING_CONFIGS.smooth,
 * });
 * ```
 */

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

/**
 * Pre-defined spring configurations for common use cases.
 */
export const SPRING_CONFIGS = {
  /**
   * Smooth, no bounce - ideal for subtle reveals and fades.
   */
  smooth: { damping: 200 } as SpringConfig,

  /**
   * Snappy with minimal bounce - ideal for UI elements and buttons.
   */
  snappy: { damping: 20, stiffness: 200 } as SpringConfig,

  /**
   * Bouncy entrance - ideal for playful animations and callouts.
   */
  bouncy: { damping: 8 } as SpringConfig,

  /**
   * Heavy, slow, small bounce - ideal for large elements and dramatic reveals.
   */
  heavy: { damping: 15, stiffness: 80, mass: 2 } as SpringConfig,

  /**
   * Tight with no overshoot - ideal for precise positioning.
   */
  tight: { damping: 30, stiffness: 300 } as SpringConfig,

  /**
   * Elastic with significant overshoot - ideal for attention-grabbing elements.
   */
  elastic: { damping: 6, stiffness: 150 } as SpringConfig,
} as const;

/**
 * Type for spring config keys.
 */
export type SpringConfigName = keyof typeof SPRING_CONFIGS;
