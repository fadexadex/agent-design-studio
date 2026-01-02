import React from 'react';
import { Composition } from 'remotion';
import { BrandVideo } from './compositions/BrandVideo';
import GeneratedVideo from './compositions/GeneratedVideo';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="BrandVideo"
                component={GeneratedVideo}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
