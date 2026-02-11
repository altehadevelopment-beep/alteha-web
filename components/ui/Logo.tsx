import React from 'react';

export const Logo = ({ className = "w-24 h-24" }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logo_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#18D19A" />
                    <stop offset="100%" stopColor="#6A4DFE" />
                </linearGradient>
            </defs>

            {/* Hexagon Shape with nodes */}
            <path
                d="M50 5 
           L85 25 
           L85 65 
           L50 85 
           L15 65 
           L15 25 
           Z"
                stroke="url(#logo_gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-lg"
            />

            {/* Node Top Right */}
            <circle cx="85" cy="25" r="8" fill="#18D19A" />

            {/* Node Bottom Left */}
            <circle cx="15" cy="65" r="8" fill="#6A4DFE" />

            {/* Letter A */}
            <path
                d="M35 65 L50 25 L65 65"
                stroke="url(#logo_gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M40 52 L60 52"
                stroke="url(#logo_gradient)"
                strokeWidth="6"
                strokeLinecap="round"
            />
        </svg>
    );
};
