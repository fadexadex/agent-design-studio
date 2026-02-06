import React from "react";
import {
  useTextSplitter,
  useAnimatableUnitCount,
} from "./hooks/useTextSplitter";
import { useAnimationCalculator } from "./hooks/useAnimationCalculator";
import { useStyleComposer, getScaleOrigin } from "./hooks/useStyleComposer";
import { usePositioning } from "./hooks/usePositioning";
import { getGradientStyles } from "./utils/gradients";
import { getPreset } from "./presets";
import type { AnimatedTextProps } from "./types";

export const AnimatedText: React.FC<AnimatedTextProps> = (props) => {
  const {
    text,
    animationUnit: animationUnitProp,
    preset = "none",
    typewriter,
    color,
    gradient,
    fontSize,
    fontWeight,
    fontFamily,
    letterSpacing,
    lineHeight,
    style,
    containerStyle,
    scale,
    mask: maskProp,
    // Positioning props
    anchor,
    offsetX,
    offsetY,
    x,
    y,
    textAlign,
    maxWidth,
    zIndex,
    anchorAnimation,
  } = props;

  const presetValues = getPreset(preset);

  // Determine animation unit (preset can override)
  const animationUnit =
    animationUnitProp ?? presetValues.animationUnit ?? "full";

  // Split text into units
  const units = useTextSplitter(text, animationUnit);
  const totalAnimatableUnits = useAnimatableUnitCount(units);

  // Get animation calculator
  const { getValuesForUnit, typewriterVisibleChars, showCursor } =
    useAnimationCalculator(props, totalAnimatableUnits);

  // Get style composer
  const { composeStyles } = useStyleComposer();

  // Get positioning
  const positioning = usePositioning({
    anchor,
    offsetX,
    offsetY,
    x,
    y,
    textAlign,
    maxWidth,
    zIndex,
    anchorAnimation,
  });

  // Get scale origin if provided
  const scaleOrigin = getScaleOrigin(scale);

  // Smart default for masking: auto-enable for slide presets (kinetic look)
  // but disable for others to preserve box-shadows and glow effects
  const isSlidePreset = preset?.toLowerCase().includes("slide");
  const shouldMask = maskProp ?? isSlidePreset;

  // Build base text styles
  const baseTextStyles: React.CSSProperties = {
    ...(color && { color }),
    ...(fontSize && { fontSize }),
    ...(fontWeight && { fontWeight }),
    ...(fontFamily && { fontFamily }),
    ...(letterSpacing && { letterSpacing }),
    ...(lineHeight && { lineHeight }),
    ...(gradient && getGradientStyles(gradient)),
    ...(textAlign && { textAlign }),
    ...style,
  };

  // Build positioning styles (applied to container)
  const positioningStyles: React.CSSProperties = positioning.isPositioned
    ? {
        position: "absolute",
        left: 0,
        top: 0,
        ...(maxWidth && {
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        }),
        ...(zIndex !== undefined && { zIndex }),
      }
    : {};

  // Check if typewriter mode
  const isTypewriter =
    preset === "typewriter" ||
    (typewriter !== undefined && typewriter !== false);

  // For typewriter, use string slicing (best practice)
  if (isTypewriter && animationUnit === "character") {
    const displayedText = text.slice(0, typewriterVisibleChars);
    const typewriterConfig =
      typeof typewriter === "object" ? typewriter : { cursor: true };
    const cursorChar = typewriterConfig.cursorChar || "|";

    const values = getValuesForUnit(0, false);
    const animationStyles = composeStyles(values, scaleOrigin, positioning);

    return (
      <span
        style={{
          ...baseTextStyles,
          ...positioningStyles,
          ...animationStyles,
          ...containerStyle,
        }}
      >
        {displayedText}
        {typewriterConfig.cursor !== false && (
          <span
            style={{
              opacity: showCursor ? 1 : 0,
              display: "inline",
            }}
          >
            {cursorChar}
          </span>
        )}
      </span>
    );
  }

  // For full text animation (no splitting)
  if (animationUnit === "full") {
    const values = getValuesForUnit(0, false);

    // For full text, masking wraps the entire text
    if (shouldMask) {
      // When masking, we need to separate positioning from animation:
      // - Positioning goes on the OUTER window (so it's placed correctly on screen)
      // - Animation transforms go on the INNER actor (so text moves within the window)

      // Get animation styles WITHOUT positioning (for inner element)
      const animationStylesWithoutPositioning = composeStyles(
        values,
        scaleOrigin,
      );
      const { transform: animationTransform, ...otherAnimationStyles } =
        animationStylesWithoutPositioning;

      // Get positioning styles WITH positioning (for outer element)
      const windowStyles = composeStyles(
        { blur: 0, opacity: 1, scale: 1, translateX: 0, translateY: 0 },
        undefined,
        positioning,
      );

      return (
        <span
          style={{
            ...positioningStyles,
            ...windowStyles,
            ...containerStyle,
            // The Window: clips content, positioned correctly
            display: "inline-flex",
            overflow: "hidden",
            verticalAlign: "top",
          }}
        >
          <span
            style={{
              ...baseTextStyles,
              ...otherAnimationStyles,
              // The Actor: animation transforms only (moves within the window)
              display: "inline-block",
              transform: animationTransform,
            }}
          >
            {text}
          </span>
        </span>
      );
    }

    const animationStyles = composeStyles(values, scaleOrigin, positioning);
    return (
      <span
        style={{
          ...baseTextStyles,
          ...positioningStyles,
          ...animationStyles,
          ...containerStyle,
        }}
      >
        {text}
      </span>
    );
  }

  // For word/character/line animation with stagger
  // Container needs positioning, individual units get animation transforms
  const containerAnimationStyles = composeStyles(
    { blur: 0, opacity: 1, scale: 1, translateX: 0, translateY: 0 },
    undefined,
    positioning,
  );

  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        ...positioningStyles,
        ...containerAnimationStyles,
        ...containerStyle,
      }}
    >
      {units.map((unit, index) => {
        // Track animatable index (excluding spaces)
        let animatableIndex = 0;
        for (let i = 0; i < index; i++) {
          if (!units[i].isSpace) {
            animatableIndex++;
          }
        }

        const unitValues = getValuesForUnit(
          unit.isSpace ? 0 : animatableIndex,
          !!unit.isSpace,
        );
        // Don't pass positioning to individual units - container handles it
        const animationStyles = composeStyles(unitValues, scaleOrigin);

        // Handle spaces
        if (unit.isSpace) {
          return (
            <span key={`space-${index}`} style={{ whiteSpace: "pre" }}>
              {unit.text}
            </span>
          );
        }

        // Masked rendering: "The Window and The Actor" pattern
        // Creates kinetic slide effect where text appears to enter from behind an invisible line
        if (shouldMask) {
          // Extract transform from animation styles for the inner element
          const { transform, ...otherAnimationStyles } = animationStyles;

          return (
            <span
              key={`unit-${index}`}
              style={{
                ...baseTextStyles,
                // The Window: clips content, defines visible area
                // No animations here - it just sits there
                display: "inline-flex",
                overflow: "hidden",
                verticalAlign: "top",
              }}
            >
              <span
                style={{
                  // The Actor: all animations happen on the inner element
                  // This creates the "portal" effect where text moves through the mask
                  display: "inline-block",
                  transform,
                  ...otherAnimationStyles,
                }}
              >
                {unit.text}
              </span>
            </span>
          );
        }

        // Standard rendering (no masking) - preserves box-shadows and glow effects
        return (
          <span
            key={`unit-${index}`}
            style={{
              ...baseTextStyles,
              ...animationStyles,
            }}
          >
            {unit.text}
          </span>
        );
      })}
    </span>
  );
};
