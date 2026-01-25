import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation constants
  const primaryColor = '#000000';
  const secondaryColor = '#FFFFFF';

  // Entrance animations
  const lineExpand = spring({
    frame,
    fps,
    config: { stiffness: 60, damping: 20 },
  });

  const textOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const textSlide = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12 },
  });

  const subTextOpacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const containerScale = interpolate(frame, [0, 271], [0.95, 1.05], {
    extrapolateRight: 'clamp',
  });

  // Exit animation
  const exitOpacity = interpolate(frame, [250, 271], [1, 0], {
    extrapolateRight: 'clamp',
  });

  const lineWidth = interpolate(lineExpand, [0, 1], [0, 300]);
  const textOffset = interpolate(textSlide, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: secondaryColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Helvetica, Arial, sans-serif',
        opacity: exitOpacity,
      }}
    >
      <div
        style={{
          transform: `scale(${containerScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Minimalist Top Line */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: primaryColor,
            marginBottom: 40,
          }}
        />

        {/* Brand Name */}
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textOffset}px)`,
            color: primaryColor,
            fontSize: 110,
            fontWeight: 200,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Campor
        </div>

        {/* Thin Decorative Box */}
        <div
          style={{
            marginTop: 40,
            width: 400,
            height: 120,
            border: `1px solid ${primaryColor}`,
            opacity: subTextOpacity,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: primaryColor,
              letterSpacing: '0.5em',
              fontWeight: 300,
              textTransform: 'uppercase',
              paddingLeft: '0.5em', // Offset for letter spacing centering
            }}
          >
            Ecommerce
          </div>
          
          {/* Corner Accents */}
          <div style={{ position: 'absolute', top: -5, left: -5, width: 10, height: 10, borderLeft: `1px solid ${primaryColor}`, borderTop: `1px solid ${primaryColor}` }} />
          <div style={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, borderRight: `1px solid ${primaryColor}`, borderBottom: `1px solid ${primaryColor}` }} />
        </div>

        {/* Bottom Line */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: primaryColor,
            marginTop: 40,
          }}
        />
      </div>

      {/* Background Minimal Elements */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 100,
          width: 2,
          height: interpolate(frame, [20, 100], [0, 200], { extrapolateRight: 'clamp' }),
          backgroundColor: primaryColor,
          opacity: 0.1,
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          right: 100,
          width: interpolate(frame, [40, 120], [0, 200], { extrapolateRight: 'clamp' }),
          height: 2,
          backgroundColor: primaryColor,
          opacity: 0.1,
        }}
      />
    </AbsoluteFill>
  );
};