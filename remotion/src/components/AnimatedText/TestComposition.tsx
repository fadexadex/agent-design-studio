import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AnimatedText, LayoutGrid, TextSequence } from "./index";

/**
 * Test composition to verify AnimatedText component
 * Run with: npm run dev then select "AnimatedTextTest" in Remotion Studio
 */
export const AnimatedTextTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#F5F6FA",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Test 1: Fade Blur In preset */}
      <Sequence from={0} durationInFrames={60}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748B" }}>
            Test 1: fadeBlurIn preset
          </span>
          <AnimatedText
            text="Turn Books into Audio"
            preset="fadeBlurIn"
            fontSize={48}
            fontWeight={600}
            gradient={{ colors: ["#2563EB", "#60A5FA"], angle: 135 }}
          />
        </div>
      </Sequence>

      {/* Test 2: Word-by-word stagger */}
      <Sequence from={60} durationInFrames={90}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748B" }}>
            Test 2: Word stagger
          </span>
          <AnimatedText
            text="Translate. Dub. Distribute."
            animationUnit="word"
            blur={{ from: 12, to: 0, duration: 17 }}
            opacity={{ from: 0, to: 1, duration: 15 }}
            stagger={15}
            fontSize={42}
            fontWeight={500}
            color="#2563EB"
          />
        </div>
      </Sequence>

      {/* Test 3: Scale In preset */}
      <Sequence from={150} durationInFrames={60}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748B" }}>
            Test 3: scaleIn preset
          </span>
          <AnimatedText
            text="Scale In Animation"
            preset="scaleIn"
            fontSize={48}
            fontWeight={700}
            color="#1A1A1A"
          />
        </div>
      </Sequence>

      {/* Test 4: Spring animation */}
      <Sequence from={210} durationInFrames={60}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748B" }}>
            Test 4: Spring bounce
          </span>
          <AnimatedText
            text="Bouncy Spring!"
            scale={{
              from: 0,
              to: 1,
              easing: { type: "spring", damping: 12, stiffness: 100 },
            }}
            opacity={{ from: 0, to: 1, duration: 10 }}
            fontSize={52}
            fontWeight={700}
            gradient={{ colors: ["#EC4899", "#3B82F6"] }}
          />
        </div>
      </Sequence>

      {/* Test 5: Typewriter */}
      <Sequence from={270} durationInFrames={90}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748B" }}>
            Test 5: Typewriter
          </span>
          <AnimatedText
            text="Just drop and go..."
            preset="typewriter"
            typewriter={{ cursor: true, cursorChar: "|", cursorBlinkSpeed: 16 }}
            fontSize={40}
            fontWeight={500}
            color="#1A1A1A"
            fontFamily="Inter, sans-serif"
          />
        </div>
      </Sequence>

      {/* Test 6: Exit animation */}
      <Sequence from={360} durationInFrames={90}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748B" }}>
            Test 6: Entry + Exit
          </span>
          <AnimatedText
            text="LangEase"
            blur={{ from: 10, to: 0, duration: 18 }}
            scale={{ from: 0.8, to: 1, duration: 22, easing: "backOut" }}
            opacity={{ from: 0, to: 1, duration: 18 }}
            exit={{
              startFrame: 50,
              opacity: { from: 1, to: 0, duration: 15 },
              blur: { from: 0, to: 15, duration: 15 },
            }}
            fontSize={56}
            fontWeight={600}
            gradient={{ colors: ["#2563EB", "#38BDF8"] }}
          />
        </div>
      </Sequence>

      {/* Test 7: Slide animations */}
      <Sequence from={450} durationInFrames={60}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <span style={{ fontSize: 14, color: "#64748B" }}>
            Test 7: Slide presets
          </span>
          <AnimatedText
            text="Slide In Left"
            preset="slideInLeft"
            fontSize={36}
            fontWeight={500}
            color="#2563EB"
          />
          <AnimatedText
            text="Slide In Right"
            preset="slideInRight"
            fontSize={36}
            fontWeight={500}
            color="#60A5FA"
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Test composition for Positioning API features
 * Demonstrates anchor-based positioning, animated positioning, LayoutGrid, and TextSequence
 */
