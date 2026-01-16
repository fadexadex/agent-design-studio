import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. Cube to 'O' Transformation
  const cubeScale = interpolate(frame, [0, 60], [2.5, 1], {
    extrapolateRight: 'clamp',
  });
  
  const cubeBorderRadius = interpolate(frame, [20, 50], [0, 100], {
    extrapolateRight: 'clamp',
  });

  const cubeRotate = interpolate(frame, [0, 60], [45, 0], {
    extrapolateRight: 'clamp',
  });

  // 2. Logo Assembly (CAMPOR)
  // The 'O' is the 5th letter: C-A-M-P-O-R
  const logoSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const letterOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const letterSpacing = interpolate(frame, [40, 90], [80, 20], {
    extrapolateRight: 'clamp',
  });

  // 3. CTA Button Appearance
  const ctaOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const ctaSlide = spring({
    frame: frame - 100,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const ctaTranslateY = interpolate(ctaSlide, [0, 1], [30, 0]);

  // 4. Final Fade to White
  const finalFade = interpolate(frame, [240, 265], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Helvetica, Arial, sans-serif',
  };

  const logoContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: 110,
    fontWeight: 300,
    letterSpacing: `${letterSpacing}px`,
    textTransform: 'uppercase',
  };

  const letterStyle: React.CSSProperties = {
    opacity: letterOpacity,
  };

  const cubeOStyle: React.CSSProperties = {
    width: 85,
    height: 85,
    border: '6px solid #FFFFFF',
    borderRadius: `${cubeBorderRadius}%`,
    transform: `scale(${cubeScale}) rotate(${cubeRotate}deg)`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 10px',
    boxSizing: 'border-box',
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: 80,
    padding: '15px 50px',
    border: '1px solid #FFFFFF',
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: 6,
    opacity: ctaOpacity,
    transform: `translateY(${ctaTranslateY}px)`,
    fontWeight: 300,
  };

  const whiteOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    opacity: finalFade,
  };

  return (
    <AbsoluteFill style={containerStyle}>
      <div style={logoContainerStyle}>
        <span style={letterStyle}>C</span>
        <span style={letterStyle}>A</span>
        <span style={letterStyle}>M</span>
        <span style={letterStyle}>P</span>
        <div style={cubeOStyle} />
        <span style={letterStyle}>R</span>
      </div>

      <div style={buttonStyle}>
        SHOP NOW
      </div>

      <div style={whiteOverlayStyle} />
    </AbsoluteFill>
  );
};