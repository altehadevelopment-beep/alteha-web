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
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Upload,
    MapPin,
    Clock,
    Eye,
    Download,
    Plus,
    Edit
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    getAuctionDetails,
    getAuctionAttachments,
    addAuctionAttachments,
    publishExistingAuction,
    type Auction,
    type AuctionAttachment
} from '@/lib/api';
import { Button } from '@/components/ui/Button';

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    'DRAFT': { label: 'Borrador', color: 'bg-slate-100 text-slate-600', icon: FileText },
    'PUBLISHED': { label: 'Publicada', color: 'bg-blue-50 text-blue-600', icon: Clock },
    'ACTIVE': { label: 'Activa', color: 'bg-emerald-50 text-emerald-600', icon: Gavel },
    'AWARDED': { label: 'Adjudicada', color: 'bg-alteha-violet/10 text-alteha-violet', icon: CheckCircle2 },
    'CANCELLED': { label: 'Cancelada', color: 'bg-red-50 text-red-600', icon: AlertCircle },
    'COMPLETED': { label: 'Finalizada', color: 'bg-slate-900 text-white', icon: CheckCircle2 }
};

export default function AuctionDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const auctionNumber = params.id as string;

    const [auction, setAuction] = useState<Auction | null>(null);
    const [attachments, setAttachments] = useState<AuctionAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [auctionRes, attachmentsRes] = await Promise.all([
                getAuctionDetails(auctionNumber),
                getAuctionAttachments(auctionNumber, 'INSURANCE_COMPANY')
            ]);

            // Handle possible raw auction object or wrapped response
            if (auctionRes.code === '00' && auctionRes.data) {
                setAuction(auctionRes.data);
            } else if ((auctionRes as any).id) {
                setAuction(auctionRes as any);
            } else {
                setError(auctionRes.message || 'Error al cargar detalles');
            }

            // Handle possible raw array or wrapped response for attachments
            if (attachmentsRes.code === '00') {
                setAttachments(attachmentsRes.data || []);
            } else if (Array.isArray(attachmentsRes)) {
                setAttachments(attachmentsRes);
            }
        } catch (err) {
            console.error('Load error:', err);
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [auctionNumber]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            const result = await addAuctionAttachments(auctionNumber, files);

            // Handle both wrapped ApiResponse and raw result or array
            if (result.code === '00' && result.data) {
                setAttachments(prev => [...result.data!, ...prev]);
            } else if (Array.isArray(result)) {
                setAttachments(prev => [...result, ...prev]);
            } else if ((result as any).id) {
                // If single attachment object returned
                setAttachments(prev => [result as any, ...prev]);
            } else {
                alert(result.message || 'Error al subir archivos (formato no soportado)');
            }
        } catch (err) {
            alert('Error al conectar con el servidor');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePublish = async () => {
        if (!auction) return;
        if (!confirm('¿Estás seguro de que deseas publicar esta subasta?')) return;

        setIsLoading(true);
        try {
            const result = await publishExistingAuction(auctionNumber);
            if (result.code === '00' || result.code === 'SUCCESS' || (result as any).id) {
                await loadData();
            } else {
                alert(result.message || 'Error al publicar subasta');
            }
        } catch (err) {
            console.error('Publish error:', err);
            alert('Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-alteha-violet animate-spin mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando detalles de subasta...</p>
            </div>
        );
    }

    if (error || !auction) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-4">¡Ups! Algo salió mal</h2>
                <p className="text-slate-500 mb-8 font-medium">{error || 'No pudimos encontrar esta subasta.'}</p>
                <Link href="/dashboard/insurance/auctions">
                    <Button className="bg-slate-900 text-white px-8 py-3 rounded-2xl">Volver al listado</Button>
                </Link>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[auction.status] || STATUS_CONFIG['DRAFT'];

    return (
        <div className="max-w-6xl mx-auto font-outfit pb-20">
            <div className="flex justify-between items-center mb-10">
                <Link href="/dashboard/insurance/auctions" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors font-bold group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a Subastas
                </Link>
                <div className="flex items-center gap-3">
                    {['DRAFT', 'PUBLISHED', 'ACTIVE'].includes(auction.status) && (
                        <Link href={`/dashboard/insurance/auctions/${auctionNumber}/edit`}>
                            <Button className="bg-white text-slate-900 border-2 border-slate-900 px-6 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all">
                                <Edit className="w-4 h-4" />
                                Editar Subasta
                            </Button>
                        </Link>
                    )}
                    {auction.status === 'DRAFT' && (
                        <Button
                            onClick={handlePublish}
                            className="bg-alteha-violet text-white px-6 py-2 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-violet-100 hover:scale-105 transition-all"
                        >
                            <Gavel className="w-4 h-4" />
                            Publicar Subasta
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusConfig.color} mb-4 inline-block`}>
                                    {statusConfig.label}
                                </span>
                                <h1 className="text-4xl font-black tracking-tight mb-2">{auction.title}</h1>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    #{auction.auctionNumber} • <Clock className="w-3 h-3" /> Creada el {new Date(auction.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="p-10 space-y-10">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 text-white shadow-xl shadow-slate-200">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Presupuesto Máximo</p>
                                            <p className="text-4xl font-black">${auction.maxBudget.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-2xl">
                                            <DollarSign className="w-6 h-6 text-alteha-turquoise" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Hon. Médicos</p>
                                            <p className="text-sm font-black text-white">${(auction.doctorBudget || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Gastos Clínica</p>
                                            <p className="text-sm font-black text-white">${(auction.clinicBudget || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-alteha-turquoise/5 p-6 rounded-[2rem] border border-alteha-turquoise/10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ofertas Recibidas</p>
                                        <p className="text-3xl font-black text-alteha-turquoise">{auction.totalBids || 0}</p>
                                    </div>
                                    <div className="bg-alteha-violet/5 p-6 rounded-[2rem] border border-alteha-violet/10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Min. Solicitado</p>
                                        <p className="text-3xl font-black text-alteha-violet">{auction.minBidsRequired}</p>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 col-span-2 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo de Subasta</p>
                                            <p className="text-xl font-black text-slate-900">{auction.durationHours} Horas</p>
                                        </div>
                                        <Clock className="w-6 h-6 text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-alteha-violet" />
                                    Descripción y Contexto
                                </h3>
                                <p className="text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border-l-4 border-alteha-violet">
                                    {auction.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Información Médica</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-alteha-violet/10 rounded-lg"><Stethoscope className="w-4 h-4 text-alteha-violet" /></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Especialidad</p>
                                                <p className="font-bold text-slate-900">{auction.specialty?.name || auction.specialty?.code || 'No especificada'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-alteha-violet/10 rounded-lg"><AlertCircle className="w-4 h-4 text-alteha-violet" /></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Antecedentes</p>
                                                <p className="font-bold text-slate-900 whitespace-pre-wrap">{auction.medicalHistory || 'Sin antecedentes registrados.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Planificación</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-alteha-turquoise/10 rounded-lg"><Calendar className="w-4 h-4 text-alteha-turquoise" /></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fecha Estimada Cirugía</p>
                                                <p className="font-bold text-slate-900">{auction.estimatedSurgeryDate ? new Date(auction.estimatedSurgeryDate).toLocaleDateString() : 'Por definir'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-alteha-turquoise/10 rounded-lg"><MapPin className="w-4 h-4 text-alteha-turquoise" /></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                                                <p className="font-bold text-slate-900">{auction.preferredLocation}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-alteha-turquoise" />
                                    Insumos Especiales
                                </h3>
                                {auction.requiredSupplies && auction.requiredSupplies.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {auction.requiredSupplies.map((s, i) => (
                                            <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                                <div>
                                                    <p className="font-black text-slate-900 mb-1">{s.itemName}</p>
                                                    <p className="text-xs text-slate-400 font-bold max-w-[180px]">{s.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cant x Precio</p>
                                                    <p className="text-sm font-black text-alteha-violet">{s.quantity} x ${s.referenceAmount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                                        <p className="text-slate-400 font-bold text-sm italic">No se han requerido insumos específicos</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Patient & Attachments */}
                <div className="space-y-8">
                    {/* Patient Card */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-50 text-center">
                        <div className="w-24 h-24 bg-slate-900 rounded-[2rem] mx-auto mb-6 flex items-center justify-center overflow-hidden shadow-2xl shadow-slate-200 border-4 border-white">
                            {auction.patient?.profileImageUrl ? (
                                <img src={auction.patient.profileImageUrl} alt="Patient" className="w-full h-full object-cover" />
                            ) : <User className="w-12 h-12 text-white/50" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{auction.patient?.firstName} {auction.patient?.lastName}</h3>
                        <p className="text-slate-400 font-bold text-sm mb-6 uppercase tracking-widest">Paciente Beneficiario</p>

                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documento</p>
                                <p className="text-xs font-bold text-slate-900">{auction.patient?.identificationNumber}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Edad/Género</p>
                                <p className="text-xs font-bold text-slate-900">{auction.patientAge} años • {auction.patientGender}</p>
                            </div>
                        </div>
                    </div>

                    {/* Attachments Card */}
                    <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-50 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900">Adjuntos</h3>
                            <div className="relative">
                                <input type="file" id="attach-file" className="hidden" multiple onChange={handleFileUpload} />
                                <label htmlFor="attach-file" className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                </label>
                            </div>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto space-y-3 thin-scrollbar">
                            {attachments.length === 0 ? (
                                <div className="py-20 text-center px-6">
                                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Sin documentos adjuntos</p>
                                </div>
                            ) : (
                                attachments.map(att => (
                                    <div key={att.id} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-alteha-violet transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-alteha-violet transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="max-w-[120px]">
                                                <p className="text-[10px] font-black text-slate-900 truncate">{att.fileName}</p>
                                                <p className="text-[8px] font-bold text-slate-400">{(att.fileSize / 1024).toFixed(0)} KB</p>
                                            </div>
                                        </div>
                                        <a href={att.fileUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 hover:text-alteha-violet transition-colors shadow-sm">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
