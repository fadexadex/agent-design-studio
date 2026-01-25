import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation constants
  const primaryColor = "#000000";
  const secondaryColor = "#FFFFFF";

  // Entrance animations
  const contentFade = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const contentMove = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60 },
  });
  const contentY = interpolate(contentMove, [0, 1], [40, 0]);

  // Line animation
  const lineProgress = spring({
    frame: frame - 45,
    fps,
    config: { damping: 15, stiffness: 40 },
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 400]);

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [80, 110], [0, 1], { extrapolateRight: 'clamp' });
  const subtitleLetterSpacing = interpolate(frame, [80, 150], [0.5, 1.2], { extrapolateRight: 'clamp' });

  // Exit animation
  const exitOpacity = interpolate(frame, [250, 270], [1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ 
      backgroundColor: primaryColor, 
      justifyContent: 'center', 
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ 
        opacity: exitOpacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}>
        {/* Main Brand Name */}
        <div style={{
          opacity: contentFade,
          transform: `translateY(${contentY}px)`,
          color: secondaryColor,
          fontSize: 110,
          fontWeight: 200,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 20
        }}>
          Campor
        </div>

        {/* Minimalist Divider Line */}
        <div style={{
          width: lineWidth,
          height: '1px',
          backgroundColor: secondaryColor,
          opacity: 0.4,
        }} />

        {/* Scene Description / Tagline */}
        <div style={{
          opacity: subtitleOpacity,
          color: secondaryColor,
          fontSize: 28,
          fontWeight: 300,
          marginTop: 30,
          letterSpacing: `${subtitleLetterSpacing}em`,
          textTransform: 'lowercase',
          fontStyle: 'italic'
        }}>
          the campor
        </div>

        {/* Decorative Minimalist Elements */}
        <div style={{
          position: 'absolute',
          top: 100,
          left: 100,
          width: 40,
          height: 1,
          backgroundColor: secondaryColor,
          opacity: interpolate(frame, [20, 50], [0, 0.2], { extrapolateRight: 'clamp' })
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: 100,
          right: 100,
          width: 1,
          height: 40,
          backgroundColor: secondaryColor,
          opacity: interpolate(frame, [20, 50], [0, 0.2], { extrapolateRight: 'clamp' })
        }} />
      </div>

      {/* Subtle background scale effect */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: `${interpolate(frame, [0, 271], [40, 20])}px solid ${secondaryColor}`,
        opacity: 0.03,
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};