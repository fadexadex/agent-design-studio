import type { ReactNode } from "react";
import type {
  FrameType,
  ThemeType,
  BrowserConfig,
  GlassConfig,
} from "../types";
import { BrowserFrame } from "../utils/deviceFrames/BrowserFrame";
import { IPhoneFrame } from "../utils/deviceFrames/IPhoneFrame";
import { CardFrame } from "../utils/deviceFrames/CardFrame";

interface UseFrameRendererProps {
  type: FrameType;
  theme: ThemeType;
  glare?: boolean;
  browserConfig?: BrowserConfig;
  glass?: boolean | GlassConfig;
  width?: number;
  height?: number;
}

/**
 * Hook that returns the appropriate frame component based on type
 */
export const useFrameRenderer = ({
  type,
  theme,
  glare,
  browserConfig,
  glass,
  width,
  height,
}: UseFrameRendererProps) => {
  /**
   * Render the frame with content
   */
  const renderFrame = (children: ReactNode): ReactNode => {
    // Plain type - no frame wrapper, just render children
    if (type === "plain") {
      return (
        <div
          style={{
            width: width || "auto",
            height: height || "auto",
            position: "relative",
          }}
        >
          {children}
        </div>
      );
    }

    // Browser frame
    if (type === "browser") {
      return (
        <BrowserFrame
          theme={theme}
          glare={glare}
          config={browserConfig}
          width={width}
          height={height}
        >
          {children}
        </BrowserFrame>
      );
    }

    // iPhone frames
    if (type === "iphone15" || type === "iphone-notch") {
      return (
        <IPhoneFrame
          theme={theme}
          glare={glare}
          variant={type}
          width={width}
          height={height}
        >
          {children}
        </IPhoneFrame>
      );
    }

    // Card frame
    if (type === "card") {
      return (
        <CardFrame
          theme={theme}
          glare={glare}
          glass={glass}
          width={width}
          height={height}
        >
          {children}
        </CardFrame>
      );
    }

    // Fallback - just return children
    return children;
  };

  return { renderFrame };
};
