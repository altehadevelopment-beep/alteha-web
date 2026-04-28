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
    Check,
    CheckCircle,
    Loader2,
    Send,
    Shield,
    Camera,
    X,
    Search,
    Building
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PuzzleCaptcha } from '@/components/ui/PuzzleCaptcha';
import {
    sendSmsToken,
    verifySmsToken,
    sendEmailToken,
    verifyEmailToken,
    getSpecialties,
    getClinics,
    registerDoctor,
    checkDoctorExists,
    type Specialty,
    type Clinic
} from '@/lib/api';

const IDENTIFICATION_TYPES = [
    { id: 'CEDULA', label: 'Cédula' },
    { id: 'RIF', label: 'RIF' }
];

export default function DoctorRegistrationPage() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingSms, setLoadingSms] = useState(false);
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
        nationality: 'V',
        identificationNumber: '',
        medicalLicenseNumber: '',
        isIndependent: false,
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

    // ID Validation State
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [idError, setIdError] = useState('');

    // Lists from API
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [stateFilter, setStateFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [clinicSearch, setClinicSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // File uploads
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [medicalLicense, setMedicalLicense] = useState<File | null>(null);
    const [medicalLicensePreview, setMedicalLicensePreview] = useState<string | null>(null);

    // Preload State
    const [isPreloading, setIsPreloading] = useState(false);
    const [showPreloadPopup, setShowPreloadPopup] = useState(false);
    const [foundDoctorData, setFoundDoctorData] = useState<any>(null);
    const [isPreloaded, setIsPreloaded] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadSpecialties();
        loadClinics();
    }, []);

    // Automatic Search for Preload
    useEffect(() => {
        if (step !== 1 || !formData.identificationNumber || formData.identificationNumber.length < 6 || idError) return;

        // Skip if we already searched/found this ID to avoid loops
        if (foundDoctorData && foundDoctorData.identificationNumber === formData.identificationNumber) return;

        const timer = setTimeout(() => {
            handlePreloadSearch();
        }, 1200); // 1.2 seconds of inactivity

        return () => clearTimeout(timer);
    }, [formData.identificationNumber, formData.identificationType, step, idError]);

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
            const list = Array.isArray(data) ? data : (data as any).content || [];
            const sortedList = list
                .filter((s: Specialty) => s.isActive)
                .sort((a: Specialty, b: Specialty) => a.name.localeCompare(b.name));
            setSpecialties(sortedList);
        } catch (err) {
            console.error('Error loading specialties:', err);
        }
    };

    const loadClinics = async () => {
        try {
            const data = await getClinics();
            // Handle both flat array and paginated object structure
            const list = Array.isArray(data) ? data : (data as any).content || [];
            
            // Map the list ensuring we have the required fields, even if status is different
            setClinics(list.filter((c: Clinic) => c.name)); 
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
        setLoadingEmail(true);
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
                const rawMsg: string = result.message || '';
                const isDbError = rawMsg.toLowerCase().includes('jdbc') || rawMsg.toLowerCase().includes('unknown column') || rawMsg.toLowerCase().includes('sql');
                setError(isDbError
                    ? 'El servicio de verificación no está disponible temporalmente. Por favor intenta de nuevo en unos minutos o contacta a soporte.'
                    : (rawMsg || 'Error al enviar el código de verificación'));
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoadingEmail(false);
    };

    const handleVerifyEmail = async (manualCode?: string) => {
        const codeToVerify = manualCode || emailToken;
        if (!codeToVerify || codeToVerify.length < 6) return;
        
        setLoadingEmail(true);
        setError('');
        try {
            const result = await verifyEmailToken(formData.email, codeToVerify);
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
        setLoadingEmail(false);
    };

    // SMS Verification
    const handleSendSmsToken = async (isResend: boolean = false) => {
        if (!formData.phone) return;
        if (isResend && smsResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Has alcanzado el límite de intentos de reenvío. Por favor inténtalo más tarde.');
            return;
        }
        setLoadingSms(true);
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
        setLoadingSms(false);
    };

    const handleVerifyPhone = async (manualCode?: string) => {
        const codeToVerify = manualCode || phoneToken;
        if (!codeToVerify || codeToVerify.length < 6) return;
        
        setLoadingSms(true);
        setError('');
        try {
            const result = await verifySmsToken(formData.phone, codeToVerify);
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
        setLoadingSms(false);
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

    // Check if ID exists
    const handleIdentificationCheck = async (value: string) => {
        if (!value || value.length < 5) {
            setIdError('');
            return;
        }

        setIsCheckingId(true);
        setIdError('');

        try {
            const exists = await checkDoctorExists(value);
            if (exists) {
                setIdError('Este documento ya se encuentra registrado');
            }
        } catch (err) {
            console.error('Error checking ID:', err);
        } finally {
            setIsCheckingId(false);
        }
    };

    // Preload Search
    const handlePreloadSearch = async () => {
        if (!formData.identificationType || !formData.identificationNumber) {
            setError('Por favor ingresa el tipo y número de documento');
            return;
        }

        if (isPreloading) return;

        // Check if doctor exists FIRST to prioritize existence error
        setIsCheckingId(true);
        try {
            const exists = await checkDoctorExists(formData.identificationNumber);
            if (exists) {
                setIdError('Este documento ya se encuentra registrado');
                setIsCheckingId(false);
                return; // Prioritize existence
            }
        } catch (err) {
            console.error('Error checking existence before preload:', err);
        } finally {
            setIsCheckingId(false);
        }

        setIsPreloading(true);
        setError('');
        try {
            const response = await fetch(`/api/doctors/preload?identificationType=${formData.identificationType}&identificationNumber=${formData.identificationNumber}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const doctor = data[0];
                setFoundDoctorData(doctor);
                setShowPreloadPopup(true);
            }
            // Si no hay datos en preload, es un registro nuevo — no mostrar error
        } catch (err) {
            console.error('Error in preload search:', err);
            setError('Error al conectar con el servicio de precarga.');
        } finally {
            setIsPreloading(false);
        }
    };

    const fillPreloadData = () => {
        if (!foundDoctorData) return;

        // Map pre-specialties to IDs if available
        const preSpecialtyIds = foundDoctorData.pre_Specialties 
            ? foundDoctorData.pre_Specialties.map((s: any) => s.id) 
            : [];

        setFormData(prev => ({
            ...prev,
            firstName: foundDoctorData.firstName || prev.firstName,
            lastName: foundDoctorData.lastName || prev.lastName,
            // Pre-fill email and phone from preloaded data, but user can correct them
            email: foundDoctorData.email || prev.email,
            phone: foundDoctorData.phone ? foundDoctorData.phone.replace(/\D/g, '') : prev.phone,
            medicalLicenseNumber: foundDoctorData.medicalLicenseNumber || prev.medicalLicenseNumber,
            isIndependent: false,
            specialtyIds: preSpecialtyIds.length > 0 ? preSpecialtyIds : prev.specialtyIds
        }));

        setIsPreloaded(true);
        // Do NOT skip verification — user must confirm or correct email and phone
        setEmailVerified(false);
        setPhoneVerified(false);
        setEmailSent(false);
        setSmsSent(false);
        setStep(2); // Go to verification step
        setShowPreloadPopup(false);
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
                    identificationType: formData.identificationType as 'CEDULA' | 'PASAPORTE' | 'RIF',
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
                setStep(7); // Success step
            } else {
                const backendMsg: string = result.message || '';

                // Translate known technical backend messages to Spanish
                const s3Error = backendMsg.toLowerCase().includes('s3') || backendMsg.toLowerCase().includes('upload');
                const emailDupe = backendMsg.toLowerCase().includes('email') && backendMsg.toLowerCase().includes('exist');
                const phoneDupe = backendMsg.toLowerCase().includes('phone') && backendMsg.toLowerCase().includes('exist');
                const idDupe = backendMsg.toLowerCase().includes('identification') && backendMsg.toLowerCase().includes('exist');

                let finalError: string;
                if (s3Error) {
                    finalError = 'Hubo un problema al subir los archivos (foto/licencia). El servidor de almacenamiento no está disponible en este momento. Por favor intenta de nuevo más tarde o contacta a soporte.';
                } else if (emailDupe) {
                    finalError = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
                } else if (phoneDupe) {
                    finalError = 'Este número de teléfono ya está registrado.';
                } else if (idDupe) {
                    finalError = 'Este número de documento ya está registrado.';
                } else {
                    const mappedMsg = getErrorMessage(result.code);
                    finalError = (backendMsg && mappedMsg === 'Error en el registro. Intenta de nuevo.')
                        ? backendMsg
                        : mappedMsg;
                }
                setError(finalError);
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        }
        setLoading(false);
    };

    const handleNextStep = () => {
        setError('');
        const missingFields: string[] = [];

        if (step === 1) {
            if (!formData.firstName) missingFields.push('Nombre');
            if (!formData.lastName) missingFields.push('Apellido');
            if (!formData.identificationNumber) missingFields.push('Número de Documento');
            if (idError) missingFields.push('Error en ID');
            if (isCheckingId) missingFields.push('Verificación de ID en curso');

            if (missingFields.length > 0) {
                setError(`Por favor completa los campos requeridos: ${missingFields.join(', ')}`);
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!emailVerified) missingFields.push('Verificación de Correo');
            if (!phoneVerified) missingFields.push('Verificación de Teléfono');

            if (missingFields.length > 0) {
                setError(`Faltan verificaciones: ${missingFields.join(', ')}`);
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (!isPasswordValid) {
                setError('La contraseña debe cumplir con todos los criterios de seguridad.');
                return;
            }
            setStep(4);
        } else if (step === 4) {
            if (formData.specialtyIds.length === 0) missingFields.push('Especialidad');
            if (!formData.medicalLicenseNumber) missingFields.push('Número de Licencia Médica');

            if (missingFields.length > 0) {
                setError(`Por favor completa: ${missingFields.join(', ')}`);
                return;
            }
            setStep(5);
        } else if (step === 5) {
            if (!formData.isIndependent && formData.preferredClinicIds.length === 0) {
                setError('Debes ser independiente o seleccionar al menos una clínica.');
                return;
            }
            setStep(6);
        } else if (step === 6) {
            if (!profileImage) missingFields.push('Foto de Perfil');
            if (!medicalLicense) missingFields.push('Título/Licencia Médica');
            if (!termsAccepted) missingFields.push('Aceptar Términos y Condiciones');

            if (missingFields.length > 0) {
                setError(`Faltan requisitos: ${missingFields.join(', ')}`);
                return;
            }
            handleSubmit();
        }
    };

    const canProceedStep1 = formData.firstName && formData.lastName && formData.identificationType && formData.identificationNumber && !idError && !isCheckingId;
    const canProceedStep2 = emailVerified && phoneVerified;
    const canProceedStep3 = isPasswordValid;
    const canProceedStep4 = formData.specialtyIds.length > 0 && formData.medicalLicenseNumber;
    const canProceedStep5 = formData.isIndependent || (formData.preferredClinicIds.length > 0);
    const canProceedStep6 = profileImage !== null && medicalLicense !== null && termsAccepted;

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
                {/* Back/Volver Button */}
                <button 
                    onClick={() => {
                        if (step > 1 && step < 7) {
                            setStep(step - 1);
                            setError(''); // Clear errors when going back
                        } else {
                            router.push('/');
                        }
                    }} 
                    className="absolute top-6 left-6 flex items-center gap-1.5 px-4 py-2 bg-alteha-turquoise/10 hover:bg-alteha-turquoise/20 text-alteha-turquoise border border-alteha-turquoise/20 rounded-xl text-sm font-bold transition-all z-50 shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {step > 1 && step < 7 ? 'Volver' : 'Inicio'}
                </button>

                {/* Header */}
                {step < 7 && (
                    <div className="text-center mb-10 mt-4">
                        <Link href="/">
                            <Logo className="w-20 h-20 mx-auto mb-4 hover:scale-105 transition-transform duration-300" />
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Registro de Talentos Médicos</h1>
                        <p className="text-slate-500 mt-2">Únete al ecosistema ALTEHA</p>
                    </div>
                )}

                {/* Progress Steps */}
                {step < 7 && (
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {[1, 2, 3, 4, 5, 6].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === s ? 'bg-alteha-violet text-white shadow-lg shadow-alteha-violet/30' :
                                    step > s ? 'bg-alteha-turquoise text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                {s < 6 && <div className={`w-8 h-1 rounded-full ${step > s ? 'bg-alteha-turquoise' : 'bg-slate-100'}`} />}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="flex gap-4">
                                    <div className="w-24">
                                        <Select
                                            label="Nac."
                                            alwaysFloat
                                            options={[
                                                { id: 'V', label: 'V' },
                                                { id: 'E', label: 'E' },
                                                { id: 'J', label: 'J' },
                                                { id: 'G', label: 'G' },
                                            ]}
                                            value={formData.nationality || 'V'}
                                            onChange={(val) => updateFormData('nationality', val)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            label="Número de Documento" alwaysFloat
                                            value={formData.identificationNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.slice(0, 20);
                                                updateFormData('identificationNumber', val);
                                                if (idError) setIdError('');
                                            }}
                                            onBlur={(e) => handleIdentificationCheck(e.target.value)}
                                            placeholder="12345678"
                                            maxLength={20}
                                            className={idError ? 'border-red-500' : ''}
                                        />
                                    </div>
                                </div>
                                {(isPreloading || isCheckingId) && (
                                        <div className="absolute right-4 top-[2.4rem]">
                                            <Loader2 className="w-5 h-5 text-alteha-turquoise animate-spin" />
                                        </div>
                                    )}
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

                            {/* ID Error Banner */}
                            {idError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                        <X className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">Documento ya registrado</p>
                                        <p className="text-xs mt-0.5 opacity-80">{idError}. Si ya tienes cuenta, <a href="/login" className="underline font-bold">inicia sesión</a>.</p>
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/')}
                                    className="border-alteha-turquoise text-alteha-turquoise bg-alteha-turquoise/5 hover:bg-alteha-turquoise/10 px-8 rounded-2xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Inicio
                                </Button>
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-alteha-turquoise px-8 py-4 rounded-2xl font-black text-white hover:bg-alteha-turquoise/90 transition-all flex items-center gap-2"
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

                            {isPreloaded && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-blue-50 border border-blue-200 rounded-[2rem] flex items-end gap-4 text-blue-700"
                                >
                                    <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">Datos precargados encontrados</p>
                                        <p className="text-xs opacity-80 mt-1">Hemos pre-rellenado tu correo y teléfono con la información registrada. <span className="font-bold">Si alguno no es correcto, corrígelo antes de enviar el código de verificación.</span></p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Email Verification */}
                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${emailVerified ? 'bg-alteha-turquoise/5 border-alteha-turquoise/40' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Mail className={`w-5 h-5 ${emailVerified ? 'text-alteha-turquoise' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Correo Electrónico</span>
                                    {emailVerified && <CheckCircle className="w-5 h-5 text-alteha-turquoise ml-auto" />}
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
                                                disabled={loadingEmail || !formData.email || !isValidEmail(formData.email)}
                                                className="w-full py-4 rounded-xl bg-alteha-violet text-white font-bold"
                                            >
                                                {loadingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Código'}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-500">Ingresa el código enviado a {formData.email}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <Input
                                                            label="Código"
                                                            value={emailToken}
                                                            onChange={(e) => {
                                                                const val = e.target.value.slice(0, 6);
                                                                setEmailToken(val);
                                                                if (val.length === 6) handleVerifyEmail(val);
                                                            }}
                                                            placeholder="000000"
                                                            maxLength={6}
                                                            disabled={loadingEmail}
                                                        />
                                                        {loadingEmail && (
                                                            <div className="absolute right-4 top-[2.4rem]">
                                                                <Loader2 className="w-5 h-5 text-alteha-turquoise animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>
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
                                                            disabled={loadingEmail || emailResendAttempts >= MAX_RESEND_ATTEMPTS}
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
                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${phoneVerified ? 'bg-alteha-turquoise/5 border-alteha-turquoise/40' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Phone className={`w-5 h-5 ${phoneVerified ? 'text-alteha-turquoise' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Teléfono Celular</span>
                                    {phoneVerified && <CheckCircle className="w-5 h-5 text-alteha-turquoise ml-auto" />}
                                </div>

                                {!phoneVerified && (
                                    <div className="space-y-4">
                                        <Input
                                            label="Teléfono Celular"
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
                                                disabled={loadingSms || !formData.phone || !isValidPhone(formData.phone)}
                                                className="w-full py-4 rounded-xl bg-alteha-turquoise text-white font-bold"
                                            >
                                                {loadingSms ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar SMS'}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-500">Ingresa el código enviado a {formData.phone}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <Input
                                                            label="Código"
                                                            value={phoneToken}
                                                            onChange={(e) => {
                                                                const val = e.target.value.slice(0, 6);
                                                                setPhoneToken(val);
                                                                if (val.length === 6) handleVerifyPhone(val);
                                                            }}
                                                            placeholder="000000"
                                                            maxLength={6}
                                                            disabled={loadingSms}
                                                        />
                                                        {loadingSms && (
                                                            <div className="absolute right-4 top-[2.4rem]">
                                                                <Loader2 className="w-5 h-5 text-alteha-turquoise animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>
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
                                                            disabled={loadingSms || smsResendAttempts >= MAX_RESEND_ATTEMPTS}
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

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => { setStep(1); setError(''); }}
                                    className="border-alteha-turquoise text-alteha-turquoise bg-alteha-turquoise/5 hover:bg-alteha-turquoise/10 px-8 rounded-2xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver
                                </Button>
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-alteha-turquoise px-8 py-4 rounded-2xl font-black text-white hover:bg-alteha-turquoise/90 transition-all flex items-center gap-2"
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
                                <PasswordRequirement met={passwordChecks.minLength} active={formData.password.length > 0} text="Mínimo 8 caracteres" />
                                <PasswordRequirement met={passwordChecks.hasUppercase} active={formData.password.length > 0} text="Al menos una letra mayúscula (A-Z)" />
                                <PasswordRequirement met={passwordChecks.hasLowercase} active={formData.password.length > 0} text="Al menos una letra minúscula (a-z)" />
                                <PasswordRequirement met={passwordChecks.hasNumber} active={formData.password.length > 0} text="Al menos un número (0-9)" />
                                <PasswordRequirement met={passwordChecks.hasSpecial} active={formData.password.length > 0} text="Al menos uno de estos caracteres especiales (!@#$%^&*)" />
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
                                <div className={`flex items-center gap-2 p-3 rounded-xl ${passwordChecks.passwordsMatch ? 'bg-alteha-turquoise/10 text-alteha-turquoise' : 'bg-red-50 text-red-500'}`}>
                                    {passwordChecks.passwordsMatch ? (
                                        <><CheckCircle className="w-4 h-4" /><span className="text-sm font-medium">Las contraseñas coinciden</span></>
                                    ) : (
                                        <><X className="w-4 h-4" /><span className="text-sm font-medium">Las contraseñas no coinciden</span></>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => { setStep(2); setError(''); }}
                                    className="border-alteha-turquoise text-alteha-turquoise bg-alteha-turquoise/5 hover:bg-alteha-turquoise/10 px-8 rounded-2xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver
                                </Button>
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-alteha-turquoise px-8 py-4 rounded-2xl font-black text-white hover:bg-alteha-turquoise/90 transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Specialties */}
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
                                    <h2 className="text-xl font-black text-slate-900">Especialidades</h2>
                                    <p className="text-sm text-slate-500">Credenciales y especialidades médicas</p>
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
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Especialidades (selecciona al menos una)</label>

                                {/* Info banner */}
                                <div className="flex items-start gap-3 p-4 bg-alteha-turquoise/5 border border-alteha-turquoise/20 rounded-2xl">
                                    <div className="w-8 h-8 bg-alteha-turquoise/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                        <Stethoscope className="w-4 h-4 text-alteha-turquoise" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-alteha-turquoise">¿Por qué es importante esta selección?</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                            Las especialidades que elijas aquí determinarán las <span className="font-bold text-slate-700">intervenciones médicas disponibles</span> cuando los pacientes creen una subasta médica. Solo verás y podrás participar en subastas relacionadas con tus especialidades registradas.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                                    {specialties.map((spec) => (
                                        <button
                                            key={spec.id}
                                            type="button"
                                            onClick={() => toggleSpecialty(spec.id)}
                                            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${formData.specialtyIds.includes(spec.id)
                                                ? 'bg-alteha-turquoise text-white shadow-lg shadow-alteha-turquoise/20'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {spec.name}
                                            {formData.specialtyIds.includes(spec.id) && <CheckCircle className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => { setStep(3); setError(''); }}
                                    className="border-alteha-turquoise text-alteha-turquoise bg-alteha-turquoise/5 hover:bg-alteha-turquoise/10 px-8 rounded-2xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver
                                </Button>
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-alteha-turquoise px-8 py-4 rounded-2xl font-black text-white hover:bg-alteha-turquoise/90 transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Clinics */}
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
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Sedes de Ejercicio Profesional</h2>
                                    <p className="text-sm text-slate-500">Centros de salud afiliados</p>
                                </div>
                            </div>

                            <div
                                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.isIndependent ? 'bg-alteha-turquoise/5 border-alteha-turquoise' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                onClick={() => updateFormData('isIndependent', !formData.isIndependent)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isIndependent ? 'bg-alteha-turquoise border-alteha-turquoise' : 'bg-white border-slate-300'}`}>
                                        {formData.isIndependent && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Soy médico independiente</p>
                                        <p className="text-sm text-slate-500 font-medium">No estoy afiliado a una clínica específica</p>
                                    </div>
                                </div>
                            </div>

                            {!formData.isIndependent && (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-4 mb-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Clínicas Preferidas</h3>
                                            <p className="text-[10px] font-bold text-alteha-turquoise bg-alteha-turquoise/10 px-2 py-1 rounded-lg">
                                                {clinics.length} clínicas disponibles
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar clínica por nombre..."
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-100/50 rounded-2xl text-sm font-bold border border-slate-200 outline-none focus:border-alteha-turquoise focus:bg-white transition-all text-ellipsis"
                                                    value={clinicSearch}
                                                    onChange={(e) => setClinicSearch(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                className="w-full bg-slate-100/50 rounded-2xl px-4 py-3 text-sm font-bold border border-slate-200 outline-none focus:border-alteha-turquoise focus:bg-white transition-all text-slate-600"
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                            >
                                                <option value="">Todas las Categorías</option>
                                                {Array.from(new Set(clinics.map(c => c.category).filter(Boolean))).map(cat => (
                                                    <option key={cat} value={cat!}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                className="text-xs bg-slate-100 rounded-lg px-2 py-2 outline-none text-slate-600 font-bold border border-slate-200 focus:border-alteha-turquoise/50"
                                                value={stateFilter}
                                                onChange={(e) => {
                                                    setStateFilter(e.target.value);
                                                    setCityFilter(''); 
                                                }}
                                            >
                                                <option value="">Todos los Estados</option>
                                                {Array.from(new Set(clinics.map(c => c.stateProvinceName).filter(Boolean))).map(state => (
                                                    <option key={state} value={state!}>{state}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="text-xs bg-slate-100 rounded-lg px-2 py-2 outline-none text-slate-600 font-bold border border-slate-200 focus:border-alteha-turquoise/50"
                                                value={cityFilter}
                                                onChange={(e) => setCityFilter(e.target.value)}
                                                disabled={!stateFilter}
                                            >
                                                <option value="">Todas las Ciudades</option>
                                                {Array.from(new Set(clinics.filter(c => c.stateProvinceName === stateFilter).map(c => c.cityName).filter(Boolean))).map(city => (
                                                    <option key={city} value={city!}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50/50 rounded-2xl border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                                        {clinics
                                            .filter(clinic => {
                                                const matchesState = !stateFilter || clinic.stateProvinceName === stateFilter;
                                                const matchesCity = !cityFilter || clinic.cityName === cityFilter;
                                                const matchesSearch = !clinicSearch || clinic.name.toLowerCase().includes(clinicSearch.toLowerCase());
                                                const matchesCategory = !categoryFilter || clinic.category === categoryFilter;
                                                return matchesState && matchesCity && matchesSearch && matchesCategory;
                                            })
                                            .map((clinic) => (
                                                <button
                                                    key={clinic.id}
                                                    onClick={() => toggleClinic(clinic.id)}
                                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${formData.preferredClinicIds.includes(clinic.id)
                                                        ? 'bg-alteha-violet text-white shadow-md shadow-alteha-violet/20'
                                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
                                                        }`}
                                                >
                                                    {clinic.name}
                                                    <span className="text-[10px] opacity-50 font-normal">
                                                        {clinic.cityName ? `(${clinic.cityName})` : ''}
                                                    </span>
                                                </button>
                                            ))}
                                        {clinics.filter(clinic => {
                                            const matchesState = !stateFilter || clinic.stateProvinceName === stateFilter;
                                            const matchesCity = !cityFilter || clinic.cityName === cityFilter;
                                            const matchesSearch = !clinicSearch || clinic.name.toLowerCase().includes(clinicSearch.toLowerCase());
                                            const matchesCategory = !categoryFilter || clinic.category === categoryFilter;
                                            return matchesState && matchesCity && matchesSearch && matchesCategory;
                                        }).length === 0 && (
                                                <p className="text-sm text-slate-400 p-4 text-center w-full italic">No se encontraron clínicas con estos filtros.</p>
                                            )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => { setStep(4); setError(''); }}
                                    className="border-alteha-turquoise text-alteha-turquoise bg-alteha-turquoise/5 hover:bg-alteha-turquoise/10 px-8 rounded-2xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver
                                </Button>
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-alteha-turquoise px-8 py-4 rounded-2xl font-black text-white hover:bg-alteha-turquoise/90 transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 6: Documents & Terms */}
                    {step === 6 && (
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-alteha-turquoise/10 rounded-3xl text-alteha-turquoise shadow-sm">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">Verificación Final</h2>
                                    <p className="text-sm text-slate-500 font-medium">Sube tus credenciales y acepta los términos</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {/* Profile Photo Card */}
                                <div className={`relative group p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${profileImage ? 'bg-alteha-turquoise/5/50 border-alteha-turquoise/40 shadow-lg shadow-alteha-turquoise/5' : 'bg-white border-slate-100 hover:border-alteha-turquoise/30 shadow-sm'}`}>
                                    <div className="flex items-center gap-5 transition-transform group-hover:translate-x-1 duration-300">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${profileImage ? 'bg-alteha-turquoise text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-alteha-turquoise/10 group-hover:text-alteha-turquoise'}`}>
                                            {profileImage ? <CheckCircle className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-900">Foto de Perfil Profesional</h3>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Obligatorio para el perfil</p>
                                        </div>
                                        <label className="cursor-pointer">
                                            <div className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:scale-105 transition-all shadow-md active:scale-95">
                                                {profileImage ? 'Cambiar Foto' : 'Subir Foto'}
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageChange} />
                                        </label>
                                    </div>
                                    {profileImage && (
                                        <div className="mt-4 p-3 bg-white/50 rounded-2xl flex items-center gap-3 border border-alteha-turquoise/20 animate-in fade-in slide-in-from-top-1 duration-500">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                                                {profileImagePreview && <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="text-sm font-bold text-alteha-turquoise truncate">{profileImage.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Medical License Card */}
                                <div className={`relative group p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${medicalLicense ? 'bg-indigo-50/50 border-indigo-200 shadow-lg shadow-indigo-500/5' : 'bg-white border-slate-100 hover:border-alteha-violet/30 shadow-sm'}`}>
                                    <div className="flex items-center gap-5 transition-transform group-hover:translate-x-1 duration-300">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${medicalLicense ? 'bg-alteha-violet text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-alteha-violet/10 group-hover:text-alteha-violet'}`}>
                                            {medicalLicense ? <CheckCircle className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-900">Licencia Médica / RIF</h3>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Verificación de especialidad</p>
                                        </div>
                                        <label className="cursor-pointer">
                                            <div className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:scale-105 transition-all shadow-md active:scale-95">
                                                {medicalLicense ? 'Cambiar Archivo' : 'Subir Archivo'}
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleMedicalLicenseChange} />
                                        </label>
                                    </div>
                                    {medicalLicense && (
                                        <div className="mt-4 p-3 bg-white/50 rounded-2xl flex items-center gap-3 border border-indigo-100 animate-in fade-in slide-in-from-top-1 duration-500">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600 truncate">{medicalLicense.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Terms & Conditions Section */}
                                <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                    <div className="flex items-end gap-4">
                                        <label className="relative flex items-center cursor-pointer mt-1">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                            />
                                            <div className="w-7 h-7 border-2 border-slate-200 rounded-lg bg-white peer-checked:bg-alteha-turquoise peer-checked:border-alteha-turquoise transition-all flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </label>
                                        <div className="flex-1">
                                            <p className="text-slate-700 font-bold leading-relaxed">
                                                Confirmo que la información proporcionada es verídica y acepto los 
                                                <button 
                                                    onClick={() => setShowTermsModal(true)}
                                                    className="ml-1 text-alteha-turquoise hover:underline decoration-2 underline-offset-4 font-black"
                                                >
                                                    Términos y Condiciones
                                                </button> de ALTEHA.
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-2 font-medium">Digital Signature ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6">
                                {/* Puzzle Captcha Section with Shake Animation */}
                                <motion.div 
                                    animate={error === 'Por favor desliza para verificar' ? { 
                                        x: [-1, 10, -10, 10, -10, 0],
                                        rotate: [0, 1, -1, 1, -1, 0]
                                    } : {}}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className={`p-6 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
                                        error === 'Por favor desliza para verificar' 
                                        ? 'border-red-400 bg-red-50/50 shadow-xl shadow-red-500/10' 
                                        : 'border-slate-100 bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className={`w-5 h-5 ${error === 'Por favor desliza para verificar' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                                        <span className={`text-xs font-black uppercase tracking-widest ${error === 'Por favor desliza para verificar' ? 'text-red-500' : 'text-slate-400'}`}>
                                            Verificación Requerida
                                        </span>
                                    </div>
                                    <PuzzleCaptcha onVerify={setIsVerified} />
                                </motion.div>

                                {/* Action Buttons Below Captcha */}
                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                                    <Button 
                                        variant="outline"
                                        onClick={() => { setStep(5); setError(''); }} 
                                        className="border-alteha-turquoise text-alteha-turquoise bg-alteha-turquoise/5 hover:bg-alteha-turquoise/10 px-8 rounded-2xl"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Volver
                                    </Button>
                                    <Button
                                        onClick={handleNextStep}
                                        isLoading={loading}
                                        className="bg-alteha-turquoise px-10 py-4 rounded-2xl font-black text-white hover:bg-alteha-turquoise/90 transition-all flex items-center gap-3 shadow-xl shadow-alteha-turquoise/20 disabled:opacity-50 disabled:grayscale disabled:shadow-none active:scale-95 overflow-hidden group relative flex-1 max-w-[280px]"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <span className="relative z-10 text-lg">Finalizar Registro</span>
                                                <ArrowRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 7: Success */}
                    {step === 7 && (
                        <motion.div
                            key="step7"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="text-center py-6 px-4"
                        >
                            {/* Welcoming Doctor Illustration (SVG) */}
                            <div className="relative w-72 h-72 mx-auto mb-8 animate-in fade-in zoom-in duration-1000">
                                <div className="absolute inset-0 bg-alteha-turquoise/5 rounded-full scale-110 blur-3xl animate-pulse" />
                                <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 drop-shadow-2xl translate-y-2">
                                    {/* Skin / Body */}
                                    <circle cx="100" cy="55" r="35" fill="#FFDBAC" className="animate-bounce-subtle" />
                                    <path d="M40,200 L40,140 C40,110 60,95 100,95 C140,95 160,110 160,140 L160,200" fill="#E2E8F0" />
                                    {/* White Coat */}
                                    <path d="M100,95 C120,95 145,100 160,130 L160,200 L120,200 L100,120 L80,200 L40,200 L40,130 C55,100 80,95 100,95" fill="white" />
                                    {/* Open Arms */}
                                    <motion.path 
                                        d="M40,135 Q10,120 15,90" 
                                        fill="none" stroke="#FFDBAC" strokeWidth="14" strokeLinecap="round"
                                        animate={{ rotate: [-2, 5, -2] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <motion.path 
                                        d="M160,135 Q190,120 185,90" 
                                        fill="none" stroke="#FFDBAC" strokeWidth="14" strokeLinecap="round"
                                        animate={{ rotate: [2, -5, 2] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    {/* Stethoscope */}
                                    <path d="M75,95 Q100,140 125,95" fill="none" stroke="#475569" strokeWidth="4" />
                                    <circle cx="100" cy="130" r="8" fill="#94A3B8" />
                                    {/* Face Details */}
                                    <circle cx="88" cy="50" r="3" fill="#334155" />
                                    <circle cx="112" cy="50" r="3" fill="#334155" />
                                    <path d="M85,65 Q100,80 115,65" fill="none" stroke="#EB5E28" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                {/* Decorative Hearts/Confetti */}
                                <div className="absolute top-0 right-10 text-alteha-turquoise animate-bounce"><CheckCircle className="w-8 h-8" /></div>
                                <div className="absolute bottom-10 left-0 text-alteha-violet animate-pulse"><Stethoscope className="w-10 h-10" /></div>
                            </div>

                            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">¡Bienvenido a ALTEHA, Dr. {formData.firstName}!</h2>
                            
                            {/* Boost Profile Section */}
                            <div className="max-w-md mx-auto mb-10 p-6 bg-gradient-to-br from-alteha-turquoise/5 to-alteha-violet/5 rounded-[3rem] border border-white shadow-xl shadow-slate-200/50">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                                            {profileImagePreview ? (
                                                <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-12 h-12 text-slate-300 m-6" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-alteha-turquoise text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                    
                                    <div className="text-center px-2">
                                        <h3 className="text-xl font-black text-slate-900 mb-2">¡Impulsa tu Perfil Médico!</h3>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                            Completa tu verificación y onboarding para obtener <span className="text-alteha-turquoise font-black">mayores beneficios</span>, prioridad en subastas y el sello de verificado en la plataforma ALTEHA.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link href="/login?role=specialist">
                                <Button className="bg-slate-900 px-12 py-5 rounded-[2.5rem] font-black text-white hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/40 active:scale-95 group">
                                    <span>Iniciar Sesión</span>
                                    <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-2" />
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Preload Data Modal */}
            <Modal
                isOpen={showPreloadPopup}
                onClose={() => setShowPreloadPopup(false)}
                title="Información Encontrada"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-alteha-turquoise/5 rounded-2xl border border-alteha-turquoise/20">
                        <div className="w-12 h-12 bg-alteha-turquoise text-white rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900">¡Médico localizado!</p>
                            <p className="text-sm text-slate-600">Hemos encontrado información asociada a este documento.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</p>
                            <p className="font-bold text-slate-900">{foundDoctorData?.firstName} {foundDoctorData?.lastName}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Identificación</p>
                            <p className="font-bold text-slate-900">
                                {foundDoctorData?.identificationType === 'CEDULA' ? 'V-' : foundDoctorData?.identificationType === 'RIF' ? 'J-' : ''}
                                {foundDoctorData?.identificationNumber}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correo</p>
                            <p className="font-bold text-slate-900 truncate">{foundDoctorData?.email || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono Celular</p>
                            <p className="font-bold text-slate-900">{foundDoctorData?.phone || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={fillPreloadData}
                            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20"
                        >
                            Usar esta información
                        </Button>
                        <button
                            onClick={() => setShowPreloadPopup(false)}
                            className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Ingresar datos manualmente
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Terms and Conditions Modal */}
            <Modal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                title="Términos y Condiciones ALTEHA"
            >
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="flex items-center gap-3 p-4 bg-alteha-turquoise/5 rounded-2xl border border-alteha-turquoise/20">
                        <Shield className="w-6 h-6 text-alteha-turquoise" />
                        <p className="text-sm font-black text-slate-900">Documento Generado Profesional - Versión 2026.1</p>
                    </div>

                    <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                        <section>
                            <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">1. Objeto del Servicio</h4>
                            <p>ALTEHA proporciona una plataforma integral para la gestión de salud digital, conectando especialistas médicos con pacientes y centros de salud de manera eficiente y segura.</p>
                        </section>

                        <section>
                            <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">2. Verificación de Credenciales</h4>
                            <p>Al registrarse como médico, usted autoriza a ALTEHA a verificar sus licencias, títulos y especialidades ante las autoridades competentes. El acceso a la plataforma está sujeto a la aprobación exitosa de esta verificación.</p>
                        </section>

                        <section>
                            <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">3. Protección de Datos (GDPR)</h4>
                            <p>Sus datos personales y los de sus pacientes están protegidos bajo los más altos estándares de seguridad (Cifrado AES-256). ALTEHA no comparte información sensible con terceros sin consentimiento explícito.</p>
                        </section>

                        <section>
                            <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">4. Responsabilidad Profesional</h4>
                            <p>El médico mantiene la total responsabilidad sobre sus diagnósticos y tratamientos. ALTEHA es una herramienta de apoyo y facilitación, no un servicio de consulta médica directa.</p>
                        </section>

                        <section>
                            <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">5. Uso de la Identidad Digital</h4>
                            <p>La cuenta es personal e intransferible. El uso indebido de las credenciales de acceso puede resultar en la suspensión definitiva de los servicios de la plataforma.</p>
                        </section>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <Button 
                            onClick={() => {
                                setTermsAccepted(true);
                                setShowTermsModal(false);
                            }}
                            className="w-full py-4 bg-alteha-turquoise text-white font-black rounded-2xl"
                        >
                            He leído y acepto los términos
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Helper component for password requirements
function PasswordRequirement({ met, active = false, text }: { met: boolean; active?: boolean; text: string }) {
    const color = met
        ? 'text-alteha-turquoise'
        : active
            ? 'text-red-500'
            : 'text-slate-400';
    return (
        <div className={`flex items-center gap-2 transition-all duration-300 ${color}`}>
            {met ? (
                <CheckCircle className="w-4 h-4" />
            ) : active ? (
                <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
            ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
            )}
            <span className={`text-sm font-medium transition-all duration-300 ${color}`}>{text}</span>
        </div>
    );
}
