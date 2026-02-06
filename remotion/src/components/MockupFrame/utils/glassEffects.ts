import type { CSSProperties } from "react";
import type { GlassConfig } from "../types";

/**
 * Default glass configuration values
 */
const DEFAULT_GLASS_CONFIG: Required<GlassConfig> = {
  blur: 20,
  opacity: 0.5,
  borderOpacity: 0.2,
};

/**
 * Generate glass morphism styles
 */
export const getGlassStyles = (
  config: GlassConfig | boolean | undefined,
  theme: "light" | "dark" = "dark",
): CSSProperties => {
  if (!config) return {};

  const glassConfig =
    config === true
      ? DEFAULT_GLASS_CONFIG
      : { ...DEFAULT_GLASS_CONFIG, ...config };

  const { blur, opacity, borderOpacity } = glassConfig;

  // Theme-based colors
  const backgroundColor =
    theme === "dark"
      ? `rgba(0, 0, 0, ${opacity})`
      : `rgba(255, 255, 255, ${opacity})`;

  const borderColor =
    theme === "dark"
      ? `rgba(255, 255, 255, ${borderOpacity})`
      : `rgba(0, 0, 0, ${borderOpacity})`;

  return {
    backgroundColor,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`, // Safari support
    border: `1px solid ${borderColor}`,
  };
};

/**
 * Generate glare overlay styles
 * Creates a subtle diagonal gradient that simulates screen reflection
 */
export const getGlareStyles = (enabled: boolean): CSSProperties => {
  if (!enabled) return {};

  return {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 50%)",
    borderRadius: "inherit",
  };
};

/**
 * Generate shadow styles for device frames
 */
export const getFrameShadowStyles = (
  theme: "light" | "dark" = "dark",
  intensity: "light" | "medium" | "heavy" = "medium",
): CSSProperties => {
  const shadowIntensities = {
    light: {
      dark: "0 4px 20px rgba(0, 0, 0, 0.3)",
      light: "0 4px 20px rgba(0, 0, 0, 0.15)",
    },
    medium: {
      dark: "0 8px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)",
      light: "0 8px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    heavy: {
      dark: "0 12px 60px rgba(0, 0, 0, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4)",
      light: "0 12px 60px rgba(0, 0, 0, 0.25), 0 8px 20px rgba(0, 0, 0, 0.15)",
    },
  };

  return {
    boxShadow: shadowIntensities[intensity][theme],
  };
};
