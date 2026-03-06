"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Gavel,
    Stethoscope,
    Calendar,
    DollarSign,
    Loader2,
    AlertCircle,
    CheckCircle2,
    FileText,
    Clock,
    MapPin,
    User,
    Activity,
    Hospital
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAuctionDetailsAsDoctor, type Auction } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
    'DRAFT': { label: 'Borrador', color: 'bg-slate-100 text-slate-600', dotColor: 'bg-slate-400' },
    'PUBLISHED': { label: 'Publicada', color: 'bg-blue-50 text-blue-600', dotColor: 'bg-blue-500' },
    'ACTIVE': { label: 'Activa', color: 'bg-emerald-50 text-emerald-600', dotColor: 'bg-emerald-500 animate-pulse' },
    'AWARDED': { label: 'Adjudicada', color: 'bg-violet-50 text-violet-600', dotColor: 'bg-violet-500' },
    'CANCELLED': { label: 'Cancelada', color: 'bg-red-50 text-red-600', dotColor: 'bg-red-500' },
    'COMPLETED': { label: 'Finalizada', color: 'bg-slate-900 text-white', dotColor: 'bg-white' },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
    'LOW': { label: 'Prioridad Baja', color: 'bg-slate-50 text-slate-500' },
    'MEDIUM': { label: 'Prioridad Media', color: 'bg-amber-50 text-amber-600' },
    'HIGH': { label: 'Prioridad Alta', color: 'bg-orange-50 text-orange-600' },
    'CRITICAL': { label: 'Urgente', color: 'bg-red-50 text-red-600' },
    'URGENT': { label: 'Urgente', color: 'bg-red-50 text-red-600' },
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | number | null }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-xl flex-shrink-0">
                <Icon className="w-4 h-4 text-alteha-violet" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

export default function DoctorAuctionDetailPage() {
    const params = useParams();
    const auctionNumber = params.id as string;

    const [auction, setAuction] = useState<Auction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await getAuctionDetailsAsDoctor(auctionNumber);
                if (res.code === '00' && res.data) {
                    setAuction(res.data);
                } else if ((res as any).id) {
                    setAuction(res as any);
                } else {
                    setError(res.message || 'No se pudo cargar la subasta');
                }
            } catch (err) {
                setError('Error de conexión con el servidor');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [auctionNumber]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-alteha-violet animate-spin mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando subasta...</p>
            </div>
        );
    }

    if (error || !auction) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">Error al cargar</h2>
                <p className="text-slate-500 mb-6">{error || 'Subasta no encontrada'}</p>
                <Link href="/dashboard/specialist/auctions">
                    <Button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black">
                        Volver a Subastas
                    </Button>
                </Link>
            </div>
        );
    }

    const status = STATUS_CONFIG[auction.status] || STATUS_CONFIG['PUBLISHED'];
    const urgency = URGENCY_CONFIG[auction.urgencyLevel] || URGENCY_CONFIG['LOW'];

    return (
        <div className="max-w-4xl mx-auto font-outfit pb-20">
            <Link href="/dashboard/specialist/auctions" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-8 font-bold group w-fit">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver a Convocatorias
            </Link>

            {/* Header card */}
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 mb-8">
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/5 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${status.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                                {status.label}
                            </span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${urgency.color}`}>
                                {urgency.label}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{auction.title}</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <Gavel className="w-3.5 h-3.5" />
                            #{auction.auctionNumber}
                            {auction.createdAt && (
                                <span className="text-slate-500">• Publicada el {new Date(auction.createdAt).toLocaleDateString('es-ES')}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                    <div className="p-6 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Presupuesto Máx.</p>
                        <p className="text-xl font-black text-slate-900">${(auction.maxBudget || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ofertas</p>
                        <p className="text-xl font-black text-alteha-turquoise">{auction.totalBids || 0}</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duración</p>
                        <p className="text-xl font-black text-slate-900">{auction.durationHours || '—'}h</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mín. Ofertas</p>
                        <p className="text-xl font-black text-slate-900">{auction.minBidsRequired || '—'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Medical info */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 p-8 space-y-6">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-alteha-violet" />
                            Información Médica
                        </h2>

                        <div className="space-y-4">
                            <InfoRow icon={Stethoscope} label="Especialidad" value={auction.specialty?.name || auction.specialty?.code} />
                            <InfoRow icon={User} label="Edad del paciente" value={auction.patientAge ? `${auction.patientAge} años` : null} />
                            <InfoRow icon={MapPin} label="Ubicación preferida" value={auction.preferredLocation} />
                            <InfoRow icon={Hospital} label="Hospitalización" value={auction.requiresHospitalization ? 'Sí requiere hospitalización' : 'No requiere hospitalización'} />
                            <InfoRow icon={Clock} label="Duración estimada" value={auction.estimatedDurationDays ? `${auction.estimatedDurationDays} días` : null} />
                            <InfoRow icon={Calendar} label="Fecha estimada de cirugía" value={auction.estimatedSurgeryDate ? new Date(auction.estimatedSurgeryDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                        </div>

                        {auction.medicalHistory && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historia Médica / Antecedentes</p>
                                <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border-l-4 border-alteha-violet">
                                    {auction.medicalHistory}
                                </p>
                            </div>
                        )}

                        {auction.specialRequirements && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requerimientos Especiales</p>
                                <p className="text-slate-600 font-medium leading-relaxed bg-amber-50 p-6 rounded-2xl border-l-4 border-amber-400">
                                    {auction.specialRequirements}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Supplies */}
                    {auction.requiredSupplies && auction.requiredSupplies.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 p-8 space-y-4">
                            <h2 className="text-xl font-black text-slate-900">Insumos Requeridos</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {auction.requiredSupplies.map((s, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100"
                                    >
                                        <div>
                                            <p className="font-black text-slate-900">{s.itemName}</p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">{s.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cant × Precio</p>
                                            <p className="font-black text-alteha-violet">{s.quantity} × ${(s.referenceAmount || 0).toLocaleString()}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Side panel */}
                <div className="space-y-6">
                    {/* Budget breakdown */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Desglose del Presupuesto</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm font-bold">Total Máximo</span>
                                <span className="font-black text-xl">${(auction.maxBudget || 0).toLocaleString()}</span>
                            </div>
                            {(auction.doctorBudget || 0) > 0 && (
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                    <span className="text-slate-400 text-xs font-bold">Honorarios Médicos</span>
                                    <span className="font-black text-alteha-turquoise">${(auction.doctorBudget || 0).toLocaleString()}</span>
                                </div>
                            )}
                            {(auction.clinicBudget || 0) > 0 && (
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                    <span className="text-slate-400 text-xs font-bold">Gastos de Clínica</span>
                                    <span className="font-black text-alteha-violet">${(auction.clinicBudget || 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auction dates */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 p-8 space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Plazos de la Subasta</h3>
                        <div className="space-y-4">
                            {auction.endDate && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-xl">
                                        <Clock className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cierre de Ofertas</p>
                                        <p className="font-bold text-slate-900">{new Date(auction.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-extensión</p>
                                    <p className="font-bold text-slate-900">{auction.autoExtendMinutes || 0} minutos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient */}
                    {auction.patient && (
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 p-8 space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Paciente</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
                                    {auction.patient.profileImageUrl
                                        ? <img src={auction.patient.profileImageUrl} alt="Patient" className="w-full h-full object-cover" />
                                        : <User className="w-7 h-7 text-slate-400" />
                                    }
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">{auction.patient.firstName} {auction.patient.lastName}</p>
                                    <p className="text-xs text-slate-400 font-bold">{auction.patientAge} años • {auction.patientGender}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
