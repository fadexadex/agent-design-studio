/**
 * Time-based Utilities
 *
 * Wrapper around remotion-time for working with seconds instead of frames.
 *
 * @example
 * ```tsx
 * import { useTime } from '@/components/Animation';
 *
 * const t = useTime();
 * // Use time strings instead of frame counts
 * const opacity = t`0s` to t`1s` // frames for 0-1 second
 * ```
 */

// Re-export from remotion-time
export { useTime, useTimeConfig, useInterpolate } from 'remotion-time';

/**
 * Convert seconds to frames based on fps.
 *
 * @param seconds - Time in seconds
 * @param fps - Frames per second (default: 30)
 * @returns Number of frames
 *
 * @example
 * ```tsx
 * const frames = secondsToFrames(2.5, 30); // 75
 * ```
 */
export const secondsToFrames = (seconds: number, fps: number = 30): number => {
  return Math.round(seconds * fps);
};

/**
 * Convert frames to seconds based on fps.
 *
 * @param frames - Number of frames
 * @param fps - Frames per second (default: 30)
 * @returns Time in seconds
 *
 * @example
 * ```tsx
 * const seconds = framesToSeconds(75, 30); // 2.5
 * ```
 */
export const framesToSeconds = (frames: number, fps: number = 30): number => {
  return frames / fps;
};

/**
 * Create a timing object for common video durations.
 *
 * @param fps - Frames per second
 * @returns Object with frame counts for common durations
 *
 * @example
 * ```tsx
 * const { fps } = useVideoConfig();
 * const timing = createTiming(fps);
 * // timing.half = 75 (for 5s video at 30fps)
 * // timing.quarter = 37.5
 * ```
 */
export const createTiming = (fps: number, durationSeconds: number = 5) => {
  const totalFrames = durationSeconds * fps;
  return {
    total: totalFrames,
    half: totalFrames / 2,
    quarter: totalFrames / 4,
    third: totalFrames / 3,
    twoThirds: (totalFrames * 2) / 3,
    threeQuarters: (totalFrames * 3) / 4,
    // Common durations in frames
    oneSecond: fps,
    halfSecond: fps / 2,
    quarterSecond: fps / 4,
    twoSeconds: fps * 2,
  };
};
