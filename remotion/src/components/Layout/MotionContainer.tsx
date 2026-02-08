import React from "react";
import { AbsoluteFill } from "remotion";
import { Animated, Move, Scale, Fade } from "remotion-animated";
import type { Animation } from "remotion-animated";

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
  /** Delay before the entrance animation starts (in frames). @default 0 */
  delay?: number;
  /** Duration of the entrance animation (in frames). @default 30 */
  duration?: number;
  /** Initial state before animation starts. @default "hidden" */
  initial?: InitialState;
  /** Exit animation state. Only triggers if exitStartFrame is provided. */
  exit?: ExitState;
  /** Frame at which exit animation should start. */
  exitStartFrame?: number;
  /** Duration of the exit animation (in frames). @default 20 */
  exitDuration?: number;
  /** Distance for slide animations (in pixels). @default 100 */
  distance?: number;
  /** Spring configuration for animations. */
  springConfig?: { damping?: number; stiffness?: number; mass?: number };
  className?: string;
  style?: React.CSSProperties;
  /** If true, uses AbsoluteFill as the wrapper. @default false */
  fill?: boolean;
  children: React.ReactNode;
}

/**
 * Build entrance animations based on initial state.
 */
function buildEntranceAnimations(
  initial: InitialState,
  delay: number,
  duration: number,
  distance: number,
  springConfig: { damping?: number; stiffness?: number; mass?: number }
): Animation[] {
  const { damping = 15, stiffness = 100, mass = 1 } = springConfig;
  const animations: Animation[] = [];

  // All initial states include fade
  animations.push(
    Fade({ to: 1, initial: 0, start: delay, duration, damping: 100 })
  );

  switch (initial) {
    case "offscreen-bottom":
      animations.push(
        Move({ y: 0, initialY: distance, start: delay, duration, damping, stiffness, mass })
      );
      break;
    case "offscreen-top":
      animations.push(
        Move({ y: 0, initialY: -distance, start: delay, duration, damping, stiffness, mass })
      );
      break;
    case "offscreen-left":
      animations.push(
        Move({ x: 0, initialX: -distance, start: delay, duration, damping, stiffness, mass })
      );
      break;
    case "offscreen-right":
      animations.push(
        Move({ x: 0, initialX: distance, start: delay, duration, damping, stiffness, mass })
      );
      break;
    case "scale-zero":
      animations.push(
        Scale({ by: 1, initial: 0, start: delay, duration, damping: 12, stiffness: 100 })
      );
      break;
    case "blur":
      // Note: remotion-animated doesn't support blur, but we include scale for similar effect
      animations.push(
        Scale({ by: 1, initial: 0.95, start: delay, duration, damping: 100 })
      );
      break;
    // "hidden" is just fade, already added above
  }

  return animations;
}

/**
 * Build exit animations based on exit state.
 */
function buildExitAnimations(
  exit: ExitState,
  exitStartFrame: number,
  exitDuration: number,
  distance: number,
  springConfig: { damping?: number; stiffness?: number; mass?: number }
): Animation[] {
  const { damping = 15, stiffness = 100, mass = 1 } = springConfig;
  const animations: Animation[] = [];

  // All exit states include fade out
  animations.push(
    Fade({ to: 0, initial: 1, start: exitStartFrame, duration: exitDuration, damping: 100 })
  );

  switch (exit) {
    case "slide-down":
      animations.push(
        Move({ y: distance, initialY: 0, start: exitStartFrame, duration: exitDuration, damping, stiffness, mass })
      );
      break;
    case "slide-up":
      animations.push(
        Move({ y: -distance, initialY: 0, start: exitStartFrame, duration: exitDuration, damping, stiffness, mass })
      );
      break;
    case "slide-left":
      animations.push(
        Move({ x: -distance, initialX: 0, start: exitStartFrame, duration: exitDuration, damping, stiffness, mass })
      );
      break;
    case "slide-right":
      animations.push(
        Move({ x: distance, initialX: 0, start: exitStartFrame, duration: exitDuration, damping, stiffness, mass })
      );
      break;
    case "scale-down":
      animations.push(
        Scale({ by: 0, initial: 1, start: exitStartFrame, duration: exitDuration, damping: 12, stiffness: 100 })
      );
      break;
    case "blur-out":
      animations.push(
        Scale({ by: 0.95, initial: 1, start: exitStartFrame, duration: exitDuration, damping: 100 })
      );
      break;
    // "fade-out" is just fade, already added above
  }

  return animations;
}

/**
 * MotionContainer - A versatile animation wrapper for Remotion.
 *
 * Uses remotion-animated for declarative, spring-based animations.
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
  springConfig = { damping: 15, stiffness: 100, mass: 1 },
  className,
  style,
  fill = false,
  children,
}) => {
  // Build entrance animations
  const entranceAnimations = buildEntranceAnimations(
    initial, delay, duration, distance, springConfig
  );

  // Build exit animations if specified
  const exitAnimations = exit && exitStartFrame !== undefined
    ? buildExitAnimations(exit, exitStartFrame, exitDuration, distance, springConfig)
    : [];

  const allAnimations = [...entranceAnimations, ...exitAnimations];

  const Wrapper = fill ? AbsoluteFill : "div";

  return (
    <Animated animations={allAnimations}>
      <Wrapper className={className} style={style}>
        {children}
      </Wrapper>
    </Animated>
  );
};
