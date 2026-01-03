import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';

// Constants for scene dimensions and branding
const WIDTH = 1920;
const HEIGHT = 1080;
const BRAND_COLOR_PRIMARY = '#FFFFFF'; // White for elements
const BRAND_COLOR_BACKGROUND = '#000000'; // Black background

// Grid parameters
const GRID_COLS = 12;
const GRID_ROWS = 8;
const GRID_PADDING = 150; // Padding from edges
const GRID_LINE_THICKNESS = 1;
const NODE_SIZE = 8; // Size of nodes at intersections

// Helper to get spring value
const getSpring = (frame: number, fps: number, delay: number, duration: number) =>
  spring({
    frame: frame - delay,
    fps: fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 0.5,
    },
    durationInFrames: duration,
  });

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30; // Assuming 30fps for Remotion

  // Campor Logotype Animation
  const logoScaleProgress = getSpring(frame, fps, 0, 25); // Scales down over 25 frames
  const logoTranslateProgress = getSpring(frame, fps, 0, 25); // Moves up over 25 frames

  const logoInitialScale = 1;
  const logoFinalScale = 0.3;
  const logoScale = interpolate(logoScaleProgress, [0, 1], [logoInitialScale, logoFinalScale], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Calculate final Y position for top-center:
  // (HEIGHT / 2) is the center. To move it up, we subtract.
  // Let's say the logo's top edge should be 80px from the screen's top.
  // The logo's initial font size is 120px, so its approximate height is 120px.
  // At 0.3 scale, its height is 120 * 0.3 = 36px.
  // If its top edge is 80px from screen top, its center is 80 + (36/2) = 98px from screen top.
  // Relative to screen center (HEIGHT/2), this is 98 - (HEIGHT/2) = 98 - 540 = -442px.
  const logoFinalY = -442; // Adjusted for top-center positioning
  const logoTranslateY = interpolate(logoTranslateProgress, [0, 1], [0, logoFinalY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Logo fades out towards the end of the scene
  const logoOpacity = interpolate(frame, [0, 5, 40, 49], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Grid Fade In
  const gridOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Calculate grid dimensions
  const gridWidth = WIDTH - GRID_PADDING * 2;
  const gridHeight = HEIGHT - GRID_PADDING * 2;
  const colSpacing = gridWidth / (GRID_COLS - 1);
  const rowSpacing = gridHeight / (GRID_ROWS - 1);

  // Generate grid points and lines
  const gridElements: React.ReactNode[] = [];

  // Horizontal lines
  for (let r = 0; r < GRID_ROWS; r++) {
    gridElements.push(
      <div
        key={`h-line-${r}`}
        style={{
          position: 'absolute',
          left: 0,
          top: r * rowSpacing,
          width: '100%',
          height: GRID_LINE_THICKNESS,
          backgroundColor: BRAND_COLOR_PRIMARY,
          opacity: gridOpacity * 0.3, // Base grid lines are subtle
        }}
      />
    );
  }

  // Vertical lines
  for (let c = 0; c < GRID_COLS; c++) {
    gridElements.push(
      <div
        key={`v-line-${c}`}
        style={{
          position: 'absolute',
          left: c * colSpacing,
          top: 0,
          width: GRID_LINE_THICKNESS,
          height: '100%',
          backgroundColor: BRAND_COLOR_PRIMARY,
          opacity: gridOpacity * 0.3, // Base grid lines are subtle
        }}
      />
    );
  }

  // Nodes and pulsing effects
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x = c * colSpacing;
      const y = r * rowSpacing;

      // Pulse effect for nodes
      const pulseDelay = (r * GRID_COLS + c) * 0.5; // Staggered delay for ripple effect
      const pulseMagnitude = interpolate(
        frame - pulseDelay,
        [20, 30], // Start pulsing around frame 20, full pulse by 30
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

      const scale = 1 + Math.sin((frame * 0.1 + r * 0.5 + c * 0.5)) * 0.5 * pulseMagnitude;
      const nodeOpacity = interpolate(
        frame - pulseDelay,
        [15, 25], // Nodes appear slightly after grid lines
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      ) * gridOpacity; // Ensure node doesn't appear before grid container

      gridElements.push(
        <div
          key={`node-${r}-${c}`}
          style={{
            position: 'absolute',
            left: x - NODE_SIZE / 2,
            top: y - NODE_SIZE / 2,
            width: NODE_SIZE,
            height: NODE_SIZE,
            borderRadius: '50%',
            backgroundColor: BRAND_COLOR_PRIMARY,
            opacity: nodeOpacity,
            transform: `scale(${scale})`,
          }}
        />
      );
    }
  }

  // Data flow pathways (more dynamic lines)
  // Let's create a few specific paths that light up
  const paths = [
    [{ r: 1, c: 2 }, { r: 3, c: 4 }, { r: 5, c: 6 }], // Diagonal path 1
    [{ r: 0, c: 8 }, { r: 2, c: 7 }, { r: 4, c: 6 }, { r: 6, c: 5 }], // Diagonal path 2
    [{ r: 7, c: 1 }, { r: 5, c: 3 }, { r: 3, c: 5 }, { r: 1, c: 7 }], // Diagonal path 3
    [{ r: 4, c: 0 }, { r: 4, c: 5 }, { r: 2, c: 5 }, { r: 2, c: 10 }], // L-shaped path
  ];

  paths.forEach((path, pathIndex) => {
    for (let i = 0; i < path.length - 1; i++) {
      const startNode = path[i];
      const endNode = path[i + 1];

      const startX = startNode.c * colSpacing;
      const startY = startNode.r * rowSpacing;
      const endX = endNode.c * colSpacing;
      const endY = endNode.r * rowSpacing;

      const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
      const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

      // Animate opacity along the path
      const flowDelay = 20 + pathIndex * 5 + i * 2; // Staggered start for different paths/segments
      const flowOpacity = interpolate(
        frame - flowDelay,
        [0, 15, 35, 45], // Fade in, hold, fade out
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

      const flowPulse = Math.sin((frame - flowDelay) * 0.2 + pathIndex * 10) * 0.5 + 0.5; // Wave-like pulse
      const animatedLineOpacity = flowOpacity * flowPulse * gridOpacity;

      gridElements.push(
        <div
          key={`path-${pathIndex}-${i}`}
          style={{
            position: 'absolute',
            left: startX,
            top: startY - (GRID_LINE_THICKNESS * 2) / 2, // Center line vertically
            width: length,
            height: GRID_LINE_THICKNESS * 2, // Slightly thicker for flow lines
            backgroundColor: BRAND_COLOR_PRIMARY,
            transformOrigin: '0 0',
            transform: `rotate(${angle}deg)`,
            opacity: animatedLineOpacity,
          }}
        />
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND_COLOR_BACKGROUND }}>
      {/* Campor Logotype */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${logoTranslateY}px) scale(${logoScale})`,
          color: BRAND_COLOR_PRIMARY,
          fontFamily: 'Montserrat, sans-serif', // Using a common sans-serif font
          fontSize: 120, // Initial large size
          fontWeight: 'bold',
          letterSpacing: -5,
          opacity: logoOpacity,
          zIndex: 10, // Ensure logo is above grid initially
        }}
      >
        Campor
      </div>

      {/* Geometric Grid */}
      <div
        style={{
          position: 'absolute',
          top: GRID_PADDING,
          left: GRID_PADDING,
          width: gridWidth,
          height: gridHeight,
          opacity: gridOpacity,
          transform: `scale(${interpolate(gridOpacity, [0, 1], [0.8, 1])})`, // Subtle scale in effect as grid appears
        }}
      >
        {gridElements}
      </div>
    </AbsoluteFill>
  );
};