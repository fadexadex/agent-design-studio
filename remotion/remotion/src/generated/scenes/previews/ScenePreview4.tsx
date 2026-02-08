import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene4 } from '../Scene4';

/**
 * Scene Preview Wrapper for Scene 4
 * Auto-generated for independent scene rendering
 */
export const ScenePreview4: React.FC = () => <Scene4 />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview4}
      durationInFrames={225}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
