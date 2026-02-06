import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { DynamicCursor } from "./DynamicCursor";
import { CursorPath } from "./CursorPath";

export const DynamicCursorTest: React.FC = () => {
  return (
    <AbsoluteFill className="bg-white">
      <AbsoluteFill className="flex flex-row items-center justify-around p-10">
        {/* Arrow Variant */}
        <div className="relative w-32 h-32 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
          <p className="absolute -top-8 text-gray-500 font-mono text-sm">
            Arrow
          </p>
          <DynamicCursor x={64} y={64} variant="arrow" />
        </div>

        {/* Pointer Variant */}
        <div className="relative w-32 h-32 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
          <p className="absolute -top-8 text-gray-500 font-mono text-sm">
            Pointer
          </p>
          <DynamicCursor x={64} y={64} variant="pointer" />
        </div>

        {/* Text Variant */}
        <div className="relative w-32 h-32 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
          <p className="absolute -top-8 text-gray-500 font-mono text-sm">
            Text
          </p>
          <DynamicCursor x={64} y={64} variant="text" color="#2563EB" />
        </div>

        {/* Wait Variant */}
        <div className="relative w-32 h-32 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
          <p className="absolute -top-8 text-gray-500 font-mono text-sm">
            Wait
          </p>
          <DynamicCursor x={64} y={64} variant="wait" color="#DC2626" />
        </div>

        {/* Crosshair Variant */}
        <div className="relative w-32 h-32 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
          <p className="absolute -top-8 text-gray-500 font-mono text-sm">
            Crosshair
          </p>
          <DynamicCursor x={64} y={64} variant="crosshair" color="#16A34A" />
        </div>
      </AbsoluteFill>

      {/* Click Animation Demo */}
      <Sequence from={30} durationInFrames={60}>
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
          <p className="mb-4 text-gray-400 font-mono text-xs">
            Simulated Click (Frame 30+)
          </p>
          <div className="relative w-32 h-32 border-2 border-blue-100 rounded-full flex items-center justify-center bg-blue-50">
            <DynamicCursor
              x={64}
              y={64}
              variant="pointer"
              isClicking={true}
              rippleStartFrame={0}
              rippleDuration={30}
            />
          </div>
        </div>
      </Sequence>

      {/* Ghost Trail Path Demo */}
      <Sequence from={90}>
        <CursorPath
          points={[
            { x: 100, y: 100 },
            { x: 400, y: 150 },
            { x: 600, y: 400 },
            { x: 900, y: 200 },
          ]}
          duration={80}
          variant="arrow"
          label="Ghost Trail"
          showTrail={true}
          color="#4F46E5"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
