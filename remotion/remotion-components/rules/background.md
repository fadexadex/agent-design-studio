---
name: background
description: Background component for composable animated backgrounds with layers, presets, and legacy BackgroundRig compatibility
metadata:
  tags: background, gradient, mesh, grid, animation, blobs, vignette, glow, noise, layers
---

## Overview

Background is a composable background component that supports three usage patterns:

1. **Preset-based** - Use named presets for instant professional backgrounds
2. **Type/Variant API** - BackgroundRig-compatible simple API
3. **Layer-based** - Full control with composable layer system

All animations are frame-based for proper video rendering.

**This component replaces BackgroundRig** (which is now deprecated).

## Import

```tsx
import {
  Background,
  backgroundPresets,
  getBackgroundPreset,
  listBackgroundPresets,
  useAnimationEngine,
  type BackgroundProps,
  type BackgroundLayerConfig,
  type BackgroundPreset,
} from "@/components/Global";

// Individual layers (for advanced use)
import {
  SolidLayer,
  LinearGradientLayer,
  RadialGradientLayer,
  MeshGradientLayer,
  NoiseLayer,
  BlurLayer,
  VignetteLayer,
  GlowLayer,
  GridLayer,
} from "@/components/Global";
```

## Props

```typescript
interface BackgroundProps {
  /**
   * Pattern 1: Use a preset by name.
   * Takes precedence over layers/type/variant.
   */
  preset?: string;

  /**
   * Pattern 2: Simple type/variant API (BackgroundRig compatible).
   */
  type?: "gradient-mesh" | "grid-lines" | "blobs" | "solid";
  variant?: "dark" | "light" | "brand";
  meshColors?: {
    primary?: string;
    secondary?: string;
  };

  /**
   * Pattern 3: Full layer control.
   * Ordered array of layers (rendered bottom → top).
   */
  layers?: BackgroundLayerConfig[];

  /** Enable animation globally. Default: depends on pattern */
  animated?: boolean;
  /** Global animation speed multiplier. Default: 1 */
  animationSpeed?: number;
  /** Additional CSS class name. */
  className?: string;
}
```

## Three Usage Patterns

### Pattern 1: Preset-based (Simplest)

Use named presets for instant professional backgrounds:

```tsx
// Dark cinematic
<Background preset="deepPurpleAurora" />

// Calm techy
<Background preset="midnightOcean" />

// Cyberpunk neon
<Background preset="neonDream" />

// Override animation settings
<Background preset="oceanMesh" animated={false} />
<Background preset="sunsetBlaze" animationSpeed={2} />
```

### Pattern 2: Type/Variant API (BackgroundRig Compatible)

Simple API for quick backgrounds - same as the deprecated BackgroundRig:

```tsx
// Animated gradient mesh
<Background type="gradient-mesh" variant="dark" />

// Grid lines overlay
<Background type="grid-lines" variant="light" />

// Organic blobs
<Background type="blobs" variant="brand" />

// Solid color
<Background type="solid" variant="dark" />

// Custom colors
<Background
  type="gradient-mesh"
  variant="light"
  meshColors={{
    primary: "rgba(255, 100, 100, 0.3)",
    secondary: "rgba(100, 100, 255, 0.25)",
  }}
/>
```

### Pattern 3: Layer-based (Most Flexible)

Full control with composable layers:

```tsx
<Background
  layers={[
    { type: "solid", color: "#0a0a2e" },
    { type: "radial", colors: ["#7b2ff7", "transparent"], centerX: 50, centerY: 50 },
    { type: "glow", color: "#3b82f6", x: 25, y: 75, radius: 40 },
    { type: "noise", opacity: 0.03 },
    { type: "vignette", intensity: 0.4 },
  ]}
  animated
  animationSpeed={0.8}
/>
```

## Layer Types

### solid - Solid Color Fill

```typescript
interface SolidLayerConfig {
  type: "solid";
  color: string; // Any CSS color
  opacity?: number; // 0-1, default: 1
  blendMode?: CSSProperties["mixBlendMode"];
  animated?: boolean;
  animationSpeed?: number;
}
```

```tsx
{ type: "solid", color: "#0F0F11" }
{ type: "solid", color: "rgba(0,0,0,0.8)", blendMode: "multiply" }
```

