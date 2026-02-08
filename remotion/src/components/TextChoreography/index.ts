/**
 * TextChoreography Components
 *
 * High-level text animation patterns for motion design videos.
 * These components implement specific choreography patterns that go
 * beyond simple entrance/exit animations.
 *
 * Components:
 * - CatchUpText: Words animate sequentially, later words move faster to "catch up"
 * - TextCycle: Words replace each other at the same position
 * - BounceReveal: Words appear on rhythmic bounces
 * - TextMakesSpace: Text slides aside to reveal other elements
 * - MorphText: Text transforms/morphs into another element
 */

export { CatchUpText } from "./CatchUpText";
export type { CatchUpTextProps } from "./CatchUpText";

export { TextCycle } from "./TextCycle";
export type { TextCycleProps, TextCycleItem } from "./TextCycle";

export { BounceReveal } from "./BounceReveal";
export type { BounceRevealProps } from "./BounceReveal";

export { TextMakesSpace } from "./TextMakesSpace";
export type { TextMakesSpaceProps } from "./TextMakesSpace";

export { MorphText } from "./MorphText";
export type { MorphTextProps } from "./MorphText";
