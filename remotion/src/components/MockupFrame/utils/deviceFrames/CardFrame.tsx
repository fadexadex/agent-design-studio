import React from "react";
import type { CardFrameProps } from "../../types";
import {
  getGlassStyles,
  getGlareStyles,
  getFrameShadowStyles,
} from "../glassEffects";
import { deviceSpecs } from "../../presets";

/**
 * CardFrame Component
 *
 * Renders a glass-morphism style card with:
 * - Backdrop blur effect
 * - Semi-transparent background
 * - Subtle white/dark border
 * - Soft shadow
 * - Optional glare effect
 */
export const CardFrame: React.FC<CardFrameProps> = ({
  children,
  theme,
  glare = false,
  glass = true,
  width,
  height,
  style,
}) => {
  const spec = deviceSpecs.card;

  // Calculate dimensions
  const frameWidth = width || spec.defaultWidth;
  const frameHeight = height || spec.defaultHeight;

  // Get glass styles
  const glassStyles = getGlassStyles(glass, theme);

  // Fallback background for non-glass mode
  const solidBackground =
    theme === "dark"
      ? {
          backgroundColor: "#1c1c1e",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }
      : { backgroundColor: "#ffffff", border: "1px solid rgba(0, 0, 0, 0.1)" };

  const containerStyle: React.CSSProperties = {
    width: frameWidth,
    height: frameHeight,
    borderRadius: spec.bezelRadius,
    overflow: "hidden",
    position: "relative",
    ...(glass ? glassStyles : solidBackground),
    ...getFrameShadowStyles(theme, "medium"),
    ...style,
  };

  const contentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  return (
    <div style={containerStyle}>
      {/* Content */}
      <div style={contentStyle}>{children}</div>

      {/* Glare Overlay */}
      {glare && <div style={getGlareStyles(true)} />}
    </div>
  );
};