### linear - Linear Gradient

```typescript
interface LinearGradientLayerConfig {
  type: "linear";
  colors: string[]; // At least 2 color stops
  angle?: number; // Degrees, default: 135
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
  animated?: boolean; // Rotates when animated
  animationSpeed?: number;
}
```

```tsx
{ type: "linear", colors: ["#7c2d12", "#581c87"], angle: 135 }
{ type: "linear", colors: ["#f0f9ff", "#e0f2fe", "#dbeafe"], angle: 160 }
```

### radial - Radial Gradient

```typescript
interface RadialGradientLayerConfig {
  type: "radial";
  colors: string[]; // At least 2 color stops
  centerX?: number; // 0-100, default: 50
  centerY?: number; // 0-100, default: 50
  radius?: number; // Percentage, default: farthest-corner
  shape?: "circle" | "ellipse"; // Default: ellipse
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
  animated?: boolean; // Center drifts when animated
  animationSpeed?: number;
}
```

```tsx
{ type: "radial", colors: ["#7c3aed", "#4c1d95", "transparent"], centerX: 50, centerY: 45, radius: 55 }
{ type: "radial", colors: ["#bae6fd", "transparent"], centerX: 40, centerY: 45, radius: 50, opacity: 0.5 }
```

### mesh - Mesh Gradient (Multi-point Blobs)

```typescript
interface MeshGradientLayerConfig {
  type: "mesh";
  colors: string[]; // Colors for each blob
  points?: Array<{ x: number; y: number }>; // Blob positions (0-100)
  spread?: number; // Blob size percentage, default: 50
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
  animated?: boolean; // Points drift organically when animated
  animationSpeed?: number;
}
```

```tsx
{ type: "mesh", colors: ["#c4b5fd", "#93c5fd", "#86efac", "#fde68a"], spread: 55 }
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
}
```

### noise - SVG Noise Texture

```typescript
interface NoiseLayerConfig {
  type: "noise";
  frequency?: number; // feTurbulence frequency, default: 0.9
  octaves?: number; // Number of octaves, default: 4
  opacity?: number; // Default: 0.03
  blendMode?: CSSProperties["mixBlendMode"]; // Default: "overlay"
}
```

```tsx
{ type: "noise", opacity: 0.025 }
{ type: "noise", frequency: 0.8, octaves: 3, opacity: 0.02 }
```

### blur - Backdrop Blur

```typescript
interface BlurLayerConfig {
  type: "blur";
  amount?: number; // Pixels, default: 40
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
  animated?: boolean; // Blur amount pulses when animated
  animationSpeed?: number;
}
```

```tsx
{ type: "blur", amount: 50 }
{ type: "blur", amount: 30, animated: true }
```

### vignette - Edge Darkening

```typescript
interface VignetteLayerConfig {
  type: "vignette";
  color?: string; // Vignette color, default: "#000000"
  intensity?: number; // 0-1, default: 0.5
  radius?: number; // Inner radius %, default: 40
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
  animated?: boolean; // Intensity pulses when animated
  animationSpeed?: number;
}
```

```tsx
{ type: "vignette", intensity: 0.5, radius: 35 }
{ type: "vignette", color: "#0a0502", intensity: 0.5, radius: 30 }
```

### glow - Soft Glow Blob

```typescript
interface GlowLayerConfig {
  type: "glow";
  color: string; // Glow color (required)
  x?: number; // Position 0-100, default: 50
  y?: number; // Position 0-100, default: 50
  radius?: number; // Size %, default: 30
  intensity?: number; // 0-1, default: 0.6
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
  animated?: boolean; // Position drifts, intensity pulses when animated
  animationSpeed?: number;
}
```

```tsx
{ type: "glow", color: "#0d9488", x: 60, y: 40, radius: 35, intensity: 0.35 }
{ type: "glow", color: "#8b5cf6", x: 30, y: 40, radius: 35, intensity: 0.55 }
```

### grid - Grid Lines Pattern

```typescript
interface GridLayerConfig {
  type: "grid";
  color?: string; // Line color, default: "rgba(255,255,255,0.05)"
  size?: number; // Cell size in pixels, default: 60
  strokeWidth?: number; // Line width, default: 1
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
}
```

