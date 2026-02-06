/**
 * Full Scene Example
 *
 * A complete Remotion composition demonstrating how to combine
 * multiple components from the remotion-components library.
 *
 * Ideal composition size: 1920x1080 (Full HD)
 * Duration: 300 frames (10 seconds at 30fps)
 */

import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { AnimatedText, LayoutGrid } from "@/components/AnimatedText";
import { MockupFrame, FrameSequence } from "@/components/MockupFrame";
import { CameraRig } from "@/components/Camera";
import { MotionContainer } from "@/components/Layout";
import { Background } from "@/components/Global";
import { IrisTransition } from "@/components/Transitions";

/**
 * ProductLaunchScene
 *
 * A professional product launch video scene that showcases:
 * - Animated background with gradient mesh
 * - Staggered text animations
 * - Device mockups with 3D effects
 * - Camera movement
 * - Transition effects
 */
export const ProductLaunchScene = () => {
  const frame = useCurrentFrame();

  // Subtle camera zoom throughout the scene
  const cameraZoom = interpolate(frame, [0, 300], [1, 1.05], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Layer 1: Animated Background */}
      <Background
        type="gradient-mesh"
        variant="light"
        animationSpeed={0.7}
        meshColors={{
          primary: "rgba(99, 102, 241, 0.15)",
          secondary: "rgba(236, 72, 153, 0.1)",
        }}
      />

      {/* Layer 2: Camera Rig wrapping all content */}
      <CameraRig zoom={cameraZoom} focusPoint={[0.5, 0.5]}>
        {/* Intro Text - frames 0-90 */}
        <Sequence from={0} durationInFrames={120}>
          <LayoutGrid
            anchor="center"
            direction="column"
            gap={16}
            align="center"
            style={{ marginTop: -100 }}
          >
            <AnimatedText
              text="Introducing"
              preset="fadeBlurIn"
              fontSize={32}
              fontWeight={500}
              color="#6B7280"
            />
            <AnimatedText
              text="Your Product"
              preset="slideInUp"
              animationUnit="word"
              stagger={6}
              blur={{ delay: 10 }}
              opacity={{ delay: 10 }}
              position={{ delay: 10 }}
              fontSize={96}
              fontWeight={800}
              gradient={{
                colors: ["#6366F1", "#EC4899"],
                angle: 90,
              }}
            />
            <AnimatedText
              text="The future of productivity"
              preset="fadeBlurIn"
              blur={{ delay: 25 }}
              opacity={{ delay: 25 }}
              fontSize={28}
              color="#6B7280"
            />
          </LayoutGrid>
        </Sequence>

        {/* Device Mockups - frames 60-240 */}
        <Sequence from={60} durationInFrames={210}>
          <FrameSequence stagger={20} startFrom={0}>
            {/* Main browser mockup */}
            <MockupFrame
              type="browser"
              src="/screenshots/dashboard.png"
              preset="springIn"
              rotate={{
                fromY: -10,
                toY: 0,
                perspective: 1200,
                duration: 45,
                easing: { type: "spring", damping: 15 },
              }}
              browserConfig={{
                url: "https://yourproduct.com",
                showButtons: true,
              }}
              exitPreset="fadeOut"
              exitStartFrame={150}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -45%)",
              }}
              width={850}
              zIndex={1}
            />

            {/* Mobile mockup - right side */}
            <MockupFrame
              type="iphone15"
              src="/screenshots/mobile-app.png"
              preset="slideInRight"
              glare
              theme="dark"
              exitPreset="slideOutRight"
              exitStartFrame={145}
              style={{
                position: "absolute",
                right: 120,
                top: "50%",
                transform: "translateY(-40%)",
              }}
              zIndex={2}
            />

            {/* Floating notification card */}
            <MockupFrame
              type="card"
              preset="slideInUp"
              glass
              theme="dark"
              exitPreset="fadeOut"
              exitStartFrame={140}
              style={{
                position: "absolute",
                left: 100,
                bottom: 150,
              }}
              width={280}
              height={100}
              zIndex={3}
            >
              <div
                style={{
                  padding: 16,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#22C55E",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 20,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>Task Complete</div>
                  <div style={{ fontSize: 14, opacity: 0.7 }}>
                    Project saved successfully
                  </div>
                </div>
              </div>
            </MockupFrame>
          </FrameSequence>
        </Sequence>

        {/* Closing CTA - frames 220-300 */}
        <Sequence from={220} durationInFrames={80}>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MotionContainer
              initial="scale-zero"
              springConfig={{ damping: 12, stiffness: 100 }}
            >
              <LayoutGrid direction="column" gap={24} align="center">
                <AnimatedText
                  text="Start Building Today"
                  preset="none"
                  fontSize={72}
                  fontWeight={800}
                  color="#1A1A1A"
                />
                <AnimatedText
                  text="yourproduct.com"
                  preset="none"
                  opacity={{ from: 0, to: 1, delay: 15, duration: 20 }}
                  fontSize={32}
                  fontWeight={600}
                  gradient={{
                    colors: ["#6366F1", "#EC4899"],
                  }}
                />
              </LayoutGrid>
            </MotionContainer>
          </AbsoluteFill>
        </Sequence>
      </CameraRig>

      {/* Layer 3: Iris transition at the end */}
      <IrisTransition
        mode="exit"
        durationInFrames={25}
        delay={275}
        color="#000000"
        center={[50, 50]}
      />
    </AbsoluteFill>
  );
};

