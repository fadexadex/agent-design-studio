import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';
import { CameraRig } from '@/components/Camera';

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // TIMING CONSTANTS
  const CONVERGE_START = 0;
  const CONVERGE_DURATION = 70;
  const LOGO_APPEAR_FRAME = 45;
  const GLOW_START_FRAME = 60;
  const EXIT_START_FRAME = 190;

  // CAMERA ANIMATION
  const zoom = interpolate(
    frame,
    [0, 225],
    [1, 1.15],
    { extrapolateRight: 'clamp' }
  );

  // CONVERGING LIGHTS LOGIC
  const particleCount = 40;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const seed = i * 133.7;
    const randomAngle = (i / particleCount) * Math.PI * 2;
    const randomDistance = 800 + (Math.sin(seed) * 300);
    
    // Starting positions (outside the frame)
    const startX = Math.cos(randomAngle) * randomDistance + width / 2;
    const startY = Math.sin(randomAngle) * randomDistance + height / 2;

    // Convergence animation
    const moveSpring = spring({
      frame: frame - (i * 0.8),
      fps,
      config: { damping: 20, stiffness: 60 },
    });

    const x = interpolate(moveSpring, [0, 1], [startX, width / 2]);
    const y = interpolate(moveSpring, [0, 1], [startY, height / 2]);
    
    // Visual properties
    const opacity = interpolate(
      moveSpring,
      [0, 0.2, 0.9, 1],
      [0, 1, 1, 0],
      { extrapolateRight: 'clamp' }
    );
    
    const size = interpolate(moveSpring, [0, 1], [15, 2]);
    const blur = interpolate(moveSpring, [0, 1], [8, 0]);

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          filter: `blur(${blur}px)`,
          boxShadow: '0 0 20px #FFFFFF, 0 0 40px #FFFFFF',
          opacity,
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  });

  // BREATHING GLOW LOGIC
  const breathProgress = Math.sin((frame - GLOW_START_FRAME) * 0.06);
  const glowOpacityBase = interpolate(
    frame,
    [GLOW_START_FRAME, GLOW_START_FRAME + 30, EXIT_START_FRAME, 225],
    [0, 0.5, 0.5, 0],
    { extrapolateRight: 'clamp' }
  );
  
  const glowBreath = interpolate(breathProgress, [-1, 1], [0.7, 1]);
  const finalGlowOpacity = glowOpacityBase * glowBreath;
  const glowScale = interpolate(breathProgress, [-1, 1], [1, 1.2]);

  // FINAL FADE TO BLACK
  const screenFade = interpolate(
    frame,
    [EXIT_START_FRAME + 10, 225],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Deep black background */}
      <Background type="solid" variant="dark" />

      <CameraRig zoom={zoom}>
        {/* Converging Lights Layer */}
        <AbsoluteFill>
          {particles}
        </AbsoluteFill>

        {/* Breathing Blue Glow behind the logo */}
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              width: 600,
              height: 300,
              background: 'radial-gradient(circle, #00b3ff 0%, transparent 70%)',
              opacity: finalGlowOpacity,
              transform: `scale(${glowScale})`,
              filter: 'blur(60px)',
              borderRadius: '50%',
            }}
          />
        </AbsoluteFill>

        {/* Logo Text */}
        <LayoutGrid anchor="center">
          <AnimatedText
            text="Campor"
            preset="fadeBlurIn"
            fontSize={120}
            fontWeight={800}
            color="#FFFFFF"
            delay={LOGO_APPEAR_FRAME}
            exit={{
              startFrame: EXIT_START_FRAME,
              opacity: { from: 1, to: 0 },
              blur: { from: 0, to: 20 }
            }}
            style={{
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
            }}
          />
        </LayoutGrid>
      </CameraRig>

      {/* Final Fade Overlay */}
      <AbsoluteFill 
        style={{ 
          backgroundColor: '#000000', 
          opacity: screenFade,
          pointerEvents: 'none'
        }} 
      />
    </AbsoluteFill>
  );
};