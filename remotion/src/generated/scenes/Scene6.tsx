import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo Entrance (0-40)
  const logoOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const logoTranslateY = interpolate(frame, [0, 40], [20, 0], { extrapolateRight: 'clamp' });
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Tagline Sequential Appearance (40-120)
  const word1Opacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: 'clamp' });
  const word2Opacity = interpolate(frame, [70, 85], [0, 1], { extrapolateRight: 'clamp' });
  const word3Opacity = interpolate(frame, [95, 110], [0, 1], { extrapolateRight: 'clamp' });

  // Final Scale and Fade (180-225)
  const finalScale = interpolate(frame, [185, 225], [1, 15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const finalFadeOut = interpolate(frame, [185, 210], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const whiteOverlay = interpolate(frame, [215, 225], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${finalScale})`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `translateY(${logoTranslateY}px)`,
            color: '#000000',
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            fontFamily: 'Helvetica, Arial, sans-serif',
            marginBottom: 20,
          }}
        >
          Campor
        </div>

        {/* Tagline Container */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            opacity: finalFadeOut,
          }}
        >
          <span
            style={{
              opacity: word1Opacity,
              color: '#000000',
              fontSize: 24,
              fontWeight: 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Simple.
          </span>
          <span
            style={{
              opacity: word2Opacity,
              color: '#000000',
              fontSize: 24,
              fontWeight: 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Essential.
          </span>
          <span
            style={{
              opacity: word3Opacity,
              color: '#000000',
              fontSize: 24,
              fontWeight: 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Yours.
          </span>
        </div>
      </div>

      {/* Final White Fade Overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: '#FFFFFF',
          opacity: whiteOverlay,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};