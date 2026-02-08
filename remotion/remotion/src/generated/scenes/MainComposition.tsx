import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { Scene1 } from './Scene1';
import { Scene2 } from './Scene2';
import { Scene3 } from './Scene3';
import { Scene4 } from './Scene4';
import { Scene5 } from './Scene5';
import { Scene6 } from './Scene6';
import { Scene7 } from './Scene7';

/**
 * MainComposition sequences all generated scenes.
 * Total duration: 150 frames (5 seconds at 30fps)
 * Brand: Campor
 * Style: cinematic
 */
export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Series>
      <Series.Sequence durationInFrames={225}>
        <Scene1 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={225}>
        <Scene2 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={225}>
        <Scene3 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={225}>
        <Scene4 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={225}>
        <Scene5 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={225}>
        <Scene6 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={271}>
        <Scene7 />
      </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export default MainComposition;
