import { useVideoConfig, useCurrentFrame, interpolate, spring } from "remotion";
import { mapEasing } from "../utils/interpolation";
import type {
  AnchorPosition,
  PositioningProps,
  PositioningResult,
  SpringConfig,
  EasingType,
} from "../types";

/**
 * Anchor position to percentage mapping
 */
const anchorToPercent: Record<AnchorPosition, { x: number; y: number }> = {
  center: { x: 50, y: 50 },
  top: { x: 50, y: 0 },
  bottom: { x: 50, y: 100 },
  left: { x: 0, y: 50 },
  right: { x: 100, y: 50 },
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 100, y: 0 },
  "bottom-left": { x: 0, y: 100 },
  "bottom-right": { x: 100, y: 100 },
};

/**
 * Parse offset value (supports px as number or percentage as string)
 */
const parseOffset = (
  offset: number | string | undefined,
  dimension: number,
): number => {
  if (offset === undefined) return 0;
  if (typeof offset === "number") return offset;

  // Parse percentage string (e.g., "10%", "-5%")
  const percentMatch = offset.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (percentMatch) {
    return (parseFloat(percentMatch[1]) / 100) * dimension;
  }

  // Parse pixel string (e.g., "20px")
  const pxMatch = offset.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  return 0;
};

/**
 * Parse coordinate value (supports px as number or percentage as string)
 */
const parseCoordinate = (
  coord: number | string | undefined,
  dimension: number,
): number | undefined => {
  if (coord === undefined) return undefined;
  if (typeof coord === "number") return coord;

  // Parse percentage string
  const percentMatch = coord.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (percentMatch) {
    return (parseFloat(percentMatch[1]) / 100) * dimension;
  }

  // Parse pixel string
  const pxMatch = coord.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  return undefined;
};

/**
 * Centering adjustment based on anchor
 * This transform offsets the element so its anchor point aligns with the position
 */
const getCenterTransform = (anchor: AnchorPosition): string => {
  const offsets: Record<AnchorPosition, string> = {
    center: "translate(-50%, -50%)",
    top: "translate(-50%, 0%)",
    bottom: "translate(-50%, -100%)",
    left: "translate(0%, -50%)",
    right: "translate(-100%, -50%)",
    "top-left": "translate(0%, 0%)",
    "top-right": "translate(-100%, 0%)",
    "bottom-left": "translate(0%, -100%)",
    "bottom-right": "translate(-100%, -100%)",
  };
  return offsets[anchor];
};

/**
 * Check if easing is a spring config
 */
const isSpringConfig = (
  easing: EasingType | SpringConfig | undefined,
): easing is SpringConfig => {
  return typeof easing === "object" && easing?.type === "spring";
};

/**
 * usePositioning hook
 *
 * Returns transform strings for positioning (not wrapper styles!)
 * This approach preserves 3D transforms and maintains a single GPU layer.
 *
 * CRITICAL: Positioning is OPT-IN, not default!
 * If no anchor/x/y provided, stay in normal document flow (for LayoutGrid compatibility)
 */
export function usePositioning(props: PositioningProps): PositioningResult {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // CRITICAL: Positioning is OPT-IN, not default!
  // If no anchor/x/y provided, stay in normal document flow
  if (
    !props.anchor &&
    props.x === undefined &&
    props.y === undefined &&
    !props.anchorAnimation
  ) {
    return {
      positionTransform: "",
      centerTransform: "",
      isPositioned: false, // Element stays in normal flow (flexbox, etc.)
    };
  }

  // Determine the anchor to use (from x/y coords or anchor prop)
  let finalX: number;
  let finalY: number;
  let effectiveAnchor: AnchorPosition;

  // Handle explicit x/y coordinates
  const explicitX = parseCoordinate(props.x, width);
  const explicitY = parseCoordinate(props.y, height);

  if (explicitX !== undefined || explicitY !== undefined) {
    // Using explicit coordinates
    finalX = explicitX ?? width / 2;
    finalY = explicitY ?? height / 2;
    effectiveAnchor = props.anchor ?? "center";

    // Apply offsets
    finalX += parseOffset(props.offsetX, width);
    finalY += parseOffset(props.offsetY, height);
  } else if (props.anchorAnimation) {
    // Handle animated positioning
    const {
      from,
      to,
      delay = 0,
      duration = 30,
      easing,
    } = props.anchorAnimation;

    const fromX =
      (anchorToPercent[from].x / 100) * width +
      parseOffset(props.anchorAnimation.fromOffsetX, width);
    const fromY =
      (anchorToPercent[from].y / 100) * height +
      parseOffset(props.anchorAnimation.fromOffsetY, height);
    const toX =
      (anchorToPercent[to].x / 100) * width +
      parseOffset(props.anchorAnimation.toOffsetX, width);
    const toY =
      (anchorToPercent[to].y / 100) * height +
      parseOffset(props.anchorAnimation.toOffsetY, height);

    if (isSpringConfig(easing)) {
      // Use spring for animated positioning
      const springValue = spring({
        frame: Math.max(0, frame - delay),
        fps,
        config: {
          damping: easing.damping ?? 10,
          stiffness: easing.stiffness ?? 100,
          mass: easing.mass ?? 1,
        },
      });
      finalX = fromX + springValue * (toX - fromX);
      finalY = fromY + springValue * (toY - fromY);
    } else {
      // Use interpolate with easing
      finalX = interpolate(frame, [delay, delay + duration], [fromX, toX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: mapEasing(easing as EasingType | undefined),
      });
      finalY = interpolate(frame, [delay, delay + duration], [fromY, toY], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: mapEasing(easing as EasingType | undefined),
      });
    }

    // Use the 'to' anchor for centering (where element is moving toward)
    effectiveAnchor = to;
  } else {
    // Using anchor-based positioning
    const anchor = props.anchor ?? "center";
    const baseX = (anchorToPercent[anchor].x / 100) * width;
    const baseY = (anchorToPercent[anchor].y / 100) * height;

    // Apply offsets
    const offsetX = parseOffset(props.offsetX, width);
    const offsetY = parseOffset(props.offsetY, height);

    finalX = baseX + offsetX;
    finalY = baseY + offsetY;
    effectiveAnchor = anchor;
  }

  // Return TRANSFORM STRINGS (not CSS object!)
  // These will be combined with animation transforms
  return {
    positionTransform: `translate(${finalX}px, ${finalY}px)`,
    // Also return centering transform based on anchor
    centerTransform: getCenterTransform(effectiveAnchor),
    isPositioned: true,
  };
}
