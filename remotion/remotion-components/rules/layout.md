---
name: layout
description: MotionContainer and BentoGrid components for animated layouts with entrance/exit states and staggered grid animations
metadata:
  tags: layout, animation, grid, motion, stagger, bento
---

## Overview

Layout components provide animation wrappers for any content:

- **MotionContainer** - Generic animation wrapper with entrance and exit states
- **BentoGrid** - CSS Grid layout with automatic staggered animations
- **BentoItem** - Grid cell with span control and animation overrides

## Import

```tsx
import {
  MotionContainer,
  BentoGrid,
  BentoItem,
  type MotionContainerProps,
  type BentoGridProps,
  type BentoItemProps,
  type InitialState,
  type ExitState,
} from "@/components/Layout";
```

---

## MotionContainer

A versatile animation wrapper using Remotion's spring physics.

### Props

```typescript
interface MotionContainerProps {
  // Entrance timing
  delay?: number; // Frames before animation starts (default: 0)
  duration?: number; // Entrance animation duration (default: 30)

  // Entrance state
  initial?: InitialState; // Starting state (default: 'hidden')

  // Exit animation
  exit?: ExitState;
  exitStartFrame?: number; // When to start exit (required if exit is set)
  exitDuration?: number; // Exit duration (default: 20)

  // Animation config
  distance?: number; // Pixels for slide animations (default: 100)
  springConfig?: {
    damping?: number; // default: 15, use 200 for no bounce
    stiffness?: number; // default: 100
    mass?: number; // default: 1
  };

  // Styling
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean; // Use AbsoluteFill as wrapper (default: false)

  children: React.ReactNode;
}
```

### Initial States

| State              | Description                    |
| ------------------ | ------------------------------ |
| `hidden`           | Starts invisible (opacity: 0)  |
| `offscreen-bottom` | Starts below + invisible       |
| `offscreen-top`    | Starts above + invisible       |
| `offscreen-left`   | Starts left + invisible        |
| `offscreen-right`  | Starts right + invisible       |
| `scale-zero`       | Starts scaled to 0 + invisible |
| `blur`             | Starts blurred + invisible     |

### Exit States

| State         | Description          |
| ------------- | -------------------- |
| `fade-out`    | Fades to invisible   |
| `slide-down`  | Slides down + fades  |
| `slide-up`    | Slides up + fades    |
| `slide-left`  | Slides left + fades  |
| `slide-right` | Slides right + fades |
| `scale-down`  | Scales down + fades  |
| `blur-out`    | Blurs out + fades    |

### CRITICAL: Common Mistakes

```tsx
// ❌ WRONG - abbreviated state names don't exist
<MotionContainer initial="below">
<MotionContainer initial="above">

// ✅ CORRECT - use full state names
<MotionContainer initial="offscreen-bottom">
<MotionContainer initial="offscreen-top">

// ❌ WRONG - Framer Motion props (animate, transition) don't work here
<MotionContainer animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>

// ✅ CORRECT - use Remotion-style props
<MotionContainer initial="hidden" delay={15} duration={30}>
```

### Usage Examples

#### Basic Fade In

```tsx
<MotionContainer initial="hidden" delay={10}>
  <MyContent />
</MotionContainer>
```

#### Slide Up with Exit

```tsx
<MotionContainer
  initial="offscreen-bottom"
  exit="slide-down"
  exitStartFrame={60}
  distance={50}
>
  <Card>Content that slides in and out</Card>
</MotionContainer>
```

#### Scale with Spring Bounce

```tsx
<MotionContainer
  initial="scale-zero"
  springConfig={{ damping: 10, stiffness: 150 }}
  delay={15}
>
  <Badge>New!</Badge>
</MotionContainer>
```

#### Full Screen Fill

```tsx
<MotionContainer
  fill // Uses AbsoluteFill
  initial="hidden"
  delay={0}
>
  <BackgroundContent />
</MotionContainer>
```

#### Custom Distance for Slides

```tsx
<MotionContainer
  initial="offscreen-left"
  distance={200} // Slide 200px instead of default 100
  duration={45}
>
  <SidePanel />
</MotionContainer>
```

---

## BentoGrid

A CSS Grid layout that automatically wraps children in MotionContainers with staggered delays.

### Props

```typescript
interface BentoGridProps {
  children: React.ReactNode;
  columns?: number; // Grid columns (default: 3)
  gap?: number; // Gap in pixels (default: 24)
  className?: string;

  // Animation
  staggerDelay?: number; // Frames between items (default: 5)
  initialDelay?: number; // Delay before first item (default: 0)
  initialState?: InitialState; // Animation state (default: 'offscreen-bottom')
  distance?: number; // Slide distance (default: 50)
}
```

### Basic Example

```tsx
<BentoGrid columns={3} staggerDelay={5}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
  <div>Item 5</div>
  <div>Item 6</div>
</BentoGrid>
```

### With Custom Animation

```tsx
<BentoGrid
  columns={4}
  gap={16}
  staggerDelay={8}
  initialDelay={20}
  initialState="scale-zero"
  distance={30}
>
  {items.map((item, i) => (
    <Card key={i}>{item}</Card>
  ))}
</BentoGrid>
```

---

## BentoItem

Grid cell wrapper for spanning multiple columns/rows and animation overrides.

### Props

