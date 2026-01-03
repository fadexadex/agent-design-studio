import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';

// Helper component for a single square in the geometric grid
interface GridSquareProps {
  x: number;
  y: number;
  size: number;
  frame: number;
  delay: number;
}

const GridSquare: React.FC<GridSquareProps> = ({ x, y, size, frame, delay }) => {
  const animationStart = 0; // Grid dissolution starts at frame 0
  const animationDuration = 20; // Grid dissolution lasts 20 frames

  const progress = spring({
    frame: frame - animationStart - delay,
    fps: 30,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 0.5,
    },
    durationInFrames: animationDuration,
  });

  const scale = interpolate(progress, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(progress, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Calculate movement outwards from the center
  const centerX = 1920 / 2;

export const Scene3 = GridSquare;