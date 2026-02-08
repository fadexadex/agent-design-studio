import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';
import { MotionContainer } from '@/components/Layout';
import { CameraRig } from '@/components/Camera';

export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Spring configuration for medium energy
  const springConfig = { damping: 120, stiffness: 100 };

  // Global animations
  const sceneEntrance = spring({
    frame,
    fps,
    config: springConfig,
  });

  const cameraZoom = interpolate(frame, [0, 271], [1, 1.15], {
    extrapolateRight: 'clamp',
  });

  // Abstract Shape Animations
  const rotationMain = interpolate(frame, [0, 271], [0, 45], {
    extrapolateRight: 'clamp',
  });

  const rotationSub = interpolate(frame, [0, 271], [0, -90], {
    extrapolateRight: 'clamp',
  });

  const shapePulse = interpolate(
    Math.sin((frame / 271) * Math.PI * 2),
    [-1, 1],
    [0.95, 1.05]
  );

  // Particle data
  const particles = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const distance = 300 + (i % 3) * 50;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    return { x, y, size: 4 + (i % 4) };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {/* Background Layer */}
      <Background 
        type="gradient-mesh" 
        variant="dark" 
        meshColors={{ primary: '#000000', secondary: '#1a1a1a' }} 
        animationSpeed={0.3} 
      />

      <CameraRig zoom={cameraZoom}>
        {/* Abstract Geometric Elements */}
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              width: 600,
              height: 600,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: interpolate(frame, [0, 40], [0, 0.6], { extrapolateRight: 'clamp' }),
            }}
          >
            {/* Outer Ring */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20%',
                transform: `rotate(${rotationMain}deg) scale(${shapePulse})`,
              }}
            />

            {/* Middle Diamond */}
            <div
              style={{
                position: 'absolute',
                width: '70%',
                height: '70%',
                border: '2px solid #FFFFFF',
                transform: `rotate(${rotationSub}deg) scale(${sceneEntrance})`,
                opacity: 0.4,
              }}
            />

            {/* Inner Core */}
            <div
              style={{
                position: 'absolute',
                width: '10%',
                height: '10%',
                backgroundColor: '#FFFFFF',
                transform: `rotate(${rotationMain * 2}deg)`,
                boxShadow: '0 0 40px rgba(255, 255, 255, 0.5)',
              }}
            />

            {/* Floating Particles */}
            {particles.map((p, i) => {
              const pEntrance = spring({
                frame: frame - (20 + i),
                fps,
                config: springConfig,
              });
              
              const driftX = Math.sin(frame / 50 + i) * 20;
              const driftY = Math.cos(frame / 60 + i) * 20;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: p.size,
                    height: p.size,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    left: `calc(50% + ${p.x * pEntrance + driftX}px)`,
                    top: `calc(50% + ${p.y * pEntrance + driftY}px)`,
                    opacity: interpolate(pEntrance, [0, 1], [0, 0.3]),
                  }}
                />
              );
            })}
          </div>
        </AbsoluteFill>

        {/* Content Layer */}
        <AbsoluteFill>
          <LayoutGrid anchor="center" direction="column" gap={40}>
            <Sequence from={30}>
              <MotionContainer initial="offscreen-bottom" duration={40}>
                <AnimatedText
                  text="CAMPOR"
                  preset="fadeBlurIn"
                  fontSize={120}
                  fontWeight={900}
                  color="#FFFFFF"
                  letterSpacing={20}
                  exit={{
                    startFrame: 230,
                    opacity: 0,
                    blur: 20,
                  }}
                />
              </MotionContainer>
            </Sequence>

            <Sequence from={60}>
              <MotionContainer initial="blur" delay={20} duration={40}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ height: 1, width: 60, backgroundColor: '#FFFFFF', opacity: 0.5 }} />
                  <AnimatedText
                    text="FUTURE OF TECH"
                    preset="typewriter"
                    fontSize={24}
                    fontWeight={300}
                    color="#FFFFFF"
                    letterSpacing={8}
                  />
                  <div style={{ height: 1, width: 60, backgroundColor: '#FFFFFF', opacity: 0.5 }} />
                </div>
              </MotionContainer>
            </Sequence>
          </LayoutGrid>
        </AbsoluteFill>
      </CameraRig>

      {/* Cinematic Overlays */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Scanline effect */}
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none',
          opacity: 0.3,
        }}
      />
    </AbsoluteFill>
  );
};