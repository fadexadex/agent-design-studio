import React from "react";
import type { IPhoneFrameProps } from "../../types";
import { getGlareStyles, getFrameShadowStyles } from "../glassEffects";
import { deviceSpecs } from "../../presets";

/**
 * SVG clip-path definitions for iPhone variants
 */
const IPHONE_CUTOUTS = {
  // iPhone 15 Dynamic Island - pill-shaped cutout
  iphone15: `
    <svg width="0" height="0">
      <defs>
        <clipPath id="iphone15-screen" clipPathUnits="objectBoundingBox">
          <path d="
            M 0.5 0
            L 0.62 0
            C 0.63 0, 0.64 0.008, 0.64 0.02
            L 0.64 0.025
            C 0.64 0.04, 0.62 0.055, 0.58 0.055
            L 0.42 0.055
            C 0.38 0.055, 0.36 0.04, 0.36 0.025
            L 0.36 0.02
            C 0.36 0.008, 0.37 0, 0.38 0
            L 0.5 0
            M 0 0 L 1 0 L 1 1 L 0 1 Z
          " fill-rule="evenodd"/>
        </clipPath>
      </defs>
    </svg>
  `,
  // iPhone Notch - classic notch design
  "iphone-notch": `
    <svg width="0" height="0">
      <defs>
        <clipPath id="iphone-notch-screen" clipPathUnits="objectBoundingBox">
          <path d="
            M 0.5 0
            L 0.72 0
            C 0.73 0, 0.74 0.01, 0.74 0.025
            L 0.74 0.045
            C 0.74 0.055, 0.72 0.065, 0.7 0.065
            L 0.3 0.065
            C 0.28 0.065, 0.26 0.055, 0.26 0.045
            L 0.26 0.025
            C 0.26 0.01, 0.27 0, 0.28 0
            L 0.5 0
            M 0 0 L 1 0 L 1 1 L 0 1 Z
          " fill-rule="evenodd"/>
        </clipPath>
      </defs>
    </svg>
  `,
};

/**
 * IPhoneFrame Component
 *
 * Renders a realistic iPhone device frame with:
 * - Dynamic Island (iPhone 15) or Notch (older models) via SVG clip-path
 * - Accurate bezel radius (55px for 15, 47px for notch)
 * - Device bezel in dark/light themes
 * - Shadow and optional glare effect
 */
export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  theme,
  glare = false,
  variant,
  width,
  height,
  style,
}) => {
  const spec = deviceSpecs[variant];

  // Calculate dimensions
  const frameWidth = width || spec.defaultWidth;
  const frameHeight = height || spec.defaultHeight;

  // Bezel thickness (as a percentage of width)
  const bezelThickness = Math.round(frameWidth * 0.03);

  // Screen dimensions (inner area)
  const screenWidth = frameWidth - bezelThickness * 2;
  const screenHeight = frameHeight - bezelThickness * 2;

  // Theme colors
  const colors = {
    dark: {
      bezel: "#1c1c1e",
      bezelInner: "#000000",
      accent: "#2c2c2e",
    },
    light: {
      bezel: "#e5e5e7",
      bezelInner: "#f5f5f7",
      accent: "#d1d1d6",
    },
  };

  const c = colors[theme];

  const containerStyle: React.CSSProperties = {
    width: frameWidth,
    height: frameHeight,
    backgroundColor: c.bezel,
    borderRadius: spec.bezelRadius,
    padding: bezelThickness,
    boxSizing: "border-box",
    position: "relative",
    ...getFrameShadowStyles(theme, "heavy"),
    ...style,
  };

  const screenContainerStyle: React.CSSProperties = {
    width: screenWidth,
    height: screenHeight,
    borderRadius: spec.bezelRadius - bezelThickness,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  };

  const screenStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  };

  const contentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  // Dynamic Island / Notch overlay (visual representation)
  const cutoutStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10,
    pointerEvents: "none",
  };

  // Dynamic Island dimensions
  const dynamicIslandWidth =
    variant === "iphone15" ? screenWidth * 0.28 : screenWidth * 0.44;
  const dynamicIslandHeight = variant === "iphone15" ? 34 : 30;
  const dynamicIslandTop = variant === "iphone15" ? 12 : 0;
  const dynamicIslandRadius = variant === "iphone15" ? 17 : 0;

  const dynamicIslandStyle: React.CSSProperties =
    variant === "iphone15"
      ? {
          ...cutoutStyle,
          top: dynamicIslandTop,
          width: dynamicIslandWidth,
          height: dynamicIslandHeight,
          backgroundColor: "#000",
          borderRadius: dynamicIslandRadius,
        }
      : {
          ...cutoutStyle,
          width: dynamicIslandWidth,
          height: dynamicIslandHeight,
          backgroundColor: "#000",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        };

  return (
    <div style={containerStyle}>
      {/* SVG Clip Path Definition */}
      <div
        dangerouslySetInnerHTML={{ __html: IPHONE_CUTOUTS[variant] }}
        style={{ position: "absolute", width: 0, height: 0 }}
      />

      {/* Screen Container */}
      <div style={screenContainerStyle}>
        {/* Screen Content */}
        <div style={screenStyle}>
          <div style={contentStyle}>{children}</div>

          {/* Dynamic Island / Notch */}
          <div style={dynamicIslandStyle} />

          {/* Glare Overlay */}
          {glare && <div style={getGlareStyles(true)} />}
        </div>
      </div>

      {/* Side Buttons (subtle visual details) */}
      <div
        style={{
          position: "absolute",
          right: -2,
          top: frameHeight * 0.25,
          width: 3,
          height: 35,
          backgroundColor: c.accent,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -2,
          top: frameHeight * 0.2,
          width: 3,
          height: 25,
          backgroundColor: c.accent,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -2,
          top: frameHeight * 0.32,
          width: 3,
          height: 50,
          backgroundColor: c.accent,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -2,
          top: frameHeight * 0.42,
          width: 3,
          height: 50,
          backgroundColor: c.accent,
          borderRadius: 2,
        }}
      />
    </div>
  );
};
