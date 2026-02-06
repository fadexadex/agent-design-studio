/**
 * Layout Examples
 *
 * Demonstrates MotionContainer and BentoGrid patterns.
 * Ideal composition size: 1920x1080 (Full HD)
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { MotionContainer, BentoGrid, BentoItem } from "@/components/Layout";

// ===========================================
// MOTION CONTAINER - ENTRANCE STATES
// ===========================================

/** Basic fade in */
export const FadeInExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MotionContainer initial="hidden" delay={10}>
      <div
        style={{
          width: 300,
          height: 200,
          backgroundColor: "#3B82F6",
          borderRadius: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#FFFFFF",
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Fade In
      </div>
    </MotionContainer>
  </AbsoluteFill>
);

/** Slide up from bottom */
export const SlideUpExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0F0F11",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MotionContainer initial="offscreen-bottom" delay={5} distance={80}>
      <div
        style={{
          width: 300,
          height: 200,
          backgroundColor: "#6366F1",
          borderRadius: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#FFFFFF",
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Slide Up
      </div>
    </MotionContainer>
  </AbsoluteFill>
);

/** Scale from zero with bounce */
export const ScaleInExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MotionContainer
      initial="scale-zero"
      delay={5}
      springConfig={{ damping: 10, stiffness: 150 }}
    >
      <div
        style={{
          width: 200,
          height: 200,
          backgroundColor: "#EC4899",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#FFFFFF",
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        POP!
      </div>
    </MotionContainer>
  </AbsoluteFill>
);

/** Blur entrance */
export const BlurInExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1A1A1A",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MotionContainer initial="blur" delay={10} duration={40}>
      <div
        style={{
          width: 400,
          height: 250,
          backgroundColor: "#22C55E",
          borderRadius: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#FFFFFF",
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        Blur In
      </div>
    </MotionContainer>
  </AbsoluteFill>
);

// ===========================================
// MOTION CONTAINER - EXIT ANIMATIONS
// ===========================================

/** Entrance with exit */
export const EnterExitExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#F3F4F6",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MotionContainer
      initial="offscreen-bottom"
      exit="slide-down"
      exitStartFrame={60}
      distance={60}
    >
      <div
        style={{
          width: 350,
          height: 200,
          backgroundColor: "#8B5CF6",
          borderRadius: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#FFFFFF",
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        In → Out
      </div>
    </MotionContainer>
  </AbsoluteFill>
);

/** Scale in, scale out */
export const ScaleInOutExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0F0F11",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MotionContainer
      initial="scale-zero"
      exit="scale-down"
      exitStartFrame={50}
      springConfig={{ damping: 12 }}
    >
      <div
        style={{
          width: 250,
          height: 250,
          backgroundColor: "#F59E0B",
          borderRadius: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#FFFFFF",
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        Scale
      </div>
    </MotionContainer>
  </AbsoluteFill>
);

// ===========================================
// MOTION CONTAINER - STACKED ELEMENTS
// ===========================================

/** Staggered cards */
export const StaggeredCardsExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#FFFFFF",
      padding: 60,
      flexDirection: "row",
      gap: 24,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {[0, 1, 2, 3].map((i) => (
      <MotionContainer
        key={i}
        initial="offscreen-bottom"
        delay={i * 10}
        distance={50}
      >
        <div
          style={{
            width: 200,
            height: 280,
            backgroundColor: ["#3B82F6", "#8B5CF6", "#EC4899", "#22C55E"][i],
            borderRadius: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#FFFFFF",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          {i + 1}
        </div>
      </MotionContainer>
    ))}
  </AbsoluteFill>
);

/** Notification stack */
export const NotificationStackExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#1A1A1A" }}>
    <div
      style={{
        position: "absolute",
        right: 40,
        top: 40,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {["New message", "File uploaded", "Export complete"].map((msg, i) => (
        <MotionContainer
          key={i}
          initial="offscreen-right"
          delay={i * 15}
          exit="slide-right"
          exitStartFrame={70 + i * 10}
          distance={100}
        >
          <div
            style={{
              width: 300,
              padding: "16px 20px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#FFFFFF",
              fontSize: 16,
            }}
          >
            {msg}
          </div>
        </MotionContainer>
      ))}
    </div>
  </AbsoluteFill>
);

// ===========================================
// BENTO GRID
// ===========================================

/** Basic 3-column grid */
export const BasicBentoGridExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#F9FAFB",
      padding: 60,
    }}
  >
    <BentoGrid columns={3} gap={20} staggerDelay={6}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 48,
            fontWeight: 700,
            color: "#374151",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            height: 200,
          }}
        >
          {n}
        </div>
      ))}
    </BentoGrid>
  </AbsoluteFill>
);

