import { interpolate, Easing } from "remotion";

/**
 * Standard easing types available in Remotion.
 */
export type EasingType =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "quad-in"
  | "quad-out"
  | "quad-in-out"
  | "cubic-in"
  | "cubic-out"
  | "cubic-in-out"
  | "expo-in"
  | "expo-out"
  | "expo-in-out";

/**
 * Map easing type strings to Remotion Easing functions.
 */
const EASING_MAP: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  ease: Easing.ease,
  "ease-in": Easing.in(Easing.ease),
  "ease-out": Easing.out(Easing.ease),
  "ease-in-out": Easing.inOut(Easing.ease),
  "quad-in": Easing.in(Easing.quad),
  "quad-out": Easing.out(Easing.quad),
  "quad-in-out": Easing.inOut(Easing.quad),
  "cubic-in": Easing.in(Easing.cubic),
  "cubic-out": Easing.out(Easing.cubic),
  "cubic-in-out": Easing.inOut(Easing.cubic),
  "expo-in": Easing.in(Easing.exp),
  "expo-out": Easing.out(Easing.exp),
  "expo-in-out": Easing.inOut(Easing.exp),
};

/**
 * Get an easing function from a type string.
 */
export const getEasing = (type: EasingType): ((t: number) => number) => {
  return EASING_MAP[type] || EASING_MAP.linear;
};

/**
 * Interpolate with a delay, clamping values outside the range.
 *
 * @param frame - Current frame
 * @param delay - Frames to wait before starting
 * @param duration - Duration of the interpolation in frames
 * @param from - Starting value
 * @param to - Ending value
 * @param easing - Optional easing type or function
 *
 * @example
 * ```tsx
 * const opacity = interpolateWithDelay(frame, 15, 30, 0, 1, 'ease-out');
 * ```
 */
export const interpolateWithDelay = (
  frame: number,
  delay: number,
  duration: number,
  from: number,
  to: number,
  easing?: EasingType | ((t: number) => number),
): number => {
  const easingFn =
    typeof easing === "function"
      ? easing
      : easing
        ? getEasing(easing)
        : undefined;

  return interpolate(frame - delay, [0, duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easingFn,
  });
};

/**
 * Create a progress value from 0 to 1 with optional delay.
 *
 * @param frame - Current frame
 * @param delay - Frames to wait before starting
 * @param duration - Duration in frames
 * @param easing - Optional easing type or function
 *
 * @example
 * ```tsx
 * const progress = getProgress(frame, 10, 30, 'ease-in-out');
 * const scale = 0.5 + progress * 0.5; // 0.5 -> 1.0
 * ```
 */
export const getProgress = (
  frame: number,
  delay: number,
  duration: number,
  easing?: EasingType | ((t: number) => number),
): number => {
  return interpolateWithDelay(frame, delay, duration, 0, 1, easing);
};

/**
 * Map a progress value (0-1) to a custom range.
 *
 * @example
 * ```tsx
 * const rotation = mapProgress(progress, 0, 360); // 0° to 360°
 * const scale = mapProgress(progress, 0.8, 1.2); // 0.8x to 1.2x
 * ```
 */
export const mapProgress = (
  progress: number,
  from: number,
  to: number,
): number => {
  return interpolate(progress, [0, 1], [from, to]);
};
