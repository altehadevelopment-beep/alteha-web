"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: LucideIcon;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon: Icon, error, className, type, ...props }, ref) => {
        const [focused, setFocused] = useState(false);
        const [showPassword, setShowPassword] = useState(false);
        const hasValue = (props.value !== '' && props.value !== undefined) || (props.defaultValue !== '' && props.defaultValue !== undefined);

        const isPasswordType = type === 'password';
        const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="relative mb-6">
                <motion.div
                    animate={focused || hasValue ? { y: -24, scale: 0.85, color: '#6A4DFE' } : { y: 0, scale: 1, color: '#94a3b8' }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute left-0 top-3 origin-left text-base pointer-events-none"
                >
                    {label}
                </motion.div>

                <div className="relative py-2">
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
                        className={`w-full bg-transparent border-b-2 py-1 outline-none transition-colors duration-300 font-medium text-slate-800 ${isPasswordType || Icon ? 'pr-10' : ''
                            } ${error ? 'border-red-500' : focused ? 'border-alteha-violet' : 'border-slate-200'
                            } ${className}`}
                    />

                    {/* Password Toggle Button */}
                    {isPasswordType && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-0 top-2 p-1 transition-colors hover:text-alteha-violet ${focused ? 'text-alteha-violet' : 'text-slate-400'
                                }`}
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    )}

                    {/* Regular Icon (if not password) */}
                    {Icon && !isPasswordType && (
                        <Icon className={`absolute right-0 top-2 w-5 h-5 transition-colors ${focused ? 'text-alteha-violet' : 'text-slate-400'}`} />
                    )}
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.span
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute -bottom-5 left-0 text-xs text-red-500 font-medium"
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
