import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";

/**
 * BounceReveal - Words appear on rhythmic bounces
 *
 * Creates a playful, energetic reveal where words bounce into view
 * with spring physics. Great for upbeat, fun content.
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
  overshoot?: number; // How much words overshoot on bounce (0-1, default: 0.2)

  // Spring physics
  springConfig?: {
    damping?: number; // Lower = more bounce (default: 10)
    stiffness?: number; // Higher = faster (default: 180)
    mass?: number; // default: 1
  };

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
  overshoot = 0.2,
  springConfig = {},
  fontSize = 48,
  fontWeight = 700,
  fontFamily = "system-ui, sans-serif",
  color = "#FFFFFF",
  letterSpacing,
  lineHeight,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Split text into words
  const words = Array.isArray(text) ? text : text.split(" ").filter(Boolean);

  // Spring config for bouncy animation
  const damping = springConfig.damping ?? 10;
  const stiffness = springConfig.stiffness ?? 180;
  const mass = springConfig.mass ?? 1;

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
        const localFrame = frame - wordStart;

        // Spring for the bounce animation
        const springValue = spring({
          frame: localFrame,
          fps,
          config: {
            damping,
            stiffness,
            mass,
            overshootClamping: false,
          },
        });

        // Calculate Y offset based on direction
        const startY = direction === "up" ? bounceHeight : -bounceHeight;
        const translateY = startY * (1 - springValue);

        // Scale adds to the "pop" effect
        const scaleSpring = spring({
          frame: localFrame,
          fps,
          config: {
            damping: damping - 2,
            stiffness: stiffness + 20,
          },
        });

        // Add slight overshoot to scale
        const scale = 0.5 + scaleSpring * (0.5 + overshoot * Math.max(0, 1 - scaleSpring));

        // Opacity tied to spring progress
        const opacity = Math.min(1, springValue * 1.5);

        // Don't render if not visible yet
        if (localFrame < 0) {
          return (
            <span
              key={`${word}-${index}`}
              style={{
                display: "inline-block",
                opacity: 0,
              }}
            >
              {word}
            </span>
          );
        }

        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
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

export default BounceReveal;
