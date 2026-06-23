"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// Alteha Hexagon Logo SVG (matches the actual logo)
function AltehaHexLogo({ size = 64 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2ECFBF" />
                    <stop offset="100%" stopColor="#7B5BFF" />
                </linearGradient>
            </defs>
            {/* Hexagon shape */}
            <path
                d="M40 6 L70 22 L70 58 L40 74 L10 58 L10 22 Z"
                stroke="url(#hexGrad)"
                strokeWidth="3.5"
                fill="rgba(46,207,191,0.06)"
                strokeLinejoin="round"
            />
            {/* "A" letter inside */}
            <path
                d="M40 22 L52 52 M40 22 L28 52 M32 44 L48 44"
                stroke="url(#hexGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Accent dots */}
            <circle cx="68" cy="20" r="3.5" fill="#2ECFBF" />
            <circle cx="14" cy="62" r="3" fill="#7B5BFF" />
        </svg>
    );
}

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await axios.post('/api/authenticate', {
                username: username.trim(),
                password: password.trim(),
                rememberMe: true
            });
            if (response.data?.id_token) {
                login(response.data.id_token);
            } else {
                setError('La respuesta no contiene un token válido.');
            }
        } catch {
            setError('Credenciales inválidas. Por favor revisa tu usuario y contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-stretch font-outfit" style={{ background: '#0C0E1A' }}>

            {/* LEFT — brand panel with blurred clinic background */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="hidden lg:flex flex-col justify-center px-20 w-1/2 relative overflow-hidden"
            >
                {/* Clinic photo background — blurred and darkened */}
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(/clinic-bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(3px) brightness(0.35)',
                        transform: 'scale(1.05)', // avoids blur edge artifacts
                    }} />

                {/* Dark navy gradient overlay */}
                <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(145deg, rgba(12,14,26,0.80) 0%, rgba(19,23,41,0.70) 60%, rgba(26,16,64,0.75) 100%)' }} />

                {/* Colored gradient blobs */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full opacity-25 blur-[80px]"
                    style={{ background: 'radial-gradient(circle, #2ECFBF, transparent)' }} />
                <div className="absolute bottom-1/4 right-0 w-72 h-72 rounded-full opacity-20 blur-[80px]"
                    style={{ background: 'radial-gradient(circle, #7B5BFF, transparent)' }} />

                {/* Content */}
                <div className="relative z-10 space-y-8">
                    <AltehaHexLogo size={72} />

                    <div>
                        <h1 className="text-7xl font-black tracking-tight leading-none alteha-text-gradient">
                            ALTEHA
                        </h1>
                        <p className="text-2xl font-medium mt-1" style={{ color: '#7B8DB0' }}>
                            Ecosistema de Salud
                        </p>
                    </div>

                    <p className="text-base leading-relaxed max-w-sm" style={{ color: '#8B9CB8' }}>
                        Panel administrativo interno para la gestión de médicos, clínicas, seguros y toda la plataforma Alteha.
                    </p>

                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#2ECFBF' }}>
                        <ShieldCheck className="w-4 h-4" />
                        Autenticación segura JHipster JWT
                    </div>
                </div>
            </motion.div>

            {/* RIGHT — login form */}
            <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#EEF2FF' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="flex flex-col items-center mb-10 lg:hidden">
                        <AltehaHexLogo size={60} />
                        <h1 className="text-4xl font-black mt-4 alteha-text-gradient">ALTEHA</h1>
                        <p className="text-slate-500 mt-1 font-medium">Ecosistema de Salud</p>
                    </div>

                    <div className="bg-white rounded-3xl p-10 shadow-xl" style={{ boxShadow: '0 20px 60px rgba(123,91,255,0.1), 0 4px 20px rgba(0,0,0,0.06)' }}>
                        {/* Top gradient line */}
                        <div className="h-1 rounded-full mb-8" style={{ background: 'linear-gradient(90deg, #2ECFBF, #7B5BFF)' }} />

                        <h2 className="text-2xl font-black text-slate-800 mb-1">Bienvenido al Admin</h2>
                        <p className="text-sm text-slate-400 font-medium mb-8">Ingresa tus credenciales para continuar</p>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="admin"
                                        className="w-full rounded-2xl py-4 pl-11 pr-4 text-slate-800 font-semibold text-sm outline-none transition-all"
                                        style={{
                                            background: '#F4F5FF',
                                            border: '1.5px solid rgba(123,91,255,0.12)',
                                        }}
                                        onFocus={e => { e.target.style.border = '1.5px solid #2ECFBF'; e.target.style.boxShadow = '0 0 0 3px rgba(46,207,191,0.1)'; }}
                                        onBlur={e => { e.target.style.border = '1.5px solid rgba(123,91,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-2xl py-4 pl-11 pr-4 text-slate-800 font-semibold text-sm outline-none transition-all"
                                        style={{
                                            background: '#F4F5FF',
                                            border: '1.5px solid rgba(123,91,255,0.12)',
                                        }}
                                        onFocus={e => { e.target.style.border = '1.5px solid #2ECFBF'; e.target.style.boxShadow = '0 0 0 3px rgba(46,207,191,0.1)'; }}
                                        onBlur={e => { e.target.style.border = '1.5px solid rgba(123,91,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-red-50 border border-red-100 text-red-500 text-sm p-4 rounded-2xl font-medium">
                                            {error}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                style={{ background: 'linear-gradient(90deg, #2ECFBF, #7B5BFF)', boxShadow: '0 8px 24px rgba(123,91,255,0.3)' }}
                            >
                                {isLoading
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <>Entrar al Panel <ArrowRight className="w-5 h-5" /></>
                                }
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
