import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

export type IrisMode = "enter" | "exit";

export interface IrisTransitionProps {
  /**
   * Mode of the transition.
   * - "exit": Circle grows from center to cover the screen (scene ends)
   * - "enter": Circle shrinks from full to reveal the scene (scene begins)
   */
  mode?: IrisMode;
  /**
   * Color of the iris overlay.
   * @default "#000000"
   */
  color?: string;
  /**
   * Duration of the transition in frames.
   */
  durationInFrames: number;
  /**
   * Delay before the transition starts (in frames).
   * @default 0
   */
  delay?: number;
  /**
   * Custom easing function.
   * @default Easing.inOut(Easing.ease)
   */
  easing?: (t: number) => number;
  /**
   * Center point of the iris as [x, y] percentages (0-100).
   * @default [50, 50] (center)
   */
  center?: [number, number];
}

/**
 * IrisTransition - A circular wipe transition effect.
 *
 * This creates a "growing/shrinking circle" effect commonly used in
 * classic animations and video transitions.
 *
 * Note: For the classic "Looney Tunes" style hole-closing effect,
 * you would need SVG masks. This implementation uses clip-path
 * for a "circle that grows to fill" style.
 */
export const IrisTransition: React.FC<IrisTransitionProps> = ({
  mode = "exit",
  color = "#000000",
  durationInFrames,
  delay = 0,
  easing,
  center = [50, 50],
}) => {
  const frame = useCurrentFrame();
  const isExit = mode === "exit";

  const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easing || Easing.inOut(Easing.ease),
  });

  // Exit: Circle grows from 0% to 150% (covers screen)
  // Enter: Circle shrinks from 150% to 0% (reveals screen)
  const startRadius = isExit ? 0 : 150;
  const endRadius = isExit ? 150 : 0;
  const radius = interpolate(progress, [0, 1], [startRadius, endRadius]);

  const [centerX, centerY] = center;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        clipPath: `circle(${radius}% at ${centerX}% ${centerY}%)`,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
};
