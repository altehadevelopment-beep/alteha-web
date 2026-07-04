"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Gavel,
    User,
    Stethoscope,
    Calendar,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    MapPin,
    Plus,
    Trash2,
    Building2,
    Users,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    getAuctionDetails,
    updateAuction,
    publishExistingAuction,
    changeAuctionStatus,
    getSpecialties,
    getClinics,
    getDoctors,
    type Specialty,
    type AuctionPayload,
    type Auction,
    type RequiredSupply
} from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function EditAuctionPage() {
    const params = useParams();
    const router = useRouter();
    const auctionNumber = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [formData, setFormData] = useState<AuctionPayload | null>(null);
    const [auction, setAuction] = useState<Auction | null>(null);

    // Participants (invited clinics / doctors) — editable selector, same as the create flow.
    const [clinics, setClinics] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [clinicSearch, setClinicSearch] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');

    const hasBids = (auction?.totalBids || 0) > 0;

    // Doctors are limited to those who work at the invited clinics (or all if no clinic is selected).
    const filteredDoctors = doctors.filter((doctor: any) => {
        if (!formData?.invitedClinicIds || formData.invitedClinicIds.length === 0) return true;
        return doctor.preferredClinics?.some((pc: any) => formData.invitedClinicIds?.includes(pc.id));
    });
    const allClinicsSelected = clinics.length > 0 && clinics.every((c: any) => formData?.invitedClinicIds?.includes(c.id));
    const allDoctorsSelected = doctors.length > 0 && doctors.every((d: any) => formData?.invitedDoctorIds?.includes(d.id));
    const handleSelectAllClinics = () => {
        if (!formData) return;
        if (allClinicsSelected) setFormData({ ...formData, invitedClinicIds: [], invitedDoctorIds: [] });
        else setFormData({ ...formData, invitedClinicIds: clinics.map((c: any) => c.id) });
    };
    const handleSelectAllDoctors = () => {
        if (!formData) return;
        if (allDoctorsSelected) setFormData({ ...formData, invitedDoctorIds: [] });
        else setFormData({ ...formData, invitedDoctorIds: doctors.map((d: any) => d.id) });
    };

    useEffect(() => {
        const loadInitial = async () => {
            setIsLoading(true);
            try {
                const [auctionRes, specs, clinicsRes, doctorsRes] = await Promise.all([
                    getAuctionDetails(auctionNumber),
                    getSpecialties(),
                    getClinics(),
                    getDoctors()
                ]);
                setClinics(Array.isArray(clinicsRes) ? clinicsRes : ((clinicsRes as any)?.content ?? []));
                setDoctors(Array.isArray(doctorsRes) ? doctorsRes : ((doctorsRes as any)?.content ?? []));

                let a: any = null;
                if (auctionRes.code === '00' && auctionRes.data) {
                    a = auctionRes.data;
                } else if ((auctionRes as any).id) {
                    a = auctionRes;
                }

                if (a) {
                    setFormData({
                        auctionNumber: a.auctionNumber ?? auctionNumber,
                        createdAt: a.createdAt ?? new Date().toISOString(),
                        title: a.title,
                        description: a.description,
                        auctionType: a.auctionType,
                        status: a.status,
                        startDate: a.startDate,
                        endDate: a.endDate,
                        maxBudget: a.maxBudget,
                        reservePrice: a.reservePrice || 0,
                        urgencyLevel: a.urgencyLevel,
                        patientAge: a.patientAge,
                        patientGender: a.patientGender,
                        medicalHistory: a.medicalHistory,
                        preferredLocation: a.preferredLocation,
                        requiresHospitalization: a.requiresHospitalization,
                        estimatedDurationDays: a.estimatedDurationDays,
                        specialRequirements: a.specialRequirements,
                        termsAndConditions: a.termsAndConditions,
                        termsAndConditionsAccepted: a.termsAndConditionsAccepted,
                        showPrice: a.showPrice,
                        durationHours: a.durationHours,
                        autoExtendMinutes: a.autoExtendMinutes,
                        minBidsRequired: 10,
                        estimatedSurgeryDate: a.estimatedSurgeryDate ? a.estimatedSurgeryDate.split('T')[0] : '',
                        patient: { id: a.patient?.id || 0 },
                        specialty: { id: a.specialty?.id || 1 },
                        currency: { id: a.currency?.id || 1 },
                        procedureType: { id: a.procedureType?.id || 1 },
                        insuranceCompany: a.insuranceCompany ? { id: a.insuranceCompany.id } : undefined,
                        clinicBudget: a.clinicBudget || 0,
                        doctorBudget: a.doctorBudget || 0,
                        requiredSupplies: a.requiredSupplies || [],
                        invitedDoctorIds: a.invitedDoctorIds || [],
                        invitedClinicIds: a.invitedClinicIds || [],
                        methodType: a.methodType || 'BS_BANK_TRANSFER',
                        allowedPaymentMethods: (a.allowedPaymentMethods && a.allowedPaymentMethods.length > 0)
                            ? a.allowedPaymentMethods
                            : (a.methodType ? [a.methodType] : ['BS_BANK_TRANSFER'])
                    });
                    setAuction(a);
                    setSpecialties(Array.isArray(specs) ? specs : []);
                } else {
                    setError('No se pudo cargar la subasta (formato no soportado)');
                }
            } catch (err) {
                console.error('Error loading initial data:', err);
                setError('Error al cargar datos de la subasta');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [auctionNumber]);

    const handleAction = async (finalStatus: string) => {
        if (!formData) return;

        setIsSaving(true);
        setError(null);
        setSuccess(false);

        const finalPayload: AuctionPayload = {
            ...formData,
            allowedPaymentMethods: (formData.allowedPaymentMethods && formData.allowedPaymentMethods.length > 0)
                ? formData.allowedPaymentMethods
                : (formData.methodType ? [formData.methodType] : ['BS_BANK_TRANSFER']),
            methodType: formData.allowedPaymentMethods?.[0] || formData.methodType || 'BS_BANK_TRANSFER'
        };

        try {
            let result;
            if (finalStatus === 'PUBLISHED' || finalStatus === 'ACTIVE') {
                // First save the current form data as DRAFT, then publish via dedicated endpoint
                await updateAuction(auctionNumber, { ...finalPayload, status: 'DRAFT' });
                result = await publishExistingAuction(auctionNumber);
                
                if (finalStatus === 'ACTIVE') {
                    // Then change status to ACTIVE
                    result = await changeAuctionStatus(auctionNumber, 'ACTIVE');
                }
            } else {
                result = await updateAuction(auctionNumber, { ...finalPayload, status: finalStatus });
            }

            if (result.code === '00' || result.code === 'SUCCESS' || (result as any).id) {
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/dashboard/insurance/auctions/${auctionNumber}`);
                }, 1500);
            } else {
                const errorStr = result.message || JSON.stringify(result) || 'Error al actualizar subasta';
                setError(`Error: ${errorStr}`);
            }
        } catch (err: any) {
            setError(`Error de conexión con el servidor: ${err.message || ''}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAction(formData?.status || 'PUBLISHED');
    };

    const addSupply = () => {
        if (!formData) return;
        setFormData({
            ...formData,
            requiredSupplies: [...(formData.requiredSupplies || []), { itemName: '', description: '', quantity: 1, referenceAmount: 0 }]
        });
    };

    const removeSupply = (index: number) => {
        if (!formData) return;
        const newSupplies = [...(formData.requiredSupplies || [])];
        newSupplies.splice(index, 1);
        setFormData({ ...formData, requiredSupplies: newSupplies });
    };

    const updateSupply = (index: number, field: keyof RequiredSupply, value: any) => {
        if (!formData) return;
        const newSupplies = [...(formData.requiredSupplies || [])];
        newSupplies[index] = { ...newSupplies[index], [field]: value };
        setFormData({ ...formData, requiredSupplies: newSupplies });
    };

    if (isLoading || !formData) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-alteha-violet animate-spin mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando subasta para editar...</p>
            </div>
        );
    }

    // Once the auction has received its first bid, its conditions are locked — no editing allowed.
    if (hasBids) {
        return (
            <div className="max-w-2xl mx-auto font-outfit py-16">
                <Link href={`/dashboard/insurance/auctions/${auctionNumber}`} className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-6 font-bold group w-fit">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a Detalles
                </Link>
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Esta subasta ya no se puede editar</h2>
                        <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                            La subasta <span className="font-bold text-slate-700">#{auctionNumber}</span> ya recibió ofertas. Para mantener la transparencia con los participantes, sus condiciones quedan bloqueadas.
                        </p>
                    </div>
                    <Link href={`/dashboard/insurance/auctions/${auctionNumber}`} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-105 transition-transform">
                        Volver a la subasta
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto font-outfit pb-20">
            <Link href={`/dashboard/insurance/auctions/${auctionNumber}`} className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-6 font-bold group w-fit">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver a Detalles
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight">Editar Subasta</h2>
                        <p className="text-slate-400 font-medium mt-1">Modificando #{auctionNumber}</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Gavel className="w-8 h-8 text-alteha-turquoise" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 border-b pb-4">Información General</h3>
                            <FormInput
                                label="Título de la Subasta"
                                value={formData.title}
                                onChange={(v: string) => setFormData({ ...formData, title: v })}
                                disabled={hasBids}
                                description="Un título descriptivo ayuda a los especialistas a identificar rápidamente el tipo de intervención."
                            />
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Historia Médica / Antecedentes</label>
                                <textarea
                                    value={formData.medicalHistory}
                                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all min-h-[120px] outline-none"
                                />
                                <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Incluye diagnósticos previos, alergias o condiciones que el médico deba considerar antes de ofertar.</p>
                            </div>
                            {hasBids && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 text-xs font-bold"
                                >
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                                    Esta subasta ya tiene ofertas. Algunos campos críticos están bloqueados para proteger el proceso.
                                </motion.div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 border-b pb-4">Detalles Clínicos</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad Requerida</label>
                                        </div>
                                        <select
                                            value={formData.specialty.id}
                                            disabled={hasBids}
                                            onChange={(e) => setFormData({ ...formData, specialty: { id: parseInt(e.target.value) } })}
                                            className={`w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all appearance-none outline-none ${hasBids ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {specialties.map(s => (
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

                                    <FormInput
                                        label="Requerimientos Especiales"
                                        value={formData.specialRequirements}
                                        onChange={(v: string) => setFormData({ ...formData, specialRequirements: v })}
                                        description="Cualquier necesidad técnica adicional que el médico deba prever."
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 border-b pb-4">Presupuesto y Plazos</h3>
                                <div className="space-y-4">
                                    <FormInput
                                        label="Presupuesto Máximo Final ($)"
                                        type="number"
                                        disabled={true}
                                        value={formData.maxBudget}
                                        description="Calculado automáticamente: Honorarios + Gastos de Clínica."
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormInput
                                            label="Honorarios Médicos ($)"
                                            type="number"
                                            disabled={hasBids}
                                            value={formData.doctorBudget}
                                            onChange={(v: string) => {
                                                const doctorBudget = parseFloat(v) || 0;
                                                setFormData({
                                                    ...formData,
                                                    doctorBudget,
                                                    maxBudget: doctorBudget + (formData.clinicBudget || 0)
                                                });
                                            }}
                                            description="Monto referencial para el especialista."
                                        />
                                        <FormInput
                                            label="Gastos de Clínica ($)"
                                            type="number"
                                            disabled={hasBids}
                                            value={formData.clinicBudget}
                                            onChange={(v: string) => {
                                                const clinicBudget = parseFloat(v) || 0;
                                                setFormData({
                                                    ...formData,
                                                    clinicBudget,
                                                    maxBudget: clinicBudget + (formData.doctorBudget || 0)
                                                });
                                            }}
                                            description="Monto referencial para hospitalización."
                                        />
                                    </div>
                                    <FormInput
                                        label="Fecha Estimada de Cirugía"
                                        type="date"
                                        value={formData.estimatedSurgeryDate}
                                        onChange={(v: string) => setFormData({ ...formData, estimatedSurgeryDate: v })}
                                        description="La fecha ideal en la que te gustaría que se realice el procedimiento."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 border-b pb-4">Reglas de la Subasta</h3>
                                <div className="space-y-4">
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
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none"
                                        />
                                        <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Fecha y hora límite para enviar propuestas.</p>
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
                                        <p className="text-[9px] text-slate-400 font-medium ml-1 italic">Indica si los médicos pueden ver tu presupuesto al ofertar.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* 
                                         <FormInput
                                             label="Ofertas Mínimas"
                                             type="number"
                                             min="0"
                                             value={formData.minBidsRequired}
                                             onChange={(v: string) => setFormData({ ...formData, minBidsRequired: Math.max(0, parseInt(v) || 0) })}
                                             description="Mínimo de propuestas para validez."
                                         />
                                         */}
                                        <FormInput
                                            label="Auto-extensión (Min.)"
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
                                            description="Tiempo añadido al recibir ofertas tardías. (Máx 60m)."
                                        />
                                </div>
                                </div>

                                {/* Método de Pago */}
                                <div className="space-y-6 pt-6 border-t">
                                    <h3 className="text-xl font-black text-slate-900 border-b pb-4">Métodos de Pago <span className="text-xs font-bold text-slate-400 lowercase">(podés elegir varios)</span></h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'BS_BANK_TRANSFER', label: 'BS_BANK_TRANSFER', desc: 'Una transferencia bancaria común entre cuentas nacionales de Venezuela.' },
                                                { id: 'BS_PAGO_MOVIL', label: 'BS_PAGO_MOVIL', desc: 'El sistema de Pago Móvil, que permite enviar bolívares de forma inmediata usando solo el número de teléfono y la cédula.' },
                                                { id: 'USD_WIRE_SWIFT', label: 'USD_WIRE_SWIFT', desc: 'Una transferencia internacional estándar. Es el método tradicional para mover dinero entre bancos de diferentes países.' },
                                                { id: 'USD_ACH', label: 'USD_ACH', desc: 'Una transferencia bancaria dentro de EE. UU. Común en plataformas como Zelle o cuentas estadounidenses.' },
                                                { id: 'USD_IBAN', label: 'USD_IBAN', desc: 'Una transferencia a una cuenta bancaria internacional (común en Europa).' },
                                                { id: 'BINANCE_PAY', label: 'BINANCE_PAY', desc: 'Pago a través de Binance Pay usando ID o correo electrónico.' },
                                                { id: 'CRYPTO_WALLET', label: 'CRYPTO_WALLET', desc: 'Transferencia directa a billetera de criptomonedas (USDT, BTC, etc.).' }
                                            ].map((method) => (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const sel = formData!.allowedPaymentMethods || [];
                                                        const next = sel.includes(method.id) ? sel.filter((m) => m !== method.id) : [...sel, method.id];
                                                        setFormData({ ...formData!, allowedPaymentMethods: next, methodType: next[0] || method.id });
                                                    }}
                                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-start gap-3 ${formData!.allowedPaymentMethods?.includes(method.id) ? 'border-alteha-violet bg-violet-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                >
                                                    <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${formData!.allowedPaymentMethods?.includes(method.id) ? 'border-alteha-violet bg-alteha-violet' : 'border-slate-200'}`}>
                                                        {formData!.allowedPaymentMethods?.includes(method.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{method.label.replace(/_/g, ' ')}</p>
                                                        <p className="text-[10px] font-medium text-slate-500 leading-tight mt-1">{method.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end border-b pb-4">
                                    <h3 className="text-xl font-black text-slate-900">Participantes Invitados</h3>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-alteha-violet uppercase tracking-widest">{formData.invitedClinicIds?.length || 0} Clínicas</p>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formData.invitedDoctorIds?.length || 0} Médicos</p>
                                    </div>
                                </div>
                                {hasBids && (
                                    <p className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-2 rounded-xl uppercase tracking-widest inline-flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> Hay ofertas — cambiar los invitados puede afectar a quienes ya ofertaron.
                                    </p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Clinics */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Building2 className="w-4 h-4" /> Clínicas
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={handleSelectAllClinics}
                                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${allClinicsSelected ? 'bg-alteha-violet text-white' : 'bg-slate-100 text-slate-500 hover:bg-alteha-violet/10 hover:text-alteha-violet'}`}
                                            >
                                                {allClinicsSelected ? '✓ Todas' : 'Todas'}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="Filtrar clínicas..."
                                                value={clinicSearch}
                                                onChange={(e) => setClinicSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl text-xs font-bold text-slate-900 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {(Array.isArray(clinics) ? clinics : [])
                                                .filter((c: any) => c.name?.toLowerCase().includes(clinicSearch.toLowerCase()))
                                                .map((clinic: any) => (
                                                    <div
                                                        key={clinic.id}
                                                        onClick={() => {
                                                            if (!formData) return;
                                                            const ids = formData.invitedClinicIds || [];
                                                            if (ids.includes(clinic.id)) {
                                                                const newIds = ids.filter((id: number) => id !== clinic.id);
                                                                const remainingDocs = doctors.filter((d: any) => d.preferredClinics?.some((pc: any) => newIds.includes(pc.id))).map((d: any) => d.id);
                                                                setFormData({ ...formData, invitedClinicIds: newIds, invitedDoctorIds: formData.invitedDoctorIds?.filter((id: number) => remainingDocs.includes(id)) || [] });
                                                            } else {
                                                                setFormData({ ...formData, invitedClinicIds: [...ids, clinic.id] });
                                                            }
                                                        }}
                                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${formData.invitedClinicIds?.includes(clinic.id) ? 'border-alteha-violet bg-violet-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center p-1 shadow-sm flex-shrink-0">
                                                            {clinic.logoUrl ? <img src={clinic.logoUrl} className="w-full h-full object-contain" /> : <Building2 className="w-6 h-6 text-slate-200" />}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 truncate">{clinic.name}</span>
                                                        {formData.invitedClinicIds?.includes(clinic.id) && <CheckCircle2 className="w-5 h-5 text-alteha-violet ml-auto flex-shrink-0" />}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Doctors */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Users className="w-4 h-4" /> Médicos
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={handleSelectAllDoctors}
                                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${allDoctorsSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                            >
                                                {allDoctorsSelected ? '✓ Todos' : 'Todos'}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="Filtrar médicos..."
                                                value={doctorSearch}
                                                onChange={(e) => setDoctorSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl text-xs font-bold text-slate-900 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredDoctors
                                                .filter((d: any) => `${d.firstName} ${d.lastName}`.toLowerCase().includes(doctorSearch.toLowerCase()))
                                                .map((doctor: any) => (
                                                    <div
                                                        key={doctor.id}
                                                        onClick={() => {
                                                            if (!formData) return;
                                                            const ids = formData.invitedDoctorIds || [];
                                                            setFormData({ ...formData, invitedDoctorIds: ids.includes(doctor.id) ? ids.filter((id: number) => id !== doctor.id) : [...ids, doctor.id] });
                                                        }}
                                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${formData.invitedDoctorIds?.includes(doctor.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <div className="w-10 h-10 bg-white rounded-full border overflow-hidden shadow-sm flex-shrink-0">
                                                            {doctor.profileImageUrl ? <img src={doctor.profileImageUrl} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-200" />}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 truncate">{doctor.firstName} {doctor.lastName}</span>
                                                        {formData.invitedDoctorIds?.includes(doctor.id) && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />}
                                                    </div>
                                                ))}
                                            {filteredDoctors.length === 0 && (
                                                <p className="text-[11px] text-slate-400 font-medium italic px-1">Selecciona clínicas para ver sus médicos disponibles.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Supplies Section */}
                        <div className="space-y-6 pt-6 border-t">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-slate-900 italic underline decoration-alteha-violet underline-offset-8 uppercase tracking-tighter">Insumos Requeridos</h3>
                                    {hasBids && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase tracking-widest">Advertencia: Hay Ofertas</span>}
                                </div>
                                <Button
                                    type="button"
                                    onClick={addSupply}
                                    className="bg-alteha-violet text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar Insumo
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {(formData.requiredSupplies || []).map((supply, index) => (
                                    <motion.div
                                        layout
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 relative group"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => removeSupply(index)}
                                            className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors bg-white p-2 rounded-xl border border-slate-100 shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-10">
                                            <FormInput
                                                label="Nombre del Insumo"
                                                value={supply.itemName}
                                                onChange={(v: string) => updateSupply(index, 'itemName', v)}
                                                placeholder="Ej: Malla Prolene"
                                            />
                                            <FormInput
                                                label="Descripción / Ref"
                                                value={supply.description}
                                                onChange={(v: string) => updateSupply(index, 'description', v)}
                                                placeholder="Especificaciones..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <FormInput
                                                label="Cantidad"
                                                type="number"
                                                value={supply.quantity}
                                                onChange={(v: string) => updateSupply(index, 'quantity', parseInt(v))}
                                            />
                                            <FormInput
                                                label="Precio Ref ($)"
                                                type="number"
                                                value={supply.referenceAmount}
                                                onChange={(v: string) => updateSupply(index, 'referenceAmount', parseFloat(v))}
                                            />
                                            <div className="flex flex-col justify-end">
                                                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-right shadow-sm">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subtotal Ref.</p>
                                                    <p className="text-lg font-black text-slate-900">${((supply.quantity || 0) * (supply.referenceAmount || 0)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {formData.requiredSupplies?.length === 0 && (
                                    <div className="py-20 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 italic font-medium text-sm">
                                        No se han definido insumos para esta subasta
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t flex flex-col items-center gap-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-3 font-bold text-sm"
                            >
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                Subasta actualizada correctamente. Redirigiendo...
                            </motion.div>
                        )}
                        {formData.status === 'DRAFT' ? (
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleAction('DRAFT')}
                                    className="bg-slate-100 text-slate-600 px-8 py-5 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all flex items-center gap-2 flex-1 md:flex-initial"
                                >
                                    Guardar Borrador
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleAction('PUBLISHED')}
                                    className="bg-alteha-violet text-white px-12 py-5 rounded-[1.5rem] font-black shadow-xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-3 flex-1 md:flex-initial"
                                >
                                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            <Gavel className="w-6 h-6" />
                                            Publicar Subasta
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-alteha-violet text-white px-12 py-5 rounded-[1.5rem] font-black shadow-xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-3 w-full md:w-auto"
                            >
                                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <Save className="w-6 h-6" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
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
