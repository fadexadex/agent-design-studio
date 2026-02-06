import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

export interface CameraRigProps {
  /**
   * Current zoom level (1 = default, no zoom).
   * @default 1
   */
  zoom?: number;
  /**
   * Camera X position (target point in the world).
   * @default 0
   */
  x?: number;
  /**
   * Camera Y position (target point in the world).
   * @default 0
   */
  y?: number;
  /**
   * Camera rotation in degrees.
   * @default 0
   */
  rotation?: number;
  /**
   * Transform origin as [x, y] ratios (0-1).
   * The camera will focus on this point during zoom/rotation.
   * @default [0.5, 0.5] (center)
   */
  focusPoint?: [number, number];

  children: React.ReactNode;
}

/**
 * CameraRig - A virtual camera wrapper for 2D compositions.
 *
 * Applies zoom, pan, and rotation transforms to create camera-like movement.
 * The focusPoint determines the center of zoom/rotation.
 *
 * @example
 * ```tsx
 * const frame = useCurrentFrame();
 * const zoom = interpolate(frame, [0, 60], [1, 1.5]);
 * const panX = interpolate(frame, [0, 60], [0, 100]);
 *
 * <CameraRig zoom={zoom} x={panX} rotation={5} focusPoint={[0.5, 0.5]}>
 *   <MyScene />
 * </CameraRig>
 * ```
 *
 * @example
 * // Focus on top-left corner during zoom
 * <CameraRig zoom={2} focusPoint={[0, 0]}>
 *   <Content />
 * </CameraRig>
 */
export const CameraRig: React.FC<CameraRigProps> = ({
  zoom = 1,
  x = 0,
  y = 0,
  rotation = 0,
  focusPoint = [0.5, 0.5],
  children,
}) => {
  const { width, height } = useVideoConfig();

  // Convert focus point ratios to pixel coordinates
  const focusX = width * focusPoint[0];
  const focusY = height * focusPoint[1];

  // Calculate translation to move world point (x, y) to screen point (focusX, focusY)
  const translateX = focusX - x;
  const translateY = focusY - y;

  // Transform origin for zoom/rotation
  const transformOrigin = `${focusX}px ${focusY}px`;

  // Transform order: translate -> rotate -> scale
  // This moves the target point to focus, then rotates and scales around it
  const transform = `translate(${translateX}px, ${translateY}px) rotate(${-rotation}deg) scale(${zoom})`;

  return (
    <AbsoluteFill
      style={{
        transformOrigin,
        transform,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
