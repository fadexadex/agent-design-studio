import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation constants
  const primaryColor = '#000000';
  const secondaryColor = '#FFFFFF';

  // Entrance animations
  const contentOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const contentFadeOut = interpolate(frame, [240, 270], [1, 0], { extrapolateRight: 'clamp' });
  
  const lineScale = spring({
    frame: frame - 10,
    fps,
    config: { stiffness: 60, damping: 20 },
  });

  const textReveal = spring({
    frame: frame - 25,
    fps,
    config: { stiffness: 100, damping: 15 },
  });

  const letterSpacing = interpolate(frame, [20, 200], [2, 12], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(textReveal, [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: primaryColor, justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          opacity: contentOpacity * contentFadeOut,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Top Thin Line */}
        <div
          style={{
            width: interpolate(lineScale, [0, 1], [0, 120]),
            height: '1px',
            backgroundColor: secondaryColor,
            marginBottom: '40px',
            opacity: 0.6,
          }}
        />

        {/* Brand Name */}
        <div
          style={{
            transform: `translateY(${translateY}px)`,
            opacity: textReveal,
            color: secondaryColor,
            fontSize: 84,
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: `${letterSpacing}px`,
            fontFamily: 'Helvetica, Arial, sans-serif',
            textAlign: 'center',
          }}
        >
          Campor
        </div>

        {/* Bottom Thin Line */}
        <div
          style={{
            width: interpolate(lineScale, [0, 1], [0, 240]),
            height: '1px',
            backgroundColor: secondaryColor,
            marginTop: '40px',
            opacity: 0.4,
          }}
        />
      </div>

      {/* Decorative Corner Lines */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          width: 40,
          height: 1,
          backgroundColor: secondaryColor,
          opacity: contentOpacity * 0.3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          width: 1,
          height: 40,
          backgroundColor: secondaryColor,
          opacity: contentOpacity * 0.3,
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 60,
          width: 40,
          height: 1,
          backgroundColor: secondaryColor,
          opacity: contentOpacity * 0.3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 60,
          width: 1,
          height: 40,
          backgroundColor: secondaryColor,
          opacity: contentOpacity * 0.3,
        }}
      />
    </AbsoluteFill>
  );
};