import React, { useMemo } from "react";
import { useCurrentFrame, interpolate } from "remotion";

// Variants of the cursor
export type CursorVariant = "arrow" | "pointer" | "text" | "wait" | "crosshair";

export interface DynamicCursorProps {
  x: number;
  y: number;
  variant?: CursorVariant;
  isClicking?: boolean;
  color?: string;
  opacity?: number;
  scale?: number;
  label?: string; // e.g. "John Doe"
  /**
   * Frame at which the ripple animation should start.
   * If provided, a ripple effect will animate from this frame.
   * Use with Sequence to control timing relative to component mount.
   */
  rippleStartFrame?: number;
  /**
   * Duration of the ripple animation in frames.
   * @default 30
   */
  rippleDuration?: number;
}

// Cursor hotspot offsets by variant
const CURSOR_OFFSETS: Record<CursorVariant, { x: number; y: number }> = {
  arrow: { x: 0, y: 0 },
  pointer: { x: -10, y: -4 },
  text: { x: -12, y: -12 },
  crosshair: { x: -12, y: -12 },
  wait: { x: -12, y: -12 },
};

export const DynamicCursor: React.FC<DynamicCursorProps> = ({
  x,
  y,
  variant = "arrow",
  isClicking = false,
  color = "#000000",
  opacity = 1,
  scale = 1,
  label,
  rippleStartFrame,
  rippleDuration = 30,
}) => {
  const frame = useCurrentFrame();

  // Click scale effect
  const clickScale = isClicking ? 0.85 : 1;
  const currentScale = scale * clickScale;

  // Frame-based ripple animation (replaces CSS animate-ping)
  const showRipple =
    rippleStartFrame !== undefined && frame >= rippleStartFrame;
  const rippleProgress = showRipple
    ? interpolate(frame - rippleStartFrame, [0, rippleDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const rippleScale = interpolate(rippleProgress, [0, 1], [0.5, 2.5]);
  const rippleOpacity = interpolate(rippleProgress, [0, 1], [0.6, 0]);

  // Refined cursor SVG paths
  const cursorPath = useMemo(() => {
    switch (variant) {
      case "pointer": // Hand
        return (
          <path
            d="M10.5 23.5C10.5 23.5 10.5 19.5 10.5 19.5C10.5 19.5 10.5 19.5 10.5 19.5L10.5 19.5C10.5 19.5 10.5 19.5 10.5 19.5C8.3 19.5 6.5 17.7 6.5 15.5L6.5 8.5C6.5 8.5 6.5 8.5 6.5 8.5C6.5 8.5 6.5 8.5 6.5 8.5C6.5 6.8 7.8 5.5 9.5 5.5C10.3 5.5 11.1 5.8 11.6 6.4C11.9 5 13.1 4 14.5 4C15.9 4 17.1 5 17.4 6.4C17.9 5.8 18.7 5.5 19.5 5.5C21.2 5.5 22.5 6.8 22.5 8.5L22.5 14.5C22.5 14.5 22.5 14.5 22.5 14.5C22.5 17.8 19.8 20.5 16.5 20.5L16.5 20.5L16.5 24.5H10.5V23.5Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        );

      case "text": // I-Beam
        return (
          <path
            d="M12 4V20M8 4H16M8 20H16"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );

      case "wait": // Loading Circle
        return (
          <g>
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeOpacity="0.3"
            />
            <path
              d="M12 4 A 8 8 0 0 1 20 12"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        );

      case "crosshair":
        return (
          <path
            d="M12 2V22M2 12H22"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="square"
          />
        );

      case "arrow":
      default:
        return (
          <path
            d="M5.5 4.5L18.5 17.5L12.5 17.5L15.5 24.5L13.5 25.5L10.5 18.5L5.5 22.5V4.5Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        );
    }
  }, [variant, color]);

  // Get offset from constant map
  const offset = CURSOR_OFFSETS[variant];

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {/* Ripple Effect (Behind cursor) - Frame-based animation */}
      {showRipple && rippleProgress < 1 && (
        <div
          style={{
            position: "absolute",
            left: offset.x - 20,
            top: offset.y - 20,
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            opacity: rippleOpacity,
            transform: `scale(${rippleScale})`,
          }}
        />
      )}

      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${currentScale})`,
        }}
      >
        {/* Visual Cursor */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.15))",
          }}
        >
          {cursorPath}
        </svg>

        {/* Label (Co-presence tag) */}
        {label && (
          <div
            style={{
              position: "absolute",
              left: 16, // To right of cursor
              top: 16, // Below cursor
              backgroundColor: color,
              color: "white",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
};
