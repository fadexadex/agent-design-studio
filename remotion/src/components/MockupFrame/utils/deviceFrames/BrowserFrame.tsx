import React from "react";
import type { BrowserFrameProps } from "../../types";
import { getGlareStyles, getFrameShadowStyles } from "../glassEffects";
import { deviceSpecs } from "../../presets";

/**
 * BrowserFrame Component
 *
 * Renders a macOS Safari-style browser window with:
 * - Title bar with traffic light buttons (red/yellow/green)
 * - Optional URL bar
 * - Light/dark theme support
 * - Box shadow for depth
 * - Optional glare effect
 */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  theme,
  glare = false,
  width,
  height,
  style,
  config = {},
}) => {
  const { borderGradient } = config;
  const spec = deviceSpecs.browser;

  // Calculate dimensions
  const frameWidth = width || spec.defaultWidth;
  const frameHeight = height || spec.defaultHeight;

  // Theme colors
  const colors = {
    dark: {
      background: "#1E1E1E",
      border: "rgba(255, 255, 255, 0.08)",
    },
    light: {
      background: "#ffffff",
      border: "rgba(0, 0, 0, 0.08)",
    },
  };

  const c = colors[theme];

  // Base frame styles (inner part if gradient is active)
  const baseFrameStyle: React.CSSProperties = {
    width: borderGradient ? "100%" : frameWidth,
    height: borderGradient ? "100%" : frameHeight,
    backgroundColor: c.background,
    borderRadius: spec.bezelRadius,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${c.border}`,
  };

  // Content styles - RESTORED
  const contentStyle: React.CSSProperties = {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    minHeight: 0,
    backgroundColor: c.background,
    borderRadius: spec.bezelRadius, // Ensure content respects border radius
  };

  const contentInnerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  // Render Inner Frame content
  const renderInnerFrame = () => (
    <div style={baseFrameStyle}>
      {/* Content Area - No Header */}
      <div style={contentStyle}>
        <div style={contentInnerStyle}>{children}</div>
        {/* Glare Overlay */}
        {glare && <div style={getGlareStyles(true)} />}
      </div>
    </div>
  );

  // If gradient border is active, wrap in gradient container
  if (borderGradient) {
    const borderWidth = 2; // Thickness of the gradient border
    // Default gradient: clean blue-purple-ish or user provided string
    const gradientBg =
      borderGradient === true
        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        : (borderGradient as string);

    const wrapperStyle: React.CSSProperties = {
      width: frameWidth + borderWidth * 2,
      height: frameHeight + borderWidth * 2,
      background: gradientBg,
      borderRadius: spec.bezelRadius + borderWidth,
      padding: borderWidth,
      display: "flex",
      ...getFrameShadowStyles(theme, "heavy"),
      ...style, // Apply external positioning/sizing styles to wrapper
    };

    return <div style={wrapperStyle}>{renderInnerFrame()}</div>;
  }

  // Standard Render (No Gradient)
  // Merge external styles and shadows directly onto the frame
  const standardStyle: React.CSSProperties = {
    ...baseFrameStyle,
    ...getFrameShadowStyles(theme, "heavy"),
    ...style,
  };

  return (
    <div style={standardStyle}>
      {/* Content Area - No Header */}
      <div style={contentStyle}>
        <div style={contentInnerStyle}>{children}</div>
        {/* Glare Overlay */}
        {glare && <div style={getGlareStyles(true)} />}
      </div>
    </div>
  );
};
