import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${className}`}>
            {children}
        </span>
    );
}
