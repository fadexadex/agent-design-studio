import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';
import { CameraRig } from '@/components/Camera';

const TopoLine: React.FC<{ d: string; delay: number; opacity: number }> = ({ d, delay, opacity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const drawProgress = spring({
    frame: frame - delay,
    fps,
    config: { stiffness: 50, damping: 100 },
  });

  return (
    <path
      d={d}
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeDasharray="1000"
      strokeDashoffset={1000 * (1 - drawProgress)}
      opacity={opacity * drawProgress}
      style={{ filter: 'blur(0.5px)' }}
    />
  );
};

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera movement: Extreme close-up to wide reveal
  const zoom = interpolate(frame, [0, 225], [3, 1], {
    extrapolateRight: 'clamp',
  });

  const cameraRotation = interpolate(frame, [0, 225], [5, 0], {
    extrapolateRight: 'clamp',
  });

  // Lighting effect: A moving spotlight reveal
  const spotlightOpacity = interpolate(frame, [0, 60], [0, 0.6], {
    extrapolateRight: 'clamp',
  });
  
  const spotlightPos = interpolate(frame, [0, 225], [40, 60]);

  // Generate topo lines data
  const topoPaths = useMemo(() => [
    "M 200,200 Q 400,150 600,200 T 1000,250",
    "M 150,300 Q 450,350 750,300 T 1100,350",
    "M 100,500 Q 500,450 900,500 T 1300,550",
    "M 300,700 Q 600,750 900,700 T 1500,750",
    // Building blocks
    "M 400,400 L 600,400 L 600,600 L 400,600 Z",
    "M 800,200 L 950,200 L 950,450 L 800,450 Z",
    "M 1100,500 L 1300,500 L 1300,800 L 1100,800 Z",
    "M 200,750 L 500,750 L 500,900 L 200,900 Z",
  ], []);

  const grainOpacity = interpolate(frame, [0, 225], [0.1, 0.2]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {/* Dark Textured Background */}
      <Background 
        type="gradient-mesh" 
        variant="dark" 
        meshColors={{ primary: '#000000', secondary: '#0a0a0a' }} 
        animationSpeed={0.2}
      />

      {/* Film Grain Texture Overlay */}
      <AbsoluteFill style={{ 
        opacity: grainOpacity,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <CameraRig zoom={zoom} rotation={cameraRotation}>
        {/* Topographical Map Layer */}
        <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }}
          >
            {topoPaths.map((d, i) => (
              <TopoLine 
                key={i} 
                d={d} 
                delay={20 + i * 8} 
                opacity={0.4} 
              />
            ))}
          </svg>
        </AbsoluteFill>

        {/* Moody Lighting Overlay */}
        <AbsoluteFill style={{
          background: `radial-gradient(circle at ${spotlightPos}% 50%, transparent 0%, rgba(0,0,0,0.9) 70%)`,
          opacity: spotlightOpacity,
        }} />
      </CameraRig>

      {/* Text Content */}
      <LayoutGrid anchor="center" direction="column" gap={10}>
        <AnimatedText
          text="THE CAMPUS MAZE"
          preset="glitchReveal"
          fontSize={110}
          fontWeight={900}
          color="#FFFFFF"
          letterSpacing={12}
          delay={90}
          exit={{
            startFrame: 190,
            opacity: { from: 1, to: 0 },
            blur: { from: 0, to: 20 }
          }}
        />
        
        <div style={{ 
          height: 2, 
          width: interpolate(frame - 110, [0, 40], [0, 400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), 
          backgroundColor: '#FFFFFF',
          opacity: interpolate(frame - 110, [0, 10], [0, 0.6], { extrapolateLeft: 'clamp' }),
          alignSelf: 'center',
          marginTop: 20
        }} />

        <AnimatedText
          text="CAMPOR"
          preset="fadeBlurIn"
          fontSize={24}
          fontWeight={300}
          color="#888888"
          letterSpacing={20}
          delay={130}
          anchor="center"
          exit={{
            startFrame: 190,
            opacity: { from: 1, to: 0 }
          }}
        />
      </LayoutGrid>

      {/* Vignette */}
      <AbsoluteFill style={{
        boxShadow: 'inset 0 0 300px rgba(0,0,0,1)',
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};