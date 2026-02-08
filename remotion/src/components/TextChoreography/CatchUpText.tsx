import React from "react";
import { Animated, Move, Fade } from "remotion-animated";
import { SPRING_CONFIGS } from "../Animation/springs";

/**
 * CatchUpText - Words animate sequentially, with later words moving faster to "catch up"
 *
 * Creates the effect where the first word starts slow, and each subsequent word
 * animates faster, creating a rhythmic acceleration that lands all words together.
 *
 * Now uses remotion-animated for declarative spring animations.
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

  // Spring preset
  springPreset?: "kinetic" | "snappy" | "smooth";

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
  springPreset = "kinetic",
  fontSize = 48,
  fontWeight = 600,
  fontFamily = "system-ui, sans-serif",
  color = "#FFFFFF",
  letterSpacing,
  lineHeight,
  style,
}) => {
  const words = text.split(" ").filter(Boolean);
  const wordCount = words.length;

  // Calculate convergence frame if not provided
  const targetConvergence = convergenceFrame ?? startFrame + 30;
  const totalDuration = targetConvergence - startFrame;

  // Get spring config
  const springConfig = SPRING_CONFIGS[springPreset];

  // Calculate staggered start times
  const getWordStart = (wordIndex: number) => {
    const staggerOffset = (wordIndex / wordCount) * (totalDuration * 0.4);
    return startFrame + staggerOffset;
  };

  // Get initial offset based on direction
  const getInitialOffset = () => {
    switch (direction) {
      case "up":
        return { initialY: distance, initialX: undefined };
      case "down":
        return { initialY: -distance, initialX: undefined };
      case "left":
        return { initialX: distance, initialY: undefined };
      case "right":
        return { initialX: -distance, initialY: undefined };
      default:
        return { initialY: distance, initialX: undefined };
    }
  };

  const offset = getInitialOffset();

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
        const wordStart = getWordStart(index);

        return (
          <Animated
            key={`${word}-${index}`}
            animations={[
              // Move animation with spring physics
              Move({
                x: offset.initialX !== undefined ? 0 : undefined,
                y: offset.initialY !== undefined ? 0 : undefined,
                initialX: offset.initialX,
                initialY: offset.initialY,
                start: wordStart,
                ...springConfig,
              }),
              // Fade in
              Fade({
                to: 1,
                initial: 0,
                start: wordStart,
                duration: 12,
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

export default CatchUpText;
