import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';
import { MotionContainer } from '@/components/Layout';
import { CameraRig } from '@/components/Camera';

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Global Camera Movement
  const zoom = interpolate(frame, [0, 225], [1, 1.15], { extrapolateRight: 'clamp' });

  // Percussive spring config
  const beatConfig = { damping: 120, stiffness: 100 };

  // Flash effect on cuts
  const flashOpacity = interpolate(
    frame % 45,
    [0, 5],
    [0.8, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      <CameraRig zoom={zoom}>
        {/* SECTION 1: STUDENT SILHOUETTE (0-45) */}
        <Sequence from={0} duration={45}>
          <Background 
            type="gradient-mesh" 
            variant="dark" 
            meshColors={{ primary: '#000000', secondary: '#001a33' }} 
          />
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            {/* Blue Screen Glow */}
            <div style={{
              width: 600,
              height: 400,
              backgroundColor: '#0066ff',
              filter: 'blur(80px)',
              opacity: 0.4,
              borderRadius: '50%',
            }} />
            
            {/* Silhouette Shape */}
            <MotionContainer initial="offscreen-bottom" duration={30}>
              <svg width="400" height="600" viewBox="0 0 100 100" fill="#000000">
                <circle cx="50" cy="30" r="15" />
                <path d="M20 90 Q50 40 80 90 Z" />
              </svg>
            </MotionContainer>
          </AbsoluteFill>
        </Sequence>

        {/* SECTION 2: TRANSPORT DOOR (45-90) */}
        <Sequence from={45} duration={45}>
          <Background type="grid-lines" variant="dark" />
          <AbsoluteFill>
            {/* Left Door */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50%',
              height: '100%',
              backgroundColor: '#000000',
              borderRight: '4px solid #FFFFFF',
              transform: `translateX(${interpolate(
                spring({ frame: frame - 45, fps, config: beatConfig }),
                [0, 1],
                [-width / 2, 0]
              )}px)`
            }} />
            {/* Right Door */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '50%',
              height: '100%',
              backgroundColor: '#000000',
              borderLeft: '4px solid #FFFFFF',
              transform: `translateX(${interpolate(
                spring({ frame: frame - 45, fps, config: beatConfig }),
                [0, 1],
                [width / 2, 0]
              )}px)`
            }} />
          </AbsoluteFill>
        </Sequence>

        {/* SECTION 3: DIGITAL MAP (90-135) */}
        <Sequence from={90} duration={45}>
          <Background type="gradient-mesh" variant="dark" meshColors={{ primary: '#000000', secondary: '#111111' }} />
          <AbsoluteFill>
            {/* Abstract Map Nodes */}
            {[...Array(8)].map((_, i) => {
              const nodeSpring = spring({ frame: frame - 90 - (i * 3), fps, config: beatConfig });
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${20 + (i * 10)}%`,
                    top: `${30 + (Math.sin(i) * 20)}%`,
                    width: 20,
                    height: 20,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: `scale(${nodeSpring})`,
                    boxShadow: '0 0 20px rgba(255,255,255,0.5)',
                  }}
                />
              );
            })}
            {/* Connecting Lines (Abstract) */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
              <line 
                x1="20%" y1="30%" x2="80%" y2="70%" 
                stroke="#FFFFFF" 
                strokeWidth="2" 
                strokeDasharray="10 5"
                style={{ opacity: interpolate(frame, [90, 110], [0, 0.3], { extrapolateRight: 'clamp' }) }}
              />
            </svg>
          </AbsoluteFill>
        </Sequence>

        {/* SECTION 4: FINAL REVEAL (135-225) */}
        <Sequence from={135} duration={90}>
          <Background type="gradient-mesh" variant="dark" meshColors={{ primary: '#000000', secondary: '#000000' }} />
          
          {/* Abstract background shapes */}
          <AbsoluteFill>
            {[...Array(5)].map((_, i) => {
              const rotation = interpolate(frame, [135, 225], [0, 45 + (i * 10)]);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 800 - (i * 100),
                    height: 800 - (i * 100),
                    border: '1px solid rgba(255,255,255,0.1)',
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </AbsoluteFill>

          <LayoutGrid anchor="center">
            <AnimatedText
              text="THE NEW STANDARD."
              preset="glitchReveal"
              fontSize={90}
              fontWeight={900}
              color="#FFFFFF"
              letterSpacing={8}
            />
          </LayoutGrid>
        </Sequence>
      </CameraRig>

      {/* Percussive Flash Overlay */}
      <AbsoluteFill 
        style={{ 
          backgroundColor: '#FFFFFF', 
          opacity: flashOpacity, 
          pointerEvents: 'none' 
        }} 
      />

      {/* Brand Watermark */}
      <div style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 24,
        letterSpacing: 4,
        fontWeight: 300,
        opacity: interpolate(frame, [180, 210], [0, 0.6], { extrapolateRight: 'clamp' })
      }}>
        CAMPOR TECH
      </div>
    </AbsoluteFill>
  );
};