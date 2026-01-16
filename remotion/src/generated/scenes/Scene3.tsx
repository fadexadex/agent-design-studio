import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation for the scanning line
  const lineX = interpolate(frame, [30, 190], [-2, width + 2], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const lineOpacity = interpolate(frame, [20, 35, 185, 200], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  // Animation for the text
  const textOpacity = interpolate(frame, [70, 100, 140, 175], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  const textBlur = interpolate(frame, [70, 100, 140, 175], [10, 0, 0, 10], {
    extrapolateRight: 'clamp',
  });

  const textLetterSpacing = interpolate(frame, [70, 175], [2, 12], {
    extrapolateRight: 'clamp',
  });

  // Dissolving squares from previous scene
  const squareRows = 5;
  const squareCols = 8;
  const squareSize = 150;

  const renderSquares = () => {
    return Array.from({ length: squareRows * squareCols }).map((_, i) => {
      const row = Math.floor(i / squareCols);
      const col = i % squareCols;
      const xPos = (width / squareCols) * col + (width / squareCols / 2) - squareSize / 2;
      const yPos = (height / squareRows) * row + (height / squareRows / 2) - squareSize / 2;
      
      // Squares dissolve as the line approaches or simply fade out early
      const dissolveStart = col * 5;
      const squareOpacity = interpolate(frame, [dissolveStart, dissolveStart + 25], [0.05, 0], {
        extrapolateRight: 'clamp',
      });

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: xPos,
            top: yPos,
            width: squareSize,
            height: squareSize,
            backgroundColor: '#000000',
            opacity: squareOpacity,
            transform: `scale(${interpolate(frame, [0, 40], [1, 0.8])})`,
          }}
        />
      );
    });
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      {/* Remnants of previous scene squares */}
      {renderSquares()}

      {/* The Scanning Line */}
      <div
        style={{
          position: 'absolute',
          left: lineX,
          top: 0,
          width: '2px',
          height: '100%',
          backgroundColor: '#000000',
          opacity: lineOpacity,
          boxShadow: '0 0 15px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}
      />

      {/* Ephemeral Typography */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          opacity: textOpacity,
          filter: `blur(${textBlur}px)`,
          color: '#000000',
          fontSize: '48px',
          fontWeight: 300,
          letterSpacing: `${textLetterSpacing}px`,
          textTransform: 'uppercase',
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
      >
        Quality over quantity
      </div>

      {/* Subtle brand watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [150, 180], [0, 0.3], { extrapolateRight: 'clamp' }),
          color: '#000000',
          fontSize: '18px',
          letterSpacing: '4px',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        Campor
      </div>
    </AbsoluteFill>
  );
};