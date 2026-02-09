---
name: brand-guidelines
description: Rules for brand element placement in motion design videos. Logo and brand name only appear in final reveal.
metadata:
  tags: brand, logo, name, reveal, timing, placement
---

## Brand Element Placement Rules

Motion design videos follow a narrative arc. Brand elements (logo, company name) should appear only at the end to build curiosity and create a satisfying reveal.

### The 5-Act Narrative Structure

```
Acts 1-4: Build the Story (frames 0-630)
├── Problem → Solution → Magic → Result
├── NO brand name
├── NO logo
└── Viewer asks: "What is this?"

Act 5: Brand Reveal (frames 630-900)
├── Brand name appears for FIRST time
├── Logo animates in
├── Tagline displays
└── Triumphant conclusion
```

### FORBIDDEN Before Frame 630

```tsx
// ❌ WRONG - Brand name in early scene
<Sequence from={0} durationInFrames={150}>
  <AnimatedText text="Welcome to Acme Corp" /> // Brand name too early!
</Sequence>

// ❌ WRONG - Logo appears in every scene
const logo = staticFile("uploads/logo.png");
<Sequence from={0}>
  <Img src={logo} /> // Logo should NOT appear until reveal!
</Sequence>
```

### Correct Brand Reveal Pattern

```tsx
// ✅ CORRECT - Brand only in final sequence (after frame 630)
const { fps } = useVideoConfig();
const REVEAL_START = 21 * fps; // Frame 630 at 30fps

// Acts 1-4: Story without brand
<Sequence from={0} durationInFrames={REVEAL_START}>
  <AnimatedText text="Got stuff you don't need?" /> // Generic question
  <AnimatedText text="Just snap, upload, done" />   // Action, no brand
  <AnimatedText text="Sell. Ship. Smile." />        // Result, no brand
</Sequence>

// Act 5: Brand Reveal
<Sequence from={REVEAL_START}>
  <LayoutGrid anchor="center" direction="column" gap={30}>
    {/* Brand name appears FOR THE FIRST TIME */}
    <AnimatedText 
      text="Acme Corp" 
      preset="springIn"
      fontSize={96}
      fontWeight={800}
    />
    {/* Logo animates in */}
    <Animated animations={[
      Scale({ by: 1, initial: 0, start: 0, damping: 12 })
    ]}>
      <Img src={staticFile("uploads/logo.png")} style={{ width: 200 }} />
    </Animated>
    {/* Tagline follows */}
    <AnimatedText 
      text="Making life easier"
      preset="fadeBlurIn"
      blur={{ delay: 15 }}
      fontSize={32}
    />
  </LayoutGrid>
</Sequence>
```

### Why This Matters

1. **Curiosity builds engagement** - Viewers watch to find out what the video is about
2. **Delayed gratification** - The reveal feels earned after the story
3. **Advertising psychology** - Hook first, brand last is proven effective
4. **Clean narrative arc** - Problem → Solution → Reveal follows natural storytelling

### Brand Elements Checklist

| Element | Before Frame 630 | After Frame 630 |
|---------|-----------------|-----------------|
| Brand Name | ❌ FORBIDDEN | ✅ Required |
| Logo Image | ❌ FORBIDDEN | ✅ Allowed |
| Tagline | ❌ FORBIDDEN | ✅ Required |
| Brand Colors | ✅ Can use subtly | ✅ Dominant |
| Product Shots | ⚠️ If generic | ✅ Branded |

### Exception: Brand Colors

Brand colors CAN be used throughout the video for backgrounds and accents, just not in ways that explicitly reveal the brand identity (like colored text spelling the brand name).

```tsx
// ✅ OK - Brand color as background (doesn't reveal identity)
<AbsoluteFill style={{ backgroundColor: '#FF6B00' }}>

// ❌ WRONG - Brand name in brand color (reveals identity too early)
<AnimatedText text="Acme" color="#FF6B00" /> // Before frame 630
```
