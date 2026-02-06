---
name: mockup-frame
description: MockupFrame component for device frames (browser, iPhone, card) with animations, glass effects, and 3D rotation
metadata:
  tags: mockup, device, frame, browser, iphone, animation, 3d
---

## Overview

MockupFrame renders content inside device frames with built-in animations. Supports:

- **5 frame types** (browser, iphone15, iphone-notch, card, plain)
- **Glass effects** with backdrop blur
- **Glare overlay** for realistic screen reflections
- **3D rotation animations** with perspective
- **Entrance and exit presets**
- **FrameSequence** for staggered multi-frame compositions

## Import

```tsx
import {
  MockupFrame,
  FrameSequence,
  type MockupFrameProps,
  type FrameType,
  type ThemeType,
  type EntrancePresetType,
  type ExitPresetType,
  type RotateAnimation,
  type GlassConfig,
  type BrowserConfig,
} from "@/components/MockupFrame";
```

## MockupFrame Props

```typescript
interface MockupFrameProps {
  // Content
  src?: string; // Image/video URL
  children?: ReactNode; // Custom content

  // Frame type
  type?: FrameType; // 'browser' | 'iphone15' | 'iphone-notch' | 'card' | 'plain'
  theme?: ThemeType; // 'light' | 'dark'
  glass?: boolean | GlassConfig;
  glare?: boolean; // Screen reflection effect

  // Browser-specific
  browserConfig?: BrowserConfig;

  // Entrance Animations
  preset?: EntrancePresetType;
  blur?: BlurAnimation | boolean;
  opacity?: OpacityAnimation | boolean;
  scale?: ScaleAnimation | boolean;
  position?: PositionAnimation | boolean;
  rotate?: RotateAnimation | boolean; // 3D rotation

  // Exit Animations
  exitPreset?: ExitPresetType;
  exitStartFrame?: number; // When to start exit animation

  // Sizing & Layering
  width?: number;
  height?: number;
  zIndex?: number;

  // Style escape hatch
  style?: CSSProperties;
  contentStyle?: CSSProperties;
}
```

## Frame Types

| Type           | Description                          | Default Size |
| -------------- | ------------------------------------ | ------------ |
| `browser`      | Browser window with address bar      | 800 x 600    |
| `iphone15`     | iPhone 15 Pro style (Dynamic Island) | 393 x 852    |
| `iphone-notch` | iPhone with notch                    | 390 x 844    |
| `card`         | Rounded card frame                   | 400 x 300    |
| `plain`        | No frame decoration                  | custom       |

## Entrance Presets

| Preset         | Description           |
| -------------- | --------------------- |
| `fadeIn`       | Fade in with opacity  |
| `springIn`     | Bouncy scale entrance |
| `slideInUp`    | Slide from bottom     |
| `slideInDown`  | Slide from top        |
| `slideInLeft`  | Slide from left       |
| `slideInRight` | Slide from right      |
| `rotateIn`     | 3D rotation entrance  |
| `none`         | No animation          |

## Exit Presets

| Preset          | Description           |
| --------------- | --------------------- |
| `fadeOut`       | Fade out              |
| `slideOutLeft`  | Slide to left         |
| `slideOutRight` | Slide to right        |
| `slideOutDown`  | Slide down            |
| `slideOutUp`    | Slide up              |
| `scaleDown`     | Scale down to nothing |
| `none`          | No exit animation     |

## Configuration Types

### BrowserConfig

```typescript
interface BrowserConfig {
  url?: string; // URL in address bar
  showButtons?: boolean; // Show traffic light buttons (default: true)
  title?: string; // Optional title in title bar
  borderGradient?: boolean | string; // Gradient outline
}
```

### GlassConfig

```typescript
interface GlassConfig {
  blur?: number; // Backdrop blur amount (default: 20)
  opacity?: number; // Background opacity (default: 0.5)
  borderOpacity?: number; // Border opacity (default: 0.2)
}
```

### RotateAnimation (3D)

```typescript
interface RotateAnimation {
  fromX?: number; // X-axis rotation in degrees
  toX?: number;
  fromY?: number; // Y-axis rotation in degrees
  toY?: number;
  fromZ?: number; // Z-axis rotation in degrees
  toZ?: number;
  perspective?: number; // Perspective distance (default: 1200)
  delay?: number;
  duration?: number;
  easing?: EasingType | SpringConfig;
}
```

### Animation Types

Same as AnimatedText - see [animated-text.md](animated-text.md) for:

- `BlurAnimation`
- `OpacityAnimation`
- `ScaleAnimation`
- `PositionAnimation`
- `EasingType`
- `SpringConfig`

## Usage Examples

### Basic Browser Frame

```tsx
<MockupFrame
  type="browser"
  src="/screenshots/dashboard.png"
  preset="springIn"
  browserConfig={{
    url: "https://myapp.com/dashboard",
    showButtons: true,
  }}
  width={900}
/>
```

### iPhone with Glass Effect

```tsx
<MockupFrame
  type="iphone15"
  src="/screenshots/mobile-app.png"
  preset="slideInUp"
  theme="dark"
  glass={{
    blur: 20,
    opacity: 0.6,
  }}
  glare
/>
```

### 3D Rotation Entrance

