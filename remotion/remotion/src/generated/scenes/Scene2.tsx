import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';
import { CameraRig } from '@/components/Camera';

const Line: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing for the "straightening" event
  const startFrame = 45;
  const transitionProgress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  // Initial chaotic state values
  const seed = index * 133.7;
  const initialRotate = ((seed % 360) - 180);
  const initialTop = (seed % 100);
  const initialLeft = ((seed * 2) % 40) - 20;

  // Target organized state values
  const targetTop = (index / total) * 100;
  const targetRotate = 0;
  const targetLeft = 0;

  // Interpolated values
  const top = interpolate(transitionProgress, [0, 1], [initialTop, targetTop]);
  const rotate = interpolate(transitionProgress, [0, 1], [initialRotate, targetRotate]);
  const left = interpolate(transitionProgress, [0, 1], [initialLeft, targetLeft]);
  const opacity = interpolate(frame, [0, 20, 200, 225], [0, 0.4, 0.4, 0], { extrapolateRight: 'clamp' });
  
  // Width expands when straightened
  const width = interpolate(transitionProgress, [0, 1], [40, 120]);

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        width: `${width}%`,
        height: '1px',
        backgroundColor: '#FFFFFF',
        opacity,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
      }}
    />
  );
};

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulse animation (Blue energy cut)
  const pulseTrigger = 40;
  const pulseProgress = spring({
    frame: frame - pulseTrigger,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const pulseWidth = interpolate(pulseProgress, [0, 0.5, 1], [0, 100, 100], { extrapolateRight: 'clamp' });
  const pulseHeight = interpolate(pulseProgress, [0, 0.2, 1], [0, 4, 0.5], { extrapolateRight: 'clamp' });
  const pulseOpacity = interpolate(frame, [pulseTrigger, pulseTrigger + 10, pulseTrigger + 60], [0, 1, 0], { extrapolateRight: 'clamp' });
  const pulseGlow = interpolate(pulseProgress, [0, 1], [0, 40]);

  // Camera Dolly-in
  const zoom = interpolate(frame, [60, 210], [1, 2.8], {
    easing: Easing.bezier(0.33, 1, 0.68, 1),
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      <Background 
        type="gradient-mesh" 
        variant="dark" 
        meshColors={{ primary: '#000000', secondary: '#001a33' }} 
        animationSpeed={0.3}
      />

      <CameraRig zoom={zoom}>
        {/* Chaotic/Organized Lines Layer */}
        <AbsoluteFill>
          {Array.from({ length: 32 }).map((_, i) => (
            <Line key={i} index={i} total={32} />
          ))}
        </AbsoluteFill>

        {/* The Blue Energy Pulse */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${pulseWidth}%`,
            height: `${pulseHeight}px`,
            backgroundColor: '#00b3ff',
            opacity: pulseOpacity,
            boxShadow: `0 0 ${pulseGlow}px #00b3ff, 0 0 ${pulseGlow * 2}px #00b3ff`,
            zIndex: 10,
          }}
        />

        {/* Central Text Reveal */}
        <LayoutGrid anchor="center">
          <AnimatedText
            text="SYNCHRONIZED."
            preset="glitchReveal"
            fontSize={110}
            fontWeight={900}
            color="#FFFFFF"
            delay={70}
            stagger={3}
            exit={{
              startFrame: 190,
              opacity: 0,
              scale: 1.2
            }}
          />
        </LayoutGrid>

        {/* Subtle atmospheric particles */}
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {Array.from({ length: 15 }).map((_, i) => {
            const particleProgress = (frame + i * 20) % 225;
            const pOpacity = interpolate(particleProgress, [0, 50, 100], [0, 0.3, 0]);
            const pY = interpolate(particleProgress, [0, 100], [60, 40]);
            return (
              <div
                key={`p-${i}`}
                style={{
                  position: 'absolute',
                  top: `${pY}%`,
                  left: `${(i * 7) % 100}%`,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#00b3ff',
                  opacity: pOpacity,
                  filter: 'blur(2px)',
                }}
              />
            );
          })}
        </AbsoluteFill>
      </CameraRig>

      {/* Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};