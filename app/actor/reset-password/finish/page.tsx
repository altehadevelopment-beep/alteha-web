"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Mapeo role backend → etiqueta legible
const roleLabels: Record<string, { label: string; color: string; emoji: string }> = {
    DOCTOR:            { label: 'Especialista / Doctor',  color: 'text-alteha-turquoise', emoji: '🩺' },
    CLINIC:            { label: 'Clínica',                color: 'text-blue-500',         emoji: '🏥' },
    INSURANCE_COMPANY: { label: 'Seguro',                 color: 'text-alteha-violet',    emoji: '🛡️' },
    PHARMACY:          { label: 'Proveedor / Farmacia',   color: 'text-indigo-500',       emoji: '💊' },
    HEALTH_FUND:       { label: 'Fondo de Salud',         color: 'text-rose-500',         emoji: '❤️‍🩹' },
    PATIENT:           { label: 'Paciente',               color: 'text-emerald-500',      emoji: '👤' },
};

function PasswordStrength({ password }: { password: string }) {
    const checks = {
        length:    password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number:    /[0-9]/.test(password),
        special:   /[!@#$%^&*]/.test(password),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const strength = passed <= 1 ? 'Muy débil' : passed === 2 ? 'Débil' : passed === 3 ? 'Regular' : passed === 4 ? 'Fuerte' : 'Muy fuerte';
    const colors   = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-500', 'bg-emerald-500'];

    if (!password) return null;

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passed ? colors[passed - 1] : 'bg-slate-200'}`}
                    />
                ))}
            </div>
            <p className={`text-xs font-bold ${passed >= 4 ? 'text-emerald-600' : passed >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                {strength}
            </p>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
                {[
                    { key: 'length',    label: 'Mínimo 8 caracteres' },
                    { key: 'uppercase', label: 'Una mayúscula' },
                    { key: 'lowercase', label: 'Una minúscula' },
                    { key: 'number',    label: 'Un número' },
                    { key: 'special',   label: 'Un carácter especial (!@#$%^&*)' },
                ].map(({ key, label }) => (
                    <div key={key} className={`flex items-center gap-1 font-medium ${checks[key as keyof typeof checks] ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {checks[key as keyof typeof checks] ? '✓' : '○'} {label}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const key  = searchParams.get('key')  || '';
    const role = searchParams.get('role') || 'DOCTOR';

    const [newPassword, setNewPassword]     = useState('');
    const [confirmPass, setConfirmPass]     = useState('');
    const [showNew, setShowNew]             = useState(false);
    const [showConfirm, setShowConfirm]     = useState(false);
    const [loading, setLoading]             = useState(false);
    const [success, setSuccess]             = useState(false);
    const [error, setError]                 = useState('');

    const roleInfo = roleLabels[role] ?? { label: role, color: 'text-slate-700', emoji: '👤' };

    // Validaciones
    const isValidPassword = newPassword.length >= 8;
    const passwordsMatch  = newPassword === confirmPass && newPassword.length > 0;
    const canSubmit       = isValidPassword && passwordsMatch && key;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/actor/reset-password/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, newPassword, role }),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                let msg = 'No pudimos actualizar tu contraseña. El enlace puede haber expirado.';
                try {
                    const data = await response.json();
                    if (data?.message) msg = data.message;
                    else if (data?.error) msg = data.error;
                } catch { /* ignorar */ }
                setError(msg);
            }
        } catch {
            setError('Error de conexión con el servidor. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Sin key en la URL → mostrar error
    if (!key) {
        return (
            <div className="text-center py-6">
                <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Enlace inválido</h2>
                <p className="text-slate-500 font-medium mb-8">
                    Este enlace de recuperación no es válido o ha expirado.<br />
                    Solicita un nuevo enlace de recuperación.
                </p>
                <Link href="/forgot-password">
                    <button className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black italic text-sm hover:bg-slate-800 transition-colors">
                        Solicitar nuevo enlace
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {success ? (
                /* ── Pantalla de éxito ── */
                <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                        className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100"
                    >
                        <CheckCircle className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">¡Contraseña Actualizada!</h2>
                    <p className="text-slate-500 font-medium mb-1">
                        Tu contraseña fue restablecida de forma exitosa.
                    </p>
                    <p className="text-slate-400 text-sm mb-8">
                        Ya puedes iniciar sesión con tu nueva contraseña.
                    </p>
                    <Link href="/login">
                        <button className="w-full py-5 rounded-2xl bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white font-black italic text-sm hover:opacity-90 transition-opacity shadow-lg">
                            Ir al Login
                        </button>
                    </Link>
                </motion.div>
            ) : (
                /* ── Formulario ── */
                <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Header */}
                    <div className="flex flex-col items-center mb-7">
                        <Link href="/">
                            <div className="p-3 bg-slate-100 rounded-full mb-4 hover:bg-white transition-colors cursor-pointer group">
                                <Logo className="w-12 h-12 group-hover:scale-105 transition-transform" />
                            </div>
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center">
                            Nueva Contraseña
                        </h1>
                        {/* Badge de rol */}
                        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold ${roleInfo.color}`}>
                            <span>{roleInfo.emoji}</span>
                            {roleInfo.label}
                        </div>
                        <p className="text-slate-400 text-sm mt-3 text-center">
                            Elige una contraseña segura para tu cuenta.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nueva contraseña */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Nueva contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-alteha-violet/30 focus:border-alteha-violet transition-all placeholder:text-slate-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Indicador de fortaleza */}
                            {newPassword && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                    <PasswordStrength password={newPassword} />
                                </motion.div>
                            )}
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full pl-10 pr-12 py-3.5 bg-slate-50 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-slate-300 ${
                                        confirmPass && !passwordsMatch
                                            ? 'border-red-300 focus:ring-red-200 text-red-600'
                                            : confirmPass && passwordsMatch
                                            ? 'border-emerald-300 focus:ring-emerald-200 text-slate-800'
                                            : 'border-slate-200 focus:ring-alteha-violet/30 focus:border-alteha-violet text-slate-800'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <AnimatePresence>
                                {confirmPass && !passwordsMatch && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-xs font-bold text-red-500"
                                    >
                                        Las contraseñas no coinciden
                                    </motion.p>
                                )}
                                {confirmPass && passwordsMatch && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-xs font-bold text-emerald-600"
                                    >
                                        ✓ Las contraseñas coinciden
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Error del backend */}
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

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={!canSubmit || loading}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black italic text-sm transition-all ${
                                canSubmit && !loading
                                    ? 'bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white hover:opacity-90 shadow-lg shadow-alteha-violet/20'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Cambiar Contraseña
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function ResetPasswordFinishPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-outfit">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-alteha-turquoise/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50"
            >
                <Suspense fallback={<div className="text-center py-10 text-slate-400 font-medium">Cargando...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </motion.div>
        </div>
    );
}
