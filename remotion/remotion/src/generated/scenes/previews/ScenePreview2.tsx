import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene2 } from '../Scene2';

/**
 * Scene Preview Wrapper for Scene 2
 * Auto-generated for independent scene rendering
 */
export const ScenePreview2: React.FC = () => <Scene2 />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview2}
      durationInFrames={225}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
