import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene3 } from '../Scene3';

/**
 * Scene Preview Wrapper for Scene 3
 * Auto-generated for independent scene rendering
 */
export const ScenePreview3: React.FC = () => <Scene3 />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview3}
      durationInFrames={225}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
