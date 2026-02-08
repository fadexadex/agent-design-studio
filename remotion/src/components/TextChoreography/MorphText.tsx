import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * MorphText - Text transforms/morphs into another element
 *
 * Creates a smooth transition where text fades out while
 * transforming (scale, blur) and another element fades in.
 * Useful for "text becomes icon" or "word becomes logo" effects.
 */
export interface MorphTextProps {
  // The starting text
  text: string;

  // The element to morph into (icon, image, component)
  morphTo: React.ReactNode;

  // Timing (in frames)
  startFrame?: number; // When text appears (default: 0)
  holdDuration?: number; // How long text stays before morphing (default: 30)
  morphDuration?: number; // Duration of the morph transition (default: 20)

  // Morph style
  morphType?: "fade" | "scale" | "blur" | "all"; // default: "all"
  scaleRange?: [number, number]; // [textEndScale, morphStartScale] (default: [1.2, 0.8])

  // Typography
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  letterSpacing?: string;

  // Styling
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  morphStyle?: React.CSSProperties;
}

export const MorphText: React.FC<MorphTextProps> = ({
  text,
  morphTo,
  startFrame = 0,
  holdDuration = 30,
  morphDuration = 20,
  morphType = "all",
  scaleRange = [1.2, 0.8],
  fontSize = 48,
  fontWeight = 600,
  fontFamily = "system-ui, sans-serif",
  color = "#FFFFFF",
  letterSpacing,
  style,
  textStyle,
  morphStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate timing
  const textEnterEnd = startFrame + 15; // Text entrance duration
  const morphStart = startFrame + holdDuration;
  const morphEnd = morphStart + morphDuration;

  // Text entrance animation
  const textEntranceFrame = frame - startFrame;
  const textEntranceSpring = spring({
    frame: textEntranceFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Morph progress (0 to 1)
  const morphProgress = interpolate(
    frame,
    [morphStart, morphEnd],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Text opacity: fade in during entrance, fade out during morph
  const textOpacity =
    frame < morphStart
      ? textEntranceSpring
      : interpolate(morphProgress, [0, 0.6], [1, 0], {
          extrapolateRight: "clamp",
        });

  // Text scale during morph
  const textScale =
    frame < morphStart
      ? 1
      : interpolate(morphProgress, [0, 1], [1, scaleRange[0]], {
          extrapolateRight: "clamp",
        });

  // Text blur during morph
  const textBlur =
    morphType === "blur" || morphType === "all"
      ? interpolate(morphProgress, [0, 1], [0, 15], {
          extrapolateRight: "clamp",
        })
      : 0;

  // Morph element animations
  const morphOpacity = interpolate(morphProgress, [0.4, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const morphScale = interpolate(
    morphProgress,
    [0.4, 1],
    [scaleRange[1], 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const morphBlur =
    morphType === "blur" || morphType === "all"
      ? interpolate(morphProgress, [0.4, 1], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Spring for morph entrance (adds bounce)
  const morphSpring = spring({
    frame: frame - morphStart - morphDuration * 0.3,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  const finalMorphScale = morphScale * (0.9 + 0.1 * morphSpring);

  // Build transforms based on morphType
  const getTextTransform = (): string => {
    const transforms: string[] = [];

    if (morphType === "scale" || morphType === "all") {
      transforms.push(`scale(${textScale})`);
    }

    return transforms.length > 0 ? transforms.join(" ") : "none";
  };

  const getMorphTransform = (): string => {
    const transforms: string[] = [];

    if (morphType === "scale" || morphType === "all") {
      transforms.push(`scale(${finalMorphScale})`);
    }

    return transforms.length > 0 ? transforms.join(" ") : "none";
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {/* The text */}
      <span
        style={{
          position: "absolute",
          fontSize,
          fontWeight,
          fontFamily,
          color,
          letterSpacing,
          opacity: textOpacity,
          transform: getTextTransform(),
          filter: textBlur > 0 ? `blur(${textBlur}px)` : undefined,
          willChange: "transform, opacity, filter",
          ...textStyle,
        }}
      >
        {text}
      </span>

      {/* The morph target */}
      <div
        style={{
          position: "relative",
          opacity: morphOpacity,
          transform: getMorphTransform(),
          filter: morphBlur > 0 ? `blur(${morphBlur}px)` : undefined,
          willChange: "transform, opacity, filter",
          ...morphStyle,
        }}
      >
        {morphTo}
      </div>
    </div>
  );
};

export default MorphText;
