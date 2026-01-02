import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export default function BrandVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Brand colors
  const bgColor = '#000000'; // Black
  const textColor = '#FFFFFF'; // White

  // Define the start frame for the main text animation
  const textAnimationStart = 10; // Animation starts at 10th frame
  const textAnimationEnd = 140; // Animation ends at 140th frame

  // Spring animation for scale and Y position for a subtle "pop" and slide-up effect
  const springProgress = spring({
    frame: frame - textAnimationStart, // Start spring animation relative to textAnimationStart
    fps,
    config: {
      damping: 200, // Controls how quickly the oscillation dies down
      stiffness: 100, // Controls the speed of the spring
      mass: 0.8, // Controls the "weight" of the spring
    },
    from: 0,
    to: 1,
  });

  const scale = interpolate(springProgress, [0, 1], [0.8, 1]); // Scale from 80% to 100%
  const translateY = interpolate(springProgress, [0, 1], [50, 0]); // Move from 50px below to original position

  // Opacity animation for fade-in and fade-out
  const opacity = interpolate(
    frame,
    [0, textAnimationStart + 20, textAnimationEnd - 30, textAnimationEnd],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
      {/* Google Fonts Import */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap');
        `}
      </style>

      {/* Brand Name: Campor */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 180, // Prominent size for 1920x1080
          color: textColor,
          opacity,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          // Ensure smooth text rendering for crisp typography
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          letterSpacing: '-0.02em', // Slightly tighter letter spacing for elegance
        }}
      >
        Campor
      </div>
    </AbsoluteFill>
  );
}