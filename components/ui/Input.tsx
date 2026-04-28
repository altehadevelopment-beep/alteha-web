"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, Eye, EyeOff, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: LucideIcon;
    error?: string;
    alwaysFloat?: boolean;
    tooltip?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon: Icon, error, alwaysFloat, tooltip, className, type, ...props }, ref) => {
        const [focused, setFocused] = useState(false);
        const [showPassword, setShowPassword] = useState(false);
        const hasValue = (props.value !== '' && props.value !== undefined) || (props.defaultValue !== '' && props.defaultValue !== undefined);

        const isPasswordType = type === 'password';
        const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className={cn("relative mb-4 group", className)}>
                <motion.label
                    animate={focused || hasValue || alwaysFloat ? { 
                        y: -14, 
                        scale: 0.75, 
                        color: error ? '#ef4444' : '#7B5BFF',
                        fontWeight: 700
                    } : { 
                        y: 30, 
                        scale: 1, 
                        color: '#94a3b8',
                        fontWeight: 500
                    }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        "absolute z-20 origin-left pointer-events-none uppercase tracking-widest text-[10px] transition-all duration-300",
                        Icon ? "left-12" : "left-4"
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        {label}
                        {tooltip && (focused || hasValue || alwaysFloat) && (
                            <div className="relative group/tooltip">
                                <Info className="w-3 h-3 text-slate-400 hover:text-alteha-violet transition-colors cursor-help" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] font-medium leading-tight rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl normal-case tracking-normal">
                                    {tooltip}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.label>

                <div className="relative group/input">
                    {/* Background & Border with Glow */}
                    <div className={cn(
                        "absolute inset-0 rounded-2xl transition-all duration-500",
                        "bg-slate-50/50 backdrop-blur-sm border-2",
                        error ? "border-red-200 bg-red-50/10" : 
                        focused ? "border-alteha-violet/40 bg-white shadow-[0_0_20px_rgba(123,91,255,0.15)] scale-[1.01]" : 
                        "border-slate-100 group-hover:border-slate-200 group-hover:bg-white/80"
                    )} />
                    
                    <div className="relative flex items-center px-4 pt-5 pb-1.5 min-h-[60px] z-10 font-outfit">
                        {Icon && (
                            <Icon className={cn(
                                "w-5 h-5 mr-3 transition-colors duration-300",
                                focused ? "text-alteha-violet" : "text-slate-400 group-hover/input:text-slate-500"
                            )} />
                        )}
                        
                        <input
                            {...props}
                            ref={ref}
                            type={inputType}
                            placeholder={focused ? props.placeholder : ''}
                            onFocus={(e) => {
                                setFocused(true);
                                props.onFocus?.(e);
                            }}
                            onBlur={(e) => {
                                setFocused(false);
                                props.onBlur?.(e);
                            }}
                            className="flex-1 bg-transparent border-none outline-none font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium tracking-tight"
                        />

                        {isPasswordType && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="ml-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-alteha-violet active:scale-90"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.span
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute -bottom-5 left-4 text-[10px] text-red-500 font-bold uppercase tracking-wider"
                        >
                            {error}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

Input.displayName = "Input";
