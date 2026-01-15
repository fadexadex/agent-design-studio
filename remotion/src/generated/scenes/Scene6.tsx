import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const secondaryFadeOut = interpolate(frame, [0, 20], [1, 0], {
    extrapolateRight: 'clamp',
  });

  const logoScaleSpring = spring({
    frame: frame - 15,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  const logoScale = interpolate(logoScaleSpring, [0, 1], [1.2, 1]);

  const lineProgress = spring({
    frame: frame - 60,
    fps,
    config: {
      stiffness: 40,
      damping: 15,
    },
  });

  const urlOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const urlTranslateY = interpolate(frame, [100, 130], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '120px',
    fontWeight: 800,
    color: '#000000',
    letterSpacing: '-0.05em',
    transform: `scale(${logoScale})`,
    marginBottom: '10px',
  };

  const underlineStyle: React.CSSProperties = {
    width: `${lineProgress * 300}px`,
    height: '4px',
    backgroundColor: '#000000',
    borderRadius: '2px',
  };

  const urlStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '80px',
    fontSize: '32px',
    fontWeight: 400,
    color: '#000000',
    letterSpacing: '0.2em',
    opacity: urlOpacity,
    transform: `translateY(${urlTranslateY}px)`,
  };

  const secondaryTextStyle: React.CSSProperties = {
    position: 'absolute',
    top: '40%',
    fontSize: '40px',
    color: '#000000',
    opacity: secondaryFadeOut,
    fontWeight: 300,
  };

  return (
    <AbsoluteFill style={containerStyle}>
      {/* Ghost of previous scene text fading out */}
      <div style={secondaryTextStyle}>Curated Excellence</div>

      {/* Main Logo Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={logoStyle}>Campor</div>
        <div style={underlineStyle} />
      </div>

      {/* Final CTA */}
      <div style={urlStyle}>campor.com</div>
    </AbsoluteFill>
  );
};