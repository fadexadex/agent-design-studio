/**
 * MockupFrame Examples
 *
 * Demonstrates device frames, animations, and FrameSequence patterns.
 * Ideal composition size: 1920x1080 (Full HD)
 */

import { AbsoluteFill } from "remotion";
import { MockupFrame, FrameSequence } from "@/components/MockupFrame";

// ===========================================
// FRAME TYPES
// ===========================================

/** Browser frame with URL bar */
export const BrowserFrameExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#F3F4F6",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="browser"
      src="/screenshots/dashboard.png"
      preset="springIn"
      browserConfig={{
        url: "https://myapp.com/dashboard",
        showButtons: true,
        title: "Dashboard",
      }}
      theme="light"
      width={900}
    />
  </AbsoluteFill>
);

/** iPhone 15 Pro frame */
export const IPhone15Example = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1A1A1A",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="iphone15"
      src="/screenshots/mobile-app.png"
      preset="slideInUp"
      theme="dark"
      glare
    />
  </AbsoluteFill>
);

/** iPhone with notch */
export const IPhoneNotchExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="iphone-notch"
      src="/screenshots/mobile-app.png"
      preset="fadeIn"
      theme="light"
    />
  </AbsoluteFill>
);

/** Card frame with custom content */
export const CardFrameExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0F0F11",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="card"
      preset="springIn"
      glass
      theme="dark"
      width={400}
      height={250}
    >
      <div
        style={{
          padding: 24,
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Notification
        </h2>
        <p style={{ margin: 0, fontSize: 16, opacity: 0.8 }}>
          Your export is ready for download
        </p>
      </div>
    </MockupFrame>
  </AbsoluteFill>
);

// ===========================================
// GLASS & GLARE EFFECTS
// ===========================================

/** Glass effect with custom config */
export const GlassEffectExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#6366F1",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="card"
      preset="fadeIn"
      glass={{
        blur: 25,
        opacity: 0.4,
        borderOpacity: 0.3,
      }}
      theme="dark"
      width={500}
      height={300}
    >
      <div
        style={{
          padding: 32,
          color: "#FFFFFF",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 32 }}>Glass Card</h2>
        <p style={{ margin: "12px 0 0", opacity: 0.9 }}>
          With backdrop blur effect
        </p>
      </div>
    </MockupFrame>
  </AbsoluteFill>
);

/** Glare overlay on iPhone */
export const GlareEffectExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1A1A1A",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="iphone15"
      src="/screenshots/app.png"
      preset="slideInRight"
      glare
      theme="dark"
    />
  </AbsoluteFill>
);

// ===========================================
// 3D ROTATION
// ===========================================

/** 3D rotation entrance */
export const RotateInExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#F9FAFB",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="browser"
      src="/screenshots/hero.png"
      rotate={{
        fromY: -30,
        toY: 0,
        fromX: 10,
        toX: 0,
        perspective: 1200,
        duration: 45,
        easing: { type: "spring", damping: 15 },
      }}
      opacity={{ from: 0, to: 1, duration: 30 }}
      scale={{ from: 0.9, to: 1 }}
      browserConfig={{ url: "https://example.com" }}
      width={1000}
    />
  </AbsoluteFill>
);

/** Dramatic perspective shot */
export const DramaticPerspectiveExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0F0F11",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="browser"
      src="/screenshots/product.png"
      rotate={{
        fromX: 25,
        toX: 5,
        fromY: -20,
        toY: -8,
        perspective: 1000,
        duration: 60,
        easing: { type: "spring", damping: 12 },
      }}
      scale={{ from: 0.85, to: 1 }}
      opacity={{ from: 0, to: 1, duration: 25 }}
      style={{
        boxShadow: "0 50px 100px rgba(0,0,0,0.5)",
      }}
      width={950}
    />
  </AbsoluteFill>
);

// ===========================================
// ENTRANCE PRESETS
// ===========================================

/** Spring bounce entrance */
export const SpringInPresetExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="browser"
      src="/screenshots/app.png"
      preset="springIn"
      browserConfig={{ url: "https://app.example.com" }}
      width={850}
    />
  </AbsoluteFill>
);

