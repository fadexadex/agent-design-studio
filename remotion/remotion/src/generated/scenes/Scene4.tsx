import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';
import { CameraRig } from '@/components/Camera';

const TRAIL_COUNT = 80;
const BUILDING_COUNT = 40;

const Building: React.FC<{ x: number; y: number; height: number; delay: number }> = ({ x, y, height, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const grow = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  const currentHeight = height * grow;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 60,
        height: 60,
        backgroundColor: '#0a0a0a',
        border: '1px solid #1a1a1a',
        transformStyle: 'preserve-3d',
        transform: `translateZ(${currentHeight / 2}px) scaleZ(${currentHeight})`,
      }}
    >
      {/* Top Face */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#111',
          transform: `translateZ(${currentHeight / 2}px)`,
          border: '1px solid #333',
        }}
      />
    </div>
  );
};

const LightTrail: React.FC<{ 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number; 
  delay: number;
  speed: number;
}> = ({ startX, startY, endX, endY, delay, speed }) => {
  const frame = useCurrentFrame();
  
  const progress = interpolate(
    (frame - delay) % 60,
    [0, 60],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const pathLength = 1000;
  const dashOffset = pathLength - (progress * pathLength * 2);

  return (
    <svg
      style={{
        position: 'absolute',
        overflow: 'visible',
        filter: 'drop-shadow(0 0 8px #00E0FF)',
      }}
      width="100%"
      height="100%"
    >
      <path
        d={`M ${startX} ${startY} L ${endX} ${endY}`}
        fill="none"
        stroke="#00E0FF"
        strokeWidth="2"
        strokeDasharray={`${pathLength / 4} ${pathLength}`}
        strokeDashoffset={dashOffset}
        opacity={interpolate(frame - delay, [0, 20], [0, 0.8], { extrapolateRight: 'clamp' })}
      />
    </svg>
  );
};

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const buildings = useMemo(() => {
    return Array.from({ length: BUILDING_COUNT }).map((_, i) => ({
      x: (Math.random() - 0.5) * 3000,
      y: (Math.random() - 0.5) * 3000,
      height: Math.random() * 400 + 100,
      delay: Math.random() * 40,
    }));
  }, []);

  const trails = useMemo(() => {
    return Array.from({ length: TRAIL_COUNT }).map((_, i) => ({
      startX: (Math.random() - 0.5) * 3000,
      startY: (Math.random() - 0.5) * 3000,
      endX: (Math.random() - 0.5) * 3000,
      endY: (Math.random() - 0.5) * 3000,
      delay: Math.random() * 100,
      speed: Math.random() * 2 + 1,
    }));
  }, []);

  // Camera Pull Back Logic
  const zoom = interpolate(frame, [0, 225], [2.5, 0.7], {
    easing: Easing.bezier(0.33, 1, 0.68, 1),
    extrapolateRight: 'clamp',
  });

  const rotationX = interpolate(frame, [0, 225], [45, 65], { extrapolateRight: 'clamp' });
  const rotationZ = interpolate(frame, [0, 225], [0, -25], { extrapolateRight: 'clamp' });

  // Heartbeat pulse effect
  const pulse = Math.sin(frame * 0.15) * 0.05 + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      <Background 
        type="gradient-mesh" 
        variant="dark" 
        meshColors={{ primary: '#000000', secondary: '#001a33' }} 
        animationSpeed={0.3}
      />

      <CameraRig zoom={zoom}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            perspective: '1500px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              width: 3000,
              height: 3000,
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotationX}deg) rotateZ(${rotationZ}deg) scale(${pulse})`,
            }}
          >
            {/* Ground Grid */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundImage: `linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)`,
                backgroundSize: '100px 100px',
                opacity: 0.5,
              }}
            />

            {/* Buildings */}
            {buildings.map((b, i) => (
              <Building key={`b-${i}`} {...b} />
            ))}

            {/* Light Trails */}
            {trails.map((t, i) => (
              <LightTrail key={`t-${i}`} {...t} />
            ))}
          </div>
        </div>
      </CameraRig>

      {/* Overlay Text */}
      <LayoutGrid anchor="center" direction="column">
        <AnimatedText
          text="ZERO FRICTION."
          preset="fadeBlurIn"
          fontSize={120}
          fontWeight={900}
          color="#FFFFFF"
          letterSpacing={15}
          delay={45}
          exit={{
            startFrame: 190,
            opacity: 0,
            blur: 20,
          }}
        />
      </LayoutGrid>

      {/* Atmospheric Vignette */}
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