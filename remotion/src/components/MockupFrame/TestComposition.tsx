import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { MockupFrame } from "./MockupFrame";
import { FrameSequence } from "./FrameSequence";

/**
 * Test composition showcasing iPhone with real image content
 */
export const MockupFrameTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* iPhone 15 with real screenshot */}
      <Sequence from={0} durationInFrames={180}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <MockupFrame
            type="iphone15"
            theme="dark"
            glare
            preset="slideInUp"
            src={staticFile("screenshot.png")}
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Test composition for Browser frame with real image content
 */
export const BrowserFrameTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <MockupFrame
        type="browser"
        theme="dark"
        browserConfig={{
          url: "langease.app",
          showButtons: true,
          borderGradient: true,
        }}
        preset="fadeIn"
        src={staticFile("screenshot.png")}
        width={900}
        height={600}
      />
    </AbsoluteFill>
  );
};

/**
 * Comprehensive Browser test - Dark and Light themes with images
 */
export const BrowserThemesTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 40,
      }}
    >
      {/* Dark theme browser */}
      <Sequence from={0}>
        <MockupFrame
          type="browser"
          theme="dark"
          glare
          browserConfig={{
            url: "app.langease.com",
            showButtons: true,
          }}
          preset="slideInLeft"
          src={staticFile("screenshot.png")}
          width={550}
          height={380}
        />
      </Sequence>

      {/* Light theme browser */}
      <Sequence from={20}>
        <MockupFrame
          type="browser"
          theme="light"
          glare
          browserConfig={{
            url: "dashboard.langease.com",
            showButtons: true,
          }}
          preset="slideInRight"
          src={staticFile("screenshot.png")}
          width={550}
          height={380}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Test composition for Card/Glass frame
 */
export const CardFrameTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <MockupFrame
        type="card"
        theme="dark"
        glass
        glare
        preset="springIn"
        width={400}
        height={300}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontFamily: "system-ui",
            padding: 24,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            Glass Card
          </h2>
          <p style={{ margin: "12px 0 0", fontSize: 16, opacity: 0.8 }}>
            With blur and glare effects
          </p>
        </div>
      </MockupFrame>
    </AbsoluteFill>
  );
};

/**
 * Test composition for FrameSequence with weaving effect using real images
 */
export const FrameSequenceTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f23",
        overflow: "hidden",
      }}
    >
      <FrameSequence stagger={20} startFrom={15}>
        {/* Screen 1 - leftmost */}
        <div style={{ position: "absolute", left: 100, top: 100 }}>
          <MockupFrame
            type="iphone15"
            theme="dark"
            glare
            preset="slideInUp"
            src={staticFile("screenshot.png")}
            width={220}
            height={476}
          />
        </div>

        {/* Screen 2 - center-left */}
        <div style={{ position: "absolute", left: 280, top: 80 }}>
          <MockupFrame
            type="iphone15"
            theme="dark"
            glare
            preset="slideInUp"
            src={staticFile("screenshot.png")}
            width={220}
            height={476}
          />
        </div>

        {/* Screen 3 - center-right */}
        <div style={{ position: "absolute", left: 460, top: 60 }}>
          <MockupFrame
            type="iphone15"
            theme="dark"
            glare
            preset="slideInUp"
            src={staticFile("screenshot.png")}
            width={220}
            height={476}
          />
        </div>

        {/* Screen 4 - rightmost */}
        <div style={{ position: "absolute", left: 640, top: 80 }}>
          <MockupFrame
            type="iphone15"
            theme="dark"
            glare
            preset="slideInUp"
            src={staticFile("screenshot.png")}
            width={220}
            height={476}
          />
        </div>
      </FrameSequence>
    </AbsoluteFill>
  );
};

/**
 * Test composition for 3D rotation animation
 */
export const RotateAnimationTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        perspective: "1200px",
      }}
    >
      <MockupFrame
        type="iphone15"
        theme="dark"
        glare
        preset="rotateIn"
        width={280}
        height={606}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(180deg, #2d3436 0%, #636e72 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontSize: 20,
            fontWeight: 600,
            fontFamily: "system-ui",
          }}
        >
          3D Rotate In
        </div>
      </MockupFrame>
    </AbsoluteFill>
  );
};

/**
 * Test composition for exit animations
 */
export const ExitAnimationTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <MockupFrame
        type="browser"
        theme="dark"
        browserConfig={{ url: "example.com" }}
        preset="fadeIn"
        exitPreset="slideOutLeft"
        exitStartFrame={90}
        width={700}
        height={450}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontSize: 24,
            fontWeight: 600,
            fontFamily: "system-ui",
          }}
        >
          Fade In, Slide Out Left
        </div>
      </MockupFrame>
    </AbsoluteFill>
  );
};

/**
 * Combined test composition showing all frame types with real images
 */
export const AllFrameTypesTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
        padding: 60,
        display: "flex",
        flexWrap: "wrap",
        gap: 40,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* iPhone 15 */}
      <Sequence from={0}>
        <MockupFrame
          type="iphone15"
          theme="dark"
          glare
          preset="slideInUp"
          src={staticFile("screenshot.png")}
          width={200}
          height={433}
        />
      </Sequence>

      {/* iPhone Notch */}
      <Sequence from={15}>
        <MockupFrame
          type="iphone-notch"
          theme="dark"
          glare
          preset="slideInUp"
          src={staticFile("screenshot.png")}
          width={200}
          height={433}
        />
      </Sequence>

      {/* Browser Dark */}
      <Sequence from={30}>
        <MockupFrame
          type="browser"
          theme="dark"
          glare
          browserConfig={{ url: "app.example.com", showButtons: true }}
          preset="fadeIn"
          src={staticFile("screenshot.png")}
          width={400}
          height={280}
        />
      </Sequence>

      {/* Card */}
      <Sequence from={45}>
        <MockupFrame
          type="card"
          theme="dark"
          glass
          glare
          preset="springIn"
          src={staticFile("screenshot.png")}
          width={280}
          height={200}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
