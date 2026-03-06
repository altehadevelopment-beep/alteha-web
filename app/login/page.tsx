"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { PuzzleCaptcha } from '@/components/ui/PuzzleCaptcha';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get('role');

    const getRoleInfo = (role: string | null) => {
        switch (role) {
            case 'specialist':
                return { title: 'Portal Especialistas', registerLink: '/register/specialist', color: 'text-alteha-turquoise' };
            case 'insurance':
                return { title: 'Portal Seguros', registerLink: '/register/insurance', color: 'text-alteha-violet' };
            case 'clinic':
                return { title: 'Portal Clínicas', registerLink: '/register/clinic', color: 'text-blue-500' };
            case 'provider':
                return { title: 'Portal Proveedores', registerLink: '/register/provider', color: 'text-indigo-500' };
            case 'health-fund':
                return { title: 'Portal Fondos de Salud', registerLink: '/register/health-fund', color: 'text-rose-500' };
            default:
                return { title: 'Bienvenido de nuevo', registerLink: '/register/specialist', color: 'text-slate-800' };
        }
    };

    const roleInfo = getRoleInfo(role);

    // Error Code Mapping
    const getErrorMessage = (code: string): string => {
        const errorMessages: Record<string, string> = {
            'AUTH_001': 'Usuario o contraseña incorrectos.',
            'AUTH_002': 'Este correo electrónico no está registrado.',
            'AUTH_003': 'Tu cuenta no está verificada.',
            'AUTH_004': 'Usuario o contraseña incorrectos.',
            'ERROR': 'Error de conexión con el servidor.'
        };
        return errorMessages[code] || 'Error al iniciar sesión. Intenta de nuevo.';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!username || !password) {
            setError('Por favor ingresa tus credenciales');
            setLoading(false);
            return;
        }

        if (!isVerified) {
            setError('Por favor desliza para verificar');
            setLoading(false);
            return;
        }

        try {
            const result = await login(username, password, role || 'specialist', isVerified ? 'human' : '');

            if (result.code === '00' && result.data?.id_token) {
                // Success - redirect to dashboard
                setFailedAttempts(0);
                const destination = role ? `/dashboard/${role}` : '/dashboard/specialist';
                router.push(destination);
            } else {
                // Increment failed attempts
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                // Prioritize backend message if it's descriptive, otherwise use mapping
                let backendMsg = result.message;

                // Specific mapping for "Unauthorized user" as requested
                if (backendMsg && (backendMsg.toLowerCase().includes('unauthorized user') || backendMsg.toLowerCase().includes('unauthorized'))) {
                    backendMsg = 'Usuario y contraseña es inválido';
                }

                // Specific mapping for "Account is blocked"
                if (backendMsg && (backendMsg.toLowerCase().includes('account is blocked') || backendMsg.toLowerCase().includes('blocked'))) {
                    backendMsg = 'Tu cuenta ha sido bloqueada debido a múltiples intentos fallidos. Por favor inténtalo más tarde.';
                }

                // Specific mapping for "Actor not found"
                if (backendMsg && backendMsg.toLowerCase().includes('actor not found')) {
                    backendMsg = 'El usuario no se encuentra registrado.';
                }

                const mappedMsg = getErrorMessage(result.code);

                // If backend message exists and isn't a generic/technical one, use it
                // Otherwise use our localized mapping
                let finalError = (backendMsg && !['Unauthorized', 'Actor not found', 'Internal Server Error', 'Bad Credentials'].includes(backendMsg))
                    ? backendMsg
                    : mappedMsg;

                // Security warning after 5th attempt
                if (newAttempts >= 5) {
                    finalError = 'Has realizado demasiados intentos lo siento el sistema lo podría monitoriar como un atacante';
                }

                setError(finalError);
                setLoading(false);
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-outfit">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-alteha-turquoise/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50"
            >
                {/* Inicio Button */}
                <Link href="/" className="absolute top-4 left-4 flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    Inicio
                </Link>

                <div className="flex flex-col items-center mb-8 mt-6">
                    <Link href="/">
                        <Logo className="w-16 h-16 mb-4 hover:scale-105 transition-transform duration-300" />
                    </Link>
                    <h1 className={`text-2xl font-bold ${roleInfo.color} transition-colors duration-300`}>{roleInfo.title}</h1>
                    <p className="text-slate-500 text-sm mt-1">Ingresa a tu cuenta para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Usuario o Correo"
                        icon={User}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="usuario@alteha.com"
                    />

                    <div className="space-y-1">
                        <Input
                            label="Contraseña"
                            icon={Lock}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-xs text-alteha-violet hover:underline font-medium">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col gap-2 shadow-sm"
                        >
                            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </div>
                            {failedAttempts > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-100/50 px-2 py-0.5 rounded-full">
                                        Intentos fallidos: {failedAttempts}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    <div className="flex justify-center">
                        <PuzzleCaptcha onVerify={setIsVerified} />
                    </div>

                    <Button type="submit" className="w-full flex items-center justify-center gap-2 group" disabled={loading || !isVerified}>
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </Button>

                    <div className="text-right">
                        <Link href="/forgot-password" className="text-sm text-slate-400 hover:text-alteha-violet font-medium transition-colors">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-4">
                    <p className="text-sm text-slate-500">
                        ¿No tienes una cuenta?{' '}
                        <Link href={roleInfo.registerLink} className="text-alteha-violet font-semibold hover:underline">
                            Regístrate
                        </Link>
                    </p>
                    <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Link href="/terms" className="hover:text-alteha-violet transition-colors">Términos</Link>
                        <span>•</span>
                        <Link href="/privacy" className="hover:text-alteha-turquoise transition-colors">Privacidad</Link>
                        <span>•</span>
                        <Link href="/support" className="hover:text-blue-500 transition-colors">Soporte</Link>
                    </div>
                </div>
            </motion.div>

            <div className="absolute bottom-6 text-slate-400 text-xs text-center w-full">
                &copy; {new Date().getFullYear()} ALTEHA - Todos los derechos reservados
            </div>
        </div>
    );
}
