import React from "react";
import { AbsoluteFill } from "remotion";
import { BentoGrid } from "./BentoGrid";
import { Background } from "../Global/Background";

const Card = ({ title, color }: { title: string; color: string }) => (
    <div
        style={{
            backgroundColor: color,
            borderRadius: 16,
            padding: 24,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
    >
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{title}</h2>
        <p style={{ opacity: 0.8, marginTop: 8 }}>Feature Description</p>
    </div>
);

export const LayoutTest: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: "white" }}>
            <Background type="grid-lines" variant="light" />
            <Background type="gradient-mesh" variant="light" animated />

            <AbsoluteFill style={{ padding: 60, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <BentoGrid columns={3} gap={20} staggerDelay={5} initialDelay={10}>
                    {/* Item 1: Large Span */}
                    <div style={{ gridColumn: "span 2", gridRow: "span 2" }}>
                        <Card title="Main Feature" color="#4F46E5" />
                    </div>

                    {/* Item 2 */}
                    <div style={{ gridColumn: "span 1", gridRow: "span 1" }}>
                        <Card title="Analytics" color="#EC4899" />
                    </div>

                    {/* Item 3 */}
                    <div style={{ gridColumn: "span 1", gridRow: "span 1" }}>
                        <Card title="Speed" color="#10B981" />
                    </div>

                    {/* Item 4: Wide bottom */}
                    <div style={{ gridColumn: "span 3", gridRow: "span 1" }}>
                        <Card title="Integration Ecosystem" color="#F59E0B" />
                    </div>
                </BentoGrid>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
