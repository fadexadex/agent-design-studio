import React from 'react';
import { Img, Video } from 'remotion';
import { DeviceFrameProps } from '../../types/schema';

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
    type,
    contentSrc,
    theme = 'light',
    width = type === 'mobile' ? 300 : 800,
    height = type === 'mobile' ? 600 : 500,
    className = '',
}) => {
    const isVideo = contentSrc.endsWith('.mp4') || contentSrc.endsWith('.webm');

    const containerStyle: React.CSSProperties = {
        width,
        height,
        position: 'relative',
        boxShadow:
            theme === 'dark'
                ? '0 20px 50px rgba(0,0,0,0.5)'
                : '0 20px 50px rgba(0,0,0,0.2)',
        borderRadius: type === 'mobile' ? 40 : 12,
        background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        overflow: 'hidden',
        border: type === 'glass-card' ? '1px solid rgba(255,255,255,0.2)' : 'none',
    };

    // Browser Header Style
    const headerStyle: React.CSSProperties = {
        height: 40,
        width: '100%',
        background: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 15px',
        gap: 8,
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
    };

    const dotStyle = (color: string): React.CSSProperties => ({
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
    });

    // Mobile Notch Style (Basic)
    const notchStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 120,
        height: 30,
        background: '#000',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        zIndex: 10,
    };

    const contentStyle: React.CSSProperties = {
        width: '100%',
        height: type === 'browser' ? 'calc(100% - 40px)' : '100%',
        objectFit: 'cover',
        display: 'block',
    };

    return (
        <div style={containerStyle} className={className}>
            {/* Browser Header */}
            {type === 'browser' && (
                <div style={headerStyle}>
                    <div style={dotStyle('#FF5F56')} />
                    <div style={dotStyle('#FFBD2E')} />
                    <div style={dotStyle('#27C93F')} />
                    {/* Address bar simulation */}
                    <div
                        style={{
                            flex: 1,
                            height: 24,
                            background: theme === 'dark' ? '#1a1a1a' : '#fff',
                            borderRadius: 6,
                            marginLeft: 10,
                            opacity: 0.5,
                        }}
                    />
                </div>
            )}

            {/* Mobile Notch */}
            {type === 'mobile' && <div style={notchStyle} />}

            {/* Content */}
            {isVideo ? (
                <Video src={contentSrc} style={contentStyle} />
            ) : (
                <Img src={contentSrc} style={contentStyle} />
            )}

            {/* Glass Effect Overlay */}
            {type === 'glass-card' && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
};
