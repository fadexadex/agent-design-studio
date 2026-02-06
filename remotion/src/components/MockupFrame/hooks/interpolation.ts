import { interpolate, Easing } from "remotion";
import type { EasingType } from "../types";

type EasingFunction = (t: number) => number;

/**
 * Maps easing string to Remotion Easing function
 */
export const mapEasing = (easing?: EasingType): EasingFunction | undefined => {
  if (!easing) return undefined;

  switch (easing) {
    case "linear":
      return Easing.linear;
    case "easeIn":
      return Easing.in(Easing.quad);
    case "easeOut":
      return Easing.out(Easing.quad);
    case "easeInOut":
      return Easing.inOut(Easing.quad);
    case "cubicIn":
      return Easing.in(Easing.cubic);
    case "cubicOut":
      return Easing.out(Easing.cubic);
    case "cubicInOut":
      return Easing.inOut(Easing.cubic);
    case "backIn":
      return Easing.in(Easing.back(1.7));
    case "backOut":
      return Easing.out(Easing.back(1.7));
    case "backInOut":
      return Easing.inOut(Easing.back(1.7));
    default:
      return undefined;
  }
};

/**
 * Safe interpolate wrapper that always clamps by default
 */
export const safeInterpolate = (
  frame: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  easing?: EasingType,
): number => {
  return interpolate(frame, inputRange, outputRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: mapEasing(easing),
  });
};

/**
 * Calculate animation value with delay support
 */
export const interpolateWithDelay = (
  frame: number,
  delay: number,
  duration: number,
  from: number,
  to: number,
  easing?: EasingType,
): number => {
  const startFrame = delay;
  const endFrame = delay + duration;

  return safeInterpolate(frame, [startFrame, endFrame], [from, to], easing);
};
