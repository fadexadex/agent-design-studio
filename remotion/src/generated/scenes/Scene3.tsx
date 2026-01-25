import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const DataLine: React.FC<{ delay: number; rotation: number; radius: number }> = ({ delay, rotation, radius }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const pathLength = 100;
  const dashOffset = interpolate(progress, [0, 1], [pathLength, -pathLength]);

  return (
    <div
      style={{
        position: 'absolute',
        width: radius * 2,
        height: radius * 2,
        transform: `rotateZ(${rotation}deg) rotateX(70deg)`,
        opacity,
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <circle
          cx="50"
          cy="50"
          r="50"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          strokeDasharray={`${pathLength / 4} ${pathLength}`}
          strokeDashoffset={dashOffset}
        />
      </svg>
    </div>
  );
};

const WireframeSphere: React.FC<{ scale: number; opacity: number }> = ({ scale, opacity }) => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [60, 225], [0, 360]);

  return (
    <div
      style={{
        position: 'relative',
        width: 600,
        height: 600,
        transform: `scale(${scale}) rotateY(${rotation}deg) rotateX(20deg)`,
        transformStyle: 'preserve-3d',
        opacity,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Vertical Rings */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            transform: `rotateY(${i * 15}deg)`,
          }}
        />
      ))}
      {/* Horizontal Rings */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            width: `${Math.sin(((i + 1) * Math.PI) / 9) * 100}%`,
            height: `${Math.sin(((i + 1) * Math.PI) / 9) * 100}%`,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            transform: `rotateX(90deg) translateZ(${(i - 3.5) * 60}px)`,
          }}
        />
      ))}
      
      {/* Zipping Data Lines */}
      {[...Array(15)].map((_, i) => (
        <DataLine 
          key={`line-${i}`} 
          delay={70 + (i * 12) % 100} 
          rotation={i * 24} 
          radius={300} 
        />
      ))}
    </div>
  );
};

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const primaryColor = "#000000";
  const secondaryColor = "#FFFFFF";

  // Intro Animation: Text Appearance
  const textEntrance = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Zoom into 'O' logic
  // "CAMPOR" -> O is at index 4
  const zoomStart = 45;
  const zoomDuration = 45;
  const zoomProgress = interpolate(frame, [zoomStart, zoomStart + zoomDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const zoomScale = interpolate(zoomProgress, [0, 1], [1, 12]);
  // Offset to center the 'O' (roughly 1.5 units from center in a 6-letter word)
  const translateX = interpolate(zoomProgress, [0, 1], [0, -165]); 
  
  const textOpacity = interpolate(frame, [zoomStart + 30, zoomStart + zoomDuration], [1, 0]);
  const sphereOpacity = interpolate(frame, [zoomStart + 15, zoomStart + 40], [0, 1]);
  const sphereScale = interpolate(frame, [zoomStart, zoomStart + zoomDuration], [0.1, 1]);

  const letters = "CAMPOR".split("");

  return (
    <AbsoluteFill style={{ backgroundColor: primaryColor, overflow: 'hidden' }}>
      {/* Background Grid */}
      <div
        style={{
          position: 'absolute',
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
          backgroundImage: `linear-gradient(${secondaryColor} 1px, transparent 1px), linear-gradient(90deg, ${secondaryColor} 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
          opacity: 0.05,
          transform: `perspective(1000px) rotateX(60deg) translateY(${frame}px)`,
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${zoomScale}) translateX(${translateX}px)`,
        }}
      >
        {/* Text Layer */}
        <div
          style={{
            display: 'flex',
            opacity: textOpacity,
            transform: `scale(${textEntrance})`,
          }}
        >
          {letters.map((letter, i) => (
            <span
              key={i}
              style={{
                color: secondaryColor,
                fontSize: 120,
                fontWeight: 900,
                fontFamily: 'sans-serif',
                margin: '0 10px',
                display: 'inline-block',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Sphere Layer - positioned exactly where the 'O' would be */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% + 155px)', // Aligned with 'O'
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <WireframeSphere scale={sphereScale} opacity={sphereOpacity} />
        </div>
      </div>

      {/* Geometric Accents */}
      <div style={{ position: 'absolute', top: 40, left: 40, color: secondaryColor, opacity: 0.6, fontFamily: 'monospace' }}>
        <div>SYSTEM_STATUS: ACTIVE</div>
        <div>ECOSYSTEM_SYNC: {Math.min(100, Math.floor((frame / 225) * 100))}%</div>
      </div>

      <div style={{ position: 'absolute', bottom: 40, right: 40, width: 200, height: 2, backgroundColor: secondaryColor, opacity: 0.3 }}>
        <div 
          style={{ 
            width: `${(frame / 225) * 100}%`, 
            height: '100%', 
            backgroundColor: secondaryColor,
            boxShadow: '0 0 10px #FFFFFF'
          }} 
        />
      </div>
    </AbsoluteFill>
  );
};