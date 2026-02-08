import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene1 } from '../Scene1';

/**
 * Scene Preview Wrapper for Scene 1
 * Auto-generated for independent scene rendering
 */
export const ScenePreview1: React.FC = () => <Scene1 />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview1}
      durationInFrames={225}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
