import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "./Background";
import { listBackgroundPresets } from "./presets";

/**
 * Test composition showcasing all Background capabilities.
 *
 * Run with: cd remotion && npm run studio
 * Then navigate to "Background Test" composition.
 */

// ─── Helper: Label Overlay ──────────────────────────────────────
const Label: React.FC<{ text: string; subtext?: string }> = ({
  text,
  subtext,
}) => (
  <div
    style={{
      position: "absolute",
      bottom: 40,
      left: 40,
      color: "#fff",
      fontFamily: "Inter, system-ui, sans-serif",
      textShadow: "0 2px 10px rgba(0,0,0,0.8)",
    }}
  >
    <div style={{ fontSize: 32, fontWeight: 700 }}>{text}</div>
    {subtext && (
      <div style={{ fontSize: 18, opacity: 0.8, marginTop: 4 }}>{subtext}</div>
    )}
  </div>
);

// ─── Test 1: Preset Showcase ────────────────────────────────────
export const PresetShowcase: React.FC = () => {
  const presets = listBackgroundPresets();
  const frame = useCurrentFrame();

  // Show each preset for 90 frames (3 seconds at 30fps)
  const framesPerPreset = 90;
  const currentIndex = Math.floor(frame / framesPerPreset) % presets.length;
  const currentPreset = presets[currentIndex];

  // Fade transition
  const progress = (frame % framesPerPreset) / framesPerPreset;
  const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;

  return (
    <AbsoluteFill>
      <Background preset={currentPreset as any} />
      <div style={{ opacity }}>
        <Label
          text={currentPreset}
          subtext={`Preset ${currentIndex + 1} of ${presets.length}`}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Test 2: Type/Variant API (BackgroundRig compat) ────────────
export const TypeVariantTest: React.FC = () => {
  const frame = useCurrentFrame();
  const types = ["gradient-mesh", "grid-lines", "blobs", "solid"] as const;
  const variants = ["light", "dark", "brand"] as const;

  const combinations = types.flatMap((t) => variants.map((v) => ({ type: t, variant: v })));
  const framesPerCombo = 60;
  const currentIndex = Math.floor(frame / framesPerCombo) % combinations.length;
  const { type, variant } = combinations[currentIndex];

  return (
    <AbsoluteFill>
      <Background type={type} variant={variant} animated />
      <Label
        text={`${type} / ${variant}`}
        subtext="Type/Variant API (BackgroundRig compatible)"
      />
    </AbsoluteFill>
  );
};

// ─── Test 3: Custom Layers ──────────────────────────────────────
export const CustomLayersTest: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.3, 0.6]);

  return (
    <AbsoluteFill>
      <Background
        layers={[
          { type: "solid", color: "#0a0a1a" },
          {
            type: "radial",
            colors: ["#7c3aed", "#4c1d95", "transparent"],
            centerX: 50,
            centerY: 50,
            radius: 60,
          },
          {
            type: "glow",
            color: "#ec4899",
            x: 30 + Math.sin(frame * 0.02) * 10,
            y: 40,
            radius: 30,
            intensity: pulse,
          },
          {
            type: "glow",
            color: "#06b6d4",
            x: 70 - Math.sin(frame * 0.02) * 10,
            y: 60,
            radius: 25,
            intensity: pulse,
          },
          { type: "noise", opacity: 0.025 },
          { type: "vignette", intensity: 0.5, radius: 35 },
        ]}
        animated
        animationSpeed={0.5}
      />
      <Label text="Custom Layers" subtext="Programmatic layer composition" />
    </AbsoluteFill>
  );
};

