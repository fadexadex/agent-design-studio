import React from "react";
import { AbsoluteFill } from "remotion";
import type { GridLayerConfig } from "../types";
import { GRID_DEFAULTS } from "../utils/layerDefaults";

type Props = Omit<GridLayerConfig, "type">;

/**
 * GridLayer - Renders an SVG grid pattern overlay.
 * Extracted from BackgroundRig's grid-lines type for layer-based composition.
 */
export const GridLayer: React.FC<Props> = ({
  color = GRID_DEFAULTS.color,
  size = GRID_DEFAULTS.size,
  strokeWidth = GRID_DEFAULTS.strokeWidth,
  opacity = GRID_DEFAULTS.opacity,
  blendMode,
}) => {
  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: blendMode,
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="background-grid"
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${size} 0 L 0 0 0 ${size}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#background-grid)" />
      </svg>
    </AbsoluteFill>
  );
};
