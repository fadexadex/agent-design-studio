import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Opacity fade in over the first 15 frames
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle scale spring for a premium feel
  const scale = spring({
    frame,
    fps,
    from: 0.96,
    to: 1,
    config: {
      damping: 20,
      stiffness: 60,
    },
  });

  // Minimalist letter spacing expansion
  const letterSpacing = interpolate(frame, [0, 30], [0.15, 0.25], {
    extrapolateRight: 'clamp',
  });

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#000000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const logoContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    opacity,
    transform: `scale(${scale})`,
  };

  const logoTextStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '90px',
    fontWeight: 200,
    letterSpacing: `${letterSpacing}em`,
    textTransform: 'uppercase',
    margin: 0,
    padding: 0,
  };

  const underlineStyle: React.CSSProperties = {
    width: '40px',
    height: '1px',
    backgroundColor: '#FFFFFF',
    marginTop: '20px',
    opacity: interpolate(frame, [10, 25], [0, 0.8], { extrapolateLeft: 'clamp' }),
  };

  return (
    <AbsoluteFill style={containerStyle}>
      <div style={logoContainerStyle}>
        <h1 style={logoTextStyle}>Campor</h1>
        <div style={underlineStyle} />
      </div>
    </AbsoluteFill>
  );
};