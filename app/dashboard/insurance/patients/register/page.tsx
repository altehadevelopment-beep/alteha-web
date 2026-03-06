"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Shield,
    Camera,
    Upload,
    CheckCircle2,
    Loader2,
    Search,
    Stethoscope,
    AlertCircle,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { registerPatient, type PatientRegistration } from '@/lib/api';

export default function RegisterPatientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState<PatientRegistration>({
        email: '',
        password: 'ChangeMe123*', // Default password as per usual onboarding
        phone: '',
        firstName: '',
        lastName: '',
        identificationType: 'CEDULA',
        identificationNumber: '',
        gender: 'FEMENINO',
        dateOfBirth: '',
        address: '',
        latitude: 10.4806, // Caracas default
        longitude: -66.9036,
        allergyIds: [],
        medicalConditionIds: [],
        currentMedicationIds: [],
        insurancePlanId: null
    });

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [documents, setDocuments] = useState<File[]>([]);

    const handleInputChange = (field: keyof PatientRegistration, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfilePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setDocuments(prev => [...prev, ...files]);
    };

    const removeDoc = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await registerPatient(formData, profileImage || undefined, documents);
            if (result.code === '00') {
                router.push('/dashboard/insurance/patients?registered=true');
            } else {
                setError(result.message || 'Error al registrar el paciente');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto font-outfit pb-20">
            <Link href="/dashboard/insurance/patients" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-6 font-bold group w-fit">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver a Gestión de Pacientes
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-4xl font-black tracking-tight">Registro de Paciente</h2>
                        <p className="text-slate-400 font-medium mt-1">Completa los datos del nuevo beneficiario.</p>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-alteha-violet/20 rounded-full blur-3xl -mr-20 -mt-20" />
                </div>

                {/* Progress Bar */}
                <div className="flex h-1.5 bg-slate-100">
                    <div className={`transition-all duration-500 bg-alteha-violet h-full`} style={{ width: `${(step / 3) * 100}%` }} />
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-violet-50 text-alteha-violet flex items-center justify-center text-sm font-black">1</div>
                                            Datos Personales
                                        </h3>

                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombres</label>
                                            <input
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                                placeholder="Ej: Camila"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellidos</label>
                                            <input
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                                placeholder="Ej: Almea"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Género</label>
                                                <select
                                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all appearance-none"
                                                    value={formData.gender}
                                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                                >
                                                    <option value="FEMENINO">Femenino</option>
                                                    <option value="MASCULINO">Masculino</option>
                                                    <option value="OTRO">Otro</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">F. Nacimiento</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-sm font-black">2</div>
                                            Identificación & Foto
                                        </h3>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                                <select
                                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all appearance-none"
                                                    value={formData.identificationType}
                                                    onChange={(e) => handleInputChange('identificationType', e.target.value)}
                                                >
                                                    <option value="CEDULA">V</option>
                                                    <option value="PASAPORTE">P</option>
                                                    <option value="RIF">RIF</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                                                <input
                                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                                    placeholder="Número de doc."
                                                    value={formData.identificationNumber}
                                                    onChange={(e) => handleInputChange('identificationNumber', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 pt-4">
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-alteha-violet transition-colors">
                                                    {profilePreview ? (
                                                        <img src={profilePreview} className="w-full h-full object-cover" alt="Preview" />
                                                    ) : (
                                                        <Camera className="w-8 h-8 text-slate-300" />
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleProfileImageChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900">Foto de Perfil</h4>
                                                <p className="text-xs text-slate-500">Carga una foto clara del rostro del paciente.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-6">
                                    <Button type="button" onClick={() => setStep(2)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black">Continuar</Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm font-black">3</div>
                                            Contacto & Ubicación
                                        </h3>

                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                            <input
                                                type="email"
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                                placeholder="ejemplo@correo.com"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                            <input
                                                type="tel"
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                                placeholder="+58-xxx-xxxxxxx"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                                            <textarea
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all min-h-[100px]"
                                                placeholder="Dirección completa..."
                                                value={formData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-sm font-black">4</div>
                                            Documentos de Verificación
                                        </h3>

                                        <div className="relative group p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-alteha-violet hover:bg-slate-100/50 transition-all text-center">
                                            <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3 group-hover:scale-110 group-hover:text-alteha-violet transition-all" />
                                            <p className="font-bold text-slate-500 group-hover:text-slate-900">Seleccionar Archivos</p>
                                            <p className="text-xs text-slate-400 mt-1">Cédula, RIF, Reportes médicos (PDF o Imagen)</p>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleDocsChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            {documents.map((doc, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{doc.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeDoc(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between pt-6">
                                    <Button type="button" onClick={() => setStep(1)} className="bg-slate-100 text-slate-500 px-10 py-4 rounded-2xl font-black">Atrás</Button>
                                    <Button type="button" onClick={() => setStep(3)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black">Continuar</Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-alteha-violet flex items-center justify-center text-sm font-black">5</div>
                                        Perfil Médico & Confirmación
                                    </h3>

                                    <div className="bg-violet-50/50 p-8 rounded-[2.5rem] border border-violet-100 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="p-6 bg-white rounded-3xl shadow-sm">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" /> Alergias
                                                </h4>
                                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                    <p className="text-xs text-slate-400 italic">Configure en el perfil del paciente post-registro</p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white rounded-3xl shadow-sm">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Stethoscope className="w-3 h-3" /> Condiciones
                                                </h4>
                                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                    <p className="text-xs text-slate-400 italic">Configure en el perfil del paciente post-registro</p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white rounded-3xl shadow-sm">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Shield className="w-3 h-3" /> Medicación
                                                </h4>
                                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                    <p className="text-xs text-slate-400 italic">Configure en el perfil del paciente post-registro</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
                                            <div className="p-3 bg-white rounded-2xl text-emerald-500 shadow-sm">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-emerald-900">Listo para Procesar</h4>
                                                <p className="text-emerald-700/70 text-sm font-medium">
                                                    Al confirmar, se creará la cuenta del paciente y se vinculará a **{formData.firstName} {formData.lastName}**.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
                                        <AlertCircle className="w-5 h-5" />
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between pt-6">
                                    <Button type="button" onClick={() => setStep(2)} className="bg-slate-100 text-slate-500 px-10 py-4 rounded-2xl font-black">Atrás</Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-slate-200 flex items-center gap-3"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            "Finalizar Registro"
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        </div>
    );
}
