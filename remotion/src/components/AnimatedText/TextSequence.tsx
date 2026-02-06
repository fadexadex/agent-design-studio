import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { AnimatedText } from "./AnimatedText";
import type { AnimatedTextProps, TextSequenceProps, PresetType } from "./types";

/**
 * TextSequence.Item props
 */
export interface TextSequenceItemProps extends Omit<AnimatedTextProps, "exit"> {
  duration: number; // seconds this item is visible
  delay?: number; // manual mode: seconds to offset from calculated start
  exitPreset?: PresetType; // auto-apply exit animation
}

/**
 * TextSequence.Item component
 * Renders an AnimatedText with timing controlled by parent TextSequence
 */
const TextSequenceItem: React.FC<TextSequenceItemProps> = ({
  duration,
  delay,
  exitPreset,
  ...animatedTextProps
}) => {
  // This component is a wrapper that passes props to AnimatedText
  // The parent TextSequence handles the Sequence wrapping and timing
  return <AnimatedText {...animatedTextProps} />;
};

/**
 * TextSequence component
 *
 * A higher-level component that manages multiple text elements with timing.
 * Supports two modes:
 * - 'chain' (default): Auto-calculates timing, AI-friendly - just specify duration for each item
 * - 'manual': Use delay prop for precise control
 *
 * Why 'chain' mode is AI-friendly:
 * - LLMs struggle with relative timing calculations ("start 0.5s after previous ends")
 * - Chain mode: AI just specifies `duration` for each item, timing is automatic
 * - Overlap is a single prop on the parent, not per-item math
 *
 * @example Chain Mode (AI-friendly, no math required!)
 * ```tsx
 * <TextSequence mode="chain" overlap={0.5}>
 *   <TextSequence.Item text="Turn Books" preset="fadeBlurIn" duration={2} />
 *   <TextSequence.Item text="Into Audio" preset="fadeBlurIn" duration={2} />
 *   <TextSequence.Item text="Any Language" preset="slideInLeft" duration={2.5} />
 * </TextSequence>
 * // Results in: Item1 @ 0s, Item2 @ 1.5s, Item3 @ 3s (each overlaps by 0.5s)
 * ```
 *
 * @example Manual Mode (precise control)
 * ```tsx
 * <TextSequence mode="manual">
 *   <TextSequence.Item text="Turn Books" anchor="center" preset="fadeBlurIn" duration={2} />
 *   <TextSequence.Item text="Into Audio" anchor="center" delay={0.5} preset="fadeBlurIn" duration={2} />
 * </TextSequence>
 * ```
 */
export const TextSequence: React.FC<TextSequenceProps> & {
  Item: typeof TextSequenceItem;
} = ({ mode = "chain", overlap = 0, children }) => {
  const { fps } = useVideoConfig();

  // In chain mode, automatically calculate start frames
  let runningFrame = 0;

  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;

        // Get props from the child
        const childProps = child.props as TextSequenceItemProps;
        const { duration, delay = 0 } = childProps;

        // Convert seconds to frames
        const durationFrames = Math.round(duration * fps);
        const overlapFrames = Math.round(overlap * fps);
        const delayFrames = Math.round(delay * fps);

        // Calculate start frame based on mode
        let startFrame: number;
        if (mode === "chain") {
          // Chain mode: items appear sequentially with optional overlap
          startFrame = runningFrame;
          // Update running frame for next item (subtract overlap for next item's start)
          runningFrame += durationFrames - overlapFrames;
        } else {
          // Manual mode: use delay prop to offset from running frame
          startFrame = runningFrame + delayFrames;
          runningFrame = startFrame + durationFrames;
        }

        return (
          <Sequence
            from={Math.max(0, Math.round(startFrame))}
            durationInFrames={durationFrames}
            premountFor={fps} // Always premount for smooth transitions
          >
            {/* Clone the child but render it directly, not through TextSequenceItem */}
            <AnimatedText
              {...(childProps as Omit<
                TextSequenceItemProps,
                "duration" | "delay" | "exitPreset"
              >)}
            />
          </Sequence>
        );
      })}
    </>
  );
};

// Attach Item as a static property
TextSequence.Item = TextSequenceItem;
