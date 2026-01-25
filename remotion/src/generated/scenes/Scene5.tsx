import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Animation constants
  const primaryColor = "#000000";
  const secondaryColor = "#FFFFFF";

  // Entrance animations
  const opacity = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: 'clamp' });
  const exitOpacity = interpolate(frame, [250, 270], [1, 0], { extrapolateLeft: 'clamp' });
  
  const textReveal = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const lineProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 20, stiffness: 40 },
  });

  // Subtle continuous motion
  const letterSpacing = interpolate(frame, [0, 271], [12, 24], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 271], [0.95, 1.05], { extrapolateRight: 'clamp' });

  // Vertical slide for the text
  const translateY = interpolate(textReveal, [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{ 
      backgroundColor: secondaryColor, 
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: opacity * exitOpacity,
        transform: `scale(${scale})`,
      }}>
        {/* Brand Name */}
        <div style={{
          color: primaryColor,
          fontSize: 80,
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: `${letterSpacing}px`,
          transform: `translateY(${translateY}px)`,
          fontFamily: 'Helvetica, Arial, sans-serif',
          marginBottom: 20,
          marginLeft: letterSpacing, // Offset to keep text centered due to letter spacing
        }}>
          Campor
        </div>

        {/* Minimalist Line Decor */}
        <div style={{
          height: '1px',
          backgroundColor: primaryColor,
          width: lineProgress * 300,
          opacity: 0.6,
        }} />

        {/* Subtle Tagline Placeholder (Minimalist style) */}
        <div style={{
          marginTop: 20,
          color: primaryColor,
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          opacity: interpolate(frame, [60, 90], [0, 0.5], { extrapolateRight: 'clamp' }),
        }}>
          Ecommerce Redefined
        </div>
      </div>

      {/* Thin border frame for minimalist aesthetic */}
      <div style={{
        position: 'absolute',
        top: 40,
        left: 40,
        right: 40,
        bottom: 40,
        border: `1px solid ${primaryColor}`,
        opacity: interpolate(frame, [0, 60], [0, 0.1], { extrapolateRight: 'clamp' }) * exitOpacity,
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};