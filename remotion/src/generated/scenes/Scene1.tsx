import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const SHAPE_COUNT = 24;
  const GRID_COLS = 6;
  const GRID_ROWS = 4;

  // Animation Timings
  const SNAP_START_FRAME = 120;
  const TEXT_APPEAR_START = 10;
  const TEXT_DISAPPEAR_START = 110;

  // Typography Animations
  const textOpacity = interpolate(
    frame,
    [TEXT_APPEAR_START, TEXT_APPEAR_START + 15, TEXT_DISAPPEAR_START, TEXT_DISAPPEAR_START + 15],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  const textScale = spring({
    frame: frame - TEXT_APPEAR_START,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Snap Animation Progress
  const snapProgress = spring({
    frame: frame - SNAP_START_FRAME,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  const shapes = Array.from({ length: SHAPE_COUNT }).map((_, i) => {
    // Deterministic random values for chaotic phase
    const seed = i * 543.21;
    const randomX = ((seed * 1.5) % 1) * width;
    const randomYStart = -200 - ((seed * 2.5) % 300);
    const randomYEnd = height * 0.2 + ((seed * 3.5) % (height * 0.6));
    const randomRotation = (seed * 10) % 360;
    const driftX = Math.sin(frame / 20 + seed) * 50;

    // Grid positions
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const gridX = (width / (GRID_COLS + 1)) * (col + 1);
    const gridY = (height / (GRID_ROWS + 1)) * (row + 1);

    // Falling animation (chaotic phase)
    const fallProgress = interpolate(frame, [0, SNAP_START_FRAME], [0, 1], {
      extrapolateRight: 'clamp',
    });
    
    const currentChaoticX = randomX + driftX;
    const currentChaoticY = interpolate(fallProgress, [0, 1], [randomYStart, randomYEnd]);
    const currentChaoticRot = randomRotation + (frame * ((seed % 5) - 2.5));

    // Interpolate between chaotic and grid
    const x = interpolate(snapProgress, [0, 1], [currentChaoticX, gridX]);
    const y = interpolate(snapProgress, [0, 1], [currentChaoticY, gridY]);
    const rotation = interpolate(snapProgress, [0, 1], [currentChaoticRot, 0]);
    const size = interpolate(snapProgress, [0, 1], [60 + (seed % 40), 80]);

    const isTriangle = i % 2 === 0;

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          width: size,
          height: size,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isTriangle ? (
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            style={{ overflow: 'visible' }}
          >
            <polygon
              points="50,0 100,100 0,100"
              fill="#FFFFFF"
            />
          </svg>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#FFFFFF',
            }}
          />
        )}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {/* Clutter/Grid Shapes */}
      {shapes}

      {/* Central Typography */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 160,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-0.05em',
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            textShadow: '0 0 40px rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          CLUTTERED?
        </div>
      </div>

      {/* Brand Overlay (Bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          width: '100%',
          textAlign: 'center',
          color: '#FFFFFF',
          fontSize: 32,
          fontWeight: 'bold',
          letterSpacing: 4,
          opacity: interpolate(frame, [200, 230], [0, 1], { extrapolateLeft: 'clamp' }),
        }}
      >
        CAMPOR
      </div>
    </AbsoluteFill>
  );
};