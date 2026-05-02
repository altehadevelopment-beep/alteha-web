"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { PuzzleCaptcha } from '@/components/ui/PuzzleCaptcha';
import { app } from '@/lib/firebase';
import { getInstallations, getId } from 'firebase/installations';

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
                return { 
                    title: 'Red Médica Althea', 
                    registerLink: '/register/specialist', 
                    color: 'text-alteha-turquoise',
                    bgImage: '/backgrounds/specialist.png'
                };
            case 'insurance':
                return { 
                    title: 'Portal Empresas de Seguros', 
                    registerLink: '/register/insurance', 
                    color: 'text-alteha-violet',
                    bgImage: '/backgrounds/insurance.png'
                };
            case 'clinic':
                return { 
                    title: 'Portal Clínicas', 
                    registerLink: '/register/clinic', 
                    color: 'text-blue-500',
                    bgImage: '/backgrounds/clinic.png'
                };
            case 'provider':
                return { 
                    title: 'Portal Proveedores', 
                    registerLink: '/register/provider', 
                    color: 'text-indigo-500',
                    bgImage: '/backgrounds/provider.png'
                };
            case 'health-fund':
                return { 
                    title: 'Portal Fondos de Salud', 
                    registerLink: '/register/health-fund', 
                    color: 'text-rose-500',
                    bgImage: '/backgrounds/health-fund.png'
                };
            default:
                return { 
                    title: 'Bienvenido de nuevo', 
                    registerLink: '/register/specialist', 
                    color: 'text-slate-800',
                    bgImage: '/backgrounds/specialist.png' // Default background
                };
        }
    };

    const roleInfo = getRoleInfo(role);

    // Error Code Mapping
    const getErrorMessage = (code: string): string => {
        const errorMessages: Record<string, string> = {
            'AUTH_001': 'Usuario (Correo Electrónico) o contraseña incorrectos.',
            'AUTH_002': 'Este correo electrónico no está registrado.',
            'AUTH_003': 'Tu cuenta no está verificada.',
            'AUTH_004': 'Usuario (Correo Electrónico) o contraseña incorrectos.',
            'ERROR': 'Error de conexión con el servidor.'
        };
        return errorMessages[code] || 'Error al iniciar sesión. Intenta de nuevo.';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUsername || !trimmedPassword) {
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
            const result = await login(trimmedUsername, trimmedPassword, role || 'specialist', isVerified ? 'human' : '');

            if (result.code === '00' && result.data?.id_token) {
                // Success - redirect to dashboard
                setFailedAttempts(0);
                
                // --- PRUEBA FIREBASE DEVICE ID ---
                try {
                    const installations = getInstallations(app);
                    const deviceId = await getId(installations);
                    alert(`Firebase Conectado. Device ID generado: ${deviceId}`);
                } catch (fbErr) {
                    console.error('Error getting Firebase ID:', fbErr);
                    alert('Login exitoso, pero hubo un problema conectando con Firebase. Revisa las reglas de Firestore.');
                }
                // ---------------------------------

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
                if (backendMsg && (backendMsg.toLowerCase().includes('actor not found') || backendMsg.toLowerCase().includes('was not found in the database'))) {
                    backendMsg = 'Usuario No Existe, inicie su registro.';
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-outfit bg-slate-900">
            {/* Dynamic Background Image */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={roleInfo.bgImage}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    <div 
                        className="w-full h-full bg-cover bg-center bg-no-repeat blur-[4px]"
                        style={{ backgroundImage: `url(${roleInfo.bgImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60" />
                </motion.div>
            </AnimatePresence>

            {/* Background Gradients (Atmospheric) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-50">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-alteha-turquoise/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="relative z-10 w-full max-w-md bg-white rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] p-8 border border-slate-100"
            >
                {/* Inicio Button */}
                <Link href="/" className="absolute top-5 left-6 z-30 flex items-center gap-2 px-3 py-1.5 bg-alteha-turquoise/10 hover:bg-alteha-turquoise/20 text-alteha-turquoise border border-alteha-turquoise/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:gap-3 shadow-sm">
                    <ArrowLeft className="w-3 h-3" />
                    Inicio
                </Link>

                <div className="flex flex-col items-center mb-8 mt-12">
                    <Link href="/" className="relative group/logo">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-alteha-turquoise/20 to-alteha-violet/20 rounded-full blur-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
                        <Logo className="w-40 h-40 mb-6 relative z-10 hover:scale-110 transition-transform duration-500 ease-out" />
                    </Link>
                    <h1 className={cn("text-2xl font-black transition-colors duration-500 tracking-tight", roleInfo.color)}>{roleInfo.title}</h1>
                    <p className="text-slate-400 text-xs mt-1 font-medium">Ingresa para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Usuario (Correo Electrónico)"
                        icon={User}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="usuario@alteha.com"
                    />

                    <div className="space-y-4">
                        <Input
                            label="Contraseña"
                            icon={Lock}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
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

                    <Button type="submit" className="w-full flex items-center justify-center gap-2 group py-3.5" disabled={loading || !isVerified}>
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </Button>

                    <div className="text-center pt-2">
                        <Link href="/forgot-password" className="text-[10px] text-slate-400 hover:text-alteha-violet font-bold uppercase tracking-widest transition-colors">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
                    <p className="text-xs text-slate-500">
                        ¿No tienes una cuenta?{' '}
                        <Link href={roleInfo.registerLink} className="text-alteha-violet font-semibold hover:underline">
                            Regístrate
                        </Link>
                    </p>
                    <div className="flex justify-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
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
