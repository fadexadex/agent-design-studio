import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene7 } from '../Scene7';

/**
 * Scene Preview Wrapper for Scene 7
 * Auto-generated for independent scene rendering
 */
export const ScenePreview7: React.FC = () => <Scene7 />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview7}
      durationInFrames={271}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
