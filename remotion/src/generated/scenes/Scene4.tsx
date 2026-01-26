import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const primaryColor = '#000000';
  const secondaryColor = '#FFFFFF';

  // Animation Timings
  const startDots = 10;
  const startLines = 40;
  const startText = 70;
  const startSquare = 110;

  // Spring animations for dots
  const dot1Scale = spring({
    frame: frame - startDots,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const dot2Scale = spring({
    frame: frame - (startDots + 10),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Coordinates
  const p1 = { x: width * 0.15, y: height * 0.2 };
  const p2 = { x: width * 0.85, y: height * 0.8 };
  const center = { x: width / 2, y: height / 2 };
  const p3 = { x: width * 0.7, y: height * 0.25 };
  const p4 = { x: width * 0.3, y: height * 0.75 };

  // Line drawing progress
  const lineProgress = interpolate(frame, [startLines, startLines + 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Text animation
  const textOpacity = interpolate(frame, [startText, startText + 30], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const textTranslateY = interpolate(frame, [startText, startText + 30], [20, 0], {
    extrapolateRight: 'clamp',
  });

  // Transaction Square Path
  // Path: P1 -> P4 -> Center -> P3 -> P2
  const squareProgress = interpolate(frame, [startSquare, startSquare + 120], [0, 4], {
    extrapolateRight: 'clamp',
  });

  const getSquarePos = (progress: number) => {
    if (progress <= 1) {
      return {
        x: interpolate(progress, [0, 1], [p1.x, p4.x]),
        y: interpolate(progress, [0, 1], [p1.y, p4.y]),
      };
    } else if (progress <= 2) {
      return {
        x: interpolate(progress, [1, 2], [p4.x, center.x]),
        y: interpolate(progress, [1, 2], [p4.y, center.y]),
      };
    } else if (progress <= 3) {
      return {
        x: interpolate(progress, [2, 3], [center.x, p3.x]),
        y: interpolate(progress, [2, 3], [center.y, p3.y]),
      };
    } else {
      return {
        x: interpolate(progress, [3, 4], [p3.x, p2.x]),
        y: interpolate(progress, [3, 4], [p3.y, p2.y]),
      };
    }
  };

  const squarePos = getSquarePos(squareProgress);
  const squareOpacity = interpolate(frame, [startSquare, startSquare + 10, startSquare + 110, startSquare + 120], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  // Background Grid
  const gridOpacity = interpolate(frame, [0, 30], [0, 0.15], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: primaryColor, overflow: 'hidden' }}>
      {/* Grid Background */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: gridOpacity,
        backgroundImage: `linear-gradient(${secondaryColor} 1px, transparent 1px), linear-gradient(90deg, ${secondaryColor} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {/* Connection Web */}
        <g stroke={secondaryColor} strokeWidth="2" fill="none" opacity={0.6}>
          <line 
            x1={p1.x} y1={p1.y} 
            x2={interpolate(lineProgress, [0, 0.4], [p1.x, p4.x], { extrapolateRight: 'clamp' })} 
            y2={interpolate(lineProgress, [0, 0.4], [p1.y, p4.y], { extrapolateRight: 'clamp' })} 
          />
          <line 
            x1={p4.x} y1={p4.y} 
            x2={interpolate(lineProgress, [0.2, 0.6], [p4.x, center.x], { extrapolateRight: 'clamp' })} 
            y2={interpolate(lineProgress, [0.2, 0.6], [p4.y, center.y], { extrapolateRight: 'clamp' })} 
          />
          <line 
            x1={center.x} y1={center.y} 
            x2={interpolate(lineProgress, [0.4, 0.8], [center.x, p3.x], { extrapolateRight: 'clamp' })} 
            y2={interpolate(lineProgress, [0.4, 0.8], [center.y, p3.y], { extrapolateRight: 'clamp' })} 
          />
          <line 
            x1={p3.x} y1={p3.y} 
            x2={interpolate(lineProgress, [0.6, 1], [p3.x, p2.x], { extrapolateRight: 'clamp' })} 
            y2={interpolate(lineProgress, [0.6, 1], [p3.y, p2.y], { extrapolateRight: 'clamp' })} 
          />
          
          {/* Decorative lines to form a web */}
          <line 
            x1={p1.x} y1={p1.y} 
            x2={interpolate(lineProgress, [0.3, 0.9], [p1.x, p3.x], { extrapolateRight: 'clamp' })} 
            y2={interpolate(lineProgress, [0.3, 0.9], [p1.y, p3.y], { extrapolateRight: 'clamp' })} 
          />
          <line 
            x1={p4.x} y1={p4.y} 
            x2={interpolate(lineProgress, [0.3, 0.9], [p4.x, p2.x], { extrapolateRight: 'clamp' })} 
            y2={interpolate(lineProgress, [0.3, 0.9], [p4.y, p2.y], { extrapolateRight: 'clamp' })} 
          />
        </g>

        {/* Student Dots */}
        <circle cx={p1.x} cy={p1.y} r="12" fill={secondaryColor} style={{ transform: `scale(${dot1Scale})`, transformOrigin: `${p1.x}px ${p1.y}px` }} />
        <circle cx={p2.x} cy={p2.y} r="12" fill={secondaryColor} style={{ transform: `scale(${dot2Scale})`, transformOrigin: `${p2.x}px ${p2.y}px` }} />

        {/* Transaction Square */}
        <rect
          x={squarePos.x - 10}
          y={squarePos.y - 10}
          width="20"
          height="20"
          fill={secondaryColor}
          style={{
            opacity: squareOpacity,
            transform: `rotate(${frame * 5}deg)`,
            transformOrigin: `${squarePos.x}px ${squarePos.y}px`,
          }}
        />
      </svg>

      {/* Text Overlay */}
      <div style={{
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        top: '45%',
        opacity: textOpacity,
        transform: `translateY(${textTranslateY}px)`,
        color: secondaryColor,
        fontFamily: 'sans-serif',
        fontSize: 80,
        fontWeight: 900,
        letterSpacing: '0.2em',
        pointerEvents: 'none',
        textShadow: `0 0 20px ${primaryColor}`,
      }}>
        ON-CAMPUS NETWORK
      </div>

      {/* Brand Watermark */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: 40,
        color: secondaryColor,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 4,
        opacity: 0.5,
      }}>
        CAMPOR
      </div>
    </AbsoluteFill>
  );
};