import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	interpolateColors,
} from 'remotion';

export const Scene5: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// 1. Circular Mask Expansion Transition
	const maskProgress = spring({
		frame,
		fps,
		config: {
			stiffness: 40,
			damping: 20,
		},
	});

	const maskRadius = interpolate(maskProgress, [0, 1], [0, 150]);

	// 2. Subtle Background Pulse
	// Oscillates between frame 0 and 225
	const pulseValue = Math.sin(frame / 30);
	const backgroundColor = interpolateColors(
		pulseValue,
		[-1, 1],
		['#FFFFFF', '#F2F2F2']
	);

	// 3. Main Text Animation (CAMPOR)
	const mainTextSpring = spring({
		frame: frame - 25,
		fps,
		config: {
			damping: 12,
			stiffness: 100,
		},
	});

	const mainTextOpacity = interpolate(frame, [25, 45], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const mainTextScale = interpolate(mainTextSpring, [0, 1], [0.85, 1]);

	// 4. Secondary Text Animation (Redefining Ecommerce)
	const subTextSpring = spring({
		frame: frame - 45,
		fps,
		config: {
			damping: 15,
		},
	});

	const subTextOpacity = interpolate(frame, [45, 65], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const subTextTranslateY = interpolate(subTextSpring, [0, 1], [20, 0]);

	const containerStyle: React.CSSProperties = {
		backgroundColor: '#000000', // Underlay for the mask transition
	};

	const contentStyle: React.CSSProperties = {
		backgroundColor,
		clipPath: `circle(${maskRadius}% at 50% 50%)`,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
	};

	const titleStyle: React.CSSProperties = {
		fontSize: '140px',
		fontWeight: 900,
		color: '#000000',
		letterSpacing: '-0.02em',
		margin: 0,
		padding: 0,
		opacity: mainTextOpacity,
		transform: `scale(${mainTextScale})`,
		lineHeight: 1,
	};

	const subtitleStyle: React.CSSProperties = {
		fontSize: '28px',
		fontWeight: 300,
		color: '#000000',
		letterSpacing: '0.4em',
		textTransform: 'uppercase',
		marginTop: '40px',
		opacity: subTextOpacity,
		transform: `translateY(${subTextTranslateY}px)`,
	};

	return (
		<AbsoluteFill style={containerStyle}>
			<AbsoluteFill style={contentStyle}>
				<div style={titleStyle}>CAMPOR</div>
				<div style={subtitleStyle}>Redefining Ecommerce</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};