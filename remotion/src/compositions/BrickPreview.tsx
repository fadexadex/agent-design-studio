import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { BackgroundRig } from '../components/atoms/BackgroundRig';
import { KineticText } from '../components/atoms/KineticText';
import { MotionContainer } from '../components/atoms/MotionContainer';
import { DeviceFrame } from '../components/atoms/DeviceFrame';
import { CursorHand } from '../components/atoms/CursorHand';

export const BrickPreview: React.FC = () => {
    return (
        <AbsoluteFill>
            <BackgroundRig type="neon-mesh" primaryColor="#8a2be2" secondaryColor="#4b0082">
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>

                    {/* Layer 1: Title */}
                    <Sequence from={0} durationInFrames={90}>
                        <AbsoluteFill style={{ top: 100, alignItems: 'center' }}>
                            <KineticText
                                text="Turn text into video"
                                style="h1"
                                animationType="word-stagger"
                                color="white"
                            />
                        </AbsoluteFill>
                    </Sequence>

                    {/* Layer 2: 3D App Demo */}
                    <Sequence from={30}>
                        <MotionContainer
                            entryAnimation="pop-up"
                            continuousEffect="hover-float"
                            rotation={{ x: 10, y: -15, z: 5 }}
                        >
                            <DeviceFrame
                                type="mobile"
                                contentSrc="https://picsum.photos/300/600" // Placeholder
                                theme="dark"
                            />
                        </MotionContainer>
                    </Sequence>

                    {/* Layer 3: Interaction */}
                    <Sequence from={50}>
                        <CursorHand
                            startPos={{ x: 1000, y: 800 }}
                            endPos={{ x: 960, y: 540 }} // Center-ish
                            clickAtFrame={80}
                        />
                    </Sequence>

                </AbsoluteFill>
            </BackgroundRig>
        </AbsoluteFill>
    );
};
