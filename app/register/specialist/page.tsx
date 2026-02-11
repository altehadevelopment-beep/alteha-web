"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    User,
    Mail,
    Phone,
    Lock,
    FileText,
    Building2,
    Stethoscope,
    Upload,
    CheckCircle,
    Loader2,
    Send,
    Shield,
    Camera,
    X
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { PuzzleCaptcha } from '@/components/ui/PuzzleCaptcha';
import {
    sendSmsToken,
    verifySmsToken,
    sendEmailToken,
    verifyEmailToken,
    getSpecialties,
    getClinics,
    registerDoctor,
    type Specialty,
    type Clinic
} from '@/lib/api';

export default function DoctorRegistrationPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        identificationType: 'CEDULA',
        identificationNumber: '',
        medicalLicenseNumber: '',
        isIndependent: true,
        specialtyIds: [] as number[],
        preferredClinicIds: [] as number[]
    });

    // Verification State
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [emailToken, setEmailToken] = useState('');
    const [phoneToken, setPhoneToken] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [smsSent, setSmsSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // Countdown and resend attempts
    const [emailCountdown, setEmailCountdown] = useState(0);
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [emailResendAttempts, setEmailResendAttempts] = useState(0);
    const [smsResendAttempts, setSmsResendAttempts] = useState(0);
    const MAX_RESEND_ATTEMPTS = 3;
    const COUNTDOWN_SECONDS = 150; // 2:30 minutes

    // Lists from API
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);

    // File uploads
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [medicalLicense, setMedicalLicense] = useState<File | null>(null);
    const [medicalLicensePreview, setMedicalLicensePreview] = useState<string | null>(null);

    // Load data on mount
    useEffect(() => {
        loadSpecialties();
        loadClinics();
    }, []);

    // Email countdown timer
    useEffect(() => {
        if (emailCountdown > 0) {
            const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [emailCountdown]);

    // SMS countdown timer
    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    // Format countdown to MM:SS
    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const loadSpecialties = async () => {
        try {
            const data = await getSpecialties();
            setSpecialties(data.filter((s: Specialty) => s.isActive));
        } catch (err) {
            console.error('Error loading specialties:', err);
        }
    };

    const loadClinics = async () => {
        try {
            const data = await getClinics();
            setClinics(data.filter((c: Clinic) => c.status === 'ACTIVE' || c.status === 'PENDING'));
        } catch (err) {
            console.error('Error loading clinics:', err);
        }
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Email Verification
    const handleSendEmailToken = async (isResend: boolean = false) => {
        if (!formData.email) return;
        if (isResend && emailResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Has alcanzado el límite de intentos de reenvío. Por favor inténtalo más tarde.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await sendEmailToken(formData.email);
            if (result.code === '00') {
                setEmailSent(true);
                setEmailCountdown(COUNTDOWN_SECONDS);
                if (isResend) {
                    setEmailResendAttempts(prev => prev + 1);
                }
            } else if (result.code === 'AUTH_002') {
                setError('Este correo electrónico ya está registrado. Por favor inicia sesión.');
            } else if (result.code === 'VAL_001') {
                setError('El formato del correo electrónico no es válido.');
            } else {
                setError(result.message || 'Error al enviar el código de verificación');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoading(false);
    };

    const handleVerifyEmail = async () => {
        if (!emailToken) return;
        setLoading(true);
        setError('');
        try {
            const result = await verifyEmailToken(formData.email, emailToken);
            if (result.code === '00' && result.data === true) {
                setEmailVerified(true);
                setError('');
            } else if (result.code === 'VAL_001') {
                setError('El código es inválido o ha expirado. Solicita uno nuevo.');
            } else {
                setError('Código incorrecto. Intenta de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoading(false);
    };

    // SMS Verification
    const handleSendSmsToken = async (isResend: boolean = false) => {
        if (!formData.phone) return;
        if (isResend && smsResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Has alcanzado el límite de intentos de reenvío. Por favor inténtalo más tarde.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await sendSmsToken(formData.phone);
            if (result.code === '00') {
                setSmsSent(true);
                setSmsCountdown(COUNTDOWN_SECONDS);
                if (isResend) {
                    setSmsResendAttempts(prev => prev + 1);
                }
            } else if (result.code === 'AUTH_003') {
                setError('Este número de teléfono ya está registrado.');
            } else if (result.code === 'VAL_001') {
                setError('El formato del teléfono no es válido. Usa formato internacional (ej: 584241234567)');
            } else {
                setError(result.message || 'Error al enviar el SMS');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoading(false);
    };

    const handleVerifyPhone = async () => {
        if (!phoneToken) return;
        setLoading(true);
        setError('');
        try {
            const result = await verifySmsToken(formData.phone, phoneToken);
            if (result.code === '00' && result.data === true) {
                setPhoneVerified(true);
                setError('');
            } else if (result.code === 'VAL_001') {
                setError('El código es inválido o ha expirado. Solicita uno nuevo.');
            } else {
                setError('Código incorrecto. Intenta de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoading(false);
    };

    // File Handlers
    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleMedicalLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMedicalLicense(file);
            setMedicalLicensePreview(URL.createObjectURL(file));
        }
    };

    // Toggle selections
    const toggleSpecialty = (id: number) => {
        setFormData(prev => ({
            ...prev,
            specialtyIds: prev.specialtyIds.includes(id)
                ? prev.specialtyIds.filter(s => s !== id)
                : [...prev.specialtyIds, id]
        }));
    };

    const toggleClinic = (id: number) => {
        setFormData(prev => ({
            ...prev,
            preferredClinicIds: prev.preferredClinicIds.includes(id)
                ? prev.preferredClinicIds.filter(c => c !== id)
                : [...prev.preferredClinicIds, id]
        }));
    };

    // Error Code Mapping
    const getErrorMessage = (code: string): string => {
        const errorMessages: Record<string, string> = {
            'AUTH_001': 'No tienes autorización para realizar esta acción.',
            'AUTH_002': 'Este correo electrónico ya está registrado. Intenta iniciar sesión.',
            'AUTH_003': 'Este número de teléfono ya está registrado.',
            'VAL_001': 'El código de verificación es inválido o ha expirado.',
            'VAL_002': 'Este número de identificación ya está registrado.',
            'VAL_003': 'Este número de licencia médica ya está registrado.',
            'VAL_004': 'Error de validación. Verifica los datos ingresados.',
            'ERROR': 'Error de conexión con el servidor.'
        };
        return errorMessages[code] || 'Error en el registro. Intenta de nuevo.';
    };

    // Password Validation
    const passwordChecks = {
        minLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        passwordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    // Email Validation
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Phone Validation (numbers only, 10-15 digits for international format)
    const isValidPhone = (phone: string): boolean => {
        const phoneRegex = /^\d{10,15}$/;
        return phoneRegex.test(phone);
    };

    // Submit Registration
    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        if (!isVerified) {
            setError('Por favor desliza para verificar');
            setLoading(false);
            return;
        }

        try {
            const result = await registerDoctor(
                {
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    identificationType: formData.identificationType as 'CEDULA' | 'PASSPORT' | 'RIF',
                    identificationNumber: formData.identificationNumber,
                    medicalLicenseNumber: formData.medicalLicenseNumber,
                    isIndependent: formData.isIndependent,
                    specialtyIds: formData.specialtyIds,
                    preferredClinicIds: formData.preferredClinicIds,
                    status: 'PENDING'
                },
                profileImage || undefined,
                medicalLicense || undefined,
                isVerified ? 'human' : ''
            );

            if (result.code === '00') {
                setStep(6); // Success step
            } else {
                setError(getErrorMessage(result.code));
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        }
        setLoading(false);
    };

    const canProceedStep1 = formData.firstName && formData.lastName && formData.identificationType && formData.identificationNumber;
    const canProceedStep2 = emailVerified && phoneVerified;
    const canProceedStep3 = isPasswordValid;
    const canProceedStep4 = formData.specialtyIds.length > 0 && formData.medicalLicenseNumber;
    const canProceedStep5 = profileImage && medicalLicense;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-outfit">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-alteha-turquoise/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl p-10 border border-white/50"
            >
                {/* Inicio Button */}
                <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    Inicio
                </Link>

                {/* Header */}
                {step < 6 && (
                    <div className="text-center mb-10 mt-4">
                        <Link href="/">
                            <Logo className="w-16 h-16 mx-auto mb-4 hover:scale-105 transition-transform duration-300" />
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Registro de Médico</h1>
                        <p className="text-slate-500 mt-2">Únete al ecosistema ALTEHA</p>
                    </div>
                )}

                {/* Progress Steps */}
                {step < 6 && (
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === s ? 'bg-alteha-violet text-white shadow-lg shadow-alteha-violet/30' :
                                    step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                {s < 5 && <div className={`w-8 h-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3"
                    >
                        <X className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-alteha-turquoise/10 rounded-2xl text-alteha-turquoise">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Información Personal</h2>
                                    <p className="text-sm text-slate-500">Datos básicos de identificación</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Nombre"
                                    value={formData.firstName}
                                    onChange={(e) => updateFormData('firstName', e.target.value.slice(0, 50))}
                                    placeholder="Juan"
                                    maxLength={50}
                                />
                                <Input
                                    label="Apellido"
                                    value={formData.lastName}
                                    onChange={(e) => updateFormData('lastName', e.target.value.slice(0, 50))}
                                    placeholder="Pérez"
                                    maxLength={50}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tipo de Documento</label>
                                    <select
                                        className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 outline-none focus:border-alteha-turquoise/50 transition-all font-medium text-slate-600"
                                        value={formData.identificationType}
                                        onChange={(e) => updateFormData('identificationType', e.target.value)}
                                    >
                                        <option value="CEDULA">Cédula</option>
                                        <option value="PASSPORT">Pasaporte</option>
                                        <option value="RIF">RIF</option>
                                    </select>
                                </div>
                                <Input
                                    label="Número de Documento"
                                    value={formData.identificationNumber}
                                    onChange={(e) => updateFormData('identificationNumber', e.target.value.slice(0, 20))}
                                    placeholder="12345678"
                                    maxLength={20}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedStep1}
                                    className="bg-slate-900 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Verification */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-alteha-violet/10 rounded-2xl text-alteha-violet">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Verificación de Contacto</h2>
                                    <p className="text-sm text-slate-500">Valida tu correo y teléfono</p>
                                </div>
                            </div>

                            {/* Email Verification */}
                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${emailVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Mail className={`w-5 h-5 ${emailVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Correo Electrónico</span>
                                    {emailVerified && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
                                </div>

                                {!emailVerified && (
                                    <div className="space-y-4">
                                        <Input
                                            label="Email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateFormData('email', e.target.value.slice(0, 100))}
                                            placeholder="doctor@ejemplo.com"
                                            disabled={emailSent}
                                            maxLength={100}
                                        />
                                        {formData.email && !isValidEmail(formData.email) && (
                                            <p className="text-red-500 text-xs font-medium -mt-2">Ingresa un correo electrónico válido</p>
                                        )}

                                        {!emailSent ? (
                                            <Button
                                                onClick={() => handleSendEmailToken(false)}
                                                disabled={loading || !formData.email || !isValidEmail(formData.email)}
                                                className="w-full py-4 rounded-xl bg-alteha-violet text-white font-bold"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Código'}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-500">Ingresa el código enviado a {formData.email}</p>
                                                <div className="flex gap-3">
                                                    <Input
                                                        label="Código"
                                                        value={emailToken}
                                                        onChange={(e) => setEmailToken(e.target.value.slice(0, 6))}
                                                        placeholder="000000"
                                                        maxLength={6}
                                                    />
                                                    <Button
                                                        onClick={handleVerifyEmail}
                                                        disabled={loading || !emailToken || emailToken.length < 6}
                                                        className="px-6 py-4 rounded-xl bg-emerald-500 text-white font-bold"
                                                    >
                                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar'}
                                                    </Button>
                                                </div>

                                                {/* Countdown and Resend */}
                                                <div className="flex items-center justify-between pt-2">
                                                    {emailCountdown > 0 ? (
                                                        <p className="text-sm text-slate-400">
                                                            Puedes reenviar en <span className="font-bold text-alteha-violet">{formatCountdown(emailCountdown)}</span>
                                                        </p>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendEmailToken(true)}
                                                            disabled={loading || emailResendAttempts >= MAX_RESEND_ATTEMPTS}
                                                            className={`text-sm font-bold transition-colors ${emailResendAttempts >= MAX_RESEND_ATTEMPTS
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-alteha-violet hover:underline'
                                                                }`}
                                                        >
                                                            Reenviar código
                                                        </button>
                                                    )}
                                                    <p className="text-xs text-slate-400">
                                                        Intentos: {emailResendAttempts}/{MAX_RESEND_ATTEMPTS}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Phone Verification */}
                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${phoneVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Phone className={`w-5 h-5 ${phoneVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Teléfono</span>
                                    {phoneVerified && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
                                </div>

                                {!phoneVerified && (
                                    <div className="space-y-4">
                                        <Input
                                            label="Teléfono"
                                            value={formData.phone}
                                            onChange={(e) => updateFormData('phone', e.target.value.replace(/\D/g, ''))}
                                            placeholder="584241234567"
                                            disabled={smsSent}
                                        />
                                        {formData.phone && !isValidPhone(formData.phone) && (
                                            <p className="text-red-500 text-xs font-medium -mt-2">Ingresa un número válido (10-15 dígitos, solo números)</p>
                                        )}

                                        {!smsSent ? (
                                            <Button
                                                onClick={() => handleSendSmsToken(false)}
                                                disabled={loading || !formData.phone || !isValidPhone(formData.phone)}
                                                className="w-full py-4 rounded-xl bg-alteha-turquoise text-white font-bold"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar SMS'}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-500">Ingresa el código enviado a {formData.phone}</p>
                                                <div className="flex gap-3">
                                                    <Input
                                                        label="Código"
                                                        value={phoneToken}
                                                        onChange={(e) => setPhoneToken(e.target.value.slice(0, 6))}
                                                        placeholder="000000"
                                                        maxLength={6}
                                                    />
                                                    <Button
                                                        onClick={handleVerifyPhone}
                                                        disabled={loading || !phoneToken || phoneToken.length < 6}
                                                        className="px-6 py-4 rounded-xl bg-emerald-500 text-white font-bold"
                                                    >
                                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar'}
                                                    </Button>
                                                </div>

                                                {/* Countdown and Resend */}
                                                <div className="flex items-center justify-between pt-2">
                                                    {smsCountdown > 0 ? (
                                                        <p className="text-sm text-slate-400">
                                                            Puedes reenviar en <span className="font-bold text-alteha-turquoise">{formatCountdown(smsCountdown)}</span>
                                                        </p>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendSmsToken(true)}
                                                            disabled={loading || smsResendAttempts >= MAX_RESEND_ATTEMPTS}
                                                            className={`text-sm font-bold transition-colors ${smsResendAttempts >= MAX_RESEND_ATTEMPTS
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-alteha-turquoise hover:underline'
                                                                }`}
                                                        >
                                                            Reenviar SMS
                                                        </button>
                                                    )}
                                                    <p className="text-xs text-slate-400">
                                                        Intentos: {smsResendAttempts}/{MAX_RESEND_ATTEMPTS}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!canProceedStep2}
                                    className="bg-slate-900 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Password */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Crear Contraseña</h2>
                                    <p className="text-sm text-slate-500">Debe ser alfanumérica con caracteres especiales</p>
                                </div>
                            </div>

                            <Input
                                label="Contraseña"
                                type="password"
                                value={formData.password}
                                onChange={(e) => updateFormData('password', e.target.value.slice(0, 50))}
                                placeholder="••••••••"
                                maxLength={50}
                            />

                            {/* Password Requirements */}
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Requisitos de Contraseña</p>
                                <PasswordRequirement met={passwordChecks.minLength} text="Mínimo 8 caracteres" />
                                <PasswordRequirement met={passwordChecks.hasUppercase} text="Al menos una letra mayúscula (A-Z)" />
                                <PasswordRequirement met={passwordChecks.hasLowercase} text="Al menos una letra minúscula (a-z)" />
                                <PasswordRequirement met={passwordChecks.hasNumber} text="Al menos un número (0-9)" />
                                <PasswordRequirement met={passwordChecks.hasSpecial} text="Al menos un carácter especial (!@#$%^&*)" />
                            </div>

                            <Input
                                label="Confirmar Contraseña"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => updateFormData('confirmPassword', e.target.value.slice(0, 50))}
                                placeholder="••••••••"
                                maxLength={50}
                            />

                            {formData.confirmPassword && (
                                <div className={`flex items-center gap-2 p-3 rounded-xl ${passwordChecks.passwordsMatch ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                    {passwordChecks.passwordsMatch ? (
                                        <><CheckCircle className="w-4 h-4" /><span className="text-sm font-medium">Las contraseñas coinciden</span></>
                                    ) : (
                                        <><X className="w-4 h-4" /><span className="text-sm font-medium">Las contraseñas no coinciden</span></>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(2)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button
                                    onClick={() => setStep(4)}
                                    disabled={!canProceedStep3}
                                    className="bg-slate-900 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Professional Info */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-alteha-turquoise/10 rounded-2xl text-alteha-turquoise">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Información Profesional</h2>
                                    <p className="text-sm text-slate-500">Especialidades y credenciales</p>
                                </div>
                            </div>

                            <Input
                                label="Número de Licencia Médica"
                                value={formData.medicalLicenseNumber}
                                onChange={(e) => updateFormData('medicalLicenseNumber', e.target.value.slice(0, 30))}
                                placeholder="Ej: 112233"
                                maxLength={30}
                            />

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Especialidades (selecciona al menos una)</label>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2">
                                    {specialties.map((spec) => (
                                        <button
                                            key={spec.id}
                                            onClick={() => toggleSpecialty(spec.id)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${formData.specialtyIds.includes(spec.id)
                                                ? 'bg-alteha-turquoise text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {spec.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <label className="flex items-center gap-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-alteha-turquoise"
                                        checked={formData.isIndependent}
                                        onChange={(e) => updateFormData('isIndependent', e.target.checked)}
                                    />
                                    <div>
                                        <p className="font-bold text-slate-900">Soy médico independiente</p>
                                        <p className="text-sm text-slate-500">No estoy afiliado a una clínica específica</p>
                                    </div>
                                </label>
                            </div>

                            {!formData.isIndependent && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Clínicas Preferidas</label>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2">
                                        {clinics.map((clinic) => (
                                            <button
                                                key={clinic.id}
                                                onClick={() => toggleClinic(clinic.id)}
                                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${formData.preferredClinicIds.includes(clinic.id)
                                                    ? 'bg-alteha-violet text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {clinic.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(3)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button
                                    onClick={() => setStep(5)}
                                    disabled={!canProceedStep4}
                                    className="bg-slate-900 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Documents */}
                    {step === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-alteha-violet/10 rounded-2xl text-alteha-violet">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Documentos</h2>
                                    <p className="text-sm text-slate-500">Sube tu foto y licencia médica</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Profile Image */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Foto de Perfil</label>
                                    <label className="block cursor-pointer">
                                        <div className={`relative h-48 rounded-[2rem] border-2 border-dashed transition-all flex items-center justify-center overflow-hidden ${profileImagePreview ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-alteha-turquoise'
                                            }`}>
                                            {profileImagePreview ? (
                                                <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-6">
                                                    <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">Haz clic para subir</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                                    </label>
                                </div>

                                {/* Medical License */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Licencia Médica</label>
                                    <label className="block cursor-pointer">
                                        <div className={`relative h-48 rounded-[2rem] border-2 border-dashed transition-all flex items-center justify-center overflow-hidden ${medicalLicensePreview ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-alteha-violet'
                                            }`}>
                                            {medicalLicensePreview ? (
                                                <img src={medicalLicensePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-6">
                                                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">Haz clic para subir</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleMedicalLicenseChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(4)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading || !canProceedStep5 || !isVerified}
                                    className="bg-alteha-turquoise px-10 py-5 rounded-2xl font-black text-white hover:bg-teal-500 transition-all flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Registrarme
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="flex justify-center mt-6">
                                <PuzzleCaptcha onVerify={setIsVerified} />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 6: Success */}
                    {step === 6 && (
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10"
                        >
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">¡Registro Exitoso!</h2>
                            <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                                Tu cuenta ha sido creada correctamente. Recibirás un correo de confirmación una vez que tu perfil profesional sea verificado por nuestro equipo.
                            </p>
                            <Link href="/login?role=specialist">
                                <Button className="bg-slate-900 px-10 py-5 rounded-2xl font-black text-white hover:bg-slate-800 transition-all">
                                    Ir al Login
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-2 transition-all ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
            {met ? (
                <CheckCircle className="w-4 h-4" />
            ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
            )}
            <span className={`text-sm font-medium ${met ? 'text-emerald-600' : 'text-slate-500'}`}>{text}</span>
        </div>
    );
}