/**
 * FeatureShowcaseScene
 *
 * An alternative scene pattern for feature breakdowns:
 * - Split layout with text and mockup
 * - Sequential feature reveals
 */
export const FeatureShowcaseScene = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F11" }}>
      {/* Left side - Text content */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: "50%",
          transform: "translateY(-50%)",
          width: "40%",
        }}
      >
        <Sequence from={0}>
          <LayoutGrid direction="column" gap={24}>
            <AnimatedText
              text="Feature One"
              preset="slideInLeft"
              fontSize={18}
              fontWeight={600}
              color="#6366F1"
              letterSpacing="0.1em"
            />
            <AnimatedText
              text="Build faster with our intuitive interface"
              preset="slideInLeft"
              animationUnit="word"
              stagger={4}
              position={{ delay: 10 }}
              opacity={{ delay: 10 }}
              fontSize={48}
              fontWeight={700}
              color="#FFFFFF"
              lineHeight={1.2}
            />
            <AnimatedText
              text="Our drag-and-drop builder lets you create complex layouts in minutes, not hours."
              preset="fadeBlurIn"
              blur={{ delay: 30 }}
              opacity={{ delay: 30 }}
              fontSize={20}
              color="#9CA3AF"
              lineHeight={1.6}
              maxWidth={450}
            />
          </LayoutGrid>
        </Sequence>
      </div>

      {/* Right side - Mockup */}
      <Sequence from={15}>
        <MockupFrame
          type="browser"
          src="/screenshots/feature-demo.png"
          rotate={{
            fromY: 15,
            toY: 5,
            fromX: 5,
            toX: 0,
            perspective: 1200,
            duration: 50,
            easing: { type: "spring", damping: 15 },
          }}
          scale={{ from: 0.9, to: 1 }}
          opacity={{ from: 0, to: 1, duration: 25 }}
          browserConfig={{ url: "https://app.example.com" }}
          theme="dark"
          style={{
            position: "absolute",
            right: 60,
            top: "50%",
            transform: "translateY(-50%)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
          }}
          width={750}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * TutorialDemoScene
 *
 * For product tutorials with cursor interactions.
 * Note: Import DynamicCursor/CursorPath for full implementation.
 */
export const TutorialDemoScene = () => {
  return (
    <AbsoluteFill>
      <Background type="grid-lines" variant="dark" />

      {/* Header instruction */}
      <Sequence from={0}>
        <MotionContainer
          initial="offscreen-top"
          distance={30}
          style={{
            position: "absolute",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <AnimatedText
            text="Click the button to continue"
            fontSize={24}
            color="#FFFFFF"
          />
        </MotionContainer>
      </Sequence>

      {/* UI Mockup */}
      <Sequence from={10}>
        <MockupFrame
          type="browser"
          src="/screenshots/tutorial-step.png"
          preset="fadeIn"
          browserConfig={{ url: "https://app.example.com/setup" }}
          theme="dark"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -45%)",
          }}
          width={900}
        />
      </Sequence>

      {/* 
        Add DynamicCursor here:
        <Sequence from={30}>
          <CursorPath
            points={[
              { x: 200, y: 200 },
              { x: 650, y: 450 },
            ]}
            duration={45}
            variant="pointer"
            color="#FFFFFF"
          />
        </Sequence>
      */}
    </AbsoluteFill>
  );
};

// Default export for Remotion
export default ProductLaunchScene;
