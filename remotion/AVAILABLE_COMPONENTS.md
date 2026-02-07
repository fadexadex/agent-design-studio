# Remotion Component Library Breakdown

This document provides a breakdown of the available components in `remotion/src/components` and `remotion/remotion-components`.

## Core Components

### 1. AnimatedText
**Path:** `@/components/AnimatedText`
**Purpose:** Renders text with built-in animations, eliminating the need for manual interpolation.
**Key Features:**
- **Presets:** `fadeBlurIn`, `slideInUp`, `typewriter`, `glitchReveal`, etc.
- **Animation Units:** Animate by `word`, `character`, `line`, or `full` text.
- **Stagger:** Control delay between units.
- **Positioning:** Semantic positioning (e.g., `center`, `top-left`) with offsets.
- **Sub-components:**
    - `LayoutGrid`: Arranges multiple text elements.
    - `TextSequence`: Chains text animations sequentially.

**Example:**
```tsx
<AnimatedText 
  text="Hello World" 
  preset="fadeBlurIn" 
  animationUnit="word" 
  stagger={5} 
/>
```

### 2. Background
**Path:** `@/components/Global`
**Purpose:** Creates composable, animated backgrounds.
**Usage Patterns:**
- **Presets:** Pre-configured styles like `deepPurpleAurora` or `neonDream`.
- **Type/Variant:** Compatible with the legacy `BackgroundRig` API (e.g., `type="gradient-mesh"`).
- **Layers:** highly customizable compositions using layers (solid, linear/radial gradients, mesh, noise, glow, etc.).

**Example:**
```tsx
<Background preset="deepPurpleAurora" />
// or
<Background 
  layers={[
    { type: 'solid', color: '#000' },
    { type: 'glow', color: '#f00', x: 50, y: 50 }
  ]} 
/>
```

### 3. MockupFrame
**Path:** `@/components/MockupFrame`
**Purpose:** Wraps content in device mockups with consistent animations.
**Types:** `browser`, `iphone15`, `iphone-notch`, `card`, `plain`.
**Key Features:**
- **Glass Effect:** frosted glass visuals.
- **Reflections:** screen glare.
- **3D Rotation:** built-in rotate prop.
- **Sub-component:** `FrameSequence` for showing multiple devices in sequence.

**Example:**
```tsx
<MockupFrame type="browser" src="/screenshot.png" glass />
```

### 4. CameraRig
**Path:** `@/components/Camera`
**Purpose:** Acts as a virtual camera to apply zoom, pan, and rotation to its children.
**Key Props:** `zoom`, `x`, `y`, `rotation`, `focusPoint`.

**Example:**
```tsx
<CameraRig zoom={1.5} x={100}>
  <YourScene />
</CameraRig>
```

### 5. MotionContainer
**Path:** `@/components/Layout`
**Purpose:** A wrapper to apply consistent entrance and exit animations to any content.
**States:**
- **Initial:** `hidden`, `offscreen-bottom`, `scale-down`, etc.
- **Exit:** `fade-out`, `slide-down`, etc.

**Example:**
```tsx
<MotionContainer initial="offscreen-bottom" delay={10}>
  <Content />
</MotionContainer>
```

### 6. BentoGrid
**Path:** `@/components/Layout`
**Purpose:** Creates a CSS Grid layout where items animate in with a stagger.
**Sub-component:** `BentoItem` for individual cells (supports `colSpan`, `rowSpan`).

**Example:**
```tsx
<BentoGrid columns={3} gap={20}>
  <BentoItem colSpan={2}>Item 1</BentoItem>
  <BentoItem>Item 2</BentoItem>
</BentoGrid>
```

### 7. DynamicCursor
**Path:** `@/components/DynamicCursor`
**Purpose:** Simulates a mouse cursor for UI demos.
**Features:**
- **Variants:** `arrow`, `pointer`, `text`, `grab`, etc.
- **Clicks:** Visual ripple effect on click.
- **Sub-component:** `CursorPath` to animate along a defined path.

**Example:**
```tsx
<DynamicCursor x={100} y={100} variant="pointer" isClicking={true} />
```

### 8. Transitions
**Path:** `@/components/Transitions`
**Purpose:** Scene transitions.
**Components:**
- `TransitionSeries`: Orchestrates sequences of scenes with transitions.
- `IrisTransition`: A circular wipe transition (looney tunes style).

**Example:**
```tsx
<IrisTransition mode="enter" />
```

## Legacy & Generated

### BackgroundRig (Deprecated)
**Path:** `@/components/Global`
**Status:** Deprecated. Use `Background` instead. Kept for backward compatibility.

### Generated Components
**Path:** `@/components/Generated`
**Purpose:** Reserved for AI-generated components that don't fit into the standard library. Currently contains a registry system for future expansions.

---

For full implementation details, refer to `remotion/remotion-components/COMPONENT-CATALOG.md`.
