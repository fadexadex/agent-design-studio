import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Smooth fade in
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Scale animation with spring physics
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Slide in from bottom
  const translateY = interpolate(
    frame,
    [0, 30],
    [50, 0],
    { extrapolateRight: 'clamp' }
  );

  // Fade out at the end
  const fadeOut = interpolate(
    frame,
    [241, 271],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: opacity * fadeOut,
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: Math.min(width, height) * 0.08,
            fontWeight: 'bold',
            marginBottom: 20,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Campor
        </div>
        <div
          style={{
            color: '#FFFFFF',
            fontSize: Math.min(width, height) * 0.03,
            opacity: 0.8,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Scene 3
        </div>
      </div>
    </AbsoluteFill>
  );
};
