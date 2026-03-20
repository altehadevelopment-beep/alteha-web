"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.PropsWithChildren<HTMLMotionProps<"button">> {
    variant?: 'primary' | 'outline' | 'ghost';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', isLoading, children, ...props }, ref) => {

        const variants = {
            primary: "bg-gradient-to-r from-alteha-turquoise/90 via-alteha-violet/90 to-alteha-turquoise/90 bg-[length:200%_auto] text-white shadow-[0_10px_25px_-5px_rgba(106,77,254,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(106,77,254,0.5)] border border-white/20 animate-gradient",
            outline: "border-2 border-slate-200 text-slate-600 bg-white/50 backdrop-blur-md hover:border-alteha-violet hover:text-alteha-violet hover:bg-white",
            ghost: "bg-transparent text-slate-500 hover:text-alteha-violet hover:bg-alteha-violet/5"
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98, y: 0 }}
                className={cn(
                    "relative px-8 py-4 rounded-2xl font-bold transition-all duration-500",
                    "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                    "flex items-center justify-center gap-3 overflow-hidden group",
                    variants[variant],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {/* Shimmer Effect for Primary */}
                {variant === 'primary' && (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: 2, 
                                ease: "linear",
                                repeatDelay: 3
                            }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                        />
                    </div>
                )}

                <div className="relative z-10 flex items-center gap-2">
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {children}
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.button>
        );
    }
);
Button.displayName = "Button";
