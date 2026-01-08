import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation values
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const contentSpring = spring({
    frame,
    fps,
    config: {
      stiffness: 40,
      damping: 20,
    },
  });

  // Subtle 1D motion for grid lines (slow vertical drift)
  const gridDrift = interpolate(frame, [0, 60], [0, 30]);

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  };

  const wordmarkStyle: React.CSSProperties = {
    color: '#000000',
    fontSize: '110px',
    fontWeight: 300,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    opacity,
    transform: `scale(${interpolate(contentSpring, [0, 1], [0.98, 1])})`,
    zIndex: 10,
    textAlign: 'center',
  };

  const gridLineStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#000000',
    opacity: 0.08,
  };

  return (
    <AbsoluteFill style={containerStyle}>
      {/* Vertical Grid Lines with subtle movement */}
      <div
        style={{
          ...gridLineStyle,
          width: '1px',
          height: '100%',
          left: '15%',
          transform: `translateY(${gridDrift}px)`,
        }}
      />
      <div
        style={{
          ...gridLineStyle,
          width: '1px',
          height: '100%',
          right: '15%',
          transform: `translateY(${-gridDrift}px)`,
        }}
      />

      {/* Horizontal Grid Lines with subtle movement */}
      <div
        style={{
          ...gridLineStyle,
          width: '100%',
          height: '1px',
          top: '20%',
          opacity: 0.05,
          transform: `translateX(${gridDrift * 0.5}px)`,
        }}
      />
      <div
        style={{
          ...gridLineStyle,
          width: '100%',
          height: '1px',
          bottom: '20%',
          opacity: 0.05,
          transform: `translateX(${-gridDrift * 0.5}px)`,
        }}
      />

      {/* Centered Wordmark */}
      <div style={wordmarkStyle}>
        CAMPOR
      </div>

      {/* Decorative thin frame elements */}
      <div
        style={{
          position: 'absolute',
          width: '40px',
          height: '1px',
          backgroundColor: '#000000',
          top: '50%',
          left: '10%',
          opacity: interpolate(frame, [10, 30], [0, 0.4], { extrapolateRight: 'clamp' }),
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '40px',
          height: '1px',
          backgroundColor: '#000000',
          top: '50%',
          right: '10%',
          opacity: interpolate(frame, [10, 30], [0, 0.4], { extrapolateRight: 'clamp' }),
        }}
      />
    </AbsoluteFill>
  );
};