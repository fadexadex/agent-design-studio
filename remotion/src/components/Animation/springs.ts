/**
 * Spring Configuration Presets
 *
 * Pre-configured spring physics for consistent animation feel across the app.
 * Based on Remotion's spring() config options.
 *
 * @example
 * ```tsx
 * import { Scale, SPRING_CONFIGS } from '@/components/Animation';
 *
 * Scale({
 *   by: 1,
 *   initial: 0,
 *   ...SPRING_CONFIGS.bouncy
 * })
 * ```
 */

// ============================================
// Types
// ============================================

export interface SpringConfig {
  /** Controls how fast the spring slows down. Higher = less oscillation. */
  damping?: number;
  /** Controls how fast the spring moves. Higher = faster. */
  stiffness?: number;
  /** Controls the weight of the object. Higher = slower, more momentum. */
  mass?: number;
  /** If true, spring won't oscillate past the target value. */
  overshootClamping?: boolean;
}

// ============================================
// Spring Presets
// ============================================

/**
 * Pre-defined spring configurations for common animation feels.
 */
export const SPRING_CONFIGS = {
  /**
   * Smooth, no bounce - ideal for subtle reveals and fades.
   * High damping prevents any oscillation.
   */
  smooth: {
    damping: 100,
    stiffness: 100,
    mass: 1,
  } as SpringConfig,

  /**
   * Snappy with minimal bounce - ideal for UI elements and buttons.
   * Quick response with controlled overshoot.
   */
  snappy: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  } as SpringConfig,

  /**
   * Bouncy entrance - ideal for playful animations and callouts.
   * Low damping creates visible oscillation.
   */
  bouncy: {
    damping: 8,
    stiffness: 150,
    mass: 1,
    overshootClamping: false,
  } as SpringConfig,

  /**
   * Heavy, slow, small bounce - ideal for large elements and dramatic reveals.
   * High mass creates a weighty, deliberate feel.
   */
  heavy: {
    damping: 15,
    stiffness: 80,
    mass: 2,
  } as SpringConfig,

  /**
   * Tight with no overshoot - ideal for precise positioning.
   * Clamps overshoot for exact landing.
   */
  tight: {
    damping: 30,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  } as SpringConfig,

  /**
   * Elastic with significant overshoot - ideal for attention-grabbing elements.
   * Very low damping creates multiple oscillations.
   */
  elastic: {
    damping: 6,
    stiffness: 150,
    mass: 1,
    overshootClamping: false,
  } as SpringConfig,

  /**
   * Kinetic slide - used for text reveals and masked slides.
   * Quick settle with subtle overshoot for a "magnetic snap" feel.
   */
  kinetic: {
    damping: 18,
    stiffness: 220,
    mass: 1,
  } as SpringConfig,

  /**
   * Gentle - slow, graceful motion for cinematic reveals.
   * Low stiffness creates a floating, dreamy feel.
   */
  gentle: {
    damping: 25,
    stiffness: 60,
    mass: 1.5,
  } as SpringConfig,

  /**
   * Pop - quick scale animations with slight bounce.
   * Good for notification badges, icons appearing.
   */
  pop: {
    damping: 12,
    stiffness: 200,
    mass: 0.8,
    overshootClamping: false,
  } as SpringConfig,
} as const;

export type SpringPreset = keyof typeof SPRING_CONFIGS;

/**
 * Get a spring config by name with optional overrides.
 *
 * @param preset - Name of the spring preset
 * @param overrides - Optional overrides for specific values
 * @returns Combined spring config
 *
 * @example
 * ```tsx
 * const config = getSpringConfig('bouncy', { damping: 10 });
 * ```
 */
export const getSpringConfig = (
  preset: SpringPreset,
  overrides?: Partial<SpringConfig>
): SpringConfig => {
  return {
    ...SPRING_CONFIGS[preset],
    ...overrides,
  };
};
