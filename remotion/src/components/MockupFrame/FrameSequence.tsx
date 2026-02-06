import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import type { FrameSequenceProps } from "./types";
import { DEFAULTS } from "./presets";

/**
 * FrameSequence Component
 *
 * A wrapper that orchestrates multiple MockupFrame children with stagger-based timing.
 * Uses Remotion's Sequence with absolute positioning for the "weaving" effect.
 *
 * Key features:
 * - Stagger-based timing: Smaller stagger = more overlap
 * - Uses premountFor for smooth loading (prevents flicker)
 * - Z-index relies on DOM order (later children render on top)
 * - layout="none" for manual absolute positioning
 *
 * @example Simple staggered sequence
 * ```tsx
 * <FrameSequence stagger={20}>
 *   <MockupFrame type="iphone15" src="screen1.png" preset="slideInUp" />
 *   <MockupFrame type="iphone15" src="screen2.png" preset="slideInUp" />
 *   <MockupFrame type="iphone15" src="screen3.png" preset="slideInUp" />
 * </FrameSequence>
 * ```
 *
 * @example Delayed sequence start
 * ```tsx
 * <FrameSequence stagger={15} startFrom={30}>
 *   <MockupFrame type="browser" src="web1.png" preset="fadeIn" />
 *   <MockupFrame type="browser" src="web2.png" preset="fadeIn" />
 * </FrameSequence>
 * ```
 */
export const FrameSequence: React.FC<FrameSequenceProps> = ({
  children,
  stagger = DEFAULTS.stagger,
  startFrom = DEFAULTS.startFrom,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Get valid children
  const childArray = React.Children.toArray(children);

  return (
    <>
      {childArray.map((child, index) => {
        if (!React.isValidElement(child)) return null;

        // Calculate start frame for this child
        const childStartFrame = startFrom + index * stagger;

        // Calculate duration for this child (from its start to end of composition)
        const childDuration = durationInFrames - childStartFrame;

        // Skip if child would start after composition ends
        if (childDuration <= 0) return null;

        return (
          <Sequence
            key={`frame-${index}`}
            from={Math.round(childStartFrame)}
            durationInFrames={childDuration}
            layout="none" // We handle positioning manually
          >
            {/* Wrap child in absolute-positioned container */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                // Z-index is naturally handled by DOM order
                // Later children render on top
              }}
            >
              {child}
            </div>
          </Sequence>
        );
      })}
    </>
  );
};