/** Grid with spanning items */
export const SpanningBentoGridExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0F0F11",
      padding: 60,
    }}
  >
    <BentoGrid columns={3} gap={20} staggerDelay={8}>
      {/* Large hero item */}
      <BentoItem colSpan={2} rowSpan={2}>
        <div
          style={{
            backgroundColor: "#6366F1",
            borderRadius: 16,
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#FFFFFF",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          Hero Card
        </div>
      </BentoItem>

      {/* Regular items */}
      <BentoItem>
        <div
          style={{
            backgroundColor: "#22C55E",
            borderRadius: 16,
            height: 180,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#FFFFFF",
            fontSize: 24,
          }}
        >
          Stats
        </div>
      </BentoItem>

      <BentoItem>
        <div
          style={{
            backgroundColor: "#EC4899",
            borderRadius: 16,
            height: 180,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#FFFFFF",
            fontSize: 24,
          }}
        >
          Chart
        </div>
      </BentoItem>

      {/* Wide item at bottom */}
      <BentoItem colSpan={3}>
        <div
          style={{
            backgroundColor: "#F59E0B",
            borderRadius: 16,
            height: 120,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#FFFFFF",
            fontSize: 24,
          }}
        >
          Full Width Footer
        </div>
      </BentoItem>
    </BentoGrid>
  </AbsoluteFill>
);

/** Dashboard layout */
export const DashboardLayoutExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#F3F4F6",
      padding: 40,
    }}
  >
    <BentoGrid
      columns={4}
      gap={16}
      staggerDelay={5}
      initialState="offscreen-bottom"
      distance={40}
    >
      {/* Main chart */}
      <BentoItem colSpan={3} rowSpan={2}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            height: "100%",
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, color: "#374151" }}>
            Revenue Chart
          </h3>
          <div
            style={{
              marginTop: 16,
              height: "calc(100% - 40px)",
              backgroundColor: "#F9FAFB",
              borderRadius: 8,
            }}
          />
        </div>
      </BentoItem>

      {/* Stats cards */}
      <BentoItem>
        <StatCard title="Users" value="1,234" color="#3B82F6" />
      </BentoItem>
      <BentoItem>
        <StatCard title="Revenue" value="$12.3K" color="#22C55E" />
      </BentoItem>

      {/* Activity feed */}
      <BentoItem rowSpan={2}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            height: "100%",
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, color: "#374151" }}>
            Activity
          </h3>
          <div style={{ marginTop: 12, fontSize: 14, color: "#6B7280" }}>
            Recent events...
          </div>
        </div>
      </BentoItem>

      {/* Bottom row */}
      <BentoItem colSpan={2}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            height: 140,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, color: "#374151" }}>
            Recent Orders
          </h3>
        </div>
      </BentoItem>
    </BentoGrid>
  </AbsoluteFill>
);

// Helper component
const StatCard = ({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) => (
  <div
    style={{
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: 20,
      height: 140,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}
  >
    <div style={{ fontSize: 14, color: "#6B7280" }}>{title}</div>
    <div style={{ fontSize: 32, fontWeight: 700, color, marginTop: 8 }}>
      {value}
    </div>
  </div>
);

// ===========================================
// CUSTOM ANIMATION OVERRIDES
// ===========================================

/** BentoItem with custom animation */
export const CustomAnimationOverrideExample = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1A1A1A",
      padding: 60,
    }}
  >
    <BentoGrid columns={3} gap={24} initialState="offscreen-bottom">
      <BentoItem>
        <Card>Default</Card>
      </BentoItem>

      <BentoItem delayOffset={15}>
        <Card>Extra Delay</Card>
      </BentoItem>

      <BentoItem
        animation={{
          initial: "scale-zero",
          springConfig: { damping: 8 },
        }}
      >
        <Card>Scale Override</Card>
      </BentoItem>
    </BentoGrid>
  </AbsoluteFill>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      backgroundColor: "#374151",
      borderRadius: 16,
      height: 200,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#FFFFFF",
      fontSize: 24,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);
