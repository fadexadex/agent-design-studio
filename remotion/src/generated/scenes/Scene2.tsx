import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const PRIMARY_COLOR = '#000000';
const SECONDARY_COLOR = '#FFFFFF';

interface PieceProps {
  width: number;
  height: number;
  top: number;
  left: number;
  delay: number;
  type: 'rect' | 'tri';
  points?: string;
  direction: 'top' | 'bottom' | 'left' | 'right';
}

const Piece: React.FC<PieceProps> = ({ width, height, top, left, delay, type, points, direction }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 120,
      mass: 0.8,
    },
  });

  const offX = direction === 'left' ? -200 : direction === 'right' ? 200 : 0;
  const offY = direction === 'top' ? -200 : direction === 'bottom' ? 200 : 0;

  const translateX = interpolate(spr, [0, 1], [offX, 0]);
  const translateY = interpolate(spr, [0, 1], [offY, 0]);
  const opacity = interpolate(spr, [0, 0.2], [0, 1]);
  const scale = interpolate(spr, [0, 1], [0.5, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        top,
        left,
        backgroundColor: SECONDARY_COLOR,
        opacity,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        clipPath: type === 'tri' ? `polygon(${points})` : 'none',
      }}
    />
  );
};

const Letter: React.FC<{ children: React.ReactNode; index: number }> = ({ children, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const letterSpring = spring({
    frame: frame - (index * 10 + 40),
    fps,
    config: { damping: 15, stiffness: 100 }
  });

  const yOffset = interpolate(letterSpring, [0, 1], [20, 0]);

  return (
    <div style={{ 
      position: 'relative', 
      width: 120, 
      height: 160, 
      margin: '0 15px',
      transform: `translateY(${yOffset}px)`
    }}>
      {children}
    </div>
  );
};

const GridBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 50], [0, 0.15], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
      <div style={{
        width: '100%',
        height: '100%',
        backgroundImage: `linear-gradient(${SECONDARY_COLOR} 1px, transparent 1px), linear-gradient(90deg, ${SECONDARY_COLOR} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
    </AbsoluteFill>
  );
};

const ConvergingLines: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [40, 55], [1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity }}>
      {[0, 90, 180, 270].map((angle, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '1000px',
            height: '2px',
            backgroundColor: SECONDARY_COLOR,
            transformOrigin: 'left center',
            transform: `rotate(${angle}deg) translateX(${interpolate(progress, [0, 1], [800, 0])}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const mainScale = interpolate(frame, [150, 225], [1, 1.05], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <GridBackground />
      <ConvergingLines />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        transform: `scale(${mainScale})`,
        zIndex: 10
      }}>
        {/* C */}
        <Letter index={0}>
          <Piece type="rect" width={25} height={160} top={0} left={0} delay={10} direction="left" />
          <Piece type="rect" width={95} height={25} top={0} left={25} delay={15} direction="top" />
          <Piece type="rect" width={95} height={25} top={135} left={25} delay={20} direction="bottom" />
        </Letter>

        {/* A */}
        <Letter index={1}>
          <Piece type="rect" width={25} height={135} top={25} left={0} delay={22} direction="left" />
          <Piece type="rect" width={25} height={135} top={25} left={95} delay={25} direction="right" />
          <Piece type="tri" width={120} height={25} top={0} left={0} points="0% 100%, 50% 0%, 100% 100%" delay={28} direction="top" />
          <Piece type="rect" width={70} height={20} top={80} left={25} delay={32} direction="bottom" />
        </Letter>

        {/* M */}
        <Letter index={2}>
          <Piece type="rect" width={25} height={160} top={0} left={0} delay={35} direction="left" />
          <Piece type="rect" width={25} height={160} top={0} left={95} delay={38} direction="right" />
          <Piece type="tri" width={35} height={40} top={0} left={25} points="0% 0%, 100% 100%, 100% 0%" delay={42} direction="top" />
          <Piece type="tri" width={35} height={40} top={0} left={60} points="0% 100%, 100% 0%, 0% 0%" delay={45} direction="top" />
          <Piece type="rect" width={10} height={30} top={35} left={55} delay={48} direction="bottom" />
        </Letter>

        {/* P */}
        <Letter index={3}>
          <Piece type="rect" width={25} height={160} top={0} left={0} delay={50} direction="left" />
          <Piece type="rect" width={70} height={25} top={0} left={25} delay={53} direction="top" />
          <Piece type="rect" width={25} height={65} top={25} left={95} delay={56} direction="right" />
          <Piece type="rect" width={70} height={25} top={90} left={25} delay={59} direction="bottom" />
        </Letter>

        {/* O */}
        <Letter index={4}>
          <Piece type="rect" width={25} height={110} top={25} left={0} delay={62} direction="left" />
          <Piece type="rect" width={25} height={110} top={25} left={95} delay={65} direction="right" />
          <Piece type="rect" width={70} height={25} top={0} left={25} delay={68} direction="top" />
          <Piece type="rect" width={70} height={25} top={135} left={25} delay={71} direction="bottom" />
        </Letter>

        {/* R */}
        <Letter index={5}>
          <Piece type="rect" width={25} height={160} top={0} left={0} delay={74} direction="left" />
          <Piece type="rect" width={70} height={25} top={0} left={25} delay={77} direction="top" />
          <Piece type="rect" width={25} height={65} top={25} left={95} delay={80} direction="right" />
          <Piece type="rect" width={70} height={25} top={90} left={25} delay={83} direction="bottom" />
          <Piece type="tri" width={40} height={45} top={115} left={80} points="0% 0%, 100% 100%, 0% 100%" delay={86} direction="bottom" />
        </Letter>
      </div>

      {/* Mechanical Accents */}
      {frame > 100 && (
        <div style={{
          position: 'absolute',
          bottom: 100,
          width: 600,
          height: 2,
          backgroundColor: SECONDARY_COLOR,
          opacity: interpolate(frame, [100, 110, 210, 225], [0, 0.4, 0.4, 0]),
          transform: `scaleX(${interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' })})`
        }} />
      )}
    </AbsoluteFill>
  );
};