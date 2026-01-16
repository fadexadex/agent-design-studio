import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Button Appearance
  const buttonAppearScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const buttonOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Path Animation (The thin line drawing into the button)
  const lineProgress = interpolate(frame, [40, 90], [0, 1], { extrapolateRight: 'clamp' });
  const lineOpacity = interpolate(frame, [40, 50, 90, 100], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  // Text Animation
  const textOpacity = interpolate(frame, [100, 115], [1, 0], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [100, 115], [0, -10], { extrapolateRight: 'clamp' });

  // Button Interaction (Slight shrink when line "clicks")
  const clickScale = spring({
    frame: frame - 90,
    fps,
    config: { damping: 10, stiffness: 200 },
  });
  const activeScale = frame > 90 && frame < 120 ? interpolate(clickScale, [0, 1], [1, 0.95]) : 1;

  // Checkmark Animation
  const checkProgress = interpolate(frame, [115, 145], [1, 0], { extrapolateRight: 'clamp' });
  const checkOpacity = interpolate(frame, [115, 120], [0, 1], { extrapolateRight: 'clamp' });

  // Final Button Shape Morph (Optional subtle rounding)
  const borderRadius = interpolate(frame, [110, 130], [8, 50], { extrapolateRight: 'clamp' });
  const buttonWidth = interpolate(frame, [110, 130], [280, 80], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      {/* The Animated Path Line */}
      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: lineOpacity,
          zIndex: 1,
        }}
      >
        <path
          d={`M ${width * 0.2} ${height * 0.6} Q ${width * 0.4} ${height * 0.4}, ${width * 0.5} ${height * 0.5}`}
          fill="none"
          stroke="#000000"
          strokeWidth="2"
          strokeDasharray="400"
          strokeDashoffset={400 * (1 - lineProgress)}
        />
      </svg>

      {/* The Button */}
      <div
        style={{
          width: buttonWidth,
          height: 80,
          backgroundColor: '#000000',
          borderRadius: borderRadius,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: buttonOpacity,
          transform: `scale(${buttonAppearScale * activeScale})`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Checkout Text */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 32,
            fontWeight: 600,
            fontFamily: 'Helvetica, Arial, sans-serif',
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            position: 'absolute',
          }}
        >
          Checkout
        </div>

        {/* Checkmark Icon */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 100 100"
          style={{
            opacity: checkOpacity,
            position: 'absolute',
          }}
        >
          <path
            d="M 20 50 L 45 75 L 80 30"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="100"
            strokeDashoffset={100 * checkProgress}
          />
        </svg>
      </div>

      {/* Brand Tagline (Minimalist Footer) */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 24,
          letterSpacing: 4,
          color: '#000000',
          opacity: interpolate(frame, [150, 180], [0, 0.5], { extrapolateRight: 'clamp' }),
          textTransform: 'uppercase',
        }}
      >
        Campor
      </div>
    </AbsoluteFill>
  );
};