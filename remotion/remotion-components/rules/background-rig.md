---
name: background-rig
description: (DEPRECATED) BackgroundRig component - use Background instead for animated backgrounds
metadata:
  tags: background, gradient, mesh, grid, animation, blobs, deprecated
---

> **DEPRECATED:** This component is deprecated. Use the new `Background` component instead, which provides the same functionality plus presets, layer-based composition, and more effects.
>
> See [Background](background.md) for the recommended replacement.

## Migration Guide

```tsx
// ❌ OLD - BackgroundRig
<BackgroundRig type="gradient-mesh" variant="dark" animate animationSpeed={0.5} />

// ✅ NEW - Background (same API works!)
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

---

## Overview (Legacy Documentation)

BackgroundRig provides animated background effects for Remotion compositions:

- **gradient-mesh** - Floating gradient blobs with movement
- **grid-lines** - Subtle grid pattern
- **blobs** - Organic pulsing shapes
- **solid** - Plain solid color

All animations are frame-based for proper video rendering.

## Import

```tsx
import {
  BackgroundRig,
  type BackgroundRigProps,
  type BackgroundType,
  type BackgroundVariant,
} from "@/components/Global";
```

## Props

```typescript
interface BackgroundRigProps {
  /**
   * Type of background effect.
   */
  type: BackgroundType; // 'gradient-mesh' | 'grid-lines' | 'blobs' | 'solid'

  /**
   * Color variant preset.
   * @default "light"
   */
  variant?: BackgroundVariant; // 'dark' | 'light' | 'brand'

  /**
   * Whether to animate the background.
   * @default true
   */
  animate?: boolean;

  /**
   * Animation speed multiplier. Higher = faster.
   * @default 1
   */
  animationSpeed?: number;

  /**
   * Custom gradient colors for mesh/blob backgrounds.
   */
  meshColors?: {
    primary?: string;
    secondary?: string;
  };

  /**
   * Additional CSS classes.
   */
  className?: string;
}
```

## Background Types

### gradient-mesh

Floating gradient orbs that drift slowly:

```tsx
<BackgroundRig type="gradient-mesh" variant="light" />
```

### grid-lines

Subtle grid pattern overlay:

```tsx
<BackgroundRig type="grid-lines" variant="dark" />
```

### blobs

Organic pulsing circular shapes:

```tsx
<BackgroundRig type="blobs" variant="light" />
```

### solid

Plain solid color background:

```tsx
<BackgroundRig type="solid" variant="dark" />
```

## Variants

| Variant | Background Color   | Accent Colors                |
| ------- | ------------------ | ---------------------------- |
| `light` | `#FFFFFF`          | Purple/pink tints            |
| `dark`  | `#0F0F11`          | Purple/pink (more saturated) |
| `brand` | `#4F46E5` (Indigo) | White tints                  |

## Usage Examples

### Basic Light Background

```tsx
<AbsoluteFill>
  <BackgroundRig type="gradient-mesh" variant="light" />
  <YourContent />
</AbsoluteFill>
```

### Dark Mode

```tsx
<AbsoluteFill>
  <BackgroundRig type="gradient-mesh" variant="dark" />
  <AnimatedText
    text="Dark Mode"
    color="#FFFFFF"
    anchor="center"
    fontSize={72}
  />
</AbsoluteFill>
```

### Static Background (No Animation)

```tsx
<BackgroundRig type="gradient-mesh" variant="light" animate={false} />
```

### Slower Animation

```tsx
<BackgroundRig
  type="blobs"
  variant="light"
  animationSpeed={0.5} // Half speed
/>
```

### Faster Animation

```tsx
<BackgroundRig
  type="gradient-mesh"
  variant="dark"
  animationSpeed={2} // Double speed
/>
```

### Custom Colors

```tsx
<BackgroundRig
  type="gradient-mesh"
  variant="light"
  meshColors={{
    primary: "rgba(255, 100, 100, 0.3)", // Red tint
    secondary: "rgba(100, 100, 255, 0.25)", // Blue tint
  }}
/>
```

### Grid Lines Overlay

```tsx
<AbsoluteFill>
  {/* Solid base */}
  <BackgroundRig type="solid" variant="dark" />

  {/* Grid overlay - note: rendered separately */}
  <BackgroundRig type="grid-lines" variant="dark" />

  <YourContent />
</AbsoluteFill>
```

