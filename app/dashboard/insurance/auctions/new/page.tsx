"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Gavel,
    User,
    Stethoscope,
    Calendar,
    DollarSign,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Upload,
    MapPin,
    Users,
    Building2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    publishAuction,
    getSpecialties,
    getClinics,
    getDoctors,
    searchPatient,
    type Specialty,
    type AuctionPayload,
    type Patient,
    type Clinic,
    type ActorProfile,
    getProfile
} from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function NewAuctionPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<AuctionPayload>({
        title: '',
        description: '',
        auctionType: 'REVERSE_AUCTION',
        status: 'DRAFT',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        maxBudget: 0,
        reservePrice: 0,
        urgencyLevel: 'MEDIUM',
        patientAge: 0,
        patientGender: 'FEMENINO',
        medicalHistory: '',
        preferredLocation: 'Caracas, Venezuela',
        requiresHospitalization: true,
        estimatedDurationDays: 1,
        specialRequirements: '',
        termsAndConditions: 'Términos estándar de Alteha...',
        termsAndConditionsAccepted: true,
        showPrice: true,
        durationHours: 240,
        autoExtendMinutes: 10,
        minBidsRequired: 1,
        estimatedSurgeryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        patient: { id: 0 },
        specialty: { id: 1 },
        currency: { id: 1 },
        procedureType: { id: 1 },
        clinicBudget: 0,
        doctorBudget: 0,
        requiredSupplies: [],
        invitedDoctorIds: [],
        invitedClinicIds: []
    });

    const [medicalReport, setMedicalReport] = useState<File | null>(null);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [doctors, setDoctors] = useState<ActorProfile[]>([]);
    const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
    const [searchDoc, setSearchDoc] = useState('');

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const specs = await getSpecialties();
                setSpecialties(Array.isArray(specs) ? specs : []);

                const clinicsRes = await getClinics();
                setClinics(Array.isArray(clinicsRes) ? clinicsRes : []);

                const doctorsRes = await getDoctors();
                setDoctors(Array.isArray(doctorsRes) ? doctorsRes : []);

                const profileRes = await getProfile('INSURANCE_COMPANY');
                if (profileRes.code === '00' && profileRes.data) {
                    setFormData(prev => ({
                        ...prev,
                        insuranceCompany: { id: profileRes.data.id }
                    }));
                }

                // Initialize invited IDs if they match specified test actors
                setFormData(prev => ({
                    ...prev,
                    invitedDoctorIds: [1500, 1501],
                    invitedClinicIds: [1500, 1501, 1502]
                }));
            } catch (err) {
                console.error('Error loading initial data:', err);
            }
        };
        loadInitial();
    }, []);

    const handlePatientSearch = async () => {
        if (!searchDoc) return;
        setIsSearching(true);
        setError(null);
        try {
            const result = await searchPatient('CEDULA', searchDoc);
            if (result.code === '00' && result.data) {
                setFoundPatient(result.data);
                setFormData(prev => ({
                    ...prev,
                    patient: { id: result.data.id },
                    patientAge: calculateAge(result.data.dateOfBirth),
                    patientGender: result.data.gender as any
                }));
            } else {
                setError('Paciente no encontrado. Por favor verifique el documento.');
                setFoundPatient(null);
            }
        } catch (err) {
            setError('Error al buscar paciente');
        } finally {
            setIsSearching(false);
        }
    };

    const calculateAge = (dob: string) => {
        if (!dob) return 0;
        const birth = new Date(dob);
        if (isNaN(birth.getTime())) return 0;
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleAction = async (finalStatus: 'DRAFT' | 'PUBLISHED') => {
        setIsLoading(true);
        setError(null);

        const finalPayload = { ...formData, status: finalStatus };

        try {
            const result = await publishAuction(finalPayload, medicalReport || undefined);
            // The backend returns the raw Auction object on success, so we check for result.id
            if (result.code === '00' || result.code === 'SUCCESS' || (result as any).id) {
                router.push('/dashboard/insurance/auctions?created=true');
            } else {
                const errorStr = result.message || JSON.stringify(result) || 'Error al procesar subasta';
                setError(`Error: ${errorStr}`);
            }
        } catch (err: any) {
            setError(`Error de conexión con el servidor: ${err.message || ''}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Default to published if somehow triggered by Enter key
        handleAction('PUBLISHED');
    };

    const steps = [
        { id: 1, title: 'Paciente', icon: User },
        { id: 2, title: 'Clínico', icon: Stethoscope },
        { id: 3, title: 'Presupuesto', icon: DollarSign },
        { id: 4, title: 'Subasta', icon: Gavel },
        { id: 5, title: 'Clínicas', icon: Building2 },
        { id: 6, title: 'Médicos', icon: Users },
        { id: 7, title: 'Confirmación', icon: CheckCircle2 }
    ];

    // Computed: Filter doctors based on selected clinics
    const filteredDoctors = doctors.filter(doctor => {
        if (!formData.invitedClinicIds || formData.invitedClinicIds.length === 0) return true; // Show all if no clinic selected? Or none? User said "médico debe trabajar en al menos una clinica de las clnicas selecionadas"
        return doctor.preferredClinics?.some(pc => formData.invitedClinicIds?.includes(pc.id));
    });

    return (
        <div className="max-w-4xl mx-auto font-outfit pb-20">
            <Link href="/dashboard/insurance/auctions" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-6 font-bold group w-fit">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver a Subastas
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight">Nueva Subasta</h2>
                        <p className="text-slate-400 font-medium mt-1">Sigue los pasos para configurar tu convocatoria</p>
                    </div>
                    {/* Progress indicator */}
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl backdrop-blur-sm overflow-x-auto max-w-full">
                        {steps.map((s, i) => (
                            <div key={s.id} className="flex items-center">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black transition-all ${step >= s.id ? 'bg-alteha-violet text-white' : 'bg-white/10 text-white/30'
                                    }`}>
                                    <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`w-3 md:w-6 h-1 rounded-full mx-1 md:mx-2 ${step > s.id ? 'bg-alteha-violet' : 'bg-white/10'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 border-b pb-4">Identificación del Paciente</h3>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula del Paciente</label>
                                            <input
                                                type="text"
                                                value={searchDoc}
                                                onChange={(e) => setSearchDoc(e.target.value)}
                                                placeholder="Ej: 28900788"
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                onClick={handlePatientSearch}
                                                disabled={isSearching || !searchDoc}
                                                className="bg-slate-900 text-white p-4 rounded-2xl aspect-square flex items-center justify-center"
                                            >
                                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {error && error.includes("belong") && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 group">
                                            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                                            <div>
                                                <p className="text-amber-800 font-bold text-sm">Validación de Pertenencia</p>
                                                <p className="text-amber-700 text-xs font-medium">El paciente no está registrado bajo su compañía de seguros. Por favor, verifique el documento o contacte con soporte.</p>
                                            </div>
                                        </div>
                                    )}

                                    {foundPatient && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-6"
                                        >
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 overflow-hidden shadow-sm">
                                                {foundPatient.profileImageUrl ? (
                                                    <img src={foundPatient.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                                ) : <User className="w-8 h-8" />}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900">{foundPatient.firstName} {foundPatient.lastName}</h4>
                                                <p className="text-slate-500 font-bold text-sm">{foundPatient.identificationNumber} • {foundPatient.gender} • {calculateAge(foundPatient.dateOfBirth)} años</p>
                                            </div>
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 ml-auto" />
                                        </motion.div>
                                    )}

                                    <FormInput
                                        label="Historia Médica / Antecedentes"
                                        value={formData.medicalHistory}
                                        onChange={(v: string) => setFormData({ ...formData, medicalHistory: v })}
                                        placeholder="Detalla los antecedentes relevantes para la subasta..."
                                        description="Incluye diagnósticos previos, alergias o condiciones que el médico deba considerar antes de ofertar."
                                    />
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
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 border-b pb-4">Detalles Clínicos</h3>
                                    <FormInput
                                        label="Título de la Subasta"
                                        value={formData.title}
                                        onChange={(v: string) => setFormData({ ...formData, title: v })}
                                        placeholder="Ej: Cirugía de Vesícula por Laparoscopia"
                                        description="Un título descriptivo ayuda a los especialistas a identificar rápidamente el tipo de intervención."
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad Requerida</label>
                                            </div>
                                            <select
                                                value={formData.specialty.id}
                                                onChange={(e) => setFormData({ ...formData, specialty: { id: parseInt(e.target.value) } })}
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all appearance-none outline-none"
                                            >
                                                {(Array.isArray(specialties) ? specialties : []).map(s => (
                                                    <option key={s.id} value={s.id}>{s.name || s.code}</option>
                                                ))}
                                            </select>
                                            <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Define qué tipo de especialista podrá ver y participar en esta subasta.</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridad del Caso</label>
                                            </div>
                                            <select
                                                value={formData.urgencyLevel}
                                                onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all appearance-none outline-none"
                                            >
                                                <option value="LOW">Baja / Consultiva</option>
                                                <option value="MEDIUM">Media / Programada</option>
                                                <option value="HIGH">Alta / Prioritaria</option>
                                                <option value="CRITICAL">Urgente / Crítica</option>
                                            </select>
                                            <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Indica la rapidez con la que se necesita realizar la intervención.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">¿Requiere Hospitalización?</label>
                                            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, requiresHospitalization: true })}
                                                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${formData.requiresHospitalization ? 'bg-white text-alteha-violet shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    SÍ
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, requiresHospitalization: false })}
                                                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!formData.requiresHospitalization ? 'bg-white text-alteha-violet shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    NO
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Determina si el paciente deberá permanecer internado tras la cirugía.</p>
                                        </div>
                                        <FormInput
                                            label="Duración Estimada (Días)"
                                            type="number"
                                            value={formData.estimatedDurationDays}
                                            onChange={(v: string) => setFormData({ ...formData, estimatedDurationDays: parseInt(v) })}
                                            description="Días aproximados que durará el proceso médico completo (incluyendo post-operatorio inicial)."
                                        />
                                    </div>

                                    <FormInput
                                        label="Requerimientos Especiales"
                                        value={formData.specialRequirements}
                                        onChange={(v: string) => setFormData({ ...formData, specialRequirements: v })}
                                        placeholder="Ej: Se requiere instrumentista especializado en robótica..."
                                        description="Cualquier necesidad técnica adicional que el médico deba prever."
                                    />

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Informe Médico (PDF)</label>
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[2rem] hover:bg-slate-50 transition-all cursor-pointer group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 text-slate-300 group-hover:text-alteha-violet transition-colors mb-2" />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                    {medicalReport ? medicalReport.name : 'Haz clic para subir archivo'}
                                                </p>
                                            </div>
                                            <input type="file" className="hidden" accept="application/pdf" onChange={(e) => setMedicalReport(e.target.files?.[0] || null)} />
                                        </label>
                                        <p className="text-[9px] text-slate-400 font-medium ml-1 italic text-center">Adjunta exámenes o informes que respalden la necesidad quirúrgica.</p>
                                    </div>
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
                                    <h3 className="text-2xl font-black text-slate-900 border-b pb-4">Presupuesto y Plazos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput
                                            label="Presupuesto Máximo ($)"
                                            type="number"
                                            value={formData.maxBudget}
                                            onChange={(v: string) => setFormData({ ...formData, maxBudget: parseFloat(v) })}
                                            description="El monto máximo general que estás dispuesto a pagar por toda la intervención."
                                        />
                                        <FormInput
                                            label="Fecha Estimada de Cirugía"
                                            type="date"
                                            value={formData.estimatedSurgeryDate}
                                            onChange={(v: string) => setFormData({ ...formData, estimatedSurgeryDate: v })}
                                            description="La fecha ideal en la que te gustaría que se realice el procedimiento."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput
                                            label="Honorarios Médicos sugeridos ($)"
                                            type="number"
                                            value={formData.doctorBudget}
                                            onChange={(v: string) => setFormData({ ...formData, doctorBudget: parseFloat(v) })}
                                            description="Monto referencial destinado específicamente a los honorarios del especialista."
                                        />
                                        <FormInput
                                            label="Gastos de Clínica sugeridos ($)"
                                            type="number"
                                            value={formData.clinicBudget}
                                            onChange={(v: string) => setFormData({ ...formData, clinicBudget: parseFloat(v) })}
                                            description="Monto referencial destinado a los gastos de hospitalización e insumos de la clínica."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación Preferida</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={formData.preferredLocation}
                                                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Zona geográfica de preferencia para la intervención.</p>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-black text-slate-900 italic underline decoration-alteha-violet underline-offset-8">Insumos Necesarios</h3>
                                            <Button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    requiredSupplies: [...(formData.requiredSupplies || []), { itemName: '', description: '', quantity: 1, referenceAmount: 0 }]
                                                })}
                                                className="bg-alteha-violet text-white px-4 py-2 rounded-xl font-bold text-xs"
                                            >
                                                + Agregar Insumo
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {(formData.requiredSupplies || []).map((supply, index) => (
                                                <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSupplies = [...(formData.requiredSupplies || [])];
                                                            newSupplies.splice(index, 1);
                                                            setFormData({ ...formData, requiredSupplies: newSupplies });
                                                        }}
                                                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <AlertCircle className="w-5 h-5" />
                                                    </button>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <FormInput
                                                            label="Nombre del Insumo"
                                                            value={supply.itemName}
                                                            onChange={(v: string) => {
                                                                const newSupplies = [...(formData.requiredSupplies || [])];
                                                                newSupplies[index].itemName = v;
                                                                setFormData({ ...formData, requiredSupplies: newSupplies });
                                                            }}
                                                            placeholder="Ej: Malla Prolene 15x15"
                                                            description="Nombre específico del material o insumo requerido."
                                                        />
                                                        <FormInput
                                                            label="Descripción / Ref"
                                                            value={supply.description}
                                                            onChange={(v: string) => {
                                                                const newSupplies = [...(formData.requiredSupplies || [])];
                                                                newSupplies[index].description = v;
                                                                setFormData({ ...formData, requiredSupplies: newSupplies });
                                                            }}
                                                            placeholder="Especificaciones técnicas..."
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <FormInput
                                                            label="Cantidad"
                                                            type="number"
                                                            value={supply.quantity}
                                                            onChange={(v: string) => {
                                                                const newSupplies = [...(formData.requiredSupplies || [])];
                                                                newSupplies[index].quantity = parseInt(v);
                                                                setFormData({ ...formData, requiredSupplies: newSupplies });
                                                            }}
                                                        />
                                                        <FormInput
                                                            label="Precio Ref. Unitario ($)"
                                                            type="number"
                                                            value={supply.referenceAmount}
                                                            onChange={(v: string) => {
                                                                const newSupplies = [...(formData.requiredSupplies || [])];
                                                                newSupplies[index].referenceAmount = parseFloat(v);
                                                                setFormData({ ...formData, requiredSupplies: newSupplies });
                                                            }}
                                                        />
                                                        <div className="flex flex-col justify-end">
                                                            <div className="p-4 bg-white rounded-xl border border-slate-200 text-right">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subtotal Ref.</p>
                                                                <p className="text-lg font-black text-slate-900">${((supply.quantity || 0) * (supply.referenceAmount || 0)).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.requiredSupplies?.length === 0 && (
                                                <div className="py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 italic font-medium text-sm">
                                                    No se han agregado insumos específicos
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 border-b pb-4">Reglas de la Subasta</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cierre de Recepción de Ofertas</label>
                                            <input
                                                type="datetime-local"
                                                defaultValue={formData.endDate.slice(0, 16)}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (!value) return;
                                                    const date = new Date(value);
                                                    if (!isNaN(date.getTime())) {
                                                        setFormData({ ...formData, endDate: date.toISOString() });
                                                    }
                                                }}
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                            />
                                            <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Fecha y hora límite para que los médicos envíen sus propuestas.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mostrar Precio Máximo</label>
                                            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, showPrice: true })}
                                                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${formData.showPrice ? 'bg-white text-alteha-violet shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    PÚBLICO
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, showPrice: false })}
                                                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!formData.showPrice ? 'bg-white text-alteha-violet shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    OCULTO
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Indica si los médicos pueden ver tu presupuesto máximo al ofertar.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput
                                            label="Ofertas Mínimas"
                                            type="number"
                                            min="0"
                                            value={formData.minBidsRequired}
                                            onChange={(v: string) => setFormData({ ...formData, minBidsRequired: Math.max(0, parseInt(v) || 0) })}
                                            description="Cantidad mínima de propuestas requeridas para considerar válida la subasta."
                                        />
                                        <FormInput
                                            label="Auto-extensión (Minutos)"
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={formData.autoExtendMinutes}
                                            onChange={(v: string) => {
                                                let val = parseInt(v) || 0;
                                                if (val > 60) val = 60;
                                                if (val < 0) val = 0;
                                                setFormData({ ...formData, autoExtendMinutes: val });
                                            }}
                                            description="Tiempo adicional añadido si se recibe una oferta al final. (Máx 60m)."
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b pb-4">
                                        <h3 className="text-2xl font-black text-slate-900">Selección de Clínicas</h3>
                                        <p className="text-[10px] font-black text-alteha-violet uppercase tracking-widest leading-none mb-1">{formData.invitedClinicIds?.length || 0} Seleccionadas</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(Array.isArray(clinics) ? clinics : []).map(clinic => (
                                            <div
                                                key={clinic.id}
                                                onClick={() => {
                                                    const ids = formData.invitedClinicIds || [];
                                                    if (ids.includes(clinic.id)) {
                                                        const newClinicIds = ids.filter(id => id !== clinic.id);
                                                        // Also remove doctors that don't belong to any of the remaining clinics
                                                        const remainingDocs = doctors.filter(d =>
                                                            d.preferredClinics?.some(pc => newClinicIds.includes(pc.id))
                                                        ).map(d => d.id);

                                                        setFormData({
                                                            ...formData,
                                                            invitedClinicIds: newClinicIds,
                                                            invitedDoctorIds: formData.invitedDoctorIds?.filter(id => remainingDocs.includes(id)) || []
                                                        });
                                                    } else {
                                                        setFormData({ ...formData, invitedClinicIds: [...ids, clinic.id] });
                                                    }
                                                }}
                                                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-4 group ${formData.invitedClinicIds?.includes(clinic.id)
                                                    ? 'border-alteha-violet bg-violet-50/50 shadow-lg shadow-violet-100'
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                                    {clinic.logoUrl ? <img src={clinic.logoUrl} className="w-full h-full object-contain" /> : <Building2 className="w-8 h-8 text-slate-300" />}
                                                </div>
                                                <div>
                                                    <span className="font-black text-slate-900 block">{clinic.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{clinic.cityName || 'Ciudad'}, {clinic.stateProvinceName || 'Estado'}</span>
                                                </div>
                                                {formData.invitedClinicIds?.includes(clinic.id) && (
                                                    <CheckCircle2 className="w-6 h-6 text-alteha-violet ml-auto" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {clinics.length === 0 && (
                                        <div className="py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando clínicas disponibles...</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 6 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b pb-4">
                                        <h3 className="text-2xl font-black text-slate-900">Selección de Médicos</h3>
                                        <p className="text-[10px] font-black text-alteha-turquoise uppercase tracking-widest leading-none mb-1">{formData.invitedDoctorIds?.length || 0} Seleccionados</p>
                                    </div>

                                    {formData.invitedClinicIds?.length === 0 ? (
                                        <div className="py-20 text-center px-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <h4 className="text-lg font-black text-slate-900 mb-2">Selecciona una clínica primero</h4>
                                            <p className="text-slate-500 font-medium text-sm">Debes elegir al menos una clínica para ver los médicos disponibles que trabajan en ellas.</p>
                                            <Button type="button" onClick={handleBack} className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black">Volver a Clínicas</Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredDoctors.map(doctor => (
                                                <div
                                                    key={doctor.id}
                                                    onClick={() => {
                                                        const ids = formData.invitedDoctorIds || [];
                                                        if (ids.includes(doctor.id)) {
                                                            setFormData({ ...formData, invitedDoctorIds: ids.filter(id => id !== doctor.id) });
                                                        } else {
                                                            setFormData({ ...formData, invitedDoctorIds: [...ids, doctor.id] });
                                                        }
                                                    }}
                                                    className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-4 group ${formData.invitedDoctorIds?.includes(doctor.id)
                                                        ? 'border-alteha-turquoise bg-alteha-turquoise/5 shadow-lg shadow-alteha-turquoise/10'
                                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                                                        {doctor.profileImageUrl ? <img src={doctor.profileImageUrl} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-slate-300" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="font-black text-slate-900 block leading-tight text-base">Dr. {doctor.firstName} {doctor.lastName}</span>
                                                        <span className="text-[10px] text-alteha-turquoise font-black uppercase tracking-widest block mt-1">{doctor.specialties?.[0]?.name || 'Especialista'}</span>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {doctor.preferredClinics?.filter(pc => formData.invitedClinicIds?.includes(pc.id)).map(pc => (
                                                                <span key={pc.id} className="px-2 py-0.5 bg-slate-100 rounded-full text-[8px] font-black text-slate-500 uppercase">{pc.name}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {formData.invitedDoctorIds?.includes(doctor.id) && (
                                                        <CheckCircle2 className="w-6 h-6 text-alteha-turquoise ml-auto" />
                                                    )}
                                                </div>
                                            ))}
                                            {filteredDoctors.length === 0 && (
                                                <div className="col-span-2 py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                    <h4 className="text-lg font-black text-slate-900">No se encontraron médicos</h4>
                                                    <p className="text-slate-500 font-medium text-sm">No hay médicos registrados que trabajen en las clínicas seleccionadas.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 7 && (
                            <motion.div
                                key="step6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 border-b pb-4">Revisión Final</h3>
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6">
                                        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <User className="text-alteha-violet" />
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
                                                    <p className="font-black text-slate-900">{foundPatient?.firstName} {foundPatient?.lastName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Edad/Género</p>
                                                <p className="font-black text-slate-900">{formData.patientAge} años • {formData.patientGender}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <Gavel className="text-alteha-turquoise" />
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedimiento</p>
                                                    <p className="font-black text-slate-900">{formData.title}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subasta</p>
                                                <p className="font-black text-slate-900">${formData.maxBudget.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hospitalización</p>
                                                <p className="text-sm font-black text-slate-900">{formData.requiresHospitalization ? 'SÍ' : 'NO'}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duración (Días)</p>
                                                <p className="text-sm font-black text-slate-900">{formData.estimatedDurationDays}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visibilidad Precio</p>
                                                <p className="text-sm font-black text-slate-900">{formData.showPrice ? 'PÚBLICO' : 'OCULTO'}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ofertas Min.</p>
                                                <p className="text-sm font-black text-slate-900">{formData.minBidsRequired}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clínicas Invitadas</p>
                                                <p className="text-2xl font-black text-alteha-violet leading-none">{formData.invitedClinicIds?.length || 0}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Médicos Invitados</p>
                                                <p className="text-2xl font-black text-alteha-turquoise leading-none">{formData.invitedDoctorIds?.length || 0}</p>
                                            </div>
                                        </div>

                                        {formData.requiredSupplies && formData.requiredSupplies.length > 0 && (
                                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Insumos Especiales ({formData.requiredSupplies.length})</p>
                                                <div className="space-y-2">
                                                    {formData.requiredSupplies.map((s, i) => (
                                                        <div key={i} className="flex justify-between items-center text-sm font-bold">
                                                            <span className="text-slate-600">{s.itemName} x{s.quantity}</span>
                                                            <span className="text-slate-900">${(s.quantity * s.referenceAmount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2 border-t mt-2 flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Insumos</span>
                                                        <span className="text-lg font-black text-alteha-violet">
                                                            ${formData.requiredSupplies.reduce((acc, s) => acc + (s.quantity * s.referenceAmount), 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
                                            <AlertCircle className="w-5 h-5" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 flex justify-between items-center pt-8 border-t">
                        {step > 1 ? (
                            <Button
                                type="button"
                                onClick={handleBack}
                                className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Anterior
                            </Button>
                        ) : <div />}

                        {step < 7 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={(step === 1 && !foundPatient) || (step === 5 && (!formData.invitedClinicIds || formData.invitedClinicIds.length === 0))}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-2 border-2 border-transparent"
                            >
                                Siguiente
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleAction('DRAFT')}
                                    className="bg-slate-100 text-slate-600 px-8 py-5 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                                >
                                    Guardar Borrador
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleAction('PUBLISHED')}
                                    className="bg-alteha-violet text-white px-12 py-5 rounded-[1.5rem] font-black shadow-xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-3"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publicar Subasta'}
                                </Button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormInput({ label, type = "text", value, onChange, disabled = false, placeholder, description, min, max }: any) {
    return (
        <div className="space-y-1 group">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                {description && (
                    <div className="relative group/tooltip">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-300 hover:text-alteha-violet transition-colors cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-white rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 font-bold leading-tight">
                            {description}
                        </div>
                    </div>
                )}
            </div>
            <input
                type={type}
                value={value}
                disabled={disabled}
                placeholder={placeholder}
                min={min}
                max={max}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
            />
            {description && <p className="text-[9px] text-slate-400 font-medium ml-1 italic">{description}</p>}
        </div>
    );
}