// ─── Test 4: Layer Types Gallery ────────────────────────────────
export const LayerTypesGallery: React.FC = () => {
  return (
    <AbsoluteFill style={{ display: "flex", flexWrap: "wrap" }}>
      {/* Solid */}
      <div style={{ width: "33.33%", height: "50%", position: "relative" }}>
        <Background layers={[{ type: "solid", color: "#4F46E5" }]} />
        <Label text="Solid" />
      </div>

      {/* Linear Gradient */}
      <div style={{ width: "33.33%", height: "50%", position: "relative" }}>
        <Background
          layers={[
            { type: "linear", colors: ["#7c3aed", "#ec4899", "#f59e0b"], angle: 135 },
          ]}
          animated
        />
        <Label text="Linear" />
      </div>

      {/* Radial Gradient */}
      <div style={{ width: "33.33%", height: "50%", position: "relative" }}>
        <Background
          layers={[
            { type: "solid", color: "#0a0a1a" },
            {
              type: "radial",
              colors: ["#7c3aed", "#4c1d95", "transparent"],
              centerX: 50,
              centerY: 50,
              radius: 60,
            },
          ]}
          animated
        />
        <Label text="Radial" />
      </div>

      {/* Mesh Gradient */}
      <div style={{ width: "33.33%", height: "50%", position: "relative" }}>
        <Background
          layers={[
            { type: "mesh", colors: ["#c4b5fd", "#93c5fd", "#86efac", "#fde68a"], spread: 50 },
          ]}
          animated
        />
        <Label text="Mesh" />
      </div>

      {/* Grid */}
      <div style={{ width: "33.33%", height: "50%", position: "relative" }}>
        <Background
          layers={[
            { type: "solid", color: "#0F0F11" },
            { type: "grid", color: "rgba(255,255,255,0.1)", size: 40 },
          ]}
        />
        <Label text="Grid" />
      </div>

      {/* Noise + Vignette + Glow */}
      <div style={{ width: "33.33%", height: "50%", position: "relative" }}>
        <Background
          layers={[
            { type: "solid", color: "#0c0c0c" },
            { type: "glow", color: "#7c3aed", x: 50, y: 50, radius: 40, intensity: 0.6 },
            { type: "noise", opacity: 0.04 },
            { type: "vignette", intensity: 0.6, radius: 30 },
          ]}
          animated
        />
        <Label text="Glow+Noise+Vignette" />
      </div>
    </AbsoluteFill>
  );
};

// ─── Test 5: Animation Speeds ───────────────────────────────────
export const AnimationSpeedTest: React.FC = () => {
  const speeds = [0.2, 0.5, 1, 2];

  return (
    <AbsoluteFill style={{ display: "flex", flexWrap: "wrap" }}>
      {speeds.map((speed, i) => (
        <div
          key={speed}
          style={{ width: "50%", height: "50%", position: "relative" }}
        >
          <Background preset="neonDream" animated animationSpeed={speed} />
          <Label text={`Speed: ${speed}x`} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ─── Main Test Composition ──────────────────────────────────────
/**
 * Full test composition with sequences.
 * Total duration: 900 frames (30 seconds at 30fps)
 */
export const BackgroundTest: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Section 1: Featured Presets (0-300 frames / 0-10s) */}
      <Sequence from={0} durationInFrames={300}>
        <PresetShowcase />
      </Sequence>

      {/* Section 2: Type/Variant API (300-480 frames / 10-16s) */}
      <Sequence from={300} durationInFrames={180}>
        <TypeVariantTest />
      </Sequence>

      {/* Section 3: Custom Layers (480-600 frames / 16-20s) */}
      <Sequence from={480} durationInFrames={120}>
        <CustomLayersTest />
      </Sequence>

      {/* Section 4: Layer Types Gallery (600-750 frames / 20-25s) */}
      <Sequence from={600} durationInFrames={150}>
        <LayerTypesGallery />
      </Sequence>

      {/* Section 5: Animation Speeds (750-900 frames / 25-30s) */}
      <Sequence from={750} durationInFrames={150}>
        <AnimationSpeedTest />
      </Sequence>
    </AbsoluteFill>
  );
};

export default BackgroundTest;
