import React from 'react';

export function HorseAvatar({ appearance, size = 64 }) {
    if (!appearance) return null;

    const { coat, mane, marking, eye } = appearance;

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            {/* Nacke och hals */}
            <path d="M 20 100 C 20 60, 40 40, 50 20 L 70 20 L 85 45 C 80 60, 60 80, 50 100 Z" fill={coat} />
            
            {/* Huvud */}
            <path d="M 40 10 Q 55 -5 70 10 L 95 60 C 95 75, 75 80, 65 70 L 40 10 Z" fill={coat} />
            
            {/* Nosparti */}
            <path d="M 85 55 C 98 55, 100 70, 95 75 C 80 80, 65 75, 70 60 Z" fill={coat} />
            
            {/* Tecken (Markings) - Vit */}
            {marking === 'star' && (
                <polygon points="55,15 60,25 50,22" fill="#ffffff" opacity="0.8" />
            )}
            {marking === 'blaze' && (
                <path d="M 55 15 L 65 15 L 85 60 L 75 62 Z" fill="#ffffff" opacity="0.8" />
            )}
            {marking === 'stripe' && (
                <path d="M 60 15 L 62 15 L 75 50 L 73 50 Z" fill="#ffffff" opacity="0.8" />
            )}
            {marking === 'snip' && (
                <ellipse cx="85" cy="65" rx="5" ry="3" fill="#ffffff" opacity="0.8" />
            )}

            {/* Manen */}
            <path d="M 40 10 C 30 30, 15 60, 20 80 C 25 70, 35 40, 50 20 Z" fill={mane} />
            
            {/* Öra */}
            <path d="M 40 10 L 35 -5 L 50 5 Z" fill={coat} />
            <path d="M 42 8 L 38 -2 L 48 4 Z" fill={mane} />

            {/* Öga */}
            <circle cx="65" cy="30" r="4" fill={eye} />
            <circle cx="66" cy="29" r="1.5" fill="#ffffff" opacity="0.5" />
            
            {/* Näsborre */}
            <ellipse cx="90" cy="68" rx="2" ry="1" fill="#1a1a1a" opacity="0.7" />
            
            {/* Mun */}
            <path d="M 82 74 C 88 75, 92 73, 95 73" stroke="#1a1a1a" strokeWidth="1" fill="none" opacity="0.5"/>
        </svg>
    );
}
