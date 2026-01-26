import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Global zoom-out animation for the entire frame
  const globalScale = interpolate(
    frame,
    [0, 225],
    [1.1, 1],
    { extrapolateRight: 'clamp' }
  );

  // Logo animations
  const logoOpacity = interpolate(
    frame,
    [0, 40],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const logoSpring = spring({
    frame,
    fps,
    config: {
      damping: 15,
      stiffness: 60,
    },
  });

  const logoScale = interpolate(
    logoSpring,
    [0, 1],
    [0.8, 1.2] // Larger and more prominent as requested
  );

  // URL animations
  const urlOpacity = interpolate(
    frame,
    [60, 120],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const urlTranslateY = interpolate(
    frame,
    [60, 120],
    [20, 0],
    { extrapolateRight: 'clamp' }
  );

  // Minimalist line animation
  const lineWidth = interpolate(
    frame,
    [80, 140],
    [0, 120],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${globalScale})`,
        }}
      >
        {/* Brand Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            color: '#FFFFFF',
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontFamily: 'Helvetica, Arial, sans-serif',
            marginBottom: 20,
          }}
        >
          Campor
        </div>

        {/* Minimalist Divider Line */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: '#FFFFFF',
            opacity: 0.3,
            marginBottom: 40,
          }}
        />

        {/* Call to Action URL */}
        <div
          style={{
            opacity: urlOpacity,
            transform: `translateY(${urlTranslateY}px)`,
            color: '#FFFFFF',
            fontSize: 32,
            fontWeight: 300,
            letterSpacing: '0.4em',
            fontFamily: 'Helvetica, Arial, sans-serif',
            textTransform: 'uppercase',
          }}
        >
          campor.com
        </div>
      </div>

      {/* Subtle corner accents for minimalist aesthetic */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          width: 40,
          height: 1,
          backgroundColor: '#FFFFFF',
          opacity: interpolate(frame, [0, 60], [0, 0.2]),
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          width: 1,
          height: 40,
          backgroundColor: '#FFFFFF',
          opacity: interpolate(frame, [0, 60], [0, 0.2]),
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 60,
          width: 40,
          height: 1,
          backgroundColor: '#FFFFFF',
          opacity: interpolate(frame, [0, 60], [0, 0.2]),
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 60,
          width: 1,
          height: 40,
          backgroundColor: '#FFFFFF',
          opacity: interpolate(frame, [0, 60], [0, 0.2]),
        }}
      />
    </AbsoluteFill>
  );
};