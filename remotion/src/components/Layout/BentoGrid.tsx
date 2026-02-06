import React from "react";
import {
  MotionContainer,
  MotionContainerProps,
  InitialState,
} from "./MotionContainer";

export interface BentoItemProps {
  /**
   * Number of columns this item spans.
   * @default 1
   */
  colSpan?: number;
  /**
   * Number of rows this item spans.
   * @default 1
   */
  rowSpan?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;

  /**
   * Additional delay offset added to the grid's staggered calculation.
   * @default 0
   */
  delayOffset?: number;
  /**
   * Custom animation props to override the grid's default animation.
   */
  animation?: Partial<MotionContainerProps>;
}

/**
 * BentoItem - A grid cell wrapper for use inside BentoGrid.
 *
 * Can specify column/row spans and custom animation overrides.
 *
 * @example
 * ```tsx
 * <BentoGrid>
 *   <BentoItem colSpan={2} rowSpan={2}>
 *     <MainFeature />
 *   </BentoItem>
 *   <BentoItem delayOffset={5}>
 *     <SecondaryFeature />
 *   </BentoItem>
 * </BentoGrid>
 * ```
 */
export const BentoItem: React.FC<BentoItemProps> = ({
  colSpan = 1,
  rowSpan = 1,
  className,
  style,
  children,
  // delayOffset and animation are read by BentoGrid, not used directly here
}) => {
  return (
    <div
      className={className}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export interface BentoGridProps {
  children: React.ReactNode;
  /**
   * Number of columns in the grid.
   * @default 3
   */
  columns?: number;
  /**
   * Gap between grid items in pixels.
   * @default 24
   */
  gap?: number;
  className?: string;

  /**
   * Delay between each item's animation (in frames).
   * @default 5
   */
  staggerDelay?: number;
  /**
   * Initial delay before the first item animates (in frames).
   * @default 0
   */
  initialDelay?: number;
  /**
   * Initial animation state for all items.
   * @default "offscreen-bottom"
   */
  initialState?: InitialState;
  /**
   * Distance for slide animations (in pixels).
   * @default 50
   */
  distance?: number;
}

/**
 * BentoGrid - A CSS Grid layout with staggered entrance animations.
 *
 * Automatically wraps each child in a MotionContainer with staggered delays.
 * If children are BentoItem components, their props will be respected.
 *
 * @example
 * ```tsx
 * <BentoGrid columns={3} staggerDelay={5}>
 *   <BentoItem colSpan={2}>
 *     <LargeCard />
 *   </BentoItem>
 *   <BentoItem>
 *     <SmallCard />
 *   </BentoItem>
 * </BentoGrid>
 * ```
 */
export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  columns = 3,
  gap = 24,
  className,
  staggerDelay = 5,
  initialDelay = 0,
  initialState = "offscreen-bottom",
  distance = 50,
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
        width: "100%",
        height: "100%",
      }}
    >
      {childrenArray.map((child, index) => {
        // Calculate base delay for this item
        let delay = initialDelay + index * staggerDelay;
        let animationOverrides: Partial<MotionContainerProps> = {};

        // If child is a BentoItem, extract its props
        if (React.isValidElement<BentoItemProps>(child)) {
          const { delayOffset = 0, animation } = child.props;

          // Add the item's delay offset to the calculated delay
          delay += delayOffset;

          // Merge animation overrides
          if (animation) {
            animationOverrides = animation;
          }
        }

        return (
          <MotionContainer
            key={index}
            delay={delay}
            initial={initialState}
            distance={distance}
            style={{ width: "100%", height: "100%" }}
            {...animationOverrides}
          >
            {child}
          </MotionContainer>
        );
      })}
    </div>
  );
};
