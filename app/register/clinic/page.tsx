"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from '@/components/ui/Loader';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Mail,
    Phone,
    Lock,
    FileText,
    Stethoscope,
    Upload,
    CheckCircle,
    Shield,
    Camera,
    X,
    MapPin,
    Globe,
    Briefcase
} from 'lucide-react';
import { useLoadScript, GoogleMap, MarkerF, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { PuzzleCaptcha } from '@/components/ui/PuzzleCaptcha';
import {
    sendSmsToken,
    verifySmsToken,
    getSpecialties,
    getServices,
    registerClinic,
    type Specialty,
    type Service,
    sendEmailToken,
    verifyEmailToken
} from '@/lib/api';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function ClinicRegistrationPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Map Reference
    // Map Reference
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        libraries,
    });

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (!place) return;

            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                setFormData(prev => ({
                    ...prev,
                    address: place.formatted_address || prev.address,
                    latitude: lat,
                    longitude: lng
                }));

                // Smart Map Movement
                if (mapRef.current) {
                    if (place.geometry.viewport) {
                        mapRef.current.fitBounds(place.geometry.viewport);
                    } else {
                        mapRef.current.panTo({ lat, lng });
                        mapRef.current.setZoom(17);
                    }
                }
            }
        }
    };

    const handleMapClick = (latLng: google.maps.LatLng) => {
        const lat = latLng.lat();
        const lng = latLng.lng();

        // Update coordinates immediately
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
        }));

        // Reverse Geocoding
        if (!geocoderRef.current) {
            geocoderRef.current = new google.maps.Geocoder();
        }

        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setFormData(prev => ({
                    ...prev,
                    address: results[0].formatted_address
                }));
            }
        });
    };

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        legalName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        identificationType: 'RIF',
        identificationNumber: '',
        website: '',
        healthLicenseNumber: '',
        address: '',
        latitude: 10.4806,
        longitude: -66.9036,
        specialtyIds: [] as number[],
        servicioIds: [] as number[]
    });

    // Verification State
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneToken, setPhoneToken] = useState('');
    const [smsSent, setSmsSent] = useState(false);

    const [emailVerified, setEmailVerified] = useState(false);
    const [emailToken, setEmailToken] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // Countdown and resend attempts
    // Countdown and resend attempts
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [smsResendAttempts, setSmsResendAttempts] = useState(0);
    const [emailCountdown, setEmailCountdown] = useState(0);
    const [emailResendAttempts, setEmailResendAttempts] = useState(0);
    const MAX_RESEND_ATTEMPTS = 3;
    const COUNTDOWN_SECONDS = 150;

    // Lists from API
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // File uploads
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [rifFile, setRifFile] = useState<File | null>(null);
    const [mercantileFile, setMercantileFile] = useState<File | null>(null);

    // Load data on mount
    useEffect(() => {
        loadSpecialties();
        loadServices();
    }, []);

    // SMS countdown timer
    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    // Email countdown timer
    useEffect(() => {
        if (emailCountdown > 0) {
            const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [emailCountdown]);



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

    const loadServices = async () => {
        try {
            const data = await getServices();
            setServices(data);
        } catch (err) {
            console.error('Error loading services:', err);
        }
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Email Verification
    const handleSendEmailToken = async (isResend: boolean = false) => {
        if (!formData.email) return;
        if (isResend && emailResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Has alcanzado el límite de intentos de reenvío.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await sendEmailToken(formData.email, 'CLINIC');
            if (result.code === '00') {
                setEmailSent(true);
                setEmailCountdown(COUNTDOWN_SECONDS);
                if (isResend) {
                    setEmailResendAttempts(prev => prev + 1);
                }
            } else if (result.code === 'AUTH_002') {
                setError('Este correo electrónico ya está registrado.');
            } else {
                setError(result.message || 'Error al enviar el código');
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
            const result = await verifyEmailToken(formData.email, emailToken, 'CLINIC');
            if (result.code === '00' && result.data === true) {
                setEmailVerified(true);
                setError('');
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
            setError('Has alcanzado el límite de intentos de reenvío.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await sendSmsToken(formData.phone, 'CLINIC');
            if (result.code === '00') {
                setSmsSent(true);
                setSmsCountdown(COUNTDOWN_SECONDS);
                if (isResend) {
                    setSmsResendAttempts(prev => prev + 1);
                }
            } else if (result.code === 'AUTH_003') {
                setError('Este número de teléfono ya está registrado.');
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
            const result = await verifySmsToken(formData.phone, phoneToken, 'CLINIC');
            if (result.code === '00' && result.data === true) {
                setPhoneVerified(true);
                setError('');
            } else {
                setError('Código incorrecto. Intenta de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
        setLoading(false);
    };

    // File Handlers
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setRifFile(file);
    };

    const handleMercantileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setMercantileFile(file);
    };

    // Toggle functions
    const toggleSpecialty = (id: number) => {
        setFormData(prev => ({
            ...prev,
            specialtyIds: prev.specialtyIds.includes(id)
                ? prev.specialtyIds.filter(s => s !== id)
                : [...prev.specialtyIds, id]
        }));
    };

    const toggleService = (id: number) => {
        setFormData(prev => ({
            ...prev,
            servicioIds: prev.servicioIds.includes(id)
                ? prev.servicioIds.filter(s => s !== id)
                : [...prev.servicioIds, id]
        }));
    };

    // Error Code Mapping
    const getErrorMessage = (code: string): string => {
        const errorMessages: Record<string, string> = {
            'AUTH_002': 'Este correo electrónico ya está registrado.',
            'AUTH_003': 'Este número de teléfono ya está registrado.',
            'VAL_002': 'Este número de identificación ya está registrado.',
            'VAL_003': 'Este número de licencia ya está registrado.',
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

    // Validation
    const isValidPhone = (phone: string): boolean => /^\d{10,15}$/.test(phone);
    const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
            const result = await registerClinic(
                {
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    name: formData.name,
                    legalName: formData.legalName,
                    identificationType: formData.identificationType as 'CEDULA' | 'PASSPORT' | 'RIF',
                    identificationNumber: formData.identificationNumber,
                    website: formData.website || undefined,
                    healthLicenseNumber: formData.healthLicenseNumber,
                    address: formData.address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    specialtyIds: formData.specialtyIds,
                    servicioIds: formData.servicioIds
                },
                rifFile || undefined,
                mercantileFile || undefined,
                logoFile || undefined,
                isVerified ? 'human' : ''
            );

            if (result.code === '00') {
                setStep(7); // Success step
            } else {
                setError(getErrorMessage(result.code));
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        }
        setLoading(false);
    };

    // Validation Logic
    const isPasswordValid = formData.password.length >= 8 &&
        /[A-Z]/.test(formData.password) &&
        /[a-z]/.test(formData.password) &&
        /[0-9]/.test(formData.password) &&
        /[!@#$%^&*]/.test(formData.password) &&
        formData.password === formData.confirmPassword;

    const canProceedStep1 = formData.address && formData.latitude && formData.longitude;
    const canProceedStep2 = formData.name && formData.legalName && formData.identificationType && formData.identificationNumber && formData.healthLicenseNumber && formData.website !== undefined;
    const canProceedStep3 = phoneVerified && emailVerified;
    const canProceedStep4 = isPasswordValid;
    const canProceedStep5 = formData.specialtyIds.length > 0;
    const canProceedStep6 = logoFile && rifFile && mercantileFile;

    const steps = [
        { num: 1, title: 'Ubicación' },
        { num: 2, title: 'Datos' },
        { num: 3, title: 'Verificación' },
        { num: 4, title: 'Contraseña' },
        { num: 5, title: 'Servicios' },
        { num: 6, title: 'Documentos' }
    ];

    const handleNext = () => {
        if (step === 1 && canProceedStep1) setStep(2);
        else if (step === 2 && canProceedStep2) setStep(3);
        else if (step === 3 && canProceedStep3) setStep(4);
        else if (step === 4 && canProceedStep4) setStep(5);
        else if (step === 5 && canProceedStep5) setStep(6);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-outfit">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-alteha-violet/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-white/50"
            >
                {/* Back Button */}
                <Link href="/" className="absolute top-4 left-4 flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    Inicio
                </Link>

                {/* Header */}
                {step < 7 && (
                    <div className="text-center mb-8 mt-6">
                        <Link href="/">
                            <Logo className="w-14 h-14 mx-auto mb-4 hover:scale-105 transition-transform duration-300" />
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900">Registro de Clínica</h1>
                        <p className="text-slate-500 font-medium">Completa el formulario para registrar tu clínica</p>
                    </div>
                )}

                {/* Progress */}
                {step < 7 && (
                    <div className="flex items-center justify-between mb-8 px-2">
                        {steps.map((s, index) => (
                            <React.Fragment key={s.num}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${step > s.num ? 'bg-emerald-500 text-white' :
                                        step === s.num ? 'bg-blue-500 text-white' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                        {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                                    </div>
                                    <span className={`text-xs mt-1 font-medium ${step >= s.num ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {s.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${step > s.num ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center gap-3"
                    >
                        <X className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {/* Step 2: Clinic Info */}
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
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Información de la Clínica</h2>
                                    <p className="text-sm text-slate-500">Datos básicos de identificación</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Nombre Comercial"
                                    value={formData.name}
                                    onChange={(e) => updateFormData('name', e.target.value.slice(0, 100))}
                                    placeholder="Clínica La Esperanza"
                                    maxLength={100}
                                />
                                <Input
                                    label="Razón Social"
                                    value={formData.legalName}
                                    onChange={(e) => updateFormData('legalName', e.target.value.slice(0, 100))}
                                    placeholder="Clínica La Esperanza C.A."
                                    maxLength={100}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tipo de Documento</label>
                                    <select
                                        className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 outline-none focus:border-blue-500/50 transition-all font-medium text-slate-600"
                                        value={formData.identificationType}
                                        onChange={(e) => updateFormData('identificationType', e.target.value)}
                                    >
                                        <option value="RIF">RIF</option>
                                        <option value="CEDULA">Cédula</option>
                                        <option value="PASSPORT">Pasaporte</option>
                                    </select>
                                </div>
                                <Input
                                    label="Número de Documento"
                                    value={formData.identificationNumber}
                                    onChange={(e) => updateFormData('identificationNumber', e.target.value.slice(0, 20))}
                                    placeholder="J-12345678-9"
                                    maxLength={20}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Número de Licencia Sanitaria"
                                    value={formData.healthLicenseNumber}
                                    onChange={(e) => updateFormData('healthLicenseNumber', e.target.value.slice(0, 30))}
                                    placeholder="LS-123456"
                                    maxLength={30}
                                />
                            </div>



                            <Input
                                label="Sitio Web (Opcional)"
                                value={formData.website}
                                onChange={(e) => updateFormData('website', e.target.value.slice(0, 100))}
                                placeholder="www.clinica.com"
                                maxLength={100}
                            />

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

                    {/* Step 3: Phone Verification */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
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
                                    <p className="text-sm text-slate-500">Valida tu correo y número de teléfono</p>
                                </div>
                            </div>

                            {/* Email Verification Section */}
                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${emailVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Mail className={`w-5 h-5 ${emailVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Correo Electrónico</span>
                                    {emailVerified && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Input
                                                label="Correo Electrónico"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => updateFormData('email', e.target.value.slice(0, 100))}
                                                placeholder="contacto@clinica.com"
                                                maxLength={100}
                                                disabled={emailSent}
                                            />
                                        </div>
                                        {!emailVerified && !emailSent && (
                                            <Button
                                                onClick={() => handleSendEmailToken(false)}
                                                disabled={loading || !formData.email || !isValidEmail(formData.email)}
                                                className="mb-1 h-[50px] px-6 rounded-xl bg-alteha-violet text-white font-bold"
                                            >
                                                {loading ? <Loader size={20} /> : 'Verificar'}
                                            </Button>
                                        )}
                                    </div>

                                    {emailSent && !emailVerified && (
                                        <div className="space-y-3">
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
                                                    {loading ? <Loader size={20} /> : 'Confirmar'}
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                {emailCountdown > 0 ? (
                                                    <p className="text-xs text-slate-400">Reenviar en <span className="font-bold">{formatCountdown(emailCountdown)}</span></p>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSendEmailToken(true)}
                                                        disabled={loading || emailResendAttempts >= MAX_RESEND_ATTEMPTS}
                                                        className="text-xs font-bold text-alteha-violet hover:underline disabled:text-slate-300"
                                                    >
                                                        Reenviar Código
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${phoneVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Phone className={`w-5 h-5 ${phoneVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Teléfono de Contacto</span>
                                    {phoneVerified && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
                                </div>

                                {!phoneVerified && (
                                    <div className="space-y-4">
                                        <Input
                                            label="Teléfono"
                                            value={formData.phone}
                                            onChange={(e) => updateFormData('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
                                            placeholder="584241234567"
                                            disabled={smsSent}
                                            maxLength={15}
                                        />
                                        {formData.phone && !isValidPhone(formData.phone) && (
                                            <p className="text-red-500 text-xs font-medium -mt-2">Ingresa un número válido (10-15 dígitos)</p>
                                        )}

                                        {!smsSent ? (
                                            <Button
                                                onClick={() => handleSendSmsToken(false)}
                                                disabled={loading || !formData.phone || !isValidPhone(formData.phone)}
                                                className="w-full py-4 rounded-xl bg-alteha-violet text-white font-bold"
                                            >
                                                {loading ? <Loader size={20} /> : 'Enviar SMS'}
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
                                                        {loading ? <Loader size={20} /> : 'Verificar'}
                                                    </Button>
                                                </div>

                                                {/* Countdown and Resend */}
                                                <div className="flex items-center justify-between pt-2">
                                                    {smsCountdown > 0 ? (
                                                        <p className="text-sm text-slate-400">
                                                            Puedes reenviar en <span className="font-bold text-alteha-violet">{formatCountdown(smsCountdown)}</span>
                                                        </p>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendSmsToken(true)}
                                                            disabled={loading || smsResendAttempts >= MAX_RESEND_ATTEMPTS}
                                                            className={`text-sm font-bold transition-colors ${smsResendAttempts >= MAX_RESEND_ATTEMPTS
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-alteha-violet hover:underline'
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

                    {/* Step 1: Location with Map */}
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
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Ubicación de la Clínica</h2>
                                    <p className="text-sm text-slate-500">Indica la dirección exacta</p>
                                </div>
                            </div>

                            {/* Map Container with Embedded Search */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                    Defina la Ubicación
                                </label>
                                <div
                                    className="w-full h-[500px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative"
                                    id="clinic-map"
                                >
                                    {isLoaded ? (
                                        <>
                                            {/* Floating Search Bar */}
                                            <div className="absolute top-4 left-4 right-16 z-10 max-w-md">
                                                <Autocomplete
                                                    onLoad={(autocomplete) => {
                                                        autocompleteRef.current = autocomplete;
                                                    }}
                                                    onPlaceChanged={onPlaceChanged}
                                                    fields={["geometry", "formatted_address", "viewport"]}
                                                >
                                                    <div className="relative shadow-lg rounded-xl">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <MapPin className="h-5 w-5 text-slate-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className="block w-full h-12 pl-10 pr-4 rounded-xl border-0 outline-none text-slate-700 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 bg-white/90 backdrop-blur-sm transition-all"
                                                            placeholder="Buscar dirección (ej. Plaza Venezuela)..."
                                                            value={formData.address}
                                                            onChange={(e) => updateFormData('address', e.target.value.slice(0, 200))}
                                                        />
                                                    </div>
                                                </Autocomplete>
                                            </div>

                                            <GoogleMap
                                                mapContainerStyle={{
                                                    width: '100%',
                                                    height: '100%',
                                                    cursor: 'crosshair'
                                                }}
                                                center={{ lat: formData.latitude, lng: formData.longitude }}
                                                zoom={15}
                                                options={{
                                                    styles: [{ featureType: 'poi', stylers: [{ visibility: 'simplified' }] }],
                                                    streetViewControl: false,
                                                    mapTypeControl: false,
                                                }}
                                                onLoad={map => {
                                                    mapRef.current = map;
                                                    geocoderRef.current = new google.maps.Geocoder();
                                                }}
                                                onClick={(e) => {
                                                    if (e.latLng) {
                                                        handleMapClick(e.latLng);
                                                    }
                                                }}
                                            >
                                                <MarkerF
                                                    position={{ lat: formData.latitude, lng: formData.longitude }}
                                                    draggable={true}
                                                    title="Ubicación de la Clínica"
                                                    icon={{
                                                        // Dark Blue Pin with White Cross
                                                        // Path 1: Pin shape
                                                        // Path 2: Medical Cross inside
                                                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><path fill="#1e3a8a" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><path fill="#ffffff" d="M11 7h2v2h2v2h-2v2h-2v-2h-2v-2h2z"/></svg>')}`,
                                                        scaledSize: new window.google.maps.Size(50, 50),
                                                        anchor: new window.google.maps.Point(25, 50) // Anchor at bottom tip
                                                    }}
                                                    onDragEnd={(e) => {
                                                        if (e.latLng) {
                                                            handleMapClick(e.latLng);
                                                        }
                                                    }}
                                                />
                                            </GoogleMap>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <div className="text-center">
                                                <MapPin className="w-12 h-12 mx-auto mb-2" />
                                                <p className="text-sm">Cargando mapa...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4 text-sm text-slate-500">
                                    <p><strong>Latitud:</strong> {formData.latitude.toFixed(6)}</p>
                                    <p><strong>Longitud:</strong> {formData.longitude.toFixed(6)}</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => setStep(2)}
                                    className="bg-slate-900 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    Siguiente <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Password */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
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

                    {/* Step 5: Specialties & Services */}
                    {step === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Especialidades y Servicios</h2>
                                    <p className="text-sm text-slate-500">Servicios que ofrece la clínica</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Especialidades (selecciona al menos una)</label>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl">
                                    {specialties.map((spec) => (
                                        <button
                                            key={spec.id}
                                            onClick={() => toggleSpecialty(spec.id)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${formData.specialtyIds.includes(spec.id)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {spec.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Servicios (opcional)</label>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl">
                                    {services.map((service) => (
                                        <button
                                            key={service.id}
                                            onClick={() => toggleService(service.id)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${formData.servicioIds.includes(service.id)
                                                ? 'bg-alteha-violet text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {service.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(4)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button
                                    onClick={() => setStep(6)}
                                    disabled={!canProceedStep5}
                                    className="bg-slate-900 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    Siguiente <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 6: Documents */}
                    {step === 6 && (
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Documentos</h2>
                                    <p className="text-sm text-slate-500">Sube los documentos requeridos</p>
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Logo de la Clínica</label>
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 ${logoPreview ? 'border-emerald-300' : 'border-slate-200 border-dashed'} flex items-center justify-center bg-slate-50`}>
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="w-8 h-8 text-slate-300" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">Logo de la Clínica</p>
                                        <p className="text-sm text-slate-500">JPG, PNG o WebP. Máximo 5MB.</p>
                                        {logoFile && <p className="text-xs text-emerald-600 font-medium mt-1">✓ {logoFile.name}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* RIF Upload */}
                            <div className={`p-4 border-2 rounded-2xl transition-all ${rifFile ? 'bg-emerald-50 border-emerald-200' : 'border-slate-200 border-dashed'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${rifFile ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-700">RIF de la Clínica</p>
                                        <p className="text-sm text-slate-500">Documento de registro fiscal</p>
                                        {rifFile && <p className="text-xs text-emerald-600 font-medium mt-1">✓ {rifFile.name}</p>}
                                    </div>
                                    <label className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800 transition-all">
                                        <Upload className="w-4 h-4 inline mr-2" />
                                        Subir
                                        <input type="file" accept="image/*,.pdf" onChange={handleRifChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Mercantile Registry Upload */}
                            <div className={`p-4 border-2 rounded-2xl transition-all ${mercantileFile ? 'bg-emerald-50 border-emerald-200' : 'border-slate-200 border-dashed'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${mercantileFile ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-700">Registro Mercantil</p>
                                        <p className="text-sm text-slate-500">Documento de constitución de la empresa</p>
                                        {mercantileFile && <p className="text-xs text-emerald-600 font-medium mt-1">✓ {mercantileFile.name}</p>}
                                    </div>
                                    <label className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800 transition-all">
                                        <Upload className="w-4 h-4 inline mr-2" />
                                        Subir
                                        <input type="file" accept="image/*,.pdf" onChange={handleMercantileChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(5)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canProceedStep6 || loading}
                                    className="bg-blue-500 px-8 py-4 rounded-2xl font-black text-white hover:bg-blue-600 transition-all flex items-center gap-2"
                                >
                                    {loading ? <Loader size={20} /> : 'Finalizar Registro'}
                                </Button>
                            </div>

                            <div className="flex justify-center mt-6">
                                <PuzzleCaptcha onVerify={setIsVerified} />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 7: Success */}
                    {step === 7 && (
                        <motion.div
                            key="step7"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10"
                        >
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">¡Registro Exitoso!</h2>
                            <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                                Tu clínica ha sido registrada correctamente. Recibirás un correo de confirmación una vez que los documentos de tu institución sean verificados por nuestro equipo.
                            </p>
                            <Link href="/login?role=clinic">
                                <Button className="bg-slate-900 px-10 py-5 rounded-2xl font-black text-white hover:bg-slate-800 transition-all">
                                    Ir al Login
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div >


        </div >
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
