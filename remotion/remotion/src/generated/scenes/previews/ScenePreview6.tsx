import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene6 } from '../Scene6';

/**
 * Scene Preview Wrapper for Scene 6
 * Auto-generated for independent scene rendering
 */
export const ScenePreview6: React.FC = () => <Scene6 />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview6}
      durationInFrames={225}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
