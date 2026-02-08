import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";

/**
 * TextCycle - Words replace each other at the same position
 *
 * Creates a cycling text effect where words appear, hold, then exit
 * while the next word enters. Useful for listing features or options.
 *
 * Example: "Simple" → "Fast" → "Powerful" cycling in place
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
  transitionDuration?: number; // Overlap between exit/enter (default: 15)

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
  const { fps } = useVideoConfig();

  // Normalize items to TextCycleItem format
  const normalizedItems: TextCycleItem[] = items.map((item) =>
    typeof item === "string" ? { text: item } : item
  );

  // Calculate total cycle duration per item
  const itemDuration = holdDuration + transitionDuration;

  // Calculate which item is currently active
  const getActiveItemIndex = () => {
    const adjustedFrame = frame - startFrame;
    if (adjustedFrame < 0) return -1;

    const rawIndex = Math.floor(adjustedFrame / itemDuration);

    if (loop) {
      return rawIndex % normalizedItems.length;
    }

    return Math.min(rawIndex, normalizedItems.length - 1);
  };

  const activeIndex = getActiveItemIndex();

  // Calculate animation values for enter/exit
  const getEnterTransform = (progress: number): string => {
    const offset = (1 - progress) * distance;
    switch (enterFrom) {
      case "up":
        return `translateY(${offset}px)`;
      case "down":
        return `translateY(${-offset}px)`;
      case "left":
        return `translateX(${offset}px)`;
      case "right":
        return `translateX(${-offset}px)`;
      case "scale":
        return `scale(${0.8 + 0.2 * progress})`;
      case "fade":
      default:
        return "none";
    }
  };

  const getExitTransform = (progress: number): string => {
    const offset = progress * distance;
    switch (exitTo) {
      case "up":
        return `translateY(${-offset}px)`;
      case "down":
        return `translateY(${offset}px)`;
      case "left":
        return `translateX(${-offset}px)`;
      case "right":
        return `translateX(${offset}px)`;
      case "scale":
        return `scale(${1 - 0.2 * progress})`;
      case "fade":
      default:
        return "none";
    }
  };

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
        const holdEnd = itemStart + holdDuration;
        const itemEnd = itemStart + itemDuration;

        // Determine if this item should be visible
        const isActive = index === activeIndex;
        const isPrevious = index === activeIndex - 1 || (loop && index === normalizedItems.length - 1 && activeIndex === 0);

        // Skip items that are neither active nor transitioning out
        const adjustedFrame = frame - startFrame;
        const itemFrame = adjustedFrame - index * itemDuration;

        // Only render if we're within the item's visibility window
        if (itemFrame < -transitionDuration || itemFrame > itemDuration + transitionDuration) {
          return null;
        }

        // Calculate enter animation (spring-based)
        const enterProgress =
          itemFrame >= 0
            ? spring({
                frame: itemFrame,
                fps,
                config: { damping: 15, stiffness: 150 },
              })
            : 0;

        // Calculate exit animation
        const exitFrame = itemFrame - holdDuration;
        const exitProgress =
          exitFrame > 0
            ? interpolate(exitFrame, [0, transitionDuration], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;

        // Combine enter and exit
        const isEntering = itemFrame >= 0 && itemFrame < holdDuration;
        const isExiting = exitFrame > 0;
        const isHolding = itemFrame >= transitionDuration && !isExiting;

        // Calculate final opacity and transform
        let opacity = 0;
        let transform = "none";

        if (isEntering) {
          opacity = interpolate(enterProgress, [0, 1], [0, 1], {
            extrapolateRight: "clamp",
          });
          transform = getEnterTransform(enterProgress);
        } else if (isHolding) {
          opacity = 1;
          transform = "none";
        } else if (isExiting) {
          opacity = 1 - exitProgress;
          transform = getExitTransform(exitProgress);
        }

        if (opacity <= 0) return null;

        return (
          <span
            key={`${item.text}-${index}`}
            style={{
              position: index === 0 ? "relative" : "absolute",
              left: index === 0 ? undefined : 0,
              top: index === 0 ? undefined : 0,
              width: "100%",
              opacity,
              transform,
              color: item.color || color,
              willChange: "transform, opacity",
            }}
          >
            {item.text}
          </span>
        );
      })}
    </span>
  );
};

export default TextCycle;
