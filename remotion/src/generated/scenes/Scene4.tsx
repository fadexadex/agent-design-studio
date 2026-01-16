import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. Wipe to Black (0-25)
  const wipeX = interpolate(frame, [0, 20], [-width, 0], { extrapolateRight: 'clamp' });

  // 2. Text Animation (40-270)
  const textOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [40, 60], [20, 0], { extrapolateRight: 'clamp' });

  // 3. Cube Animation States
  // Drawing the cube (30-70)
  const drawProgress = spring({
    frame: frame - 30,
    fps,
    config: { stiffness: 60 },
  });

  // Rotation of the whole container (70-270)
  const containerRotateX = interpolate(frame, [70, 270], [20, -20]);
  const containerRotateY = interpolate(frame, [70, 270], [-35, 45]);

  // Unfolding/Folding Logic (100-170 unfold, 190-250 refold)
  const unfoldSpring = spring({
    frame: frame - 100,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const refoldSpring = spring({
    frame: frame - 190,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Combined progress: 0 is cube, 1 is flat
  const foldProgress = interpolate(
    unfoldSpring - refoldSpring,
    [0, 1],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const cubeSize = 160;
  const halfSize = cubeSize / 2;

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    width: cubeSize,
    height: cubeSize,
    border: '2px solid #FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'visible',
    opacity: drawProgress,
  };

  // Helper to calculate face transforms
  const getFaceTransform = (face: string) => {
    const p = foldProgress;
    switch (face) {
      case 'front':
        // Stays center, moves from Z-offset to flat
        return `translateZ(${(1 - p) * halfSize}px)`;
      case 'back':
        // Attached to right face in flat layout
        return `
          translateX(${interpolate(p, [0, 1], [0, cubeSize * 2])}px)
          translateZ(${interpolate(p, [0, 1], [-halfSize, 0])}px)
          rotateY(${interpolate(p, [0, 1], [180, 0])}deg)
        `;
      case 'left':
        return `
          translateX(${interpolate(p, [0, 1], [-halfSize, -cubeSize])}px)
          translateZ(${interpolate(p, [0, 1], [0, 0])}px)
          rotateY(${interpolate(p, [0, 1], [-90, 0])}deg)
        `;
      case 'right':
        return `
          translateX(${interpolate(p, [0, 1], [halfSize, cubeSize])}px)
          translateZ(${interpolate(p, [0, 1], [0, 0])}px)
          rotateY(${interpolate(p, [0, 1], [90, 0])}deg)
        `;
      case 'top':
        return `
          translateY(${interpolate(p, [0, 1], [-halfSize, -cubeSize])}px)
          translateZ(${interpolate(p, [0, 1], [0, 0])}px)
          rotateX(${interpolate(p, [0, 1], [90, 0])}deg)
        `;
      case 'bottom':
        return `
          translateY(${interpolate(p, [0, 1], [halfSize, cubeSize])}px)
          translateZ(${interpolate(p, [0, 1], [0, 0])}px)
          rotateX(${interpolate(p, [0, 1], [-90, 0])}deg)
        `;
      default:
        return '';
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF' }}>
      {/* Wipe Layer */}
      <AbsoluteFill
        style={{
          backgroundColor: '#000000',
          transform: `translateX(${wipeX}px)`,
          zIndex: 1,
        }}
      />

      {/* Content Layer */}
      <AbsoluteFill style={{ zIndex: 2 }}>
        {/* Header Text */}
        <div
          style={{
            position: 'absolute',
            top: 100,
            width: '100%',
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 32,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 300,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          Delivered with Precision
        </div>

        {/* 3D Scene Container */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            perspective: '1200px',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: cubeSize,
              height: cubeSize,
              transformStyle: 'preserve-3d',
              transform: `rotateX(${containerRotateX}deg) rotateY(${containerRotateY}deg)`,
            }}
          >
            <div style={{ ...faceStyle, transform: getFaceTransform('front') }} />
            <div style={{ ...faceStyle, transform: getFaceTransform('back') }} />
            <div style={{ ...faceStyle, transform: getFaceTransform('left') }} />
            <div style={{ ...faceStyle, transform: getFaceTransform('right') }} />
            <div style={{ ...faceStyle, transform: getFaceTransform('top') }} />
            <div style={{ ...faceStyle, transform: getFaceTransform('bottom') }} />
          </div>
        </div>

        {/* Brand Name (Bottom) */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            width: '100%',
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 24,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            letterSpacing: '0.5em',
            opacity: interpolate(frame, [230, 250], [0, 0.6], { extrapolateLeft: 'clamp' }),
          }}
        >
          CAMPOR
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};