import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { Scene1 } from './Scene1';
import { Scene2 } from './Scene2';
import { Scene3 } from './Scene3';

/**
 * MainComposition sequences all generated scenes.
 * Total duration: 150 frames (5 seconds at 30fps)
 * Brand: Campor
 * Style: minimalist
 */
export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Series>
      <Series.Sequence durationInFrames={271}>
        <Scene1 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={271}>
        <Scene2 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={271}>
        <Scene3 />
      </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export default MainComposition;
