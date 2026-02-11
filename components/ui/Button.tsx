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
            primary: "bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white shadow-lg shadow-alteha-violet/30 hover:shadow-alteha-violet/50",
            outline: "border-2 border-alteha-violet text-alteha-violet bg-transparent hover:bg-alteha-violet/5",
            ghost: "bg-transparent text-slate-600 hover:text-alteha-violet"
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "relative px-8 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    variants[variant],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {children}

                {variant === 'primary' && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                )}
            </motion.button>
        );
    }
);
Button.displayName = "Button";
