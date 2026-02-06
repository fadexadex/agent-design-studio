/**
 * AnimatedText Examples
 *
 * Demonstrates various AnimatedText patterns and configurations.
 * Ideal composition size: 1920x1080 (Full HD)
 */

import { AbsoluteFill } from "remotion";
import {
  AnimatedText,
  LayoutGrid,
  TextSequence,
} from "@/components/AnimatedText";

// ===========================================
// PRESET DEMOS
// ===========================================

/** Fade blur entrance - smooth, professional */
export const FadeBlurInExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <AnimatedText
      text="Fade Blur In"
      preset="fadeBlurIn"
      anchor="center"
      fontSize={72}
      fontWeight={700}
      color="#1A1A1A"
    />
  </AbsoluteFill>
);

/** Scale entrance with spring bounce */
export const SpringInExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#0F0F11" }}>
    <AnimatedText
      text="Spring In"
      preset="springIn"
      anchor="center"
      fontSize={72}
      fontWeight={700}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

/** Slide from left with mask for kinetic effect */
export const SlideInLeftExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <AnimatedText
      text="Slide In Left"
      preset="slideInLeft"
      anchor="center"
      fontSize={72}
      fontWeight={700}
      color="#1A1A1A"
    />
  </AbsoluteFill>
);

/** Typewriter effect with blinking cursor */
export const TypewriterExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#1A1A1A" }}>
    <AnimatedText
      text="Typing this message..."
      preset="typewriter"
      typewriter={{
        cursor: true,
        cursorChar: "|",
        cursorBlinkSpeed: 30,
      }}
      anchor="center"
      fontSize={48}
      fontFamily="monospace"
      color="#22C55E"
    />
  </AbsoluteFill>
);

// ===========================================
// STAGGER ANIMATIONS
// ===========================================

/** Word-by-word stagger animation */
export const WordStaggerExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <AnimatedText
      text="Each word animates in sequence"
      preset="slideInUp"
      animationUnit="word"
      stagger={6}
      anchor="center"
      fontSize={56}
      fontWeight={600}
      color="#1A1A1A"
    />
  </AbsoluteFill>
);

/** Character-by-character stagger */
export const CharacterStaggerExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#0F0F11" }}>
    <AnimatedText
      text="HELLO"
      animationUnit="character"
      blur={{ from: 20, to: 0, duration: 20 }}
      opacity={{ from: 0, to: 1, duration: 15 }}
      scale={{
        from: 0.5,
        to: 1,
        easing: { type: "spring", damping: 12 },
      }}
      stagger={{ delay: 4, reverse: false }}
      anchor="center"
      fontSize={120}
      fontWeight={800}
      letterSpacing="0.15em"
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

/** Reverse stagger (right to left) */
export const ReverseStaggerExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <AnimatedText
      text="Reverse Order"
      preset="fadeBlurIn"
      animationUnit="character"
      stagger={{ delay: 3, reverse: true }}
      anchor="center"
      fontSize={72}
      fontWeight={700}
      color="#1A1A1A"
    />
  </AbsoluteFill>
);

// ===========================================
// GRADIENT TEXT
// ===========================================

/** Linear gradient text */
export const GradientTextExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#0F0F11" }}>
    <AnimatedText
      text="Gradient Magic"
      preset="scaleIn"
      gradient={{
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
        angle: 45,
        type: "linear",
      }}
      anchor="center"
      fontSize={80}
      fontWeight={800}
    />
  </AbsoluteFill>
);

/** Brand gradient */
export const BrandGradientExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <AnimatedText
      text="Your Brand"
      preset="springIn"
      gradient={{
        colors: ["#6366F1", "#EC4899"],
        angle: 90,
      }}
      anchor="center"
      fontSize={96}
      fontWeight={800}
    />
  </AbsoluteFill>
);

// ===========================================
// POSITIONING API
// ===========================================

/** Anchor positions demo */
export const AnchorPositionsExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#F3F4F6" }}>
    <AnimatedText
      text="Top Left"
      preset="fadeBlurIn"
      anchor="top-left"
      offsetX={40}
      offsetY={40}
      fontSize={32}
      color="#374151"
    />
    <AnimatedText
      text="Top Right"
      preset="fadeBlurIn"
      blur={{ delay: 5 }}
      opacity={{ delay: 5 }}
      anchor="top-right"
      offsetX={-40}
      offsetY={40}
      fontSize={32}
      color="#374151"
    />
    <AnimatedText
      text="Center"
      preset="springIn"
      scale={{ delay: 10 }}
      anchor="center"
      fontSize={48}
      fontWeight={700}
      color="#1F2937"
    />
    <AnimatedText
      text="Bottom Left"
      preset="fadeBlurIn"
      blur={{ delay: 15 }}
      opacity={{ delay: 15 }}
      anchor="bottom-left"
      offsetX={40}
      offsetY={-40}
      fontSize={32}
      color="#374151"
    />
    <AnimatedText
      text="Bottom Right"
      preset="fadeBlurIn"
      blur={{ delay: 20 }}
      opacity={{ delay: 20 }}
      anchor="bottom-right"
      offsetX={-40}
      offsetY={-40}
      fontSize={32}
      color="#374151"
    />
  </AbsoluteFill>
);

