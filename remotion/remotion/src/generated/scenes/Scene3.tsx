import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';
import { MotionContainer } from '@/components/Layout';
import { CameraRig } from '@/components/Camera';

const Pod: React.FC<{ 
  delay: number; 
  y: number; 
  scale: number; 
  speed: number; 
  blur?: boolean;
}> = ({ delay, y, scale, speed, blur }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  
  const progress = frame - delay;
  const x = interpolate(progress, [0, 200], [-width * 0.5, width * 1.5], { extrapolateRight: 'clamp' });
  
  const float = Math.sin(frame / 20) * 10;

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y + float,
      width: 600 * scale,
      height: 120 * scale,
      background: 'linear-gradient(165deg, #222 0%, #000 40%, #333 50%, #000 60%, #111 100%)',
      borderRadius: 100,
      border: '1px solid rgba(0, 163, 255, 0.4)',
      boxShadow: `
        0 0 40px rgba(0, 163, 255, 0.2),
        inset 0 0 20px rgba(0, 163, 255, 0.1)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 60 * scale,
      transform: `perspective(1000px) rotateY(-15deg) rotateX(5deg)`,
      filter: blur ? 'blur(4px)' : 'none',
      zIndex: Math.floor(scale * 10),
    }}>
      {/* Blue Rim Light Strip */}
      <div style={{
        width: 120 * scale,
        height: 4 * scale,
        backgroundColor: '#00a3ff',
        borderRadius: 2,
        boxShadow: '0 0 15px #00a3ff, 0 0 5px #fff',
        opacity: interpolate(Math.sin(frame / 5), [-1, 1], [0.6, 1]),
      }} />
      
      {/* Engine Glow */}
      <div style={{
        position: 'absolute',
        left: -10,
        width: 20,
        height: '60%',
        background: 'radial-gradient(circle, rgba(0, 163, 255, 0.8) 0%, transparent 80%)',
        filter: 'blur(10px)',
      }} />
    </div>
  );
};

const DataPoint: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    Math.sin((frame - delay) / 10),
    [-1, 1],
    [0.1, 0.5]
  );

  const val1 = Math.floor(interpolate(frame, [0, 225], [1000, 9999]));
  const val2 = (interpolate(frame, [0, 225], [40.712, 40.720])).toFixed(4);

  if (frame < delay) return null;

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      color: '#00a3ff',
      fontFamily: 'monospace',
      fontSize: 12,
      opacity,
      letterSpacing: 1,
      pointerEvents: 'none',
    }}>
      <div>TRK_ID: {val1}</div>
      <div>POS_X: {val2}</div>
      <div style={{ width: 40, height: 1, backgroundColor: '#00a3ff', marginTop: 4 }} />
    </div>
  );
};

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cameraZoom = interpolate(frame, [0, 225], [1, 1.2], { extrapolateRight: 'clamp' });
  const cameraX = interpolate(frame, [0, 225], [0, -100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {/* Background Grid */}
      <Background 
        type="grid-lines" 
        variant="dark" 
        animationSpeed={0.5}
      />
      
      {/* Subtle Ambient Glow */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 80, 150, 0.15) 0%, transparent 70%)',
      }} />

      <CameraRig zoom={cameraZoom} x={cameraX}>
        {/* Background Pods */}
        <Pod delay={-50} y={200} scale={0.5} speed={1} blur />
        <Pod delay={20} y={750} scale={0.7} speed={1.2} blur />
        
        {/* UI Data Points scattered in 3D space */}
        <DataPoint x={200} y={150} delay={10} />
        <DataPoint x={1400} y={250} delay={45} />
        <DataPoint x={400} y={800} delay={30} />
        <DataPoint x={1600} y={700} delay={60} />
        <DataPoint x={900} y={100} delay={80} />

        {/* Main Hero Pod */}
        <Pod delay={0} y={450} scale={1.2} speed={1.5} />
      </CameraRig>

      {/* Overlay UI Elements */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <LayoutGrid anchor="center" direction="column" gap={10}>
          <MotionContainer 
            initial="blur" 
            delay={40} 
            duration={40}
          >
            <AnimatedText 
              text="REAL-TIME PRECISION"
              preset="glitchReveal"
              fontSize={82}
              fontWeight={900}
              color="#FFFFFF"
              letterSpacing={8}
              exit={{
                startFrame: 190,
                opacity: { from: 1, to: 0 }
              }}
            />
          </MotionContainer>
          
          <MotionContainer 
            initial="offscreen-bottom" 
            delay={65} 
            duration={30}
          >
            <div style={{
              height: 2,
              width: 400,
              background: 'linear-gradient(90deg, transparent, #00a3ff, transparent)',
              margin: '0 auto'
            }} />
          </MotionContainer>
        </LayoutGrid>

        {/* Corner UI Accents */}
        <div style={{
          position: 'absolute',
          top: 60,
          left: 60,
          borderLeft: '2px solid #00a3ff',
          borderTop: '2px solid #00a3ff',
          width: 40,
          height: 40,
          opacity: 0.6
        }} />
        <div style={{
          position: 'absolute',
          bottom: 60,
          right: 60,
          borderRight: '2px solid #00a3ff',
          borderBottom: '2px solid #00a3ff',
          width: 40,
          height: 40,
          opacity: 0.6
        }} />

        {/* Scanning Line Effect */}
        <div style={{
          position: 'absolute',
          top: interpolate(frame % 100, [0, 100], [-100, 1180]),
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 163, 255, 0.3), transparent)',
          boxShadow: '0 0 10px rgba(0, 163, 255, 0.2)',
        }} />
      </AbsoluteFill>

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        boxShadow: 'inset 0 0 300px rgba(0,0,0,0.8)',
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};