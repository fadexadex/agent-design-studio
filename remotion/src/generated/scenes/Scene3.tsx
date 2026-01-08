import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, useVideoConfig } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  // Aggressive ease-in-out curve for a snappy transition
  const snappyEasing = Easing.bezier(0.9, 0, 0.1, 1);

  // The composition starts fully visible and slides up out of view
  // Animation starts at frame 10 and finishes by frame 38 to ensure a clean black hold
  const translateY = interpolate(
    frame,
    [10, 38],
    [0, -height],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: snappyEasing,
    }
  );

  // Subtle opacity fade on the text to enhance the exit feel
  const contentOpacity = interpolate(
    frame,
    [10, 25],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <AbsoluteFill
        style={{
          backgroundColor: '#FFFFFF',
          transform: `translateY(${translateY}px)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: contentOpacity,
          }}
        >
          <div
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: 64,
              fontWeight: 200,
              letterSpacing: '0.25em',
              color: '#000000',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Campor
          </div>
          <div
            style={{
              width: 40,
              height: 1,
              backgroundColor: '#000000',
              opacity: 0.6,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};