import React from "react";
import { AbsoluteFill } from "remotion";
import type { MeshGradientLayerConfig } from "../types";
import { MESH_DEFAULTS } from "../utils/layerDefaults";
import { useAnimationEngine } from "../hooks/useAnimationEngine";

type Props = Omit<MeshGradientLayerConfig, "type">;

export const MeshGradientLayer: React.FC<Props> = ({
  colors,
  points,
  spread = MESH_DEFAULTS.spread,
  opacity = MESH_DEFAULTS.opacity,
  blendMode,
  animated = false,
  animationSpeed = 1,
}) => {
  const { drift } = useAnimationEngine({ animated, animationSpeed });

  // Use provided points or generate defaults matching the number of colors
  const defaultPoints = MESH_DEFAULTS.points;
  const meshPoints =
    points ?? colors.map((_, i) => defaultPoints[i % defaultPoints.length]);

  // Animate each point with slightly different periods for organic motion
  const animatedPoints = meshPoints.map((pt, i) => ({
    x: drift(pt.x, 10 + i * 3, 400 + i * 80),
    y: drift(pt.y, 8 + i * 2, 350 + i * 70),
  }));

  // Build overlapping radial gradients
  const blobs = animatedPoints
    .map(
      (pos, i) =>
        `radial-gradient(circle at ${pos.x}% ${pos.y}%, ${colors[i % colors.length]} 0%, transparent ${spread}%)`
    )
    .join(", ");

  // Base gradient as fallback
  const base = `linear-gradient(135deg, ${colors[0]}, ${colors[colors.length - 1]})`;

  return (
    <AbsoluteFill
      style={{
        background: `${blobs}, ${base}`,
        opacity,
        mixBlendMode: blendMode,
      }}
    />
  );
};
