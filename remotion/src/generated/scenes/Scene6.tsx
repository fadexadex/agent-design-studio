import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation values for the logo
  const logoOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const logoSpring = spring({
    frame,
    fps,
    config: {
      damping: 20,
      stiffness: 60,
    },
  });

  // Scale is slightly larger (1.2) for the final branding
  const logoScale = interpolate(logoSpring, [0, 1], [0.95, 1.2]);

  // Circular path animation for the dot
  const radius = 24;
  const angle = interpolate(frame, [0, 225], [0, Math.PI * 6]); // 3 full rotations
  const dotX = Math.cos(angle) * radius;
  const dotY = Math.sin(angle) * radius;

  const dotOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Logo Text */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            color: '#000000',
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Campor
        </div>

        {/* Circular Loading/Focus Element */}
        <div
          style={{
            height: 100,
            width: 100,
            marginTop: 20,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: dotOpacity,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              backgroundColor: '#000000',
              borderRadius: '50%',
              position: 'absolute',
              transform: `translate(${dotX}px, ${dotY}px)`,
            }}
          />
        </div>
      </div>

      {/* Subtle border frame for premium finish */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          right: 40,
          bottom: 40,
          border: '1px solid rgba(0,0,0,0.05)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};