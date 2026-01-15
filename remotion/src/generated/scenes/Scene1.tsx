import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  interpolateColors,
} from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const ROWS = 6;
  const COLS = 11;
  const cellWidth = width / COLS;
  const cellHeight = height / ROWS;

  const brandRed = '#c91313';
  const brandBlack = '#000000';

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          height: '100%',
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;

          // Staggering logic based on grid position (diagonal burst)
          const staggerOffset = (row + col) * 1.2;
          
          const animationProgress = spring({
            frame: frame - staggerOffset,
            fps,
            config: {
              stiffness: 120,
              damping: 14,
              mass: 0.8,
            },
          });

          // Morphing: Circle (50%) to Square (0%)
          const borderRadius = interpolate(animationProgress, [0, 1], [50, 0]);

          // Color transition: Red to Black
          const backgroundColor = interpolateColors(
            animationProgress,
            [0, 1],
            [brandRed, brandBlack]
          );

          // 90-degree rotation
          const rotation = interpolate(animationProgress, [0, 1], [0, 90]);

          // Staggered scaling burst
          const scale = interpolate(
            animationProgress,
            [0, 0.4, 1],
            [0, 1.1, 1]
          );

          // Opacity fade in
          const opacity = interpolate(animationProgress, [0, 0.2], [0, 1]);

          return (
            <div
              key={`${row}-${col}`}
              style={{
                width: cellWidth,
                height: cellHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: Math.min(cellWidth, cellHeight) * 0.85,
                  height: Math.min(cellWidth, cellHeight) * 0.85,
                  backgroundColor,
                  borderRadius: `${borderRadius}%`,
                  opacity,
                  transform: `rotate(${rotation}deg) scale(${scale})`,
                  boxShadow: `0 4px 15px rgba(0,0,0,${interpolate(animationProgress, [0, 1], [0, 0.15])})`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Subtle overlay for geometric texture */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          border: '20px solid transparent',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: `2px solid ${brandBlack}`,
            opacity: interpolate(frame, [0, 15, 45], [0, 0.1, 0.1]),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};