import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandName = "Campor";
  const letters = brandName.split("");

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const wordmarkContainer: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: '200px',
    overflow: 'hidden',
  };

  return (
    <AbsoluteFill style={containerStyle}>
      <div style={wordmarkContainer}>
        {letters.map((letter, i) => {
          const delay = i * 3;
          
          const move = spring({
            frame: frame - delay,
            fps,
            config: {
              stiffness: 120,
              damping: 15,
              mass: 0.8,
            },
          });

          const translateY = interpolate(move, [0, 1], [120, 0]);
          const opacity = interpolate(move, [0, 0.5], [0, 1]);
          const maskHeight = interpolate(move, [0, 1], [0, 100]);

          return (
            <div
              key={i}
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '0 2px',
              }}
            >
              {/* Geometric reveal mask line */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#000000',
                  transform: `translateY(${-translateY}px)`,
                  opacity: interpolate(move, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
                }}
              />
              
              {/* Letter component */}
              <div
                style={{
                  fontSize: '110px',
                  fontWeight: 800,
                  color: '#000000',
                  letterSpacing: '-0.05em',
                  transform: `translateY(${translateY}%)`,
                  opacity: opacity,
                  lineHeight: 1,
                }}
              >
                {letter}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle geometric accent lines */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: interpolate(frame, [10, 35], [0, 100], { extrapolateRight: 'clamp' }),
          backgroundColor: '#000000',
          left: '15%',
          top: '40%',
          opacity: interpolate(frame, [10, 20, 35, 44], [0, 0.2, 0.2, 0]),
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: interpolate(frame, [15, 40], [0, 150], { extrapolateRight: 'clamp' }),
          backgroundColor: '#000000',
          right: '15%',
          bottom: '35%',
          opacity: interpolate(frame, [15, 25, 40, 44], [0, 0.1, 0.1, 0]),
        }}
      />
    </AbsoluteFill>
  );
};