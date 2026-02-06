/**
 * Background Component Examples
 *
 * Demonstrates various patterns and configurations for the Background component.
 * Ideal composition size: 1920x1080 (Full HD) @ 30fps
 */

import { AbsoluteFill, Composition } from "remotion";
import {
  Background,
  backgroundPresets,
  getBackgroundPreset,
  listBackgroundPresets,
} from "@/components/Global";
import { AnimatedText } from "@/components/AnimatedText";
import { MockupFrame } from "@/components/MockupFrame";

// ─── Pattern 1: Preset-based ────────────────────────────────

/**
 * Using named presets - simplest approach
 */
export const PresetBasicExample = () => (
  <AbsoluteFill>
    <Background preset="deepPurpleAurora" />
    <AnimatedText
      text="Deep Purple Aurora"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const PresetMidnightOcean = () => (
  <AbsoluteFill>
    <Background preset="midnightOcean" />
    <AnimatedText
      text="Midnight Ocean"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const PresetNeonDream = () => (
  <AbsoluteFill>
    <Background preset="neonDream" />
    <AnimatedText
      text="Neon Dream"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const PresetSoftLavender = () => (
  <AbsoluteFill>
    <Background preset="softLavender" />
    <AnimatedText
      text="Soft Lavender"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#333333"
    />
  </AbsoluteFill>
);

// ─── Pattern 2: Type/Variant API (BackgroundRig compat) ─────

/**
 * Simple type/variant API - backwards compatible with BackgroundRig
 */
export const TypeVariantGradientMesh = () => (
  <AbsoluteFill>
    <Background type="gradient-mesh" variant="dark" animated />
    <AnimatedText
      text="Gradient Mesh (Dark)"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const TypeVariantGridLines = () => (
  <AbsoluteFill>
    <Background type="grid-lines" variant="dark" />
    <AnimatedText
      text="Grid Lines"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const TypeVariantBlobs = () => (
  <AbsoluteFill>
    <Background type="blobs" variant="light" animated />
    <AnimatedText
      text="Blobs"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#333333"
    />
  </AbsoluteFill>
);

export const TypeVariantCustomColors = () => (
  <AbsoluteFill>
    <Background
      type="gradient-mesh"
      variant="light"
      meshColors={{
        primary: "rgba(255, 100, 100, 0.3)",
        secondary: "rgba(100, 100, 255, 0.25)",
      }}
      animated
    />
    <AnimatedText
      text="Custom Colors"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#333333"
    />
  </AbsoluteFill>
);

// ─── Pattern 3: Layer-based (Full Control) ──────────────────

/**
 * Full layer control for maximum flexibility
 */
export const LayerBasicExample = () => (
  <AbsoluteFill>
    <Background
      layers={[
        { type: "solid", color: "#0a0a1a" },
        {
          type: "radial",
          colors: ["#7c3aed", "#4c1d95", "transparent"],
          centerX: 50,
          centerY: 45,
          radius: 55,
        },
        { type: "noise", opacity: 0.025 },
        { type: "vignette", intensity: 0.5, radius: 35 },
      ]}
      animated
      animationSpeed={0.5}
    />
    <AnimatedText
      text="Custom Layers"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const LayerMultipleGlows = () => (
  <AbsoluteFill>
    <Background
      layers={[
        { type: "solid", color: "#0a0a0a" },
        { type: "glow", color: "#8b5cf6", x: 30, y: 40, radius: 35, intensity: 0.55 },
        { type: "glow", color: "#06b6d4", x: 70, y: 55, radius: 30, intensity: 0.5 },
        { type: "glow", color: "#ec4899", x: 50, y: 75, radius: 25, intensity: 0.35 },
        { type: "noise", opacity: 0.02 },
      ]}
      animated
      animationSpeed={0.4}
    />
    <AnimatedText
      text="Multiple Glows"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const LayerMeshGradient = () => (
  <AbsoluteFill>
    <Background
      layers={[
        { type: "solid", color: "#042f2e" },
        {
          type: "mesh",
          colors: ["#0d9488", "#0284c7", "#1e40af", "#059669"],
          points: [
            { x: 25, y: 20 },
            { x: 75, y: 30 },
            { x: 50, y: 75 },
            { x: 15, y: 60 },
          ],
          spread: 50,
          opacity: 0.7,
        },
        { type: "noise", opacity: 0.02 },
        { type: "vignette", intensity: 0.4, radius: 35 },
      ]}
      animated
      animationSpeed={0.35}
    />
    <AnimatedText
      text="Mesh Gradient"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

export const LayerGlassmorphism = () => (
  <AbsoluteFill>
    <Background
      layers={[
        { type: "linear", colors: ["#e0e7ff", "#c7d2fe", "#a5b4fc"], angle: 135 },
        { type: "blur", amount: 50 },
        { type: "noise", opacity: 0.03 },
      ]}
    />
    <AnimatedText
      text="Glassmorphism"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#333333"
    />
  </AbsoluteFill>
);

export const LayerGridWithGlow = () => (
  <AbsoluteFill>
    <Background
      layers={[
        { type: "solid", color: "#0F0F11" },
        { type: "glow", color: "#3b82f6", x: 50, y: 50, radius: 60, intensity: 0.3 },
        { type: "grid", color: "rgba(255,255,255,0.05)", size: 60 },
      ]}
      animated
    />
    <AnimatedText
      text="Grid + Glow"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={64}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

// ─── Real-World Compositions ────────────────────────────────

/**
 * Hero section with centered text
 */
export const HeroSection = () => (
  <AbsoluteFill>
    <Background preset="deepPurpleAurora" />

    <AnimatedText
      text="Welcome"
      preset="fadeBlurIn"
      anchor="center"
      offsetY={-50}
      fontSize={96}
      fontWeight={700}
      color="#FFFFFF"
    />

    <AnimatedText
      text="To the future of video"
      preset="fadeBlurIn"
      blur={{ delay: 15 }}
      opacity={{ delay: 15 }}
      anchor="center"
      offsetY={50}
      fontSize={32}
      color="#AAAAAA"
    />
  </AbsoluteFill>
);

/**
 * Product showcase with mockup
 */
export const ProductShowcase = () => (
  <AbsoluteFill>
    <Background preset="midnightOcean" />

    <MockupFrame
      type="browser"
      src="/product-screenshot.png"
      preset="springIn"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
      width={900}
    />
  </AbsoluteFill>
);

/**
 * Technical/developer content with grid background
 */
export const TechnicalContent = () => (
  <AbsoluteFill>
    <Background
      layers={[
        { type: "solid", color: "#0F0F11" },
        { type: "grid", color: "rgba(255,255,255,0.03)", size: 40 },
        { type: "vignette", intensity: 0.3, radius: 50 },
      ]}
    />

    <AnimatedText
      text="Building the future"
      preset="slideInUp"
      animationUnit="word"
      stagger={5}
      anchor="center"
      fontSize={72}
      fontWeight={700}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

/**
 * Energetic/bold scene with neon colors
 */
export const NeonScene = () => (
  <AbsoluteFill>
    <Background preset="neonDream" />

    <AnimatedText
      text="LAUNCH"
      preset="scaleUp"
      anchor="center"
      fontSize={120}
      fontWeight={900}
      gradient={{
        colors: ["#8b5cf6", "#06b6d4", "#ec4899"],
        angle: 90,
      }}
    />
  </AbsoluteFill>
);

// ─── Preset Showcase (cycles through presets) ───────────────

/**
 * Showcases all available presets
 */
export const PresetShowcase = () => {
  const presetNames = listBackgroundPresets();
  // This would need frame-based logic to cycle through presets
  // For now, just showing first preset
  return (
    <AbsoluteFill>
      <Background preset={presetNames[0]} />
      <AnimatedText
        text={presetNames[0]}
        preset="fadeBlurIn"
        anchor="bottom-center"
        offsetY={-50}
        fontSize={32}
        color="#FFFFFF"
      />
    </AbsoluteFill>
  );
};

// ─── Remotion Compositions ──────────────────────────────────

export const BackgroundExampleCompositions = () => {
  return (
    <>
      <Composition
        id="PresetBasic"
        component={PresetBasicExample}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LayerMultipleGlows"
        component={LayerMultipleGlows}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HeroSection"
        component={HeroSection}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="NeonScene"
        component={NeonScene}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
