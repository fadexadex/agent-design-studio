import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type BackgroundType = "gradient-mesh" | "grid-lines" | "blobs" | "solid";
export type BackgroundVariant = "dark" | "light" | "brand";

export interface BackgroundRigProps {
  /**
   * Type of background effect.
   */
  type: BackgroundType;
  /**
   * Color variant preset.
   * @default "light"
   */
  variant?: BackgroundVariant;
  /**
   * Whether to animate the background.
   * @default true
   */
  animate?: boolean;
  /**
   * Animation speed multiplier. Higher = faster.
   * @default 1
   */
  animationSpeed?: number;
  /**
   * Custom gradient colors for mesh/blob backgrounds.
   */
  meshColors?: {
    primary?: string;
    secondary?: string;
  };
  /**
   * Additional CSS classes.
   */
  className?: string;
}

// Color presets by variant
const BG_COLORS: Record<BackgroundVariant, string> = {
  light: "#FFFFFF",
  dark: "#0F0F11",
  brand: "#4F46E5",
};

const GRID_COLORS: Record<BackgroundVariant, string> = {
  light: "rgba(0,0,0,0.05)",
  dark: "rgba(255,255,255,0.05)",
  brand: "rgba(255,255,255,0.1)",
};

const DEFAULT_MESH_COLORS: Record<
  BackgroundVariant,
  { primary: string; secondary: string }
> = {
  light: {
    primary: "rgba(99,102,241,0.2)",
    secondary: "rgba(236,72,153,0.15)",
  },
  dark: {
    primary: "rgba(99,102,241,0.3)",
    secondary: "rgba(236,72,153,0.2)",
  },
  brand: {
    primary: "rgba(255,255,255,0.2)",
    secondary: "rgba(255,255,255,0.15)",
  },
};

/**
 * BackgroundRig - Animated background effects for Remotion compositions.
 *
 * Supports gradient meshes, grid lines, organic blobs, and solid colors.
 * All animations are frame-based for proper video rendering.
 *
 * @example
 * ```tsx
 * // Animated gradient mesh
 * <BackgroundRig type="gradient-mesh" variant="light" animate />
 *
 * // Grid lines with custom speed
 * <BackgroundRig type="grid-lines" variant="dark" animationSpeed={0.5} />
 *
 * // Custom mesh colors
 * <BackgroundRig
 *   type="gradient-mesh"
 *   meshColors={{ primary: "rgba(255,0,0,0.2)", secondary: "rgba(0,0,255,0.2)" }}
 * />
 * ```
 */
export const BackgroundRig: React.FC<BackgroundRigProps> = ({
  type,
  variant = "light",
  animate = true,
  animationSpeed = 1,
  meshColors,
  className,
}) => {
  const frame = useCurrentFrame();

  // Apply animation speed multiplier
  const animFrame = frame * animationSpeed;

  const backgroundColor = BG_COLORS[variant];
  const gridColor = GRID_COLORS[variant];

  // Resolve mesh colors (custom or default)
  const resolvedMeshColors = {
    primary: meshColors?.primary ?? DEFAULT_MESH_COLORS[variant].primary,
    secondary: meshColors?.secondary ?? DEFAULT_MESH_COLORS[variant].secondary,
  };

  return (
    <AbsoluteFill
      className={className}
      style={{
        backgroundColor,
        overflow: "hidden",
        zIndex: -1,
      }}
    >
      {/* Type: Grid Lines */}
      {type === "grid-lines" && (
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke={gridColor}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      {/* Type: Gradient Mesh */}
      {type === "gradient-mesh" && (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: "-10%",
              width: "80%",
              height: "80%",
              background: `radial-gradient(circle, ${resolvedMeshColors.primary} 0%, rgba(0,0,0,0) 70%)`,
              transform: animate
                ? `translate(${Math.sin(animFrame / 60) * 50}px, ${Math.cos(animFrame / 70) * 30}px)`
                : "none",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              right: "-10%",
              width: "70%",
              height: "70%",
              background: `radial-gradient(circle, ${resolvedMeshColors.secondary} 0%, rgba(0,0,0,0) 70%)`,
              transform: animate
                ? `translate(${Math.cos(animFrame / 80) * 40}px, ${Math.sin(animFrame / 60) * 40}px)`
                : "none",
              filter: "blur(60px)",
            }}
          />
        </div>
      )}

      {/* Type: Blobs (Organic shapes) */}
      {type === "blobs" && (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "20%",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: resolvedMeshColors.primary,
              transform: animate
                ? `scale(${1 + Math.sin(animFrame / 40) * 0.1})`
                : "none",
              filter: "blur(80px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "15%",
              right: "15%",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: resolvedMeshColors.secondary,
              transform: animate
                ? `scale(${1 + Math.cos(animFrame / 50) * 0.1})`
                : "none",
              filter: "blur(80px)",
            }}
          />
        </div>
      )}

      {/* Type: Solid - Just uses the background color, no additional elements */}
      {/* The backgroundColor is already applied to AbsoluteFill */}
    </AbsoluteFill>
  );
};