## Common Patterns

### Hero Section

```tsx
const HeroScene = () => {
  return (
    <AbsoluteFill>
      <BackgroundRig type="gradient-mesh" variant="light" />

      <AnimatedText
        text="Welcome"
        preset="fadeBlurIn"
        anchor="center"
        offsetY={-50}
        fontSize={96}
        fontWeight={700}
      />

      <AnimatedText
        text="To the future of video"
        preset="fadeBlurIn"
        blur={{ delay: 15 }}
        opacity={{ delay: 15 }}
        anchor="center"
        offsetY={50}
        fontSize={32}
        color="#666666"
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
      <BackgroundRig type="blobs" variant="dark" animationSpeed={0.7} />

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

### Brand Themed

```tsx
const BrandScene = () => {
  return (
    <AbsoluteFill>
      <BackgroundRig
        type="gradient-mesh"
        variant="brand"
        meshColors={{
          primary: "rgba(255, 255, 255, 0.25)",
          secondary: "rgba(255, 255, 255, 0.15)",
        }}
      />

      <AnimatedText
        text="Your Brand"
        preset="scaleIn"
        anchor="center"
        fontSize={80}
        fontWeight={800}
        color="#FFFFFF"
      />
    </AbsoluteFill>
  );
};
```

### Grid for Technical Content

```tsx
const TechScene = () => {
  return (
    <AbsoluteFill>
      <BackgroundRig type="grid-lines" variant="dark" />

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

### Combining Multiple Layers

```tsx
// For complex backgrounds, layer multiple components
const LayeredBackground = () => {
  return (
    <AbsoluteFill>
      {/* Base solid color */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#0A0A0B",
          zIndex: -3,
        }}
      />

      {/* Gradient layer */}
      <BackgroundRig
        type="gradient-mesh"
        variant="dark"
        meshColors={{
          primary: "rgba(99, 102, 241, 0.4)",
          secondary: "rgba(236, 72, 153, 0.3)",
        }}
      />

      {/* Content */}
      <YourContent />
    </AbsoluteFill>
  );
};
```

## Technical Notes

- BackgroundRig uses `zIndex: -1` internally to stay behind content
- Animations use `useCurrentFrame()` and math functions (sin/cos) for movement
- Grid lines are rendered as SVG patterns
- Mesh gradients use radial-gradient with blur filters

## Best Practices

1. **Use light variant for light content** - Ensures readability
2. **Keep animation speed subtle** - 0.5-1.5 works best; higher values feel chaotic
3. **Match variant to overall theme** - Consistent throughout video
4. **Layer carefully** - BackgroundRig should be the first child in AbsoluteFill
5. **Test rendering** - Complex backgrounds may affect render performance

## CRITICAL: Common Mistakes

```tsx
// ❌ WRONG - these props DO NOT EXIST
<BackgroundRig 
  type="gradient-mesh" 
  colors={['#000', '#111']}    // ❌ No "colors" prop
  opacity={0.5}                 // ❌ No "opacity" prop  
  speed={1}                     // ❌ No "speed" prop
/>

// ✅ CORRECT - use the actual props
<BackgroundRig 
  type="gradient-mesh" 
  variant="dark"                          // Use variant for color presets
  meshColors={{ primary: '#000', secondary: '#111' }}  // Use meshColors for custom colors
  animationSpeed={1}                      // Use animationSpeed, not speed
/>
```

## When to Use What

| Scenario               | Type            | Variant                      |
| ---------------------- | --------------- | ---------------------------- |
| Marketing hero         | `gradient-mesh` | `light` or `brand`           |
| Technical/code content | `grid-lines`    | `dark`                       |
| Organic/creative       | `blobs`         | `light`                      |
| Simple/professional    | `solid`         | any                          |
| High-energy            | `gradient-mesh` | with higher `animationSpeed` |

## See Also

- [Background](background.md) - **Recommended replacement** with presets, layers, and more effects
- [AnimatedText](animated-text.md) - Text to overlay on backgrounds
- [MockupFrame](mockup-frame.md) - Device frames to showcase on backgrounds
- [Layout](layout.md) - Animated layouts for content over backgrounds
