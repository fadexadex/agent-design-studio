import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * CatchUpText - Words animate sequentially, with later words moving faster to "catch up"
 *
 * Creates the effect where the first word starts slow, and each subsequent word
 * animates faster, creating a rhythmic acceleration that lands all words together.
 *
 * Example:
 * - Word 1 starts at frame 0, animates over 20 frames
 * - Word 2 starts at frame 5, animates over 15 frames
 * - Word 3 starts at frame 10, animates over 10 frames
 * - All words settle around frame 20
 */
export interface CatchUpTextProps {
  // Text content - will be split by spaces
  text: string;

  // Timing
  startFrame?: number; // When the animation begins (default: 0)
  convergenceFrame?: number; // When all words should be "caught up" (default: startFrame + 30)

  // Animation style
  direction?: "up" | "down" | "left" | "right"; // Direction words come from
  distance?: number; // How far words travel (pixels, default: 40)
  springConfig?: {
    damping?: number; // default: 15
    stiffness?: number; // default: 150
  };

  // Typography
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  letterSpacing?: string;
  lineHeight?: number | string;

  // Positioning
  style?: React.CSSProperties;
}

export const CatchUpText: React.FC<CatchUpTextProps> = ({
  text,
  startFrame = 0,
  convergenceFrame,
  direction = "up",
  distance = 40,
  springConfig = {},
  fontSize = 48,
  fontWeight = 600,
  fontFamily = "system-ui, sans-serif",
  color = "#FFFFFF",
  letterSpacing,
  lineHeight,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(" ").filter(Boolean);
  const wordCount = words.length;

  // Calculate convergence frame if not provided
  const targetConvergence = convergenceFrame ?? startFrame + 30;
  const totalDuration = targetConvergence - startFrame;

  // Calculate staggered start times and durations
  // First word gets the most time, last word gets the least
  const getWordTiming = (wordIndex: number) => {
    // Stagger: each word starts a bit later
    const staggerOffset = (wordIndex / wordCount) * (totalDuration * 0.4);
    const wordStart = startFrame + staggerOffset;

    // Duration: first word is longest, last is shortest (catch-up effect)
    const baseDuration = totalDuration - staggerOffset;
    const minDuration = Math.max(10, totalDuration * 0.3);
    const wordDuration = Math.max(minDuration, baseDuration);

    return { wordStart, wordDuration };
  };

  // Get transform based on direction
  const getTransform = (progress: number) => {
    const offset = (1 - progress) * distance;
    switch (direction) {
      case "up":
        return `translateY(${offset}px)`;
      case "down":
        return `translateY(${-offset}px)`;
      case "left":
        return `translateX(${offset}px)`;
      case "right":
        return `translateX(${-offset}px)`;
      default:
        return `translateY(${offset}px)`;
    }
  };

  const damping = springConfig.damping ?? 15;
  const stiffness = springConfig.stiffness ?? 150;

  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: "0.25em",
        fontSize,
        fontWeight,
        fontFamily,
        color,
        letterSpacing,
        lineHeight,
        ...style,
      }}
    >
      {words.map((word, index) => {
        const { wordStart, wordDuration } = getWordTiming(index);

        // Use spring for natural motion
        const springProgress = spring({
          frame: frame - wordStart,
          fps,
          config: {
            damping,
            stiffness,
          },
        });

        // Opacity fades in with the spring
        const opacity = interpolate(
          frame,
          [wordStart, wordStart + wordDuration * 0.3],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const transform = getTransform(springProgress);

        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              opacity,
              transform,
              willChange: "transform, opacity",
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};

export default CatchUpText;
