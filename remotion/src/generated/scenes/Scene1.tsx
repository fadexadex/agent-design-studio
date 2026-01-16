import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. Pixel to Line Animation (Frames 0 - 45)
  const pixelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const pixelWidth = interpolate(frame, [10, 45], [4, 120], { extrapolateRight: 'clamp' });
  const pixelHeight = interpolate(frame, [10, 45], [4, 2], { extrapolateRight: 'clamp' });
  const lineOpacity = interpolate(frame, [45, 60], [1, 0], { extrapolateRight: 'clamp' });

  // 2. Line to 'C' Morph (Frames 45 - 90)
  const cOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: 'clamp' });
  const cStrokeDash = 250;
  const cStrokeOffset = interpolate(frame, [45, 90], [cStrokeDash, 0], { extrapolateRight: 'clamp' });

  // 3. 'ampor' Fade and Kerning (Frames 80 - 200)
  const amporOpacity = interpolate(frame, [80, 120], [0, 1], { extrapolateRight: 'clamp' });
  const amporLetterSpacing = interpolate(frame, [80, 200], [1.2, 0.05], { extrapolateRight: 'clamp' });
  const amporTranslateX = interpolate(frame, [80, 120], [30, 0], { extrapolateRight: 'clamp' });

  // 4. Overall Scene Dynamics
  const sceneScale = interpolate(frame, [0, 226], [0.98, 1.05], { extrapolateRight: 'clamp' });
  const springConfig = { damping: 20, stiffness: 60 };
  const entranceSpring = spring({ frame, fps, config: springConfig });

  const primaryColor = "#000000";
  const secondaryColor = "#FFFFFF";

  return (
    <AbsoluteFill style={{ 
      backgroundColor: secondaryColor, 
      justifyContent: 'center', 
      alignItems: 'center',
      fontFamily: 'Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${sceneScale})`,
      }}>
        
        {/* The Initial Expanding Line */}
        <div style={{
          position: 'absolute',
          width: pixelWidth,
          height: pixelHeight,
          backgroundColor: primaryColor,
          opacity: lineOpacity * pixelOpacity,
          borderRadius: 2,
        }} />

        {/* The Logo Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}>
          
          {/* Animated 'C' SVG */}
          <div style={{ 
            opacity: cOpacity,
            width: 100,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <path
                d="M 75 25 A 35 35 0 1 0 75 75"
                fill="none"
                stroke={primaryColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={cStrokeDash}
                strokeDashoffset={cStrokeOffset}
              />
            </svg>
          </div>

          {/* 'ampor' Text */}
          <div style={{
            opacity: amporOpacity,
            color: primaryColor,
            fontSize: 82,
            fontWeight: 300,
            letterSpacing: `${amporLetterSpacing}em`,
            transform: `translateX(${amporTranslateX}px)`,
            marginLeft: 10,
            display: 'flex',
            alignItems: 'center',
            height: 100,
            paddingBottom: 8
          }}>
            ampor
          </div>
        </div>
      </div>

      {/* Subtle minimalist border frame for "airy" feel */}
      <div style={{
        position: 'absolute',
        top: 40,
        bottom: 40,
        left: 40,
        right: 40,
        border: `1px solid rgba(0,0,0,${interpolate(frame, [150, 200], [0, 0.05], { extrapolateRight: 'clamp' })})`,
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};