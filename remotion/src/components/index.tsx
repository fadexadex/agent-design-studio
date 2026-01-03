import React from 'react';
import { AbsoluteFill } from 'remotion';

export const GlassCard: React.FC<{
    width: number;
    height: number;
    dark?: boolean;
    children: React.ReactNode;
}> = ({ width, height, dark, children }) => {
    return (
        <div
      style= {{
        width,
            height,
            background: dark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                    borderRadius: 20,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    }
}
    >
    { children }
    </div>
  );
};

export const TextOverlay: React.FC<{
    title: string;
    subtitle: string;
    delay?: number;
    dark?: boolean;
}> = ({ title, subtitle, dark }) => {
    return (
        <AbsoluteFill
      style= {{
        justifyContent: 'center',
            alignItems: 'center',
                color: dark ? 'white' : 'black',
                    textAlign: 'center'
    }
}
    >
    <h1 style={ { fontSize: 80, margin: 0 } }> { title } </h1>
        < p style = {{ fontSize: 40, marginTop: 20, opacity: 0.8 }}> { subtitle } </p>
            </AbsoluteFill>
  );
};

export const Cursor: React.FC<{
    x: number;
    y: number;
    click: boolean | number;
    color: string;
}> = ({ x, y, click, color }) => {
    const isClicked = typeof click === 'number' ? click > 0.5 : click;

    return (
        <div
      style= {{
        position: 'absolute',
            left: x,
                top: y,
                    width: 40,
                        height: 40,
                            borderRadius: '50%',
                                backgroundColor: color,
                                    transform: `translate(-50%, -50%) scale(${isClicked ? 0.8 : 1})`,
                                        transition: 'transform 0.1s',
                                            boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                                                pointerEvents: 'none'
    }
}
    />
  );
};

export const BackgroundGrid: React.FC<{
    dark?: boolean;
    color?: string;
}> = ({ dark, color }) => {
    return (
        <AbsoluteFill
      style= {{
        background: `linear-gradient(90deg, ${color || '#444'} 1px, transparent 1px), linear-gradient(${color || '#444'} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
                opacity: 0.1
    }
}
    />
  );
};
