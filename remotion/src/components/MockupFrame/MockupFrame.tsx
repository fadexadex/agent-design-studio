import React from "react";
import { Img, Video } from "remotion";
import type { MockupFrameProps } from "./types";
import { useAnimationCalculator } from "./hooks/useAnimationCalculator";
import { useStyleComposer, getScaleOrigin } from "./hooks/useStyleComposer";
import { useFrameRenderer } from "./hooks/useFrameRenderer";
import { getDeviceSpec } from "./presets";

/**
 * MockupFrame Component
 *
 * Wraps content (images/videos/divs) in realistic device shells with
 * smooth Remotion-based animations.
 *
 * @example Basic iPhone mockup
 * ```tsx
 * <MockupFrame
 *   type="iphone15"
 *   src="/screenshots/app-screen.png"
 *   preset="slideInUp"
 * />
 * ```
 *
 * @example Browser with URL bar
 * ```tsx
 * <MockupFrame
 *   type="browser"
 *   browserConfig={{ url: "example.com", showButtons: true }}
 *   preset="fadeIn"
 * >
 *   <MyWebsitePreview />
 * </MockupFrame>
 * ```
 *
 * @example Glass card with custom content
 * ```tsx
 * <MockupFrame
 *   type="card"
 *   glass
 *   glare
 *   preset="springIn"
 * >
 *   <div>Custom card content</div>
 * </MockupFrame>
 * ```
 */
export const MockupFrame: React.FC<MockupFrameProps> = (props) => {
  const {
    src,
    children,
    type = "plain",
    theme = "dark",
    glass,
    glare = false,
    browserConfig,
    width,
    height,
    zIndex,
    style,
    contentStyle,
    scale: scaleProp,
  } = props;

  // Get device spec for default dimensions
  const deviceSpec = getDeviceSpec(type);
  const frameWidth = width || deviceSpec.defaultWidth;
  const frameHeight = height || deviceSpec.defaultHeight;

  // Calculate animation values
  const { values } = useAnimationCalculator(props);

  // Get style composer
  const { composeStyles } = useStyleComposer();

  // Get scale origin if provided
  const scaleOrigin = getScaleOrigin(scaleProp);

  // Compose animation styles
  const animationStyles = composeStyles(values, scaleOrigin);

  // Get frame renderer
  const { renderFrame } = useFrameRenderer({
    type,
    theme,
    glare,
    browserConfig,
    glass,
    width: frameWidth,
    height: frameHeight,
  });

  // Determine content to render
  const renderContent = () => {
    // If src is provided, render image or video
    if (src) {
      const isVideo =
        src.endsWith(".mp4") ||
        src.endsWith(".webm") ||
        src.endsWith(".mov") ||
        src.includes("video");

      if (isVideo) {
        return (
          <Video
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              ...contentStyle,
            }}
          />
        );
      }

      return (
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            ...contentStyle,
          }}
        />
      );
    }

    // Otherwise render children
    return children;
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    display: "inline-block",
    ...animationStyles,
    ...(zIndex !== undefined && { zIndex }),
    ...style,
  };

  return <div style={containerStyles}>{renderFrame(renderContent())}</div>;
};
