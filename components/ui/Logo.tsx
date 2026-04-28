import React from 'react';
import Image from 'next/image';

export const Logo = ({ className = "w-24 h-24" }: { className?: string }) => {
    return (
        <div className={`relative ${className}`}>
            <Image
                src="/logoalteha.svg"
                alt="Alteha Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};

