import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene5 } from '../Scene5';

/**
 * Scene Preview Wrapper for Scene 5
 * Auto-generated for independent scene rendering
 */
export const ScenePreview5: React.FC = () => <Scene5 />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview5}
      durationInFrames={225}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
