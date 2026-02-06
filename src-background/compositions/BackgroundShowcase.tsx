import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring} from 'remotion';
import {Background} from '../components/Background';
import {backgroundPresets} from '../components/Background/presets';

/**
 * Showcase composition that cycles through all Background presets,
 * demonstrating the composable layer system.
 */
export const BackgroundShowcase: React.FC = () => {
	const frame = useCurrentFrame();

	const presetEntries = Object.entries(backgroundPresets);
	const total = presetEntries.length;
	const framesPerPreset = 90; // 1.5 seconds at 60fps

	const currentIndex = Math.floor(frame / framesPerPreset) % total;
	const [, preset] = presetEntries[currentIndex];

	// Text entrance spring
	const localFrame = frame % framesPerPreset;
	const progress = spring({
		frame: localFrame,
		fps: 60,
		config: {damping: 80, stiffness: 200},
	});

	const titleOpacity = interpolate(progress, [0, 1], [0, 1]);
	const titleY = interpolate(progress, [0, 1], [30, 0]);

	// Fade out near end of each preset
	const fadeOut = interpolate(
		localFrame,
		[framesPerPreset - 20, framesPerPreset],
		[1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);

	return (
		<AbsoluteFill>
			{/* The composable background — just spread the preset */}
			<Background
				layers={preset.layers}
				animated={preset.animated}
				animationSpeed={preset.animationSpeed}
			/>

			{/* Overlay text */}
			<AbsoluteFill
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
					padding: 80,
					opacity: fadeOut,
				}}
			>
				<div
					style={{
						opacity: titleOpacity,
						transform: `translateY(${titleY}px)`,
					}}
				>
					<h1
						style={{
							color: '#ffffff',
							fontSize: 82,
							fontWeight: 700,
							textAlign: 'center',
							textShadow: '0 4px 40px rgba(0,0,0,0.5)',
							margin: 0,
							marginBottom: 16,
							letterSpacing: '-0.03em',
						}}
					>
						{preset.name}
					</h1>
					<p
						style={{
							color: 'rgba(255,255,255,0.85)',
							fontSize: 32,
							textAlign: 'center',
							textShadow: '0 2px 20px rgba(0,0,0,0.4)',
							margin: 0,
							maxWidth: 900,
							fontWeight: 400,
							lineHeight: 1.4,
						}}
					>
						{preset.description}
					</p>

					{/* Layer count badge */}
					<div
						style={{
							marginTop: 30,
							display: 'flex',
							justifyContent: 'center',
							gap: 10,
						}}
					>
						<span
							style={{
								color: 'rgba(255,255,255,0.7)',
								fontSize: 20,
								background: 'rgba(255,255,255,0.1)',
								backdropFilter: 'blur(10px)',
								padding: '8px 20px',
								borderRadius: 50,
								border: '1px solid rgba(255,255,255,0.15)',
							}}
						>
							{preset.layers.length} layers composed
						</span>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
