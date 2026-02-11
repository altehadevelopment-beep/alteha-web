"use client";

import React, { useState, useEffect, useRef } from 'react';
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
    Upload,
    CheckCircle,
    Shield,
    X,
    MapPin,
    Globe,
    Building,
    AlertCircle
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
    sendEmailToken,
    verifyEmailToken,
    registerPharmacy,
    type PharmacyRegistration
} from '@/lib/api';
import { toast } from 'sonner';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

const PHARMACY_TYPES = [
    { id: 'RETAIL', label: 'Comercial / Detal' },
    { id: 'HOSPITAL', label: 'Hospitalaria' },
    { id: 'CHAIN', label: 'Cadena' }
];

export default function PharmacyRegistrationPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Map Configuration
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        libraries,
    });

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    // Form Data
    const [formData, setFormData] = useState<PharmacyRegistration & { confirmPassword: string }>({
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        name: '',
        legalName: '',
        pharmacyLicenseNumber: '',
        pharmacyType: 'RETAIL',
        identificationType: 'RIF',
        identificationNumber: '',
        address: '',
        latitude: 10.4806,
        longitude: -66.9036,
        website: ''
    });

    // States for verification
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneToken, setPhoneToken] = useState('');
    const [smsSent, setSmsSent] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailToken, setEmailToken] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // Countdown timers
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [emailCountdown, setEmailCountdown] = useState(0);
    const [smsResendAttempts, setSmsResendAttempts] = useState(0);
    const [emailResendAttempts, setEmailResendAttempts] = useState(0);
    const MAX_RESEND_ATTEMPTS = 3;
    const COUNTDOWN_SECONDS = 150;

    // Files
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [rifFile, setRifFile] = useState<File | null>(null);
    const [mercantileFile, setMercantileFile] = useState<File | null>(null);
    const [sanitaryFile, setSanitaryFile] = useState<File | null>(null);

    // Timer Effects
    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    useEffect(() => {
        if (emailCountdown > 0) {
            const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [emailCountdown]);

    // Helpers
    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Map Handlers
    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (!place || !place.geometry || !place.geometry.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setFormData(prev => ({
                ...prev,
                address: place.formatted_address || prev.address,
                latitude: lat,
                longitude: lng
            }));

            if (mapRef.current) {
                if (place.geometry.viewport) {
                    mapRef.current.fitBounds(place.geometry.viewport);
                } else {
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(17);
                }
            }
        }
    };

    const handleMapClick = (latLng: google.maps.LatLng) => {
        const lat = latLng.lat();
        const lng = latLng.lng();

        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

        if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
            }
        });
    };

    // Verification Handlers
    const handleSendEmailToken = async (isResend: boolean = false) => {
        if (!formData.email) return;
        if (isResend && emailResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Límite de reenvíos alcanzado.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await sendEmailToken(formData.email, 'PHARMACY');
            if (result.code === '00') {
                setEmailSent(true);
                setEmailCountdown(COUNTDOWN_SECONDS);
                if (isResend) setEmailResendAttempts(prev => prev + 1);
                toast.success('Código enviado al correo');
            } else {
                setError(result.message || 'Error al enviar código');
            }
        } catch (err) {
            setError('Error de conexión');
        }
        setLoading(false);
    };

    const handleVerifyEmail = async () => {
        if (!emailToken) return;
        setLoading(true);
        try {
            const result = await verifyEmailToken(formData.email, emailToken, 'PHARMACY');
            if (result.code === '00' && result.data === true) {
                setEmailVerified(true);
                toast.success('Correo verificado');
            } else {
                setError('Código incorrecto');
            }
        } catch (err) {
            setError('Error de conexión');
        }
        setLoading(false);
    };

    const handleSendSmsToken = async (isResend: boolean = false) => {
        if (!formData.phone) return;
        if (isResend && smsResendAttempts >= MAX_RESEND_ATTEMPTS) {
            setError('Límite de reenvíos alcanzado.');
            return;
        }
        setLoading(true);
        try {
            const result = await sendSmsToken(formData.phone, 'PHARMACY');
            if (result.code === '00') {
                setSmsSent(true);
                setSmsCountdown(COUNTDOWN_SECONDS);
                if (isResend) setSmsResendAttempts(prev => prev + 1);
                toast.success('SMS enviado');
            } else {
                setError(result.message || 'Error al enviar SMS');
            }
        } catch (err) {
            setError('Error de conexión');
        }
        setLoading(false);
    };

    const handleVerifyPhone = async () => {
        if (!phoneToken) return;
        setLoading(true);
        try {
            const result = await verifySmsToken(formData.phone, phoneToken, 'PHARMACY');
            if (result.code === '00' && result.data === true) {
                setPhoneVerified(true);
                toast.success('Teléfono verificado');
            } else {
                setError('Código incorrecto');
            }
        } catch (err) {
            setError('Error de conexión');
        }
        setLoading(false);
    };

    // File Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'rif' | 'mercantile' | 'sanitary') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'logo') {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else if (type === 'rif') setRifFile(file);
        else if (type === 'mercantile') setMercantileFile(file);
        else if (type === 'sanitary') setSanitaryFile(file);
    };

    // Password Validation
    const passwordChecks = {
        minLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecial: /[!@#$%^&*]/.test(formData.password),
        match: formData.password === formData.confirmPassword && formData.password.length > 0
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    // Step Validation
    const canProceedStep1 = formData.address && formData.latitude && formData.longitude;
    const canProceedStep2 = formData.name && formData.legalName && formData.pharmacyLicenseNumber && formData.identificationNumber;
    const canProceedStep3 = emailVerified && phoneVerified;
    const canProceedStep4 = isPasswordValid;
    const canProceedStep5 = rifFile && mercantileFile && sanitaryFile && logoFile;

    // Submit
    const handleSubmit = async () => {
        if (!isVerified) {
            setError('Por favor realiza la verificación de seguridad');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { confirmPassword, ...registrationData } = formData;
            const result = await registerPharmacy(
                registrationData,
                rifFile!,
                mercantileFile!,
                sanitaryFile!,
                logoFile!,
                'human'
            );

            if (result.code === '00') {
                setStep(6);
                toast.success('¡Registro exitoso!');
            } else {
                setError(result.message || 'Error en el registro');
            }
        } catch (err) {
            setError('Error de conexión al procesar el registro');
        }
        setLoading(false);
    };

    const steps = [
        { num: 1, title: 'Ubicación' },
        { num: 2, title: 'Datos' },
        { num: 3, title: 'Verificación' },
        { num: 4, title: 'Contraseña' },
        { num: 5, title: 'Documentos' }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-outfit">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/50"
            >
                {/* Header */}
                <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all">
                    <ArrowLeft className="w-4 h-4" /> Inicio
                </Link>

                {step < 6 && (
                    <div className="text-center mb-8">
                        <Logo className="w-14 h-14 mx-auto mb-4" />
                        <h1 className="text-2xl font-black text-slate-900">Registro de Farmacia</h1>
                        <p className="text-slate-500 text-sm">Únete a nuestra red de proveedores</p>
                    </div>
                )}

                {/* Progress */}
                {step < 6 && (
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {steps.map((s) => (
                            <div key={s.num} className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === s.num ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' :
                                    step > s.num ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                                </div>
                                {s.num < steps.length && <div className={`w-8 h-1 rounded-full ${step > s.num ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
                            </div>
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* Step 1: Location */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><MapPin className="w-6 h-6" /></div>
                                <div><h2 className="text-xl font-bold text-slate-900">Ubicación</h2><p className="text-sm text-slate-500">¿Dónde se encuentra tu farmacia?</p></div>
                            </div>

                            {isLoaded ? (
                                <div className="space-y-4">
                                    <Autocomplete onLoad={ref => autocompleteRef.current = ref} onPlaceChanged={onPlaceChanged}>
                                        <div className="relative">
                                            <input type="text" placeholder="Busca la dirección..." className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium" defaultValue={formData.address} />
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        </div>
                                    </Autocomplete>
                                    <div className="h-[300px] rounded-2.5xl overflow-hidden shadow-inner border border-slate-100">
                                        <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={{ lat: formData.latitude, lng: formData.longitude }} zoom={15} onClick={(e) => e.latLng && handleMapClick(e.latLng)} onLoad={map => { mapRef.current = map; }} options={{ disableDefaultUI: true, zoomControl: true }}>
                                            <MarkerF
                                                position={{ lat: formData.latitude, lng: formData.longitude }}
                                                draggable={true}
                                                onDragEnd={(e) => {
                                                    const latLng = e.latLng;
                                                    if (latLng) handleMapClick(latLng);
                                                }}
                                            />
                                        </GoogleMap>
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">Puedes mover el marcador o hacer clic en el mapa para ajustar la ubicación exacta.</p>
                                </div>
                            ) : <div className="h-[300px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center"><Loader /></div>}

                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="bg-slate-900 px-10 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2">Siguiente <ArrowRight className="w-5 h-5" /></Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Data */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Building2 className="w-6 h-6" /></div>
                                <div><h2 className="text-xl font-bold text-slate-900">Datos de la Empresa</h2><p className="text-sm text-slate-500">Información legal y operativa</p></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2"><Input label="Nombre de la Farmacia" placeholder="Ej. Farmacia El Valle" value={formData.name} onChange={e => updateFormData('name', e.target.value)} /></div>
                                <div className="col-span-2"><Input label="Razón Social" placeholder="Ej. Farmacia El Valle C.A." value={formData.legalName} onChange={e => updateFormData('legalName', e.target.value)} /></div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tipo de Farmacia</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium text-slate-600" value={formData.pharmacyType} onChange={e => updateFormData('pharmacyType', e.target.value)}>
                                        {PHARMACY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                                <Input label="Licencia Farmacéutica" placeholder="Nro de licencia" value={formData.pharmacyLicenseNumber} onChange={e => updateFormData('pharmacyLicenseNumber', e.target.value)} />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tipo Identificación</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium text-slate-600" value={formData.identificationType} onChange={e => updateFormData('identificationType', e.target.value)}>
                                        <option value="RIF">RIF</option>
                                        <option value="CEDULA">Cédula</option>
                                    </select>
                                </div>
                                <Input label="Número Identificación" placeholder="J-12345678-0" value={formData.identificationNumber} onChange={e => updateFormData('identificationNumber', e.target.value)} />
                                <div className="col-span-2"><Input label="Sitio Web (Opcional)" placeholder="https://..." value={formData.website} onChange={e => updateFormData('website', e.target.value)} icon={Globe} /></div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">Volver</button>
                                <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="bg-slate-900 px-10 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2">Siguiente <ArrowRight className="w-5 h-5" /></Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Verification */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Shield className="w-6 h-6" /></div>
                                <div><h2 className="text-xl font-bold text-slate-900">Verificación</h2><p className="text-sm text-slate-500">Valida tus medios de contacto</p></div>
                            </div>

                            {/* Error Alert */}
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium"><AlertCircle className="w-5 h-5" /> {error}</div>}

                            {/* Email Section */}
                            <div className={`p-6 rounded-3xl border-2 transition-all ${emailVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Mail className={`w-5 h-5 ${emailVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Correo Electrónico</span>
                                    {emailVerified && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
                                </div>
                                {!emailVerified && (
                                    <div className="space-y-4">
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1"><Input label="Email" type="email" value={formData.email} onChange={e => updateFormData('email', e.target.value)} placeholder="contacto@farmacia.com" disabled={emailSent} /></div>
                                            {!emailSent && <Button onClick={() => handleSendEmailToken()} disabled={loading || !formData.email} className="mb-1 h-[54px] px-6 rounded-2xl bg-indigo-600 text-white font-bold">{loading ? <Loader size={20} /> : 'Enviar'}</Button>}
                                        </div>
                                        {emailSent && (
                                            <div className="space-y-4 pt-2">
                                                <div className="flex gap-2">
                                                    <Input label="Código" value={emailToken} onChange={e => setEmailToken(e.target.value.slice(0, 6))} placeholder="000000" maxLength={6} />
                                                    <Button onClick={handleVerifyEmail} disabled={loading || emailToken.length < 6} className="h-[54px] mt-7 px-6 rounded-2xl bg-emerald-500 text-white font-bold">{loading ? <Loader size={20} /> : 'Verificar'}</Button>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    {emailCountdown > 0 ? <p className="text-slate-400">Reenviar en <span className="text-indigo-600 font-bold">{formatCountdown(emailCountdown)}</span></p> : <button onClick={() => handleSendEmailToken(true)} className="text-indigo-600 font-bold hover:underline">Reenviar código</button>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Phone Section */}
                            <div className={`p-6 rounded-3xl border-2 transition-all ${phoneVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Phone className={`w-5 h-5 ${phoneVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <span className="font-bold text-slate-900">Teléfono</span>
                                    {phoneVerified && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
                                </div>
                                {!phoneVerified && (
                                    <div className="space-y-4">
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1"><Input label="Teléfono" value={formData.phone} onChange={e => updateFormData('phone', e.target.value.replace(/\D/g, ''))} placeholder="58412..." disabled={smsSent} /></div>
                                            {!smsSent && <Button onClick={() => handleSendSmsToken()} disabled={loading || !formData.phone} className="mb-1 h-[54px] px-6 rounded-2xl bg-indigo-600 text-white font-bold">{loading ? <Loader size={20} /> : 'Enviar'}</Button>}
                                        </div>
                                        {smsSent && (
                                            <div className="space-y-4 pt-2">
                                                <div className="flex gap-2">
                                                    <Input label="Código" value={phoneToken} onChange={e => setPhoneToken(e.target.value.slice(0, 6))} placeholder="000000" maxLength={6} />
                                                    <Button onClick={handleVerifyPhone} disabled={loading || phoneToken.length < 6} className="h-[54px] mt-7 px-6 rounded-2xl bg-emerald-500 text-white font-bold">{loading ? <Loader size={20} /> : 'Verificar'}</Button>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    {smsCountdown > 0 ? <p className="text-slate-400">Reenviar en <span className="text-indigo-600 font-bold">{formatCountdown(smsCountdown)}</span></p> : <button onClick={() => handleSendSmsToken(true)} className="text-indigo-600 font-bold hover:underline">Reenviar SMS</button>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(2)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">Volver</button>
                                <Button onClick={() => setStep(4)} disabled={!canProceedStep3} className="bg-slate-900 px-10 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2">Siguiente <ArrowRight className="w-5 h-5" /></Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Password */}
                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-slate-100 rounded-2xl text-slate-600"><Lock className="w-6 h-6" /></div>
                                <div><h2 className="text-xl font-bold text-slate-900">Seguridad</h2><p className="text-sm text-slate-500">Protege tu cuenta profesional</p></div>
                            </div>

                            <div className="space-y-6">
                                <Input label="Contraseña" type="password" value={formData.password} onChange={e => updateFormData('password', e.target.value)} placeholder="••••••••" icon={Lock} />
                                <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requisitos</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Requirement met={passwordChecks.minLength} text="8+ caracteres" />
                                        <Requirement met={passwordChecks.hasUppercase} text="Mayúscula" />
                                        <Requirement met={passwordChecks.hasLowercase} text="Minúscula" />
                                        <Requirement met={passwordChecks.hasNumber} text="Número" />
                                        <Requirement met={passwordChecks.hasSpecial} text="Símbolo (!@#)" />
                                    </div>
                                </div>
                                <Input label="Confirmar Contraseña" type="password" value={formData.confirmPassword} onChange={e => updateFormData('confirmPassword', e.target.value)} placeholder="••••••••" icon={Lock} />
                                {formData.confirmPassword && (
                                    <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${passwordChecks.match ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                        {passwordChecks.match ? <><CheckCircle className="w-5 h-5" /> Las contraseñas coinciden</> : <><X className="w-5 h-5" /> Las contraseñas no coinciden</>}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(3)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">Volver</button>
                                <Button onClick={() => setStep(5)} disabled={!canProceedStep4} className="bg-slate-900 px-10 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2">Siguiente <ArrowRight className="w-5 h-5" /></Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Documents */}
                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600"><FileText className="w-6 h-6" /></div>
                                <div><h2 className="text-xl font-bold text-slate-900">Documentación</h2><p className="text-sm text-slate-500">Sube los soportes legales requeridos</p></div>
                            </div>

                            {/* Logo Upload */}
                            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-indigo-500 transition-all bg-slate-50/50">
                                {logoPreview ? (
                                    <div className="relative inline-block mt-2">
                                        <img src={logoPreview} alt="Logo Preview" className="w-32 h-32 object-contain rounded-2xl bg-white p-2 shadow-sm" />
                                        <button onClick={() => { setLogoFile(null); setLogoPreview(null) }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer group">
                                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'logo')} />
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform"><Upload className="text-slate-400 group-hover:text-indigo-600" /></div>
                                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Subir Logo Comercial</p>
                                        <p className="text-xs text-slate-400 mt-1">PNG, JPG (Máx 5MB)</p>
                                    </label>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DocUpload label="RIF Digital" file={rifFile} onUpload={e => handleFileChange(e, 'rif')} />
                                <DocUpload label="Registro Mercantil" file={mercantileFile} onUpload={e => handleFileChange(e, 'mercantile')} />
                                <DocUpload label="Licencia Sanitaria" file={sanitaryFile} onUpload={e => handleFileChange(e, 'sanitary')} />
                            </div>

                            {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-bold flex items-center gap-3"><AlertCircle size={20} /> {error}</div>}

                            <div className="flex justify-center py-4"><PuzzleCaptcha onVerify={setIsVerified} /></div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(4)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">Volver</button>
                                <Button onClick={handleSubmit} disabled={loading || !canProceedStep5} className="bg-emerald-500 px-10 py-4 rounded-2xl font-black text-white hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">{loading ? <Loader size={20} /> : <><CheckCircle className="w-5 h-5" /> Finalizar Registro</>}</Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 6: Success */}
                    {step === 6 && (
                        <motion.div key="step6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle className="w-12 h-12" /></div>
                            <h2 className="text-4xl font-black text-slate-900 mb-4">¡Bienvenido a ALTEHA!</h2>
                            <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">Tu registro de farmacia ha sido recibido correctamente. Nuestro equipo validará la documentación pronto.</p>
                            <Link href="/login?role=provider"><Button className="bg-slate-900 px-12 py-5 rounded-2xl font-black text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">Ir al Login de Proveedores</Button></Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// Components
function Requirement({ met, text }: { met: boolean; text: string }) {
    return <div className={`flex items-center gap-2 text-xs font-bold transition-all ${met ? 'text-emerald-500' : 'text-slate-400'}`}>{met ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />} <span>{text}</span></div>;
}

function DocUpload({ label, file, onUpload }: { label: string; file: File | null; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <div className="p-4 border border-slate-200 rounded-2xl bg-white flex items-center gap-4">
            <div className={`p-3 rounded-xl ${file ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}><FileText size={20} /></div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-900 truncate">{file ? file.name : 'Pendiente'}</p>
            </div>
            <input type="file" id={label} className="hidden" accept=".pdf,image/*" onChange={onUpload} />
            <label htmlFor={label} className="cursor-pointer px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors">{file ? 'Cambiar' : 'Subir'}</label>
        </div>
    );
}
