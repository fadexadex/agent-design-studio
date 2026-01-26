import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const primaryColor = '#000000';
  const secondaryColor = '#FFFFFF';

  // 1. Entry: Square enters from left
  const entrySpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const squareX = interpolate(entrySpring, [0, 1], [-width / 2, -150]);

  // 2. Split: Square splits into 4 triangles
  const splitStart = 45;
  const splitProgress = interpolate(frame, [splitStart, splitStart + 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 3. Rotation: Rapid rotation with sharp stops
  const rotateStart = 60;
  const rotation = interpolate(
    frame,
    [rotateStart, rotateStart + 15, rotateStart + 30, rotateStart + 45, rotateStart + 60],
    [0, 180, 360, 540, 720],
    { extrapolateRight: 'clamp' }
  );

  // 4. Morph: Triangles merge back into a UI element
  const morphStart = 130;
  const morphProgress = interpolate(frame, [morphStart, morphStart + 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 5. UI Elements: Plus sign and lines
  const uiElementsStart = 150;
  const plusScale = spring({
    frame: frame - uiElementsStart,
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  const line1Width = interpolate(frame, [uiElementsStart + 10, uiElementsStart + 25], [0, 120], {
    extrapolateRight: 'clamp',
  });
  const line2Width = interpolate(frame, [uiElementsStart + 15, uiElementsStart + 30], [0, 80], {
    extrapolateRight: 'clamp',
  });

  // 6. Text: 'SELL SEAMLESSLY'
  const textStart = 50;
  const textOpacity = interpolate(frame, [textStart, textStart + 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const textX = interpolate(frame, [textStart, textStart + 20], [100, 50], {
    extrapolateRight: 'clamp',
  });

  // Triangle Clip Paths
  const triangles = [
    { path: 'polygon(0% 0%, 100% 0%, 50% 50%)', offset: { x: -20, y: -20 } }, // Top
    { path: 'polygon(100% 0%, 100% 100%, 50% 50%)', offset: { x: 20, y: -20 } }, // Right
    { path: 'polygon(100% 100%, 0% 100%, 50% 50%)', offset: { x: 20, y: 20 } }, // Bottom
    { path: 'polygon(0% 100%, 0% 0%, 50% 50%)', offset: { x: -20, y: 20 } }, // Left
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: primaryColor, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      {/* Main Animation Container */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
        
        {/* Shape Container */}
        <div style={{ 
          width: 300, 
          height: 300, 
          position: 'relative',
          transform: `translateX(${squareX}px) rotate(${rotation}deg)`,
        }}>
          {triangles.map((t, i) => {
            const tx = splitProgress * t.offset.x * (1 - morphProgress);
            const ty = splitProgress * t.offset.y * (1 - morphProgress);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: secondaryColor,
                  clipPath: t.path,
                  transform: `translate(${tx}px, ${ty}px)`,
                }}
              />
            );
          })}

          {/* UI Icon Content (Plus and Lines) */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: morphProgress,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              {/* Plus Sign */}
              <div style={{ 
                width: 40, 
                height: 40, 
                position: 'relative', 
                transform: `scale(${plusScale})`,
                marginRight: 20
              }}>
                <div style={{ position: 'absolute', width: '100%', height: 6, backgroundColor: primaryColor, top: '50%', transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', width: 6, height: '100%', backgroundColor: primaryColor, left: '50%', transform: 'translateX(-50%)' }} />
              </div>
              {/* UI Line 1 */}
              <div style={{ height: 12, width: line1Width, backgroundColor: primaryColor, borderRadius: 6 }} />
            </div>
            {/* UI Line 2 */}
            <div style={{ height: 12, width: line2Width, backgroundColor: primaryColor, borderRadius: 6, marginLeft: 60 }} />
          </div>
        </div>

        {/* Text Container */}
        <div style={{
          opacity: textOpacity,
          transform: `translateX(${textX}px)`,
          color: secondaryColor,
          fontFamily: 'sans-serif',
          fontSize: 80,
          fontWeight: 900,
          letterSpacing: -2,
          lineHeight: 1,
          width: 400,
          marginLeft: 100,
          textAlign: 'left'
        }}>
          SELL<br />SEAMLESSLY
        </div>
      </div>

      {/* Decorative Grid Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(${secondaryColor}22 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        zIndex: -1,
        opacity: interpolate(frame, [0, 30], [0, 1])
      }} />
    </AbsoluteFill>
  );
};