```tsx
{ type: "grid", color: "rgba(255,255,255,0.05)", size: 60 }
{ type: "grid", color: "rgba(0,0,0,0.05)", size: 40, strokeWidth: 2 }
```

## Available Presets

### Dark & Dramatic

| Preset | Description |
|--------|-------------|
| `deepPurpleAurora` | Rich purple center fading into deep blue — cinematic, premium feel |
| `midnightOcean` | Deep navy with subtle teal glow — calm, techy, professional |
| `cosmicNight` | Starless deep space with subtle color nebulae |
| `darkElegance` | Near-black with barely-there warm gradient — ultra-minimal dark mode |

### Warm Tones

| Preset | Description |
|--------|-------------|
| `sunsetBlaze` | Warm orange-to-purple gradient with golden center glow |
| `warmEmber` | Cozy dark amber with subtle orange-red glows |

### Cool Tones

| Preset | Description |
|--------|-------------|
| `arcticFrost` | Icy whites and light blues — clean, modern, airy |

### Soft / Light

| Preset | Description |
|--------|-------------|
| `softLavender` | Gentle purple mist — elegant, dreamy, approachable |
| `frostedGlass` | Glassmorphism — blurred, luminous, modern UI feel |

### Neon / Bold

| Preset | Description |
|--------|-------------|
| `neonDream` | Dark base with vibrant colored glows — cyberpunk, energetic |

### Mesh / Organic

| Preset | Description |
|--------|-------------|
| `pastelMesh` | Soft multi-color mesh gradient — playful, creative, fresh |
| `oceanMesh` | Deep blue-green mesh — fluid, immersive, nature-inspired |

### BackgroundRig-compatible Presets

| Preset | Description |
|--------|-------------|
| `light-gradient-mesh` | Light background with purple/pink gradient blobs |
| `dark-gradient-mesh` | Dark background with purple/pink gradient blobs |
| `brand-gradient-mesh` | Indigo background with white gradient blobs |
| `light-grid-lines` | White background with subtle dark grid |
| `dark-grid-lines` | Dark background with subtle light grid |
| `brand-grid-lines` | Indigo background with white grid |
| `light-blobs` | Light background with organic purple/pink shapes |
| `dark-blobs` | Dark background with organic purple/pink shapes |
| `brand-blobs` | Indigo background with organic white shapes |
| `light-solid` | Plain white background |
| `dark-solid` | Plain dark background |
| `brand-solid` | Plain indigo background |

## useAnimationEngine Hook

For creating custom layers or advanced animations:

```typescript
function useAnimationEngine(options?: {
  animated?: boolean;
  animationSpeed?: number;
}): {
  frame: number;
  oscillate: (min: number, max: number, period?: number) => number;
  rotate: (startAngle: number, period?: number) => number;
  pulse: (base: number, amplitude: number, period?: number) => number;
  drift: (center: number, range: number, period?: number) => number;
  animated: boolean;
};
```

```tsx
const { oscillate, pulse, drift, rotate } = useAnimationEngine({
  animated: true,
  animationSpeed: 0.5,
});

// Oscillate between 10 and 20 over 300 frames
const opacity = oscillate(0.5, 1.0, 200);

// Pulse around 50 by ±10
const size = pulse(50, 10, 250);

// Drift around center position
const x = drift(50, 5, 400);

// Continuous rotation
const angle = rotate(0, 600);
```

## Common Patterns

### Hero Section

```tsx
const HeroScene = () => {
  return (
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
};
```

### Dark Mode Product Shot

```tsx
const ProductScene = () => {
  return (
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
};
```

### Custom Layered Background

```tsx
const CustomBackground = () => {
  return (
    <AbsoluteFill>
      <Background
        layers={[
          // Base dark color
          { type: "solid", color: "#0a0a1a" },
          // Primary gradient
          {
            type: "radial",
            colors: ["#7c3aed", "#4c1d95", "transparent"],
            centerX: 50,
            centerY: 45,
            radius: 55,
          },
          // Secondary accent
          {
            type: "glow",
            color: "#06b6d4",
            x: 70,
            y: 60,
            radius: 30,
            intensity: 0.4,
          },
          // Texture
          { type: "noise", opacity: 0.025 },
          // Vignette for depth
          { type: "vignette", intensity: 0.5, radius: 35 },
        ]}
        animated
        animationSpeed={0.5}
      />
    </AbsoluteFill>
  );
};
```

