import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export type InitialState =
  | "hidden"
  | "offscreen-bottom"
  | "offscreen-top"
  | "offscreen-left"
  | "offscreen-right"
  | "scale-zero"
  | "blur";

export type ExitState =
  | "fade-out"
  | "slide-down"
  | "slide-up"
  | "slide-left"
  | "slide-right"
  | "scale-down"
  | "blur-out";

export interface MotionContainerProps {
  /**
   * Delay before the entrance animation starts (in frames).
   * @default 0
   */
  delay?: number;
  /**
   * Duration of the entrance animation (in frames).
   * @default 30
   */
  duration?: number;

  /**
   * Initial state before animation starts.
   * @default "hidden"
   */
  initial?: InitialState;

  /**
   * Exit animation state. Only triggers if exitStartFrame is provided.
   */
  exit?: ExitState;

  /**
   * Frame at which exit animation should start.
   * If not provided, no exit animation will play.
   */
  exitStartFrame?: number;

  /**
   * Duration of the exit animation (in frames).
   * @default 20
   */
  exitDuration?: number;

  /**
   * Distance for slide animations (in pixels).
   * @default 100
   */
  distance?: number;

  /**
   * Spring configuration for animations.
   * @default { damping: 15, stiffness: 100, mass: 1 }
   */
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };

  // Styling
  className?: string;
  style?: React.CSSProperties;
  /**
   * If true, uses AbsoluteFill as the wrapper.
   * @default false
   */
  fill?: boolean;

  children: React.ReactNode;
}

/**
 * MotionContainer - A versatile animation wrapper for Remotion.
 *
 * Supports entrance and exit animations with configurable timing,
 * using Remotion's spring() for natural motion.
 *
 * @example
 * ```tsx
 * // Basic fade in
 * <MotionContainer initial="hidden" delay={10}>
 *   <Content />
 * </MotionContainer>
 *
 * // Slide up with exit
 * <MotionContainer
 *   initial="offscreen-bottom"
 *   exit="slide-down"
 *   exitStartFrame={60}
 *   distance={50}
 * >
 *   <Content />
 * </MotionContainer>
 * ```
 */
export const MotionContainer: React.FC<MotionContainerProps> = ({
  delay = 0,
  duration = 30,
  initial = "hidden",
  exit,
  exitStartFrame,
  exitDuration = 20,
  distance = 100,
  springConfig = { damping: 200 },
  className,
  style,
  fill = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation progress (0 to 1)
  // Use lower damping for visible animation, duration stretches the spring
  const entranceProgress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: springConfig.damping ?? 15,
      stiffness: springConfig.stiffness ?? 100,
      mass: springConfig.mass ?? 1,
    },
    durationInFrames: duration,
  });

  // Exit animation progress (0 to 1)
  const hasExit = exit && exitStartFrame !== undefined;
  const exitProgress = hasExit
    ? spring({
        frame: frame - exitStartFrame,
        fps,
        config: {
          damping: springConfig.damping ?? 15,
          stiffness: springConfig.stiffness ?? 100,
          mass: springConfig.mass ?? 1,
        },
        durationInFrames: exitDuration,
      })
    : 0;

  // Combined progress: entrance goes 0->1, exit subtracts back to 0
  // This creates smooth enter/exit with spring physics
  const progress = entranceProgress - exitProgress;

  // Calculate animated styles based on initial state
  const getEntranceStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};

    // Opacity (most initial states include fade)
    if (
      initial === "hidden" ||
      initial === "offscreen-bottom" ||
      initial === "offscreen-top" ||
      initial === "offscreen-left" ||
      initial === "offscreen-right" ||
      initial === "scale-zero" ||
      initial === "blur"
    ) {
      styles.opacity = interpolate(progress, [0, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }

    // Transform based on initial state
    const transforms: string[] = [];

    if (initial === "offscreen-bottom") {
      const translateY = interpolate(progress, [0, 1], [distance, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transforms.push(`translateY(${translateY}px)`);
    }

    if (initial === "offscreen-top") {
      const translateY = interpolate(progress, [0, 1], [-distance, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transforms.push(`translateY(${translateY}px)`);
    }

    if (initial === "offscreen-left") {
      const translateX = interpolate(progress, [0, 1], [-distance, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transforms.push(`translateX(${translateX}px)`);
    }

    if (initial === "offscreen-right") {
      const translateX = interpolate(progress, [0, 1], [distance, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transforms.push(`translateX(${translateX}px)`);
    }

    if (initial === "scale-zero") {
      // Use a separate bouncy spring for scale
      const scaleSpring = spring({
        frame: frame - delay,
        fps,
        config: { damping: 12, stiffness: 100 },
      });
      const scaleValue = hasExit ? scaleSpring - exitProgress : scaleSpring;
      transforms.push(`scale(${Math.max(0, scaleValue)})`);
    }

    if (initial === "blur") {
      const blurAmount = interpolate(progress, [0, 1], [10, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      styles.filter = `blur(${blurAmount}px)`;
    }

    if (transforms.length > 0) {
      styles.transform = transforms.join(" ");
    }

    return styles;
  };

  const animatedStyles = getEntranceStyles();
  const combinedStyle: React.CSSProperties = { ...style, ...animatedStyles };

  if (fill) {
    return (
      <AbsoluteFill className={className} style={combinedStyle}>
        {children}
      </AbsoluteFill>
    );
  }

  return (
    <div className={className} style={combinedStyle}>
      {children}
    </div>
  );
};