```tsx
<MockupFrame
  type="browser"
  src="/screenshots/hero.png"
  rotate={{
    fromY: -30,
    toY: 0,
    fromX: 10,
    toX: 0,
    perspective: 1200,
    easing: { type: "spring", damping: 15 },
  }}
  opacity={{ from: 0, to: 1, duration: 30 }}
  scale={{ from: 0.9, to: 1 }}
  width={1000}
/>
```

### Card with Custom Content

```tsx
<MockupFrame
  type="card"
  preset="fadeIn"
  glass
  theme="dark"
  width={400}
  height={250}
>
  <div style={{ padding: 24 }}>
    <h2>Custom Content</h2>
    <p>You can put any React content here</p>
  </div>
</MockupFrame>
```

### With Exit Animation

```tsx
<MockupFrame
  type="browser"
  src="/screenshot.png"
  preset="springIn"
  exitPreset="slideOutRight"
  exitStartFrame={90}
  browserConfig={{ url: "https://example.com" }}
/>
```

### Plain Frame (No Decoration)

```tsx
<MockupFrame type="plain" preset="fadeIn" width={800} height={600}>
  <img src="/custom-image.png" style={{ width: "100%", height: "100%" }} />
</MockupFrame>
```

## FrameSequence

Stagger multiple MockupFrames for weaving/overlapping entrances:

```typescript
interface FrameSequenceProps {
  children: ReactNode;
  stagger?: number; // Frames between each child's start (default: 15)
  startFrom?: number; // Global delay before sequence begins
}
```

### FrameSequence Example

```tsx
<FrameSequence stagger={20} startFrom={10}>
  <MockupFrame
    type="browser"
    src="/screen1.png"
    preset="slideInLeft"
    style={{ position: "absolute", left: 100, top: 100 }}
    width={600}
  />
  <MockupFrame
    type="iphone15"
    src="/mobile.png"
    preset="slideInRight"
    style={{ position: "absolute", right: 100, top: 150 }}
  />
  <MockupFrame
    type="card"
    preset="slideInUp"
    glass
    style={{ position: "absolute", left: 300, bottom: 100 }}
    width={300}
    height={200}
  >
    <NotificationCard />
  </MockupFrame>
</FrameSequence>
```

## Advanced: Device Frame Sub-Components

For custom compositions, you can use the device frame components directly:

```tsx
import {
  BrowserFrame,
  IPhoneFrame,
  CardFrame,
} from "@/components/MockupFrame";

// BrowserFrame
<BrowserFrame
  theme="dark"
  config={{ url: "https://example.com", showButtons: true }}
  width={800}
>
  <Content />
</BrowserFrame>

// IPhoneFrame
<IPhoneFrame
  variant="iphone15"  // or 'iphone-notch'
  theme="dark"
  glare
>
  <Content />
</IPhoneFrame>

// CardFrame
<CardFrame
  theme="light"
  glass={{ blur: 15, opacity: 0.4 }}
  width={400}
  height={300}
>
  <Content />
</CardFrame>
```

## Advanced: Animation Hooks

For fine-grained control over animations:

```tsx
import {
  useAnimationCalculator,
  useStyleComposer,
  useFrameRenderer,
} from "@/components/MockupFrame";
```

## Common Patterns

### Hero Section with Floating Mockups

```tsx
<AbsoluteFill>
  <FrameSequence stagger={15}>
    {/* Main browser in center-back */}
    <MockupFrame
      type="browser"
      src="/hero-desktop.png"
      preset="springIn"
      rotate={{ fromY: -5, toY: 0 }}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
      width={900}
      zIndex={1}
    />

    {/* Mobile on right, slightly forward */}
    <MockupFrame
      type="iphone15"
      src="/hero-mobile.png"
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

    {/* Card notification floating */}
    <MockupFrame
      type="card"
      preset="slideInUp"
      glass
      theme="dark"
      style={{
        position: "absolute",
        left: 100,
        bottom: 150,
      }}
      width={280}
      height={120}
      zIndex={3}
    >
      <NotificationContent />
    </MockupFrame>
  </FrameSequence>
</AbsoluteFill>
```

### Product Screenshot Showcase

```tsx
// Single centered mockup with dramatic entrance
<MockupFrame
  type="browser"
  src="/product-screenshot.png"
  browserConfig={{
    url: "https://yourproduct.com",
    title: "Your Product",
  }}
  rotate={{
    fromX: 20,
    toX: 0,
    fromY: -15,
    toY: 0,
    perspective: 1000,
    duration: 45,
    easing: { type: "spring", damping: 12 },
  }}
  scale={{ from: 0.85, to: 1 }}
  opacity={{ from: 0, to: 1, duration: 20 }}
  style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    boxShadow: "0 50px 100px rgba(0,0,0,0.3)",
  }}
  width={1000}
/>
```

## Best Practices

1. **Choose the right frame type** - Browser for web, iPhone for mobile, Card for floating UI
2. **Use glass sparingly** - Glass effects are heavy; limit to 1-2 per scene
3. **Combine rotate + scale + opacity** - This creates professional 3D reveal effects
4. **Use FrameSequence for multiple frames** - Don't manually time overlapping mockups
5. **Match theme to content** - Dark theme for dark screenshots, light for light
6. **Keep perspective consistent** - Use 1000-1500 for most 3D effects

## See Also

- [Full Examples](assets/mockup-frame-examples.tsx) - Complete code examples
- [AnimatedText](animated-text.md) - Text to pair with mockups
- [Layout](layout.md) - MotionContainer for additional animation control