### Technical/Grid Background

```tsx
const TechScene = () => {
  return (
    <AbsoluteFill>
      <Background
        layers={[
          { type: "solid", color: "#0F0F11" },
          { type: "grid", color: "rgba(255,255,255,0.05)", size: 60 },
        ]}
      />

      <BentoGrid columns={3} gap={20}>
        <BentoItem>
          <CodeCard />
        </BentoItem>
        <BentoItem>
          <TerminalCard />
        </BentoItem>
        <BentoItem>
          <DiagramCard />
        </BentoItem>
      </BentoGrid>
    </AbsoluteFill>
  );
};
```

### Migrating from BackgroundRig

```tsx
// ❌ OLD - BackgroundRig (deprecated)
<BackgroundRig type="gradient-mesh" variant="dark" animate animationSpeed={0.5} />

// ✅ NEW - Background with type/variant API
<Background type="gradient-mesh" variant="dark" animated animationSpeed={0.5} />

// ✅ BETTER - Background with preset
<Background preset="dark-gradient-mesh" />

// ✅ BEST - Background with full layer control
<Background
  layers={[
    { type: "solid", color: "#0F0F11" },
    { type: "glow", color: "#6366F1", x: 30, y: 30, radius: 50, intensity: 0.8 },
    { type: "glow", color: "#EC4899", x: 70, y: 70, radius: 45, intensity: 0.7 },
  ]}
  animated
/>
```

## Best Practices

1. **Use presets first** - They're pre-tuned for professional results
2. **Keep animation speed subtle** - 0.3-0.5 works best for backgrounds; higher values feel chaotic
3. **Layer order matters** - Layers render bottom-to-top; put solid base first
4. **Add noise for texture** - A subtle noise layer (opacity 0.02-0.03) adds polish
5. **Use vignette for depth** - Darkened edges draw attention to center
6. **Match variant to theme** - Keep background consistent with content

## CRITICAL: Common Mistakes

```tsx
// ❌ WRONG - Using old BackgroundRig props
<Background
  type="gradient-mesh"
  animate={true}         // ❌ It's "animated", not "animate"
  speed={0.5}            // ❌ It's "animationSpeed", not "speed"
  colors={["#000"]}      // ❌ No "colors" prop - use layers or meshColors
/>

// ✅ CORRECT
<Background
  type="gradient-mesh"
  variant="dark"
  animated={true}
  animationSpeed={0.5}
  meshColors={{ primary: "#6366F1", secondary: "#EC4899" }}
/>
```

```tsx
// ❌ WRONG - Invalid layer type
<Background layers={[
  { type: "gradient", colors: ["#000", "#111"] }  // ❌ No "gradient" type
]} />

// ✅ CORRECT - Use "linear" or "radial"
<Background layers={[
  { type: "linear", colors: ["#000", "#111"], angle: 135 }
]} />
```

```tsx
// ❌ WRONG - Forgetting required props
<Background layers={[
  { type: "glow", x: 50, y: 50 }  // ❌ "color" is required for glow
]} />

// ✅ CORRECT
<Background layers={[
  { type: "glow", color: "#8b5cf6", x: 50, y: 50 }
]} />
```

```tsx
// ❌ WRONG - Using CSS animations
<Background
  layers={[{ type: "solid", color: "#000" }]}
  style={{ animation: "pulse 2s infinite" }}  // ❌ CSS animations don't render in Remotion
/>

// ✅ CORRECT - Use animated prop for frame-based animation
<Background
  layers={[{ type: "solid", color: "#000" }]}
  animated
/>
```

## See Also

- [AnimatedText](animated-text.md) - Text to overlay on backgrounds
- [MockupFrame](mockup-frame.md) - Device frames to showcase on backgrounds
- [Layout](layout.md) - Animated layouts for content over backgrounds
- [BackgroundRig](background-rig.md) - Legacy component (deprecated)
