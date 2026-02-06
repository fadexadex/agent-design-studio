import { useCurrentFrame, interpolate } from "remotion";

interface AnimationEngineOptions {
  animated?: boolean;
  animationSpeed?: number;
}

/**
 * Provides frame-aware animation primitives for background layers.
 *
 * Every helper returns the static value when `animated` is false,
 * so layer components can call them unconditionally.
 */
export function useAnimationEngine(options: AnimationEngineOptions = {}) {
  const rawFrame = useCurrentFrame();
  const { animated = false, animationSpeed = 1 } = options;
  const frame = rawFrame * animationSpeed;

  /**
   * Oscillate smoothly between `min` and `max` over `period` frames.
   * Returns `min` when not animated.
   */
  const oscillate = (min: number, max: number, period = 300): number => {
    if (!animated) return min;
    const p = Math.max(period, 1);
    return interpolate(frame % p, [0, p / 2, p], [min, max, min]);
  };

  /**
   * Continuously rotate starting from `startAngle`.
   * Returns `startAngle` when not animated.
   */
  const rotate = (startAngle: number, period = 600): number => {
    if (!animated) return startAngle;
    return interpolate(frame, [0, period], [startAngle, startAngle + 360], {
      extrapolateRight: "wrap",
    });
  };

  /**
   * Pulse around `base` by ± `amplitude`.
   * Returns `base` when not animated.
   */
  const pulse = (base: number, amplitude: number, period = 200): number => {
    if (!animated) return base;
    const p = Math.max(period, 1);
    return interpolate(
      frame % p,
      [0, p / 2, p],
      [base, base + amplitude, base]
    );
  };

  /**
   * Gentle drift around `center` by ± `range`.
   * Returns `center` when not animated.
   */
  const drift = (center: number, range: number, period = 400): number => {
    if (!animated) return center;
    const p = Math.max(period, 1);
    return interpolate(
      frame % p,
      [0, p / 2, p],
      [center - range, center + range, center - range]
    );
  };

  return { frame, oscillate, rotate, pulse, drift, animated };
}