/** Animated position (anchor animation) */
export const AnchorAnimationExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#1A1A1A" }}>
    <AnimatedText
      text="Moving Text"
      preset="fadeBlurIn"
      anchorAnimation={{
        from: "left",
        to: "center",
        fromOffsetX: 100,
        delay: 20,
        duration: 40,
        easing: { type: "spring", damping: 15 },
      }}
      fontSize={64}
      fontWeight={700}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

// ===========================================
// LAYOUT GRID
// ===========================================

/** Centered title + subtitle */
export const TitleSubtitleExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <LayoutGrid anchor="center" direction="column" gap={16} align="center">
      <AnimatedText
        text="Main Title"
        preset="fadeBlurIn"
        fontSize={72}
        fontWeight={700}
        color="#1A1A1A"
      />
      <AnimatedText
        text="Subtitle text goes here"
        preset="fadeBlurIn"
        blur={{ delay: 10 }}
        opacity={{ delay: 10 }}
        fontSize={32}
        color="#6B7280"
      />
    </LayoutGrid>
  </AbsoluteFill>
);

/** Multi-line hero text */
export const HeroTextExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#0F0F11" }}>
    <LayoutGrid anchor="center" direction="column" gap={0} align="center">
      <AnimatedText
        text="Build Amazing"
        preset="slideInUp"
        animationUnit="word"
        stagger={8}
        fontSize={96}
        fontWeight={800}
        color="#FFFFFF"
      />
      <AnimatedText
        text="Videos with Code"
        preset="slideInUp"
        animationUnit="word"
        stagger={8}
        position={{ delay: 15 }}
        opacity={{ delay: 15 }}
        fontSize={96}
        fontWeight={800}
        gradient={{ colors: ["#6366F1", "#EC4899"] }}
      />
    </LayoutGrid>
  </AbsoluteFill>
);

// ===========================================
// TEXT SEQUENCE
// ===========================================

/** Chain mode - automatic timing */
export const TextSequenceChainExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <TextSequence mode="chain" overlap={0.3}>
      <TextSequence.Item
        text="First, this appears"
        duration={2}
        preset="slideInUp"
        exitPreset="fadeBlurOut"
        anchor="center"
        fontSize={48}
        fontWeight={600}
        color="#1A1A1A"
      />
      <TextSequence.Item
        text="Then this takes over"
        duration={2}
        preset="slideInUp"
        exitPreset="fadeBlurOut"
        anchor="center"
        fontSize={48}
        fontWeight={600}
        color="#1A1A1A"
      />
      <TextSequence.Item
        text="And finally this"
        duration={3}
        preset="slideInUp"
        anchor="center"
        fontSize={48}
        fontWeight={600}
        color="#1A1A1A"
      />
    </TextSequence>
  </AbsoluteFill>
);

// ===========================================
// EXIT ANIMATIONS
// ===========================================

/** Entrance with exit animation */
export const EnterExitExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#1A1A1A" }}>
    <AnimatedText
      text="I will fade out"
      preset="fadeBlurIn"
      exit={{
        startFrame: 60,
        opacity: { from: 1, to: 0, duration: 20 },
        blur: { from: 0, to: 15, duration: 20 },
      }}
      anchor="center"
      fontSize={56}
      fontWeight={600}
      color="#FFFFFF"
    />
  </AbsoluteFill>
);

// ===========================================
// QUOTE PATTERN
// ===========================================

/** Quote with attribution */
export const QuoteExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#F9FAFB" }}>
    <LayoutGrid
      anchor="center"
      direction="column"
      gap={32}
      align="center"
      style={{ maxWidth: 900 }}
    >
      <AnimatedText
        text='"The best way to predict the future is to create it."'
        preset="fadeBlurIn"
        fontSize={42}
        fontWeight={500}
        fontStyle="italic"
        textAlign="center"
        lineHeight={1.5}
        color="#374151"
      />
      <AnimatedText
        text="— Peter Drucker"
        preset="fadeBlurIn"
        blur={{ delay: 20 }}
        opacity={{ delay: 20 }}
        fontSize={24}
        fontWeight={500}
        color="#9CA3AF"
      />
    </LayoutGrid>
  </AbsoluteFill>
);
