import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * TextMakesSpace - Text slides aside to reveal UI elements or other content
 *
 * Creates the effect where text animates in, holds, then slides away
 * (usually to the side) to make room for something else. The "reveal"
 * element can be passed as children.
 *
 * Example: "Introducing" slides left → Product UI appears in the center
 */
export interface TextMakesSpaceProps {
  // The text that makes space
  text: string;

  // The element that appears when text moves aside
  children?: React.ReactNode;

  // Timing (in frames)
  textEnterFrame?: number; // When text enters (default: 0)
  textHoldDuration?: number; // How long text stays centered (default: 30)
  makeSpaceFrame?: number; // When text starts moving aside (default: textEnterFrame + textHoldDuration)
  revealDelay?: number; // Delay before reveal element appears (default: 10)

  // Animation
  slideDirection?: "left" | "right" | "up" | "down";
  slideDistance?: number | string; // How far text slides (default: "40%")
  textEnterFrom?: "up" | "down" | "left" | "right" | "fade";

  // Typography for the text
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  letterSpacing?: string;

  // Container styling
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  revealStyle?: React.CSSProperties;
}

export const TextMakesSpace: React.FC<TextMakesSpaceProps> = ({
  text,
  children,
  textEnterFrame = 0,
  textHoldDuration = 30,
  makeSpaceFrame,
  revealDelay = 10,
  slideDirection = "left",
  slideDistance = "40%",
  textEnterFrom = "up",
  fontSize = 48,
  fontWeight = 600,
  fontFamily = "system-ui, sans-serif",
  color = "#FFFFFF",
  letterSpacing,
  style,
  textStyle,
  revealStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate timing
  const actualMakeSpaceFrame = makeSpaceFrame ?? textEnterFrame + textHoldDuration;
  const revealFrame = actualMakeSpaceFrame + revealDelay;

  // Parse slide distance
  const slideDistanceValue =
    typeof slideDistance === "number" ? `${slideDistance}px` : slideDistance;

  // Calculate text entrance animation
  const textLocalFrame = frame - textEnterFrame;
  const isTextEntering = textLocalFrame >= 0 && frame < actualMakeSpaceFrame;
  const isTextSliding = frame >= actualMakeSpaceFrame;

  // Entrance spring
  const entranceSpring = spring({
    frame: textLocalFrame,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  // Get entrance transform
  const getEntranceOffset = (): { x: number; y: number } => {
    const offset = (1 - entranceSpring) * 40;
    switch (textEnterFrom) {
      case "up":
        return { x: 0, y: offset };
      case "down":
        return { x: 0, y: -offset };
      case "left":
        return { x: offset, y: 0 };
      case "right":
        return { x: -offset, y: 0 };
      case "fade":
      default:
        return { x: 0, y: 0 };
    }
  };

  // Calculate slide animation
  const slideLocalFrame = frame - actualMakeSpaceFrame;
  const slideSpring = spring({
    frame: slideLocalFrame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  // Get slide transform
  const getSlideOffset = (): string => {
    switch (slideDirection) {
      case "left":
        return `translateX(calc(-${slideDistanceValue} * ${slideSpring}))`;
      case "right":
        return `translateX(calc(${slideDistanceValue} * ${slideSpring}))`;
      case "up":
        return `translateY(calc(-${slideDistanceValue} * ${slideSpring}))`;
      case "down":
        return `translateY(calc(${slideDistanceValue} * ${slideSpring}))`;
      default:
        return "none";
    }
  };

  // Calculate text opacity and transform
  let textOpacity = 0;
  let textTransform = "none";

  if (textLocalFrame < 0) {
    textOpacity = 0;
  } else if (isTextEntering) {
    const entrance = getEntranceOffset();
    textOpacity = entranceSpring;
    textTransform = `translate(${entrance.x}px, ${entrance.y}px)`;
  } else if (isTextSliding) {
    textOpacity = 1;
    textTransform = getSlideOffset();
  }

  // Calculate reveal animation
  const revealLocalFrame = frame - revealFrame;
  const revealSpring = spring({
    frame: revealLocalFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const revealOpacity = revealLocalFrame >= 0 ? revealSpring : 0;
  const revealScale = 0.9 + 0.1 * revealSpring;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        ...style,
      }}
    >
      {/* The text that makes space */}
      <span
        style={{
          position: children ? "absolute" : "relative",
          fontSize,
          fontWeight,
          fontFamily,
          color,
          letterSpacing,
          opacity: textOpacity,
          transform: textTransform,
          willChange: "transform, opacity",
          zIndex: 2,
          ...textStyle,
        }}
      >
        {text}
      </span>

      {/* The reveal element */}
      {children && (
        <div
          style={{
            position: "relative",
            opacity: revealOpacity,
            transform: `scale(${revealScale})`,
            willChange: "transform, opacity",
            zIndex: 1,
            ...revealStyle,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default TextMakesSpace;