/** Slide from bottom */
export const SlideInUpPresetExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1A1A1A",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="iphone15"
      src="/screenshots/mobile.png"
      preset="slideInUp"
      theme="dark"
    />
  </AbsoluteFill>
);

// ===========================================
// EXIT ANIMATIONS
// ===========================================

/** Entrance with exit preset */
export const EnterExitExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#F3F4F6",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="browser"
      src="/screenshots/page.png"
      preset="springIn"
      exitPreset="slideOutRight"
      exitStartFrame={75}
      browserConfig={{ url: "https://example.com" }}
      width={800}
    />
  </AbsoluteFill>
);

// ===========================================
// FRAME SEQUENCE
// ===========================================

/** Staggered multi-device showcase */
export const FrameSequenceExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#0F0F11" }}>
    <FrameSequence stagger={20} startFrom={10}>
      {/* Desktop browser - back layer */}
      <MockupFrame
        type="browser"
        src="/screenshots/desktop.png"
        preset="slideInLeft"
        browserConfig={{ url: "https://myapp.com" }}
        style={{
          position: "absolute",
          left: 100,
          top: "50%",
          transform: "translateY(-50%)",
        }}
        width={700}
        zIndex={1}
      />

      {/* Mobile - front right */}
      <MockupFrame
        type="iphone15"
        src="/screenshots/mobile.png"
        preset="slideInRight"
        glare
        theme="dark"
        style={{
          position: "absolute",
          right: 150,
          top: "50%",
          transform: "translateY(-45%)",
        }}
        zIndex={2}
      />

      {/* Floating notification card */}
      <MockupFrame
        type="card"
        preset="slideInUp"
        glass
        theme="dark"
        style={{
          position: "absolute",
          left: 250,
          bottom: 120,
        }}
        width={300}
        height={100}
        zIndex={3}
      >
        <div
          style={{
            padding: 16,
            color: "#FFFFFF",
            fontSize: 14,
          }}
        >
          <strong>Success!</strong> Your changes were saved.
        </div>
      </MockupFrame>
    </FrameSequence>
  </AbsoluteFill>
);

/** Hero mockup arrangement */
export const HeroMockupsExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <FrameSequence stagger={15}>
      {/* Center main mockup */}
      <MockupFrame
        type="browser"
        src="/screenshots/hero-main.png"
        preset="springIn"
        rotate={{ fromY: -5, toY: 0 }}
        browserConfig={{ url: "https://yourproduct.com" }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
        width={900}
        zIndex={1}
      />

      {/* Right mobile */}
      <MockupFrame
        type="iphone15"
        src="/screenshots/hero-mobile.png"
        preset="slideInRight"
        glare
        style={{
          position: "absolute",
          right: 80,
          top: "50%",
          transform: "translateY(-40%)",
        }}
        zIndex={2}
      />

      {/* Left card */}
      <MockupFrame
        type="card"
        preset="slideInLeft"
        glass
        theme="dark"
        style={{
          position: "absolute",
          left: 60,
          top: "55%",
          transform: "translateY(-50%)",
        }}
        width={280}
        height={160}
        zIndex={2}
      >
        <div
          style={{
            padding: 20,
            color: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.7 }}>Total Revenue</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>$124,500</div>
          <div style={{ fontSize: 14, color: "#22C55E" }}>↑ 12.5%</div>
        </div>
      </MockupFrame>
    </FrameSequence>
  </AbsoluteFill>
);

// ===========================================
// COMBINED EFFECTS
// ===========================================

/** Full product showcase */
export const ProductShowcaseExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0A0A0B",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MockupFrame
      type="browser"
      src="/screenshots/product-full.png"
      browserConfig={{
        url: "https://yourproduct.com",
        title: "Your Product",
        showButtons: true,
      }}
      rotate={{
        fromX: 20,
        toX: 0,
        fromY: -15,
        toY: 0,
        perspective: 1000,
        duration: 50,
        easing: { type: "spring", damping: 12 },
      }}
      scale={{ from: 0.85, to: 1 }}
      opacity={{ from: 0, to: 1, duration: 25 }}
      theme="dark"
      glare
      style={{
        boxShadow: "0 60px 120px rgba(0,0,0,0.4)",
      }}
      width={1050}
    />
  </AbsoluteFill>
);
