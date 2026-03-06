"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    UserPlus,
    ChevronLeft,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Edit2,
    SearchX,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { searchPatient, type Patient } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function PatientsPage() {
    const [documentType, setDocumentType] = useState('CEDULA');
    const [documentNumber, setDocumentNumber] = useState('');
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentNumber) return;

        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setPatient(null);

        try {
            const result = await searchPatient(documentType, documentNumber);
            if (result.code === '00' && result.data) {
                setPatient(result.data);
            } else {
                setError(result.message || 'No se encontró el paciente');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link href="/dashboard/insurance" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-2 font-bold group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Volver al Dashboard
                    </Link>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Pacientes</h2>
                    <p className="text-slate-500 font-medium mt-1">Busca, registra y gestiona la información de tus beneficiarios.</p>
                </div>
                <Link href="/dashboard/insurance/patients/register">
                    <Button className="bg-alteha-violet text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Registrar Nuevo Paciente
                    </Button>
                </Link>
            </div>

            {/* Search Section */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-48">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo Doc.</label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all appearance-none"
                        >
                            <option value="CEDULA">Cédula</option>
                            <option value="PASAPORTE">Pasaporte</option>
                            <option value="RIF">RIF</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Número de Documento</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ej: 28900788"
                                value={documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value)}
                                className="w-full p-4 pl-12 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all"
                                required
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        </div>
                    </div>
                    <div className="md:mt-6 flex flex-col justify-end">
                        <Button
                            disabled={isLoading}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all h-[58px]"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buscar Paciente"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Results Section */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 space-y-4"
                    >
                        <Loader2 className="w-12 h-12 text-alteha-violet animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Buscando en la base de datos...</p>
                    </motion.div>
                ) : patient ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <div className="bg-alteha-violet p-10 text-white flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                {patient.profileImageUrl ? (
                                    <img src={patient.profileImageUrl} alt="Paciente" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 opacity-50 text-white" />
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-4xl font-black tracking-tight">{patient.firstName} {patient.lastName}</h3>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                                    <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        {patient.status}
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                    <p className="font-bold text-white/80">{patient.identificationType}: {patient.identificationNumber}</p>
                                </div>
                            </div>
                            <Link href={`/dashboard/insurance/patients/${patient.id}/edit`}>
                                <Button className="bg-white text-alteha-violet px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xl shadow-black/10">
                                    <Edit2 className="w-5 h-5" />
                                    Editar Perfil
                                </Button>
                            </Link>
                        </div>

                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <InfoCard icon={Mail} label="Correo Electrónico" value={patient.email} />
                            <InfoCard icon={Phone} label="Teléfono de Contacto" value={patient.phone} />
                            <InfoCard icon={Calendar} label="Fecha de Nacimiento" value={new Date(patient.dateOfBirth).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} />
                            <InfoCard icon={User} label="Género" value={patient.gender} />
                        </div>
                    </motion.div>
                ) : hasSearched && !isLoading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 p-20 text-center space-y-6"
                    >
                        <div className="p-6 bg-white rounded-3xl shadow-sm inline-block mx-auto border border-slate-100">
                            <SearchX className="w-16 h-16 text-slate-300" />
                        </div>
                        <div className="max-w-md mx-auto">
                            <h4 className="text-2xl font-black text-slate-900">Paciente no encontrado</h4>
                            <p className="text-slate-500 font-medium mt-2">
                                No pudimos encontrar ningún paciente con el documento {documentType}: {documentNumber}.
                            </p>
                        </div>
                        <Link href="/dashboard/insurance/patients/register">
                            <Button className="bg-alteha-violet text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-violet-200">
                                Registrar este paciente ahora
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 p-20 text-center space-y-4"
                    >
                        <div className="p-6 bg-white rounded-3xl shadow-sm inline-block mx-auto border border-slate-100">
                            <User className="w-16 h-16 text-slate-200" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-400">Ingresa los datos para buscar</h4>
                            <p className="text-slate-400 text-sm">Los resultados aparecerán aquí una vez realices la búsqueda.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value }: any) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="font-bold text-slate-900 text-lg">{value || 'No especificado'}</p>
        </div>
    );
}
