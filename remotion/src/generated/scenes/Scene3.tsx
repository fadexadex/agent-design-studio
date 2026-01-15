import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, Easing } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Morphing: Circle (50%) to Square (0%)
  const borderRadius = interpolate(frame, [0, 45], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });

  // Breathing rhythm: Subtle scale oscillation
  const breathing = Math.sin(frame / 20) * 0.02;

  // Text: 'Seamless Experience' fade in
  const textOpacity = interpolate(frame, [70, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Transition: Expansion to fill screen with black
  const transitionStart = 190;
  const expansionScale = interpolate(frame, [transitionStart, 224], [1, 100], {
    extrapolateLeft: 'clamp',
    easing: Easing.in(Easing.expo),
  });

  // Square background fill during transition
  const fillOpacity = interpolate(frame, [transitionStart, transitionStart + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const finalScale = (1 + breathing) * expansionScale;

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Central Morphing Shape */}
      <div
        style={{
          width: 350,
          height: 350,
          border: '1.5px solid #000000',
          borderRadius: `${borderRadius}%`,
          transform: `scale(${finalScale})`,
          backgroundColor: `rgba(0, 0, 0, ${fillOpacity})`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
        }}
      />

      {/* Typography */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 40,
          fontWeight: 300,
          letterSpacing: '0.3em',
          color: '#000000',
          opacity: textOpacity,
          textTransform: 'uppercase',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        Seamless Experience
      </div>
    </AbsoluteFill>
  );
};