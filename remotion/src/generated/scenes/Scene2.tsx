import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. Grid Animation
  const gridRotation = interpolate(frame, [0, 100], [0, 45], {
    extrapolateRight: 'clamp',
  });
  
  const gridOpacity = interpolate(frame, [100, 130], [1, 0], {
    extrapolateRight: 'clamp',
  });

  // 2. Circle Expansion
  const circleScale = spring({
    frame: frame - 60,
    fps,
    config: {
      stiffness: 40,
      damping: 12,
    },
  });

  const circleExpansion = interpolate(circleScale, [0, 1], [0, 15], {
    extrapolateRight: 'clamp',
  });

  // 3. Text Draw-on Effect
  const drawProgress = interpolate(frame, [130, 240], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // SVG Path Data for "CAMPOR"
  const paths = {
    C: "M 100 150 A 40 40 0 1 0 100 230",
    A: "M 160 230 L 190 150 L 220 230 M 172 205 L 208 205",
    M: "M 250 230 L 250 150 L 290 190 L 330 150 L 330 230",
    P: "M 370 230 L 370 150 L 410 150 A 20 20 0 0 1 410 190 L 370 190",
    O: "M 480 190 A 40 40 0 1 1 480 189.9",
    R: "M 550 230 L 550 150 L 590 150 A 20 20 0 0 1 590 190 L 550 190 M 575 190 L 610 230"
  };

  const lineLength = 300; // Arbitrary long length for dash array

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {/* Rotating Grid */}
      <AbsoluteFill 
        style={{ 
          opacity: gridOpacity,
          transform: `rotate(${gridRotation}deg) scale(2)`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'center'
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: `${(i / 40) * 100}%`,
              width: '100%',
              height: '2px',
              backgroundColor: '#FFFFFF',
              opacity: 0.1,
            }}
          />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: `${(i / 40) * 100}%`,
              width: '2px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              opacity: 0.1,
            }}
          />
        ))}
      </AbsoluteFill>

      {/* Central Expanding Circle */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 200,
          height: 200,
          marginLeft: -100,
          marginTop: -100,
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          transform: `scale(${circleExpansion})`,
          opacity: interpolate(frame, [120, 150], [1, 0], { extrapolateRight: 'clamp' }),
        }}
      />

      {/* Logo Reveal */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <svg
          viewBox="0 0 700 400"
          style={{
            width: '80%',
            height: 'auto',
            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
          }}
        >
          {Object.entries(paths).map(([key, path], index) => {
            const individualStart = 130 + (index * 15);
            const individualProgress = interpolate(
              frame,
              [individualStart, individualStart + 40],
              [0, 1],
              { extrapolateRight: 'clamp' }
            );

            return (
              <path
                key={key}
                d={path}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={lineLength}
                strokeDashoffset={lineLength * (1 - individualProgress)}
              />
            );
          })}
        </svg>
      </AbsoluteFill>

      {/* Mechanical Accents */}
      <AbsoluteFill>
        {[0, 90, 180, 270].map((angle) => (
          <div
            key={angle}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 40,
              height: 2,
              backgroundColor: '#FFFFFF',
              transform: `rotate(${angle}deg) translate(${interpolate(frame, [0, 100], [0, 400], { extrapolateRight: 'clamp' })}px, 0)`,
              opacity: interpolate(frame, [0, 100], [0.8, 0], { extrapolateRight: 'clamp' }),
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};