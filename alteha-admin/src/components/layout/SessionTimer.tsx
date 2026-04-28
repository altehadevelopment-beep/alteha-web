"use client";

import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_DURATION = 5 * 60;

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function SessionTimer() {
    const { secondsLeft, logout, resetTimer } = useAuth();

    const pct = (secondsLeft / SESSION_DURATION) * 100;
    const isWarning = secondsLeft <= 60;
    const isCritical = secondsLeft <= 30;

    const barColor = isCritical
        ? '#EF4444'
        : isWarning
        ? '#F59E0B'
        : '#2ECFBF';

    return (
        <AnimatePresence>
            <div className="shrink-0">
                {/* Progress bar — always visible */}
                <div className="h-0.5 w-full" style={{ background: 'rgba(123,91,255,0.06)' }}>
                    <motion.div
                        className="h-full transition-all"
                        style={{
                            width: `${pct}%`,
                            background: isCritical
                                ? 'linear-gradient(90deg, #EF4444, #FF6B6B)'
                                : isWarning
                                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                                : 'linear-gradient(90deg, #2ECFBF, #7B5BFF)',
                        }}
                    />
                </div>

                {/* Warning banner — shows only when ≤ 60 seconds */}
                <AnimatePresence>
                    {isWarning && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-3 px-6 py-2.5"
                                style={{
                                    background: isCritical ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                                    borderBottom: `1px solid ${isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}`,
                                }}>
                                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: barColor }} />
                                <p className="text-sm font-bold flex-1" style={{ color: barColor }}>
                                    {isCritical
                                        ? `⚠️ La sesión expira en ${formatTime(secondsLeft)}`
                                        : `Sesión expira en ${formatTime(secondsLeft)} — ¿Deseas extenderla?`
                                    }
                                </p>
                                <button
                                    onClick={resetTimer}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                    style={{ background: barColor + '22', color: barColor, border: `1px solid ${barColor}33` }}>
                                    <RefreshCw className="w-3 h-3" />
                                    Extender
                                </button>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <LogOut className="w-3 h-3" />
                                    Salir
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Subtle timer in happy state — top-right microchip style */}
                {!isWarning && (
                    <div className="flex justify-end px-6 py-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold"
                            style={{ color: 'rgba(46,207,191,0.5)' }}>
                            <Clock className="w-3 h-3" />
                            Sesión: {formatTime(secondsLeft)}
                        </span>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
}
