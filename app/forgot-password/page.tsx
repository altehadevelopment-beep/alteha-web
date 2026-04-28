"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2, Send, ChevronDown, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

// Mapeo de roles frontend → backend (mismo que lib/api.ts)
const roleOptions = [
    { label: 'Especialista / Doctor', value: 'DOCTOR' },
    { label: 'Clínica', value: 'CLINIC' },
    { label: 'Seguro', value: 'INSURANCE_COMPANY' },
    { label: 'Proveedor / Farmacia', value: 'PHARMACY' },
    { label: 'Fondo de Salud', value: 'HEALTH_FUND' },
];

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('DOCTOR');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/actor/reset-password/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });

            if (response.ok || response.status === 200) {
                setSubmitted(true);
            } else {
                // Intentar leer el mensaje de error del backend
                let msg = 'No pudimos procesar tu solicitud. Verifica el correo e intenta de nuevo.';
                try {
                    const data = await response.json();
                    if (data?.message) msg = data.message;
                    else if (data?.error) msg = data.error;
                } catch {
                    // Si no hay JSON, usar mensaje genérico
                }
                setError(msg);
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Intenta de nuevo más tarde.');
        } finally {
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50"
            >
                {/* Inicio Button */}
                <Link href="/" className="absolute top-4 left-4 flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    Inicio
                </Link>

                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="flex flex-col items-center mb-8">
                                <Link href="/">
                                    <div className="p-3 bg-slate-100 rounded-full mb-4 hover:bg-white transition-colors group cursor-pointer">
                                        <Logo className="w-12 h-12 group-hover:scale-105 transition-transform" />
                                    </div>
                                </Link>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center">Recuperar Contraseña</h1>
                                <p className="text-slate-500 text-sm mt-2 text-center">Ingresa tu correo y te enviaremos un enlace para restablecer tu acceso.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email */}
                                <Input
                                    label="Correo Electrónico"
                                    icon={Mail}
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="doctor@ejemplo.com"
                                />

                                {/* Role Selector */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Tipo de cuenta
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-alteha-violet/30 focus:border-alteha-violet transition-all cursor-pointer"
                                        >
                                            {roleOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium"
                                        >
                                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 group py-6 rounded-2xl"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span className="font-black italic">Enviar Enlace</span>
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-8 text-center">
                                <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 font-bold hover:text-alteha-violet transition-colors text-sm">
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver al Login
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">¡Correo Enviado!</h2>
                            <p className="text-slate-500 font-medium mb-8">
                                Hemos enviado instrucciones a <span className="text-slate-900 font-bold">{email}</span> para restablecer tu contraseña.
                            </p>
                            <Link href="/login">
                                <Button className="w-full py-6 rounded-2xl bg-slate-900 text-white font-black italic">
                                    Entendido, ir al Login
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
