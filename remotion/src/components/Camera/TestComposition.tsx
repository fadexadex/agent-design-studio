import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraRig } from "./CameraRig";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { IrisTransition } from "../Transitions/IrisTransition";

export const CameraTest: React.FC = () => {
  const frame = useCurrentFrame();

  // Animate Zoom and Panning
  const zoom = 1 + Math.sin(frame / 40) * 0.5; // Zoom varies over time
  const x = Math.sin(frame / 60) * 300; // Pan X
  const y = Math.cos(frame / 60) * 150; // Pan Y
  const rotation = Math.sin(frame / 120) * 5; // Rotate +/- 5 degrees

  return (
    <CameraRig
      zoom={zoom}
      x={x}
      y={y}
      rotation={rotation}
      focusPoint={[0.5, 0.5]}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        {/* Grid Pattern Background */}
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "200%",
            backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            opacity: 0.1,
          }}
        />

        <div
          style={{
            width: 400,
            height: 400,
            backgroundColor: "white",
            borderRadius: 30,
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            fontWeight: "bold",
            color: "#333",
            flexDirection: "column",
            gap: 20,
            zIndex: 10,
          }}
        >
          <div>Camera Test</div>
          <div style={{ fontSize: 20, fontWeight: "normal", opacity: 0.6 }}>
            Z: {zoom.toFixed(2)}
          </div>
        </div>

        {/* Floating Elements for parallax feel */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "20%",
            width: 100,
            height: 100,
            backgroundColor: "#FF6B6B",
            borderRadius: "50%",
            boxShadow: "0 10px 20px rgba(255, 107, 107, 0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            right: "20%",
            width: 120,
            height: 120,
            backgroundColor: "#4ECDC4",
            borderRadius: 20,
            boxShadow: "0 10px 20px rgba(78, 205, 196, 0.3)",
          }}
        />
      </AbsoluteFill>
    </CameraRig>
  );
};

/**
 * Scene components for transition demo
 */
const Scene1: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    }}
  >
    <h1
      style={{ fontSize: 80, color: "#333", fontFamily: "Inter, sans-serif" }}
    >
      Scene 1
    </h1>
  </AbsoluteFill>
);

const Scene2: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFE66D",
    }}
  >
    <h1
      style={{ fontSize: 80, color: "#333", fontFamily: "Inter, sans-serif" }}
    >
      Scene 2
    </h1>
  </AbsoluteFill>
);

const Scene3: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#4ECDC4",
    }}
  >
    <h1
      style={{ fontSize: 80, color: "#333", fontFamily: "Inter, sans-serif" }}
    >
      Scene 3
    </h1>
  </AbsoluteFill>
);

/**
 * TransitionTest - Demonstrates @remotion/transitions usage
 *
 * Uses TransitionSeries for proper scene-to-scene transitions with
 * fade, slide, and wipe effects from the official package.
 */
export const TransitionTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      <TransitionSeries>
        {/* Scene 1 with fade transition to Scene 2 */}
        <TransitionSeries.Sequence durationInFrames={45}>
          <Scene1 />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 2 with slide transition to Scene 3 */}
        <TransitionSeries.Sequence durationInFrames={45}>
          <Scene2 />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 20 })}
        />

        {/* Scene 3 with wipe transition to final */}
        <TransitionSeries.Sequence durationInFrames={45}>
          <Scene3 />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Final scene with custom iris transition overlay */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#4F46E5",
            }}
          >
            <h1
              style={{
                fontSize: 60,
                color: "#fff",
                fontFamily: "Inter, sans-serif",
              }}
            >
              The End
            </h1>
            {/* Custom iris transition as overlay effect */}
            <IrisTransition
              mode="exit"
              durationInFrames={30}
              delay={25}
              color="#000"
            />
          </AbsoluteFill>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
