import { z } from "zod";

// Brick 1: KineticText
export type KineticTextProps = {
    text: string;
    style: "h1" | "h2" | "label";
    animationType: "word-stagger" | "letter-slide" | "fade-up";
    enterDelay?: number; // How many frames to wait before starting
    color?: string;
    className?: string;
};

// Brick 2: DeviceFrame
export type DeviceFrameProps = {
    type: "mobile" | "browser" | "glass-card";
    contentSrc: string; // URL or local path to the screenshot
    theme: "light" | "dark";
    width?: number;
    height?: number;
    className?: string;
};

// Brick 3: CursorHand
export type CursorHandProps = {
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    clickAtFrame?: number; // When to trigger the "click" animation
    visible?: boolean;
};

// Brick 4: MotionContainer
export type MotionContainerProps = {
    children: React.ReactNode;
    entryAnimation: "slide-in-right" | "pop-up" | "zoom-out" | "none";
    continuousEffect?: "hover-float" | "slow-rotate" | "none"; // Passive motion
    perspective?: number; // For 3D depth
    rotation?: { x: number; y: number; z: number };
    delay?: number;
    duration?: number;
    className?: string;
};

// Brick 5: BackgroundRig
export type BackgroundRigProps = {
    type: "clean-white" | "neon-mesh" | "brand-gradient";
    primaryColor?: string;
    secondaryColor?: string;
    movementSpeed?: number;
    children?: React.ReactNode;
};

// Schema for the AI Director JSON (The "Screenplay")
export const SceneElementSchema = z.object({
    type: z.enum(["KineticText", "DeviceFrame", "CursorHand", "MotionContainer"]),
    id: z.string(),
    start_frame: z.number(),
    duration_frames: z.number().optional(),
    props: z.record(z.any()), // This would be refined to match the props above in a stricter schema
});

export const SceneSchema = z.object({
    scene_id: z.string(),
    duration_frames: z.number(),
    background: z.object({
        type: z.enum(["clean-white", "neon-mesh", "brand-gradient"]),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
    }),
    elements: z.array(SceneElementSchema),
});

export type SceneElement = z.infer<typeof SceneElementSchema>;
export type Scene = z.infer<typeof SceneSchema>;
