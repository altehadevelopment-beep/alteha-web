"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    User,
    Mail,
    Phone,
    FileText,
    Upload,
    Check,
    CheckCircle,
    X,
    AlertCircle,
    ArrowRight,
    Loader2,
    Shield, // Icon for Insurance
    Users,  // Icon for Additional Users
    Trash2,
    Plus,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { PuzzleCaptcha } from '@/components/ui/PuzzleCaptcha';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';

import {
    sendSmsToken,
    verifySmsToken,
    sendEmailToken,
    verifyEmailToken
} from '@/lib/api';

// --- Constants ---
const IDENTIFICATION_TYPES = [
    { id: 'RIF', label: 'RIF' },
    // Add others if needed
];

// --- Interfaces ---
interface AdditionalUser {
    email: string;
    phone: string;
    permisoIds: number[];
}

interface FormData {
    // Company Data
    email: string;
    phone: string;
    commercialName: string;
    legalName: string;
    identificationType: string;
    identificationNumber: string;
    insuranceLicenseNumber: string;
    website: string;

    // Contact Person (Main User)
    contactPersonName: string;
    password: string;
    confirmPassword: string;

    // Additional Users
    hasAdditionalUsers: boolean;
    additionalUsers: AdditionalUser[];
}

export default function InsuranceRegistrationPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // Form State
    const [formData, setFormData] = useState<FormData>({
        email: '',
        phone: '',
        commercialName: '',
        legalName: '',
        identificationType: 'RIF',
        identificationNumber: '',
        insuranceLicenseNumber: '',
        website: '',
        contactPersonName: '',
        password: '',
        confirmPassword: '',
        hasAdditionalUsers: false,
        additionalUsers: []
    });

    // Verification State
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [emailToken, setEmailToken] = useState('');
    const [phoneToken, setPhoneToken] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [smsSent, setSmsSent] = useState(false);

    // Countdown and resend attempts
    const [emailCountdown, setEmailCountdown] = useState(0);
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [emailResendAttempts, setEmailResendAttempts] = useState(0);
    const [smsResendAttempts, setSmsResendAttempts] = useState(0);
    const MAX_RESEND_ATTEMPTS = 3;
    const COUNTDOWN_SECONDS = 150; // 2:30 minutes

    // File State
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [rifFile, setRifFile] = useState<File | null>(null);
    const [mercantileFile, setMercantileFile] = useState<File | null>(null);

    // Previews
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Helpers
    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const updateAdditionalUser = (index: number, field: keyof AdditionalUser, value: any) => {
        const newUsers = [...formData.additionalUsers];
        newUsers[index] = { ...newUsers[index], [field]: value };
        setFormData(prev => ({ ...prev, additionalUsers: newUsers }));
    };

    const addAdditionalUser = () => {
        setFormData(prev => ({
            ...prev,
            additionalUsers: [...prev.additionalUsers, { email: '', phone: '', permisoIds: [1, 4, 5] }]
        }));
    };

    const removeAdditionalUser = (index: number) => {
        const newUsers = formData.additionalUsers.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, additionalUsers: newUsers }));
    };

    // Validation Logic
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone: string) => /^\d{10,15}$/.test(phone);

    const canProceedStep1 = formData.commercialName && formData.legalName && formData.identificationType && formData.identificationNumber && formData.insuranceLicenseNumber;
    const canProceedStep2 = formData.contactPersonName && emailVerified && phoneVerified;

    // Password Validation Logic
    const passwordChecks = {
        minLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        passwordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
    };

    const isPasswordValid = passwordChecks.minLength &&
        passwordChecks.hasUppercase &&
        passwordChecks.hasLowercase &&
        passwordChecks.hasNumber &&
        passwordChecks.hasSpecial &&
        passwordChecks.passwordsMatch;

    const canProceedStep3 = isPasswordValid;
    // Step 4 (Additional Users) is always valid to proceed (optional)
    const canProceedStep4 = true;
    const canProceedStep5 = logoFile && rifFile && mercantileFile;

    // Steps Configuration
    const steps = [
        { num: 1, title: 'Empresa' },
        { num: 2, title: 'Contacto' },
        { num: 3, title: 'Contraseña' },
        { num: 4, title: 'Usuarios' },
        { num: 5, title: 'Documentos' }
    ];

    // File Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'rif' | 'mercantile') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'logo') {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else if (type === 'rif') {
            setRifFile(file);
        } else if (type === 'mercantile') {
            setMercantileFile(file);
        }
    };

    // Email Countdown Timer
    useEffect(() => {
        if (emailCountdown > 0) {
            const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [emailCountdown]);

    // SMS Countdown Timer
    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Email Verification Logic
    const handleSendEmailToken = async (isResend: boolean = false) => {
        if (!formData.email) return;
        if (isResend && emailResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Has alcanzado el límite de intentos de reenvío. Por favor inténtalo más tarde.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await sendEmailToken(formData.email, 'INSURANCE_COMPANY'); // Using INSURANCE_COMPANY role
            if (result.code === '00') {
                setEmailSent(true);
                setEmailCountdown(COUNTDOWN_SECONDS);
                if (isResend) {
                    setEmailResendAttempts(prev => prev + 1);
                }
                toast.success('Código enviado a su correo');
            } else if (result.code === 'AUTH_002') {
                setError('Este correo electrónico ya está registrado.');
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
            const result = await verifyEmailToken(formData.email, emailToken, 'INSURANCE_COMPANY');
            if (result.code === '00' && result.data === true) {
                setEmailVerified(true);
                setError('');
                toast.success('Correo verificado exitosamente');
            } else {
                setError('Código incorrecto o expirado.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoading(false);
    };

    // SMS Verification Logic
    const handleSendSmsToken = async (isResend: boolean = false) => {
        if (!formData.phone) return;
        if (isResend && smsResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Has alcanzado el límite de intentos de reenvío. Por favor inténtalo más tarde.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await sendSmsToken(formData.phone, 'INSURANCE_COMPANY'); // Using INSURANCE_COMPANY role
            if (result.code === '00') {
                setSmsSent(true);
                setSmsCountdown(COUNTDOWN_SECONDS);
                if (isResend) {
                    setSmsResendAttempts(prev => prev + 1);
                }
                toast.success('Código SMS enviado');
            } else if (result.code === 'AUTH_003') {
                setError('Este número de teléfono ya está registrado.');
            } else if (result.code === 'VAL_001') {
                setError('El formato del teléfono no es válido.');
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
            const result = await verifySmsToken(formData.phone, phoneToken, 'INSURANCE_COMPANY');
            if (result.code === '00' && result.data === true) {
                setPhoneVerified(true);
                setError('');
                toast.success('Teléfono verificado exitosamente');
            } else {
                setError('Código incorrecto o expirado.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoading(false);
    };

    // Submit Handler
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            const submissionData = new FormData();

            // Construct JSON payload
            const registrationPayload = {
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                commercialName: formData.commercialName,
                legalName: formData.legalName,
                identificationType: formData.identificationType,
                identificationNumber: formData.identificationNumber,
                insuranceLicenseNumber: formData.insuranceLicenseNumber,
                contactPersonName: formData.contactPersonName,
                // Only include additional users if toggle is on
                additionalUsers: formData.hasAdditionalUsers ? formData.additionalUsers : []
            };

            // Append JSON as string
            submissionData.append('registration', new Blob([JSON.stringify(registrationPayload)], { type: 'application/json' }));

            if (isVerified) {
                submissionData.append('captchaToken', 'human');
            }

            // Append Files
            if (rifFile) submissionData.append('rifFile', rifFile);
            if (mercantileFile) submissionData.append('mercantileRegistryFile', mercantileFile);
            if (logoFile) submissionData.append('logoFile', logoFile);

            // API Call - Updated to use external-internal proxy
            const response = await fetch('/api/actor-register/insurance', {
                method: 'POST',
                body: submissionData
            });

            const data = await response.json();

            if (!response.ok || (data.code !== '00' && data.code !== 200)) {
                throw new Error(data.message || 'Error en el registro');
            }

            toast.success('¡Registro exitoso!');
            setStep(6); // Success step

        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Ocurrió un error inesperado');
            toast.error(err.message || 'Error en el registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-outfit">
            {/* Background Gradients - Matching Specialist Style */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
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
                        <Logo className="w-16 h-16 mx-auto mb-4" />
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Registro de Aseguradora</h1>
                        <p className="text-slate-500 mt-2">Únete a la red de salud digital</p>
                    </div>
                )}

                {/* Progress Steps */}
                {step < 6 && (
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {steps.map((s) => (
                            <div key={s.num} className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === s.num ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                                    step > s.num ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                                </div>
                                {s.num < steps.length && <div className={`w-8 h-1 rounded-full ${step > s.num ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
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
                    {/* Step 1: Company Data */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Datos de la Aseguradora</h2>
                                    <p className="text-sm text-slate-500">Información legal y administrativa</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <Input
                                        label="Nombre Comercial"
                                        placeholder="Ej. Seguros La Previsora"
                                        value={formData.commercialName}
                                        onChange={(e) => updateFormData('commercialName', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Razón Social"
                                        placeholder="Ej. C.A. Seguros La Previsora"
                                        value={formData.legalName}
                                        onChange={(e) => updateFormData('legalName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Select
                                        label="Tipo ID"
                                        options={IDENTIFICATION_TYPES}
                                        value={formData.identificationType}
                                        onChange={(val) => updateFormData('identificationType', val)}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Número de Identificación (RIF)"
                                        placeholder="J-12345678-9"
                                        value={formData.identificationNumber}
                                        onChange={(e) => updateFormData('identificationNumber', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Licencia de Seguro"
                                        placeholder="Número de licencia"
                                        value={formData.insuranceLicenseNumber}
                                        onChange={(e) => updateFormData('insuranceLicenseNumber', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Sitio Web (Opcional)"
                                        placeholder="https://..."
                                        value={formData.website}
                                        onChange={(e) => updateFormData('website', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedStep1}
                                    className="bg-slate-900 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    Siguiente <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Contact Person & Verification */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Contacto Principal</h2>
                                    <p className="text-sm text-slate-500">Administrador de la cuenta</p>
                                </div>
                            </div>

                            <Input
                                label="Nombre del Contacto"
                                placeholder="Nombre y Apellido"
                                value={formData.contactPersonName}
                                onChange={(e) => updateFormData('contactPersonName', e.target.value)}
                                icon={User}
                            />

                            {/* Email Verification Component */}
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
                                            placeholder="empresa@aseguradora.com"
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
                                                className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600"
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
                                                            Reenviar en <span className="font-bold text-blue-500">{formatCountdown(emailCountdown)}</span>
                                                        </p>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendEmailToken(true)}
                                                            disabled={loading || emailResendAttempts >= MAX_RESEND_ATTEMPTS}
                                                            className={`text-sm font-bold transition-colors ${emailResendAttempts >= MAX_RESEND_ATTEMPTS
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-blue-500 hover:underline'
                                                                }`}
                                                        >
                                                            Reenviar código
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Phone Verification Component */}
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
                                            placeholder="58412..."
                                            disabled={smsSent}
                                        />
                                        {formData.phone && !isValidPhone(formData.phone) && (
                                            <p className="text-red-500 text-xs font-medium -mt-2">Ingresa un número válido</p>
                                        )}

                                        {!smsSent ? (
                                            <Button
                                                onClick={() => handleSendSmsToken(false)}
                                                disabled={loading || !formData.phone || !isValidPhone(formData.phone)}
                                                className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600"
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
                                                            Reenviar en <span className="font-bold text-emerald-500">{formatCountdown(smsCountdown)}</span>
                                                        </p>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendSmsToken(true)}
                                                            disabled={loading || smsResendAttempts >= MAX_RESEND_ATTEMPTS}
                                                            className={`text-sm font-bold transition-colors ${smsResendAttempts >= MAX_RESEND_ATTEMPTS
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-emerald-500 hover:underline'
                                                                }`}
                                                        >
                                                            Reenviar SMS
                                                        </button>
                                                    )}
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
                                    Siguiente <ArrowRight className="w-5 h-5" />
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
                                    <p className="text-sm text-slate-500">Protege tu cuenta con una contraseña segura</p>
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
                                    Siguiente <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Additional Users */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Usuarios Adicionales</h2>
                                    <p className="text-sm text-slate-500">Opcional: Agregue más usuarios a la cuenta</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                        checked={formData.hasAdditionalUsers}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            updateFormData('hasAdditionalUsers', isChecked);
                                            if (isChecked && formData.additionalUsers.length === 0) {
                                                addAdditionalUser();
                                            }
                                        }}
                                    />
                                    <span className="font-bold text-slate-700">¿Desea registrar usuarios adicionales?</span>
                                </label>
                            </div>

                            {formData.hasAdditionalUsers && (
                                <div className="space-y-4">
                                    {formData.additionalUsers.map((user, index) => (
                                        <div key={index} className="p-4 border border-slate-200 rounded-xl bg-white space-y-4 relative">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-slate-600">Usuario #{index + 1}</h4>
                                                {formData.additionalUsers.length > 1 && (
                                                    <button onClick={() => removeAdditionalUser(index)} className="text-red-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Correo Electrónico"
                                                    type="email"
                                                    value={user.email}
                                                    onChange={(e) => updateAdditionalUser(index, 'email', e.target.value)}
                                                    placeholder="usuario@aseguradora.com"
                                                />
                                                <Input
                                                    label="Teléfono"
                                                    type="tel"
                                                    value={user.phone}
                                                    onChange={(e) => updateAdditionalUser(index, 'phone', e.target.value)}
                                                    placeholder="58412..."
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addAdditionalUser}
                                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Agregar otro usuario
                                    </button>
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
                                    Siguiente <ArrowRight className="w-5 h-5" />
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
                                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Documentación</h2>
                                    <p className="text-sm text-slate-500">Sube los archivos requeridos</p>
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Logo de la Empresa</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-orange-500 transition-colors bg-orange-50/30">
                                    {logoPreview ? (
                                        <div className="space-y-4">
                                            <img src={logoPreview} alt="Preview" className="w-32 h-32 object-contain mx-auto rounded-xl bg-white shadow-sm p-2" />
                                            <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="text-red-500 text-sm font-bold hover:underline">
                                                Eliminar
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                            <label htmlFor="logo-upload" className="cursor-pointer block">
                                                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <p className="text-slate-900 font-bold mb-1">Haz clic para subir el logo</p>
                                                <p className="text-slate-400 text-sm">PNG, JPG, WEBP (Max 5MB)</p>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* RIF Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">RIF Digital</label>
                                    <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 bg-white">
                                        <div className={`p-3 rounded-lg ${rifFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{rifFile ? rifFile.name : 'No seleccionado'}</p>
                                            <p className="text-xs text-slate-400">PDF o Imagen</p>
                                        </div>
                                        <input type="file" id="rif-upload" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileChange(e, 'rif')} />
                                        <label htmlFor="rif-upload" className="cursor-pointer px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                                            {rifFile ? 'Cambiar' : 'Subir'}
                                        </label>
                                    </div>
                                </div>

                                {/* Mercantile Registry Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Registro Mercantil</label>
                                    <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 bg-white">
                                        <div className={`p-3 rounded-lg ${mercantileFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{mercantileFile ? mercantileFile.name : 'No seleccionado'}</p>
                                            <p className="text-xs text-slate-400">PDF o Imagen</p>
                                        </div>
                                        <input type="file" id="mercantile-upload" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileChange(e, 'mercantile')} />
                                        <label htmlFor="mercantile-upload" className="cursor-pointer px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                                            {mercantileFile ? 'Cambiar' : 'Subir'}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-between pt-8">
                                <button onClick={() => setStep(4)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading || !canProceedStep5 || !isVerified}
                                    className="bg-emerald-500 px-8 py-4 rounded-2xl font-black text-white hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Finalizar Registro
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
                                Tu solicitud ha sido recibida. Nos comunicaremos contigo en breve para confirmar la activación de tu cuenta.
                            </p>
                            <Link href="/login?role=insurance">
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
