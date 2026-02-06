/**
 * Transitions module
 *
 * Re-exports from @remotion/transitions for standard scene transitions,
 * plus custom IrisTransition for circular wipe effects.
 *
 * Usage with TransitionSeries (recommended for scene-to-scene):
 * ```tsx
 * import { TransitionSeries, linearTiming } from '@/components/Transitions';
 * import { fade } from '@remotion/transitions/fade';
 *
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <SceneA />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition
 *     presentation={fade()}
 *     timing={linearTiming({ durationInFrames: 15 })}
 *   />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <SceneB />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 * ```
 *
 * Usage with IrisTransition (overlay style):
 * ```tsx
 * import { IrisTransition } from '@/components/Transitions';
 *
 * <IrisTransition mode="exit" durationInFrames={30} color="#000" />
 * ```
 */

// Re-export from @remotion/transitions
export {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";

// Export custom transitions
export { IrisTransition } from "./IrisTransition";
export type { IrisTransitionProps, IrisMode } from "./IrisTransition";

// Re-export transition presentation types for convenience
// Users can import specific presentations from @remotion/transitions/* directly:
// import { fade } from '@remotion/transitions/fade';
// import { slide } from '@remotion/transitions/slide';
// import { wipe } from '@remotion/transitions/wipe';
// import { flip } from '@remotion/transitions/flip';
// import { clockWipe } from '@remotion/transitions/clock-wipe';
