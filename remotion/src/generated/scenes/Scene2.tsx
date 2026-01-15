import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation Constants
  const gridOpacity = interpolate(frame, [0, 40], [0, 0.1], {
    extrapolateRight: 'clamp',
  });

  const textOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const textTranslateY = interpolate(frame, [60, 90], [20, 0], {
    extrapolateRight: 'clamp',
  });

  // Grid Intersection Coordinates
  const x1 = width * 0.333;
  const x2 = width * 0.666;
  const y1 = height * 0.333;
  const y2 = height * 0.666;

  // Circle Movement Logic
  // Entry: Frame 10-50
  // Glide 1: Frame 80-140
  // Glide 2: Frame 160-220
  
  const circleEntry = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  const circleGlide1 = spring({
    frame: frame - 80,
    fps,
    config: { damping: 20, stiffness: 30 },
  });

  const circleGlide2 = spring({
    frame: frame - 160,
    fps,
    config: { damping: 20, stiffness: 30 },
  });

  const circleX = interpolate(
    circleGlide1,
    [0, 1],
    [interpolate(circleEntry, [0, 1], [-50, x1]), x2]
  );

  const circleY = interpolate(
    circleGlide2,
    [0, 1],
    [y1, y2]
  );

  const circleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#000000',
    opacity: gridOpacity,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF' }}>
      {/* Grid System */}
      <div style={{ ...gridStyle, width: 1, height: '100%', left: '33.33%' }} />
      <div style={{ ...gridStyle, width: 1, height: '100%', left: '66.66%' }} />
      <div style={{ ...gridStyle, width: '100%', height: 1, top: '33.33%' }} />
      <div style={{ ...gridStyle, width: '100%', height: 1, top: '66.66%' }} />

      {/* Abstract Product Dot */}
      <div
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          backgroundColor: '#000000',
          borderRadius: '50%',
          left: circleX - 12,
          top: circleY - 12,
          opacity: circleOpacity,
        }}
      />

      {/* Typography */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 22,
            fontWeight: 300,
            letterSpacing: '0.25em',
            color: '#000000',
            textTransform: 'uppercase',
          }}
        >
          Curated Selection
        </span>
      </div>
    </AbsoluteFill>
  );
};