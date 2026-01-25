import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entranceSpring = spring({
    frame,
    fps,
    config: {
      damping: 20,
      stiffness: 90,
    },
  });

  const mainOpacity = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(entranceSpring, [0, 1], [40, 0]);

  const lineWidth = interpolate(frame, [60, 110], [0, 300], {
    extrapolateRight: 'clamp',
  });

  const subTextOpacity = interpolate(frame, [90, 130], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const subTextSlide = interpolate(frame, [90, 130], [10, 0], {
    extrapolateRight: 'clamp',
  });

  const finalExit = interpolate(frame, [250, 270], [1, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: finalExit,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            opacity: mainOpacity,
            transform: `translateY(${translateY}px)`,
            color: '#000000',
            fontSize: 110,
            fontWeight: 200,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Campor
        </div>

        <div
          style={{
            width: lineWidth,
            height: '1px',
            backgroundColor: '#000000',
            marginTop: 15,
            marginBottom: 30,
          }}
        />

        <div
          style={{
            opacity: subTextOpacity,
            transform: `translateY(${subTextSlide}px)`,
            color: '#000000',
            fontSize: 22,
            fontWeight: 300,
            letterSpacing: '0.8em',
            textTransform: 'uppercase',
            marginLeft: '0.8em',
          }}
        >
          Entrance Of
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 80,
          width: 40,
          height: 1,
          backgroundColor: '#000000',
          opacity: interpolate(frame, [120, 150], [0, 0.5], { extrapolateRight: 'clamp' }),
        }}
      />
    </AbsoluteFill>
  );
};