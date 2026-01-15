import React from 'react';
import {
	AbsoluteFill,
	useCurrentFrame,
	interpolate,
	spring,
	useVideoConfig,
	Easing,
} from 'remotion';

export const Scene4: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height, fps } = useVideoConfig();

	const pathData = "M 384 756 C 576 756, 672 324, 960 540 S 1344 108, 1536 324";
	
	// Path drawing animation (0 to 1)
	const pathDrawProgress = interpolate(frame, [0, 120], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.33, 1, 0.68, 1),
	});

	// Dot movement animation (slightly delayed and follows path)
	const dotProgress = interpolate(frame, [15, 135], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.33, 1, 0.68, 1),
	});

	// Text animation
	const textSpring = spring({
		frame: frame - 100,
		fps,
		config: {
			damping: 12,
			stiffness: 100,
		},
	});

	const textOpacity = interpolate(frame, [100, 130], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const textMove = interpolate(textSpring, [0, 1], [20, 0]);

	return (
		<AbsoluteFill style={{ backgroundColor: '#000000', color: '#FFFFFF', fontFamily: 'Inter, system-ui, sans-serif' }}>
			{/* Abstract Delivery Path */}
			<svg
				width={width}
				height={height}
				viewBox={`0 0 ${width} ${height}`}
				fill="none"
				style={{ position: 'absolute' }}
			>
				<path
					d={pathData}
					stroke="#FFFFFF"
					strokeWidth="1.5"
					strokeDasharray="2000"
					strokeDashoffset={2000 * (1 - pathDrawProgress)}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				
				{/* Traveling Dot */}
				<circle
					r="5"
					fill="#FFFFFF"
					style={{
						offsetPath: `path("${pathData}")`,
						offsetDistance: `${dotProgress * 100}%`,
						opacity: dotProgress > 0 && dotProgress < 1 ? 1 : 0,
						filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
					}}
				/>
			</svg>

			{/* Minimalist Text */}
			<div
				style={{
					position: 'absolute',
					bottom: '15%',
					width: '100%',
					textAlign: 'center',
					opacity: textOpacity,
					transform: `translateY(${textMove}px)`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '10px',
				}}
			>
				<div
					style={{
						fontSize: '48px',
						fontWeight: 300,
						letterSpacing: '0.2em',
						textTransform: 'uppercase',
					}}
				>
					Direct To You
				</div>
				<div
					style={{
						width: interpolate(textSpring, [0, 1], [0, 60]),
						height: '1px',
						backgroundColor: '#FFFFFF',
						marginTop: '10px',
					}}
				/>
			</div>

			{/* Subtle Vignette for Depth */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)',
					pointerEvents: 'none',
				}}
			/>
		</AbsoluteFill>
	);
};

export default Scene4;