```typescript
interface BentoItemProps {
  colSpan?: number; // Columns to span (default: 1)
  rowSpan?: number; // Rows to span (default: 1)
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;

  // Animation overrides
  delayOffset?: number; // Additional delay added to stagger calculation
  animation?: Partial<MotionContainerProps>; // Override grid animation
}
```

### Spanning Cells

```tsx
<BentoGrid columns={3}>
  {/* Large hero item spanning 2 columns and 2 rows */}
  <BentoItem colSpan={2} rowSpan={2}>
    <HeroCard />
  </BentoItem>

  {/* Regular items */}
  <BentoItem>
    <SmallCard />
  </BentoItem>
  <BentoItem>
    <SmallCard />
  </BentoItem>
  <BentoItem>
    <SmallCard />
  </BentoItem>
</BentoGrid>
```

### Custom Animation Per Item

```tsx
<BentoGrid columns={3} initialState="offscreen-bottom">
  <BentoItem colSpan={2}>
    <MainFeature />
  </BentoItem>

  {/* This item has extra delay */}
  <BentoItem delayOffset={10}>
    <SecondaryFeature />
  </BentoItem>

  {/* This item uses different animation */}
  <BentoItem
    animation={{
      initial: "scale-zero",
      springConfig: { damping: 8 },
    }}
  >
    <SpecialCard />
  </BentoItem>
</BentoGrid>
```

---

## Common Patterns

### Dashboard Layout

```tsx
<BentoGrid columns={4} gap={20} staggerDelay={6}>
  {/* Main chart - spans 3 columns */}
  <BentoItem colSpan={3} rowSpan={2}>
    <ChartCard />
  </BentoItem>

  {/* Stats cards */}
  <BentoItem>
    <StatCard title="Users" value="1,234" />
  </BentoItem>
  <BentoItem>
    <StatCard title="Revenue" value="$12,345" />
  </BentoItem>

  {/* Activity feed - spans 2 rows */}
  <BentoItem rowSpan={2}>
    <ActivityFeed />
  </BentoItem>

  {/* Recent items */}
  <BentoItem colSpan={2}>
    <RecentItems />
  </BentoItem>
</BentoGrid>
```

### Feature Grid

```tsx
<BentoGrid
  columns={3}
  gap={32}
  staggerDelay={8}
  initialState="offscreen-bottom"
  distance={40}
>
  {features.map((feature, index) => (
    <BentoItem key={index}>
      <MotionContainer
        style={{
          background: feature.color,
          borderRadius: 16,
          padding: 24,
          height: "100%",
        }}
      >
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </MotionContainer>
    </BentoItem>
  ))}
</BentoGrid>
```

### Stacked Cards with Manual Timing

```tsx
// For precise control, use MotionContainer directly
<AbsoluteFill style={{ padding: 40 }}>
  <MotionContainer
    initial="offscreen-left"
    delay={0}
    distance={100}
    style={{ position: "absolute", left: 40, top: 100 }}
  >
    <Card>First</Card>
  </MotionContainer>

  <MotionContainer
    initial="offscreen-right"
    delay={15}
    distance={100}
    style={{ position: "absolute", right: 40, top: 150 }}
  >
    <Card>Second</Card>
  </MotionContainer>

  <MotionContainer
    initial="offscreen-bottom"
    delay={30}
    exit="fade-out"
    exitStartFrame={90}
    style={{
      position: "absolute",
      left: "50%",
      bottom: 100,
      transform: "translateX(-50%)",
    }}
  >
    <Card>Third (will exit)</Card>
  </MotionContainer>
</AbsoluteFill>
```

### Notification Stack

```tsx
const notifications = ["Message 1", "Message 2", "Message 3"];

<div style={{ position: "absolute", right: 20, top: 20 }}>
  {notifications.map((msg, i) => (
    <MotionContainer
      key={i}
      initial="offscreen-right"
      delay={i * 20}
      exit="slide-right"
      exitStartFrame={60 + i * 10}
      distance={50}
      style={{ marginBottom: 12 }}
    >
      <NotificationCard>{msg}</NotificationCard>
    </MotionContainer>
  ))}
</div>;
```

---

## Best Practices

1. **Use BentoGrid for grid layouts** - Don't manually create grids with MotionContainer
2. **Keep stagger delays small** - 5-10 frames creates a nice cascade effect
3. **Match exit to entrance** - `offscreen-bottom` pairs well with `slide-down`
4. **Use fill for backgrounds** - Set `fill={true}` for full-screen elements
5. **Override carefully** - BentoItem's `animation` prop completely overrides grid defaults
6. **Consider spring config** - Lower damping (8-12) = more bounce, higher (200) = no bounce

## When to Use What

| Scenario                     | Component                                         |
| ---------------------------- | ------------------------------------------------- |
| Single animated element      | MotionContainer                                   |
| Grid of cards/items          | BentoGrid + BentoItem                             |
| Text animations              | AnimatedText (not MotionContainer)                |
| Device mockups               | MockupFrame (has built-in animations)             |
| Stacked/overlapping elements | Multiple MotionContainers with manual positioning |

## See Also

- [Full Examples](assets/layout-examples.tsx) - Complete code examples
- [AnimatedText](animated-text.md) - Text-specific animations
- [MockupFrame](mockup-frame.md) - Device frames with animations
