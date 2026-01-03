import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from 'remotion';
import { GlassCard, TextOverlay, Cursor, BackgroundGrid } from '../components';

// Define brand colors
const BRAND_COLOR_1 = '#000000'; // Main dark background
const BRAND_COLOR_2 = '#343232'; // Secondary dark, for grid lines and subtle elements
const ACCENT_COLOR = '#00D4FF'; // A bright accent for geometric highlights

export default function BrandVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // SCENE 3: Solution - GlassCard appearance animation
  // The GlassCard sequence starts at frame 220
  const solutionCardSequenceStartFrame = 220;
  const solutionCardProgress = spring({
    frame: frame - solutionCardSequenceStartFrame,
    fps,
    config: {
      stiffness: 100,
      damping: 20,
      mass: 0.8,
    },
  });
  const solutionCardScale = interpolate(solutionCardProgress, [0, 1], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const solutionCardOpacity = interpolate(solutionCardProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // SCENE 4: Demo - Cursor animation
  const demoSceneStartFrame = 300;
  const demoSceneFrame = frame - demoSceneStartFrame; // Relative frame for demo scene

  const cursorPath1Duration = 20; // Move to first element (Status)
  const clickDuration = 10; // How long the click state lasts
  const cursorPath2Duration = 20; // Move to second element (Inventory)
  const cursorPath3Duration = 20; // Move to button (Approve)

  // Calculate target positions relative to the screen center for the 800x500 GlassCard
  // GlassCard top-left is at (width/2 - 400, height/2 - 250)
  // Approximate positions for elements within the card:
  const targetStatusX = width / 2 - 250; // Inside the card, towards left
  const targetStatusY = height / 2 - 100; // Inside the card, top section

  const targetInventoryX = width / 2 - 200; // Inside the card, middle
  const targetInventoryY = height / 2 + 50; // Inside the card, middle section

  const targetButtonX = width / 2 + 150; // Inside the card, towards right
  const targetButtonY = height / 2 + 180; // Inside the card, bottom section

  // Cursor X position animation
  const cursorX = interpolate(
    demoSceneFrame,
    [
      0,
      cursorPath1Duration,
      cursorPath1Duration + clickDuration,
      cursorPath1Duration + clickDuration + cursorPath2Duration,
      cursorPath1Duration + clickDuration + cursorPath2Duration + clickDuration,
      cursorPath1Duration + clickDuration + cursorPath2Duration + clickDuration + cursorPath3Duration,
    ],
    [
      width / 2 - 300, // Initial position, outside card
      targetStatusX, // Move to Status
      targetStatusX, // Hold
      targetInventoryX, // Move to Inventory
      targetInventoryX, // Hold
      targetButtonX, // Move to Approve button
    ],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear, // Geometric style, linear movement
    }
  );

  // Cursor Y position animation
  const cursorY = interpolate(
    demoSceneFrame,
    [
      0,
      cursorPath1Duration,
      cursorPath1Duration + clickDuration,
      cursorPath1Duration + clickDuration + cursorPath2Duration,
      cursorPath1Duration + clickDuration + cursorPath2Duration + clickDuration,
      cursorPath1Duration + clickDuration + cursorPath2Duration + clickDuration + cursorPath3Duration,
    ],
    [
      height / 2 - 200, // Initial position, outside card
      targetStatusY, // Move to Status
      targetStatusY, // Hold
      targetInventoryY, // Move to Inventory
      targetInventoryY, // Hold
      targetButtonY, // Move to Approve button
    ],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear, // Geometric style, linear movement
    }
  );

  // Cursor click animations
  const cursorClickProgress1 = spring({
    frame: demoSceneFrame - cursorPath1Duration,
    fps,
    config: { damping: 10, stiffness: 100 },
  });
  const cursorClick1 = interpolate(cursorClickProgress1, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cursorClickProgress2 = spring({
    frame: demoSceneFrame - (cursorPath1Duration + clickDuration + cursorPath2Duration),
    fps,
    config: { damping: 10, stiffness: 100 },
  });
  const cursorClick2 = interpolate(cursorClickProgress2, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cursorClickProgress3 = spring({
    frame: demoSceneFrame - (cursorPath1Duration + clickDuration + cursorPath2Duration + clickDuration + cursorPath3Duration),
    fps,
    config: { damping: 10, stiffness: 100 },
  });
  const cursorClick3 = interpolate(cursorClickProgress3, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const showSuccessState =
    demoSceneFrame >
    cursorPath1Duration + clickDuration + cursorPath2Duration + clickDuration + cursorPath3Duration + clickDuration;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND_COLOR_1 }}>
      <BackgroundGrid dark={true} color={BRAND_COLOR_2} />

      {/* SCENE 1: INTRO (0-3s | Frames 0-90) */}
      <Sequence from={0} durationInFrames={90}>
        <TextOverlay title="Campor" subtitle="Your E-commerce Evolution" delay={10} dark={true} />
      </Sequence>

      {/* SCENE 2: PROBLEM (3-6s | Frames 90-180) */}
      <Sequence from={90} durationInFrames={90}>
        <TextOverlay
          title="Lost in a Sea of Data?"
          subtitle="Managing product listings, inventory, and orders across multiple platforms can be overwhelming."
          delay={10}
          dark={true}
        />
      </Sequence>

      {/* SCENE 3: SOLUTION (6-10s | Frames 180-300) */}
      {/* TextOverlay appears first, then fades as GlassCard scales in */}
      <Sequence from={180} durationInFrames={60}>
        {' '}
        {/* Text for first 2 seconds of the scene */}
        <TextOverlay
          title="Streamline Your Workflow"
          subtitle="Campor provides a unified dashboard for all your E-commerce needs."
          delay={10}
          dark={true}
        />
      </Sequence>
      <Sequence from={solutionCardSequenceStartFrame} durationInFrames={80}>
        {' '}
        {/* GlassCard appears after text starts fading */}
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            transform: `scale(${solutionCardScale})`,
            opacity: solutionCardOpacity,
          }}
        >
          <GlassCard width={800} height={500} dark={true}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 30,
                color: 'white',
                fontFamily: 'sans-serif',
                width: '100%',
                height: '100%',
              }}
            >
              <h2
                style={{
                  fontSize: 32,
                  marginBottom: 20,
                  borderBottom: `1px solid ${BRAND_COLOR_2}`,
                  paddingBottom: 10,
                }}
              >
                Product Dashboard
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                <span style={{ fontSize: 20 }}>
                  Total Products: <strong style={{ color: ACCENT_COLOR }}>2,450</strong>
                </span>
                <span style={{ fontSize: 20 }}>
                  Pending Approval: <strong style={{ color: '#FFD700' }}>12</strong>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                <span style={{ fontSize: 20 }}>
                  Live Listings: <strong style={{ color: '#00FF00' }}>2,300</strong>
                </span>
                <span style={{ fontSize: 20 }}>
                  Out of Stock: <strong style={{ color: '#FF0000' }}>138</strong>
                </span>
              </div>
              <div
                style={{
                  flexGrow: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 24,
                  opacity: 0.7,
                }}
              >
                <p>Click to view details...</p>
              </div>
            </div>
          </GlassCard>
        </AbsoluteFill>
      </Sequence>

      {/* SCENE 4: DEMO (10-14s | Frames 300-420) */}
      <Sequence from={demoSceneStartFrame} durationInFrames={120}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <GlassCard width={800} height={500} dark={true}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 30,
                color: 'white',
                fontFamily: 'sans-serif',
                width: '100%',
                height: '100%',
              }}
            >
              <h2
                style={{
                  fontSize: 32,
                  marginBottom: 20,
                  borderBottom: `1px solid ${BRAND_COLOR_2}`,
                  paddingBottom: 10,
                }}
              >
                Manage Product: "Geometric Lamp"
              </h2>
              <div
                style={{
                  marginBottom: 15,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <label style={{ fontSize: 20, marginRight: 10 }}>Status:</label>
                <div
                  style={{
                    backgroundColor: showSuccessState ? '#00FF00' : '#FFD700',
                    padding: '8px 15px',
                    borderRadius: 5,
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: BRAND_COLOR_1,
                    cursor: 'pointer', // Simulate clickable area
                  }}
                >
                  {showSuccessState ? 'Approved' : 'Pending'}
                </div>
              </div>
              <div
                style={{
                  marginBottom: 15,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <label style={{ fontSize: 20, marginRight: 10 }}>Inventory:</label>
                <div
                  style={{
                    backgroundColor: BRAND_COLOR_2,
                    padding: '8px 15px',
                    borderRadius: 5,
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: 'white',
                    cursor: 'pointer', // Simulate clickable area
                  }}
                >
                  Edit (250 units)
                </div>
              </div>
              <div
                style={{
                  flexGrow: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <button
                  style={{
                    backgroundColor: showSuccessState ? BRAND_COLOR_2 : ACCENT_COLOR, // Change color after click
                    color: showSuccessState ? 'white' : BRAND_COLOR_1,
                    border: 'none',
                    padding: '15px 30px',
                    fontSize: 24,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s ease',
                  }}
                >
                  {showSuccessState ? 'Updated!' : 'Approve Product'}
                </button>
              </div>
            </div>
          </GlassCard>
          <Cursor x={cursorX} y={cursorY} click={cursorClick1 || cursorClick2 || cursorClick3} color="#fff" />
        </AbsoluteFill>
      </Sequence>

      {/* SCENE 5: CTA (14-15s | Frames 420-450) */}
      <Sequence from={420} durationInFrames={30}>
        <TextOverlay title="Campor.com" subtitle="Elevate Your E-commerce Today." delay={0} dark={true} />
      </Sequence>
    </AbsoluteFill>
  );
}