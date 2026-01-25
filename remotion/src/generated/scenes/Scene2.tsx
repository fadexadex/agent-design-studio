import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from 'remotion';

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const primaryColor = '#000000';
  const secondaryColor = '#FFFFFF';

  // Global entrance/exit
  const sceneOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const sceneExit = interpolate(frame, [180, 210], [1, 0], { extrapolateRight: 'clamp' });

  // Header animation
  const headerReveal = spring({
    frame: frame - 10,
    fps,
    config: { stiffness: 100, damping: 20 },
  });

  // Steps data
  const steps = [
    { id: '01', title: 'SELECT', desc: 'Curated essentials' },
    { id: '02', title: 'ORDER', desc: 'Seamless experience' },
    { id: '03', title: 'RECEIVE', desc: 'Express delivery' },
  ];

  const renderStep = (index: number, content: typeof steps[0]) => {
    const delay = 40 + index * 25;
    const stepSpring = spring({
      frame: frame - delay,
      fps,
      config: { stiffness: 80, damping: 15 },
    });

    const moveUp = interpolate(stepSpring, [0, 1], [40, 0]);
    const opacity = interpolate(stepSpring, [0, 1], [0, 1]);

    return (
      <div
        key={content.id}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity,
          transform: `translateY(${moveUp}px)`,
        }}
      >
        <span style={{
          fontSize: 24,
          fontWeight: 300,
          color: primaryColor,
          marginBottom: 10,
          letterSpacing: 4
        }}>
          {content.id}
        </span>
        <div style={{
          width: 40,
          height: 1,
          backgroundColor: primaryColor,
          marginBottom: 20,
          opacity: 0.3
        }} />
        <h3 style={{
          fontSize: 32,
          fontWeight: 600,
          margin: 0,
          letterSpacing: 8,
          color: primaryColor
        }}>
          {content.title}
        </h3>
        <p style={{
          fontSize: 18,
          fontWeight: 300,
          marginTop: 15,
          color: primaryColor,
          opacity: 0.6,
          letterSpacing: 1
        }}>
          {content.desc}
        </p>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: secondaryColor, opacity: sceneOpacity * sceneExit }}>
      {/* Top Border Line */}
      <div style={{
        position: 'absolute',
        top: 80,
        left: '10%',
        right: '10%',
        height: 1,
        backgroundColor: primaryColor,
        transform: `scaleX(${headerReveal})`,
        opacity: 0.1
      }} />

      {/* Main Title */}
      <div style={{
        marginTop: 140,
        textAlign: 'center',
        width: '100%',
        transform: `translateY(${interpolate(headerReveal, [0, 1], [20, 0])}px)`,
        opacity: headerReveal
      }}>
        <h2 style={{
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: 12,
          color: primaryColor,
          margin: 0,
          textTransform: 'uppercase'
        }}>
          How it works
        </h2>
      </div>

      {/* Steps Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '80%',
        margin: 'auto',
        marginTop: 100
      }}>
        {steps.map((step, i) => renderStep(i, step))}
      </div>

      {/* Bottom Decorative Element */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 1,
        height: interpolate(headerReveal, [0, 1], [0, 60]),
        backgroundColor: primaryColor,
        opacity: 0.2
      }} />
    </AbsoluteFill>
  );
};