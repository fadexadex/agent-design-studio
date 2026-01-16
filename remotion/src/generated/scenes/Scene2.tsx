import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing constants
  const startFadeIn = 0;
  const endFadeIn = 45;
  const startFocus = 60;
  const endFocus = 90;
  const startExit = 200;
  const endExit = 225;

  // Global opacity for the whole scene
  const sceneOpacity = interpolate(
    frame,
    [startFadeIn, endFadeIn, startExit, endExit],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  // Focus animation progress
  const focusSpring = spring({
    frame: frame - startFocus,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  // Typography animation
  const textOpacity = interpolate(
    frame,
    [startFadeIn + 15, endFadeIn + 15],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
  const textTranslateY = interpolate(
    frame,
    [startFadeIn + 15, endFadeIn + 15],
    [20, 0],
    { extrapolateRight: 'clamp' }
  );

  // Grid item properties
  const focusedIndex = 1; // Top right square
  const unfocusedOpacity = interpolate(focusSpring, [0, 1], [1, 0.2]);
  const focusedScale = interpolate(focusSpring, [0, 1], [1, 1.15]);

  const renderSquare = (index: number) => {
    const isFocused = index === focusedIndex;
    const itemOpacity = isFocused ? 1 : unfocusedOpacity;
    const itemScale = isFocused ? focusedScale : 1;

    return (
      <div
        key={index}
        style={{
          width: 160,
          height: 160,
          border: '1px solid #000000',
          opacity: itemOpacity,
          transform: `scale(${itemScale})`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
          transition: 'opacity 0.3s ease-out',
        }}
      />
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFFFF',
        opacity: sceneOpacity,
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      {/* Centered Grid */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 160px)',
          gridTemplateRows: 'repeat(2, 160px)',
          gap: '40px',
        }}
      >
        {[0, 1, 2, 3].map((i) => renderSquare(i))}
      </div>

      {/* Bottom Left Typography */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#000000',
            fontWeight: 300,
          }}
        >
          Curated Choice
        </div>
        <div
          style={{
            width: 40,
            height: 1,
            backgroundColor: '#000000',
            marginTop: 12,
          }}
        />
      </div>

      {/* Brand Watermark (Optional but fits minimalist style) */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 80,
          fontSize: 14,
          letterSpacing: '0.1em',
          color: '#000000',
          opacity: 0.5,
        }}
      >
        CAMPOR
      </div>
    </AbsoluteFill>
  );
};