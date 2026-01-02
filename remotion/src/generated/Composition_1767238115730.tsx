import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

export default function BrandVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const brandColor1 = '#000000'; // Dark background
  const brandColor2 = '#FFFFFF'; // Light text/elements

  // --- Global Background / Pulse Effect (Opening Scene & Closing) ---
  // Subtle background color shift for a minimalist feel
  const bgColorInterpolation = interpolate(
    frame,
    [0, 30, 120, 150], // Start black, subtly shift to a slightly lighter black, then back
    [brandColor1, '#1a1a1a', '#1a1a1a', brandColor1],
    { extrapolateRight: 'clamp' }
  );

  // A subtle pulsating circle element for the opening and closing
  const pulseSpring = spring({
    frame: frame - 10, // Start animation slightly after video begins
    fps,
    config: {
      stiffness: 100,
      damping: 20,
      mass: 0.5,
    },
  });

  const pulseOpacity = interpolate(
    frame,
    [0, 15, 130, 150], // Fade in, hold, then fade out
    [0, 0.1, 0.1, 0],
    { extrapolateRight: 'clamp' }
  );

  const pulseScale = interpolate(
    pulseSpring,
    [0, 1],
    [0.8, 1], // Scale from 80% to 100%
    { extrapolateRight: 'clamp' }
  );

  // --- Brand Name Animation ("Campor") ---
  const brandNameEnterProgress = spring({
    frame: frame - 30, // Animation starts at frame 30
    fps,
    config: {
      stiffness: 100,
      damping: 15,
      mass: 0.5,
    },
  });

  const brandNameOpacity = interpolate(
    brandNameEnterProgress,
    [0, 1],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
  const brandNameSlide = interpolate(
    brandNameEnterProgress,
    [0, 1],
    [50, 0], // Slide up 50px from below
    { extrapolateRight: 'clamp' }
  );

  // Outro animation for brand name
  const brandNameOutroOpacity = interpolate(
    frame,
    [100, 120], // Fades out between frames 100 and 120
    [1, 0],
    { extrapolateRight: 'clamp' }
  );

  // --- Tagline Animation (empty string) ---
  // The tagline is an empty string, but we'll animate its "space" as requested.
  const taglineEnterProgress = spring({
    frame: frame - 60, // Animation starts at frame 60, after brand name
    fps,
    config: {
      stiffness: 100,
      damping: 15,
      mass: 0.5,
    },
  });

  const taglineOpacity = interpolate(
    taglineEnterProgress,
    [0, 1],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
  const taglineSlide = interpolate(
    taglineEnterProgress,
    [0, 1],
    [30, 0], // Slide up 30px
    { extrapolateRight: 'clamp' }
  );

  // Outro animation for tagline
  const taglineOutroOpacity = interpolate(
    frame,
    [100, 120], // Fades out between frames 100 and 120, same as brand name
    [1, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: bgColorInterpolation, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Opening Scene: Subtle pulsating element */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: width * 0.4, // 40% of video width
            height: width * 0.4,
            borderRadius: '50%',
            border: `1px solid ${brandColor2}`,
            transform: `scale(${pulseScale})`,
            opacity: pulseOpacity,
            position: 'absolute',
          }}
        />
      </AbsoluteFill>

      {/* Brand Name and Tagline Container - Centered and stacked */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column', // Stack children vertically
        }}
      >
        {/* Brand Name Reveal (frames 30-90, visible till 120) */}
        <Sequence from={30} durationInFrames={90}> {/* Active from frame 30 to 120 */}
          <h1
            style={{
              fontSize: 90,
              fontWeight: 'bold',
              color: brandColor2,
              opacity: brandNameOpacity * brandNameOutroOpacity, // Combine enter and exit opacity
              transform: `translateY(${brandNameSlide}px)`,
              letterSpacing: -2, // Tight letter spacing for minimalism
              marginBottom: 10, // Space between brand name and tagline
              textAlign: 'center',
            }}
          >
            Campor
          </h1>
        </Sequence>

        {/* Tagline (frames 60-120) */}
        <Sequence from={60} durationInFrames={60}> {/* Active from frame 60 to 120 */}
          <p
            style={{
              fontSize: 28,
              color: brandColor2,
              opacity: taglineOpacity * taglineOutroOpacity, // Combine enter and exit opacity
              transform: `translateY(${taglineSlide}px)`,
              letterSpacing: 3, // Elegant letter spacing
              textAlign: 'center',
            }}
          >
            {""} {/* Renders an empty string as specified */}
          </p>
        </Sequence>
      </AbsoluteFill>

      {/* Closing: Handled by the fade-out animations of individual elements and background */}
    </AbsoluteFill>
  );
}