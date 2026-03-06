"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Save
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { updatePatient, searchPatient, type PatientRegistration, type Patient } from '@/lib/api';

export default function EditPatientPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<Partial<PatientRegistration>>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'FEMENINO',
        dateOfBirth: '',
        address: '',
        latitude: 10.4806,
        longitude: -66.9036,
        allergyIds: [],
        medicalConditionIds: [],
        currentMedicationIds: []
    });

    // We use searchPatient as a fallback to load initial data if we have document info
    // In a real app, we'd have a getPatientById endpoint
    useEffect(() => {
        const loadPatientData = async () => {
            setIsLoading(true);
            try {
                // For demonstration, we'll try to load from a hypothetical endpoint or 
                // search if we had the document number in the URL/state.
                // Since we only have the ID, we'll try to fetch via a proxy that supports GET by ID 
                // or just show the form for the user to fill/update.

                // Let's assume the update endpoint works and we might have a GET endpoint too
                // For now, we'll initialize with empty and let user edit
                // (In a real scenario, this would be populated from a GET call)

                // Mocking the fetch for now as the GET by ID wasn't provided
                setTimeout(() => setIsLoading(false), 800);
            } catch (err) {
                console.error('Load error:', err);
                setError('Error al cargar los datos del paciente');
                setIsLoading(false);
            }
        };

        loadPatientData();
    }, [patientId]);

    const handleInputChange = (field: keyof PatientRegistration, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await updatePatient(patientId, formData);
            if (result.code === '00') {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/dashboard/insurance/patients');
                }, 2000);
            } else {
                setError(result.message || 'Error al actualizar el paciente');
            }
        } catch (err) {
            console.error('Update error:', err);
            setError('Error de conexión con el servidor');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <Loader2 className="w-12 h-12 text-alteha-violet animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto font-outfit pb-20">
            <Link href="/dashboard/insurance/patients" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-6 font-bold group w-fit">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver a Gestión de Pacientes
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight">Editar Paciente</h2>
                        <p className="text-slate-400 font-medium mt-1">ID del Sistema: #{patientId}</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                            <User className="w-8 h-8 text-alteha-turquoise" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 border-b pb-4">Datos Personales</h3>
                            <div className="space-y-4">
                                <FormInput label="Nombres" value={formData.firstName} onChange={(v) => handleInputChange('firstName', v)} />
                                <FormInput label="Apellidos" value={formData.lastName} onChange={(v) => handleInputChange('lastName', v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Género</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all appearance-none"
                                        >
                                            <option value="MASCULINO">Masculino</option>
                                            <option value="FEMENINO">Femenino</option>
                                            <option value="OTRO">Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">F. Nacimiento</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all font-outfit"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 border-b pb-4">Información de Contacto</h3>
                            <div className="space-y-4">
                                <FormInput label="Email" type="email" value={formData.email} onChange={(v) => handleInputChange('email', v)} />
                                <FormInput label="Teléfono" value={formData.phone} onChange={(v) => handleInputChange('phone', v)} />
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all min-h-[120px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t flex flex-col items-center gap-6">
                        {error && (
                            <div className="w-full p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="w-full p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
                                <CheckCircle2 className="w-5 h-5" />
                                Paciente actualizado correctamente. Redirigiendo...
                            </div>
                        )}
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-alteha-violet text-white px-12 py-5 rounded-[1.5rem] font-black shadow-xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-3 w-full md:w-auto"
                        >
                            {isSaving ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-6 h-6" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormInput({ label, type = "text", value, onChange }: any) {
    return (
        <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
            />
        </div>
    );
}
