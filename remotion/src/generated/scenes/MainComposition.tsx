import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { Scene1 } from './Scene1';
import { Scene2 } from './Scene2';

export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill>
      <Series>
      <Series.Sequence durationInFrames={271}>
        <Scene1 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={210}>
        <Scene2 />
      </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
