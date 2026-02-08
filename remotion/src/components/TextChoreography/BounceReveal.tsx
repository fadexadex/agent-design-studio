import React from "react";
import { Animated, Move, Scale, Fade } from "remotion-animated";
import { SPRING_CONFIGS } from "../Animation/springs";

/**
 * BounceReveal - Words appear on rhythmic bounces
 *
 * Creates a playful, energetic reveal where words bounce into view
 * with spring physics. Great for upbeat, fun content.
 * 
 * Now uses remotion-animated for declarative spring animations.
 */
export interface BounceRevealProps {
  // Text content - split by spaces, or provide array for custom grouping
  text: string | string[];

  // Timing
  startFrame?: number;
  staggerFrames?: number; // Delay between each word's bounce (default: 8)

  // Animation style
  direction?: "up" | "down"; // Direction of bounce (default: up)
  bounceHeight?: number; // How high words bounce (pixels, default: 60)

  // Spring physics preset
  springPreset?: "bouncy" | "elastic" | "pop" | "snappy";

  // Typography
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  letterSpacing?: string;
  lineHeight?: number | string;

  // Styling
  style?: React.CSSProperties;
}

export const BounceReveal: React.FC<BounceRevealProps> = ({
  text,
  startFrame = 0,
  staggerFrames = 8,
  direction = "up",
  bounceHeight = 60,
  springPreset = "bouncy",
  fontSize = 48,
  fontWeight = 700,
  fontFamily = "system-ui, sans-serif",
  color = "#FFFFFF",
  letterSpacing,
  lineHeight,
  style,
}) => {
  // Split text into words
  const words = Array.isArray(text) ? text : text.split(" ").filter(Boolean);

  // Get spring config from presets
  const springConfig = SPRING_CONFIGS[springPreset];

  // Calculate initial Y position based on direction
  const initialY = direction === "up" ? bounceHeight : -bounceHeight;

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
        const wordStart = startFrame + index * staggerFrames;

        return (
          <Animated
            key={`${word}-${index}`}
            animations={[
              // Move from offset to final position
              Move({
                y: 0,
                initialY,
                start: wordStart,
                ...springConfig,
              }),
              // Scale in with bounce
              Scale({
                by: 1,
                initial: 0.5,
                start: wordStart,
                damping: springConfig.damping! - 2,
                stiffness: springConfig.stiffness! + 20,
              }),
              // Fade in quickly
              Fade({
                to: 1,
                initial: 0,
                start: wordStart,
                duration: 10,
              }),
            ]}
          >
            <span style={{ display: "inline-block" }}>{word}</span>
          </Animated>
        );
      })}
    </span>
  );
};

export default BounceReveal;
