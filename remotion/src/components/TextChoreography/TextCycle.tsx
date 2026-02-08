import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Animated, Move, Scale, Fade } from "remotion-animated";
import { SPRING_CONFIGS } from "../Animation/springs";

/**
 * TextCycle - Words replace each other at the same position
 *
 * Creates a cycling text effect where words appear, hold, then exit
 * while the next word enters. Useful for listing features or options.
 *
 * Now uses remotion-animated for declarative spring animations.
 */
export interface TextCycleItem {
  text: string;
  color?: string; // Override color for this word
}

export interface TextCycleProps {
  // Words to cycle through
  items: (string | TextCycleItem)[];

  // Timing (in frames)
  startFrame?: number;
  holdDuration?: number; // How long each word stays visible (default: 30)
  transitionDuration?: number; // Duration of enter/exit transitions (default: 15)

  // Animation style
  enterFrom?: "up" | "down" | "left" | "right" | "fade" | "scale";
  exitTo?: "up" | "down" | "left" | "right" | "fade" | "scale";
  distance?: number; // Travel distance for slide animations (default: 30)

  // Typography
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string; // Default color
  letterSpacing?: string;
  lineHeight?: number | string;
  textAlign?: "left" | "center" | "right";

  // Styling
  style?: React.CSSProperties;

  // Loop behavior
  loop?: boolean; // Whether to loop back to first item
}

export const TextCycle: React.FC<TextCycleProps> = ({
  items,
  startFrame = 0,
  holdDuration = 30,
  transitionDuration = 15,
  enterFrom = "up",
  exitTo = "up",
  distance = 30,
  fontSize = 48,
  fontWeight = 600,
  fontFamily = "system-ui, sans-serif",
  color = "#FFFFFF",
  letterSpacing,
  lineHeight,
  textAlign = "center",
  style,
  loop = false,
}) => {
  const frame = useCurrentFrame();

  // Normalize items to TextCycleItem format
  const normalizedItems: TextCycleItem[] = items.map((item) =>
    typeof item === "string" ? { text: item } : item
  );

  // Calculate total cycle duration per item
  const itemDuration = holdDuration + transitionDuration;

  // Get initial offset for enter animation
  const getEnterOffset = () => {
    switch (enterFrom) {
      case "up": return { initialY: distance };
      case "down": return { initialY: -distance };
      case "left": return { initialX: distance };
      case "right": return { initialX: -distance };
      case "scale": return { initialScale: 0.8 };
      default: return {};
    }
  };

  // Get exit offset
  const getExitOffset = () => {
    switch (exitTo) {
      case "up": return { y: -distance };
      case "down": return { y: distance };
      case "left": return { x: -distance };
      case "right": return { x: distance };
      case "scale": return { scale: 0.8 };
      default: return {};
    }
  };

  const enterOffset = getEnterOffset();
  const exitOffset = getExitOffset();
  const springConfig = SPRING_CONFIGS.kinetic;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        minWidth: "1em",
        fontSize,
        fontWeight,
        fontFamily,
        color,
        letterSpacing,
        lineHeight,
        textAlign,
        ...style,
      }}
    >
      {normalizedItems.map((item, index) => {
        // Calculate timing for this item
        const itemStart = startFrame + index * itemDuration;
        const exitStart = itemStart + holdDuration;

        // Check visibility
        const adjustedFrame = frame - startFrame;
        const itemFrame = adjustedFrame - index * itemDuration;

        // Only render if within visibility window
        if (itemFrame < -transitionDuration || itemFrame > itemDuration + transitionDuration) {
          return null;
        }

        // Calculate exit progress for opacity fade
        const exitFrame = itemFrame - holdDuration;
        const exitProgress = exitFrame > 0
          ? interpolate(exitFrame, [0, transitionDuration], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        // Skip if fully exited
        if (exitProgress >= 1) return null;

        // Build enter animations
        const enterAnimations = [
          // Fade in
          Fade({
            to: 1,
            initial: 0,
            start: itemStart,
            duration: transitionDuration,
          }),
        ];

        // Add movement animation based on enterFrom
        if (enterOffset.initialY !== undefined) {
          enterAnimations.push(
            Move({ y: 0, initialY: enterOffset.initialY, start: itemStart, ...springConfig })
          );
        }
        if (enterOffset.initialX !== undefined) {
          enterAnimations.push(
            Move({ x: 0, initialX: enterOffset.initialX, start: itemStart, ...springConfig })
          );
        }
        if (enterOffset.initialScale !== undefined) {
          enterAnimations.push(
            Scale({ by: 1, initial: enterOffset.initialScale, start: itemStart, ...springConfig })
          );
        }

        // Build exit animations
        if (exitOffset.y !== undefined) {
          enterAnimations.push(
            Move({ y: exitOffset.y, initialY: 0, start: exitStart, duration: transitionDuration, damping: 100 })
          );
        }
        if (exitOffset.x !== undefined) {
          enterAnimations.push(
            Move({ x: exitOffset.x, initialX: 0, start: exitStart, duration: transitionDuration, damping: 100 })
          );
        }
        if (exitOffset.scale !== undefined) {
          enterAnimations.push(
            Scale({ by: exitOffset.scale, initial: 1, start: exitStart, duration: transitionDuration, damping: 100 })
          );
        }

        // Add exit fade
        enterAnimations.push(
          Fade({ to: 0, initial: 1, start: exitStart, duration: transitionDuration })
        );

        return (
          <Animated key={`${item.text}-${index}`} animations={enterAnimations}>
            <span
              style={{
                position: index === 0 ? "relative" : "absolute",
                left: index === 0 ? undefined : 0,
                top: index === 0 ? undefined : 0,
                width: "100%",
                color: item.color || color,
                display: "inline-block",
              }}
            >
              {item.text}
            </span>
          </Animated>
        );
      })}
    </span>
  );
};

export default TextCycle;
