import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Entrance animations (0-40)
  const entranceOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const entranceScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  // Pulsing effect (constant)
  const pulse = Math.sin(frame / 15) * 0.03;

  // Text appearance (30-60)
  const textOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Expansion transition (185-225)
  const expansionStartFrame = 185;
  const expansionProgress = spring({
    frame: frame - expansionStartFrame,
    fps,
    config: {
      stiffness: 40,
      damping: 20,
    },
  });

  const expansionScale = interpolate(expansionProgress, [0, 1], [1, 60], {
    extrapolateLeft: 'clamp',
  });

  const expansionFillOpacity = interpolate(frame, [expansionStartFrame, expansionStartFrame + 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const contentFadeOut = interpolate(frame, [expansionStartFrame, expansionStartFrame + 10], [1, 0], {
    extrapolateRight: 'clamp',
  });

  const circleSize = 400;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      {/* Main Animated Circle */}
      <div
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: '50%',
          border: '2px solid #FFFFFF',
          backgroundColor: `rgba(255, 255, 255, ${expansionFillOpacity})`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${frame < expansionStartFrame ? entranceScale + pulse : expansionScale})`,
          opacity: entranceOpacity,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Text Content */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 32,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 300,
            letterSpacing: '0.1em',
            textAlign: 'center',
            opacity: frame < expansionStartFrame ? textOpacity : contentFadeOut,
            width: '80%',
          }}
        >
          Find what matters
        </div>
      </div>

      {/* Brand Tagline (Subtle) */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          color: '#FFFFFF',
          fontSize: 18,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 200,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          opacity: interpolate(frame, [60, 90, 180, 190], [0, 0.5, 0.5, 0], { extrapolateRight: 'clamp' }),
        }}
      >
        Campor Discovery
      </div>
    </AbsoluteFill>
  );
};