export const PositioningApiTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0F172A",
      }}
    >
      {/* Test 1: All 9 anchor positions */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 1: 9 Anchor Positions
          </span>
          <AnimatedText
            text="top-left"
            anchor="top-left"
            offsetX={10}
            offsetY={10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
          <AnimatedText
            text="top"
            anchor="top"
            offsetY={10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
          <AnimatedText
            text="top-right"
            anchor="top-right"
            offsetX={-10}
            offsetY={10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
          <AnimatedText
            text="left"
            anchor="left"
            offsetX={10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
          <AnimatedText
            text="center"
            anchor="center"
            preset="fadeBlurIn"
            fontSize={24}
            fontWeight={600}
            color="#F8FAFC"
          />
          <AnimatedText
            text="right"
            anchor="right"
            offsetX={-10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
          <AnimatedText
            text="bottom-left"
            anchor="bottom-left"
            offsetX={10}
            offsetY={-10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
          <AnimatedText
            text="bottom"
            anchor="bottom"
            offsetY={-10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
          <AnimatedText
            text="bottom-right"
            anchor="bottom-right"
            offsetX={-10}
            offsetY={-10}
            preset="fadeBlurIn"
            fontSize={18}
            color="#60A5FA"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 2: Animated positioning - text moves from left to center */}
      <Sequence from={90} durationInFrames={90}>
        <AbsoluteFill>
          <AnimatedText
            text="Moving Text"
            anchorAnimation={{
              from: "left",
              to: "center",
              fromOffsetX: 50,
              toOffsetX: 0,
              duration: 45,
              easing: "easeOut",
            }}
            preset="fadeBlurIn"
            fontSize={48}
            fontWeight={600}
            gradient={{ colors: ["#2563EB", "#60A5FA"] }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 3: LayoutGrid - vertical list */}
      <Sequence from={180} durationInFrames={90}>
        <AbsoluteFill>
          <LayoutGrid direction="column" gap={24} anchor="center">
            <AnimatedText
              text="Translate."
              preset="fadeBlurIn"
              stagger={0}
              fontSize={52}
              fontWeight={600}
              color="#F8FAFC"
            />
            <AnimatedText
              text="Dub."
              preset="fadeBlurIn"
              blur={{ from: 12, to: 0, duration: 17, delay: 15 }}
              opacity={{ from: 0, to: 1, duration: 15, delay: 15 }}
              fontSize={52}
              fontWeight={600}
              color="#F8FAFC"
            />
            <AnimatedText
              text="Distribute."
              preset="fadeBlurIn"
              blur={{ from: 12, to: 0, duration: 17, delay: 30 }}
              opacity={{ from: 0, to: 1, duration: 15, delay: 30 }}
              fontSize={52}
              fontWeight={600}
              color="#F8FAFC"
            />
          </LayoutGrid>
        </AbsoluteFill>
      </Sequence>

      {/* Test 4: LayoutGrid - horizontal layout */}
      <Sequence from={270} durationInFrames={90}>
        <AbsoluteFill>
          <LayoutGrid direction="row" gap={40} anchor="center" align="center">
            <AnimatedText
              text="Any language"
              preset="fadeBlurIn"
              fontSize={36}
              fontWeight={500}
              color="#F8FAFC"
            />
            <span style={{ fontSize: 36, color: "#60A5FA" }}>|</span>
            <AnimatedText
              text="Instantly"
              preset="fadeBlurIn"
              blur={{ from: 12, to: 0, duration: 17, delay: 10 }}
              opacity={{ from: 0, to: 1, duration: 15, delay: 10 }}
              fontSize={36}
              fontWeight={500}
              color="#F8FAFC"
            />
          </LayoutGrid>
        </AbsoluteFill>
      </Sequence>

      {/* Test 5: TextSequence - chain mode */}
      <Sequence from={360} durationInFrames={180}>
        <AbsoluteFill>
          <TextSequence mode="chain" overlap={0.3}>
            <TextSequence.Item
              text="Turn Books"
              anchor="center"
              preset="fadeBlurIn"
              duration={2}
              fontSize={48}
              fontWeight={600}
              color="#F8FAFC"
            />
            <TextSequence.Item
              text="Into Audio"
              anchor="center"
              preset="fadeBlurIn"
              duration={2}
              fontSize={48}
              fontWeight={600}
              gradient={{ colors: ["#2563EB", "#60A5FA"] }}
            />
            <TextSequence.Item
              text="Any Language"
              anchor="center"
              preset="slideInLeft"
              duration={2}
              fontSize={48}
              fontWeight={600}
              color="#60A5FA"
            />
          </TextSequence>
        </AbsoluteFill>
      </Sequence>

      {/* Test 6: Multi-position layout example */}
      <Sequence from={540} durationInFrames={90}>
        <AbsoluteFill>
          <AnimatedText
            text="LANGEASE"
            anchor="top"
            offsetY="10%"
            preset="fadeBlurIn"
            fontSize={32}
            fontWeight={700}
            letterSpacing="0.2em"
            color="#64748B"
          />
          <AnimatedText
            text="Turn any content into audio"
            anchor="center"
            preset="fadeBlurIn"
            fontSize={48}
            fontWeight={600}
            color="#F8FAFC"
          />
          <AnimatedText
            text="www.langease.ai"
            anchor="bottom-right"
            offsetX={-24}
            offsetY={-16}
            preset="fadeBlurIn"
            fontSize={16}
            color="#64748B"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 7: Percentage-based positioning */}
      <Sequence from={630} durationInFrames={90}>
        <AbsoluteFill>
          <AnimatedText
            text="Custom Position (30%, 40%)"
            x="30%"
            y="40%"
            preset="fadeBlurIn"
            fontSize={24}
            color="#60A5FA"
          />
          <AnimatedText
            text="Custom Position (70%, 60%)"
            x="70%"
            y="60%"
            preset="fadeBlurIn"
            fontSize={24}
            color="#EC4899"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 8: Spring animated positioning */}
      <Sequence from={720} durationInFrames={90}>
        <AbsoluteFill>
          <AnimatedText
            text="Bouncy Move!"
            anchorAnimation={{
              from: "top",
              to: "center",
              fromOffsetY: 50,
              toOffsetY: 0,
              duration: 30,
              easing: { type: "spring", damping: 12, stiffness: 100 },
            }}
            preset="fadeBlurIn"
            fontSize={56}
            fontWeight={700}
            gradient={{ colors: ["#EC4899", "#3B82F6"] }}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Kinetic Masking Test Composition
 * Tests the "Window and Actor" masking pattern for sharp, kinetic text animations
 */
export const KineticMaskingTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0F172A",
      }}
    >
      {/* Test 1: Masked Slide (Auto-mask for slideInLeft preset) */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 1: Masked Slide (slideInLeft auto-masks)
          </span>
          <AnimatedText
            text="Kinetic Slide"
            anchor="center"
            preset="slideInLeft"
            fontSize={56}
            fontWeight={700}
            color="#F8FAFC"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 2: Unmasked Scale (scaleIn should NOT mask - preserves glow) */}
      <Sequence from={90} durationInFrames={90}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 2: Unmasked Scale (scaleIn - no mask, glow preserved)
          </span>
          <AnimatedText
            text="Glow Scale"
            anchor="center"
            preset="scaleIn"
            fontSize={56}
            fontWeight={700}
            color="#60A5FA"
            style={{
              textShadow: "0 0 40px rgba(96, 165, 250, 0.8)",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 3: Word-by-word masked slide */}
      <Sequence from={180} durationInFrames={120}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 3: Word-by-word masked slide with stagger
          </span>
          <AnimatedText
            text="Turn Books Into Audio"
            anchor="center"
            animationUnit="word"
            preset="slideInRight"
            stagger={10}
            fontSize={48}
            fontWeight={600}
            color="#F8FAFC"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 4: Explicit mask=false on slide (override smart default) */}
      <Sequence from={300} durationInFrames={90}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 4: mask=false override on slideInLeft (shows full movement)
          </span>
          <AnimatedText
            text="Unmasked Slide"
            anchor="center"
            preset="slideInLeft"
            mask={false}
            fontSize={56}
            fontWeight={700}
            gradient={{ colors: ["#EC4899", "#3B82F6"] }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 5: Explicit mask=true on fadeBlurIn (force mask) */}
      <Sequence from={390} durationInFrames={90}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 5: mask=true on fadeBlurIn (forced mask)
          </span>
          <AnimatedText
            text="Forced Mask"
            anchor="center"
            preset="fadeBlurIn"
            mask={true}
            fontSize={56}
            fontWeight={700}
            color="#22C55E"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 6: slideInUp - Spring-based vertical kinetic slide */}
      <Sequence from={480} durationInFrames={90}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 6: slideInUp (Spring-based vertical snap)
          </span>
          <AnimatedText
            text="Snappy Spring!"
            anchor="center"
            preset="slideInUp"
            fontSize={56}
            fontWeight={700}
            gradient={{ colors: ["#F59E0B", "#EF4444"] }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Test 7: Nested LayoutGrid - LangEase Three Bullet Points Scene */}
      <Sequence from={570} durationInFrames={150}>
        <AbsoluteFill>
          <span
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Test 7: Nested LayoutGrid (Three Bullet Points)
          </span>
          <LayoutGrid direction="column" gap={30} anchor="center">
            {/* Bullet 1 */}
            <LayoutGrid direction="row" gap={20} align="center">
              <CheckIcon />
              <AnimatedText
                text="Translate"
                preset="slideInRight"
                fontSize={36}
                fontWeight={600}
                color="#F8FAFC"
              />
            </LayoutGrid>

            {/* Bullet 2 */}
            <LayoutGrid direction="row" gap={20} align="center">
              <CheckIcon delay={10} />
              <AnimatedText
                text="Dub"
                preset="slideInRight"
                position={{ fromX: 50, toX: 0, duration: 20, delay: 10 }}
                opacity={{ from: 0, to: 1, duration: 15, delay: 10 }}
                fontSize={36}
                fontWeight={600}
                color="#F8FAFC"
              />
            </LayoutGrid>

            {/* Bullet 3 */}
            <LayoutGrid direction="row" gap={20} align="center">
              <CheckIcon delay={20} />
              <AnimatedText
                text="Distribute"
                preset="slideInRight"
                position={{ fromX: 50, toX: 0, duration: 20, delay: 20 }}
                opacity={{ from: 0, to: 1, duration: 15, delay: 20 }}
                fontSize={36}
                fontWeight={600}
                color="#F8FAFC"
              />
            </LayoutGrid>
          </LayoutGrid>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Simple CheckIcon component for the bullet point test
 */
const CheckIcon: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  return (
    <AnimatedText
      text="✓"
      opacity={{ from: 0, to: 1, duration: 15, delay }}
      scale={{
        from: 0,
        to: 1,
        duration: 20,
        delay,
        easing: { type: "spring", damping: 15, stiffness: 150 },
      }}
      fontSize={32}
      fontWeight={700}
      color="#22C55E"
    />
  );
};
