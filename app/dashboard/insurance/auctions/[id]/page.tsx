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
    Edit,
    Zap,
    ShieldCheck,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    getAuctionDetails,
    getAuctionAttachments,
    addAuctionAttachments,
    publishExistingAuction,
    changeAuctionStatus,
    type Auction,
    type AuctionAttachment
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import AuctionBidsList from '@/components/auctions/AuctionBidsList';

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
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [auctionRes, attachmentsRes] = await Promise.all([
                getAuctionDetails(auctionNumber),
                getAuctionAttachments(auctionNumber, 'INSURANCE_COMPANY')
            ]);

            if (auctionRes.code === '00' && auctionRes.data) {
                setAuction(auctionRes.data);
            } else if ((auctionRes as any).id) {
                setAuction(auctionRes as any);
            } else {
                setError(auctionRes.message || 'Error al cargar detalles');
            }

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
            if (result.code === '00' && result.data) {
                setAttachments(prev => [...result.data!, ...prev]);
            } else if (Array.isArray(result)) {
                setAttachments(prev => [...result, ...prev]);
            } else if ((result as any).id) {
                setAttachments(prev => [result as any, ...prev]);
            } else {
                alert(result.message || 'Error al subir archivos');
            }
        } catch (err) {
            alert('Error al conectar con el servidor');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishModalOpen(true);
    };

    const confirmPublish = async () => {
        if (!auction) return;
        setIsPublishing(true);
        try {
            const result = await publishExistingAuction(auctionNumber);
            if (result.code === '00' || result.code === 'SUCCESS' || (result as any).id) {
                setIsPublishModalOpen(false);
                await loadData();
            } else {
                alert(result.message || 'Error al publicar subasta');
            }
        } catch (err) {
            console.error('Publish error:', err);
            alert('Error al conectar con el servidor');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleActivate = async () => {
        setIsStatusModalOpen(true);
    };

    const confirmActivate = async () => {
        if (!auction) return;
        setIsActivating(true);
        try {
            const result = await changeAuctionStatus(auction.auctionNumber, 'ACTIVE', 'Activación manual desde el panel');
            if (result.code === '00' || (result as any).id) {
                setIsStatusModalOpen(false);
                await loadData();
            } else {
                alert(result.message || 'Error al activar subasta');
            }
        } catch (err) {
            console.error('Activate error:', err);
            alert('Error al conectar con el servidor');
        } finally {
            setIsActivating(false);
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
                    {auction.status === 'PUBLISHED' && (
                        <Button
                            onClick={handleActivate}
                            className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Activar Subasta
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute right-0 top-0 w-96 h-96 bg-alteha-turquoise/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute left-0 bottom-0 w-64 h-64 bg-alteha-violet/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${statusConfig.color} shadow-lg shadow-black/20`}>
                                {statusConfig.label}
                            </span>
                            {(!auction.invitedDoctorIds?.length && !auction.invitedClinicIds?.length) && (
                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Convocatoria Pública
                                </span>
                            )}
                            {auction.urgencyLevel === 'URGENT' && (
                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-red-500 text-white shadow-lg shadow-red-500/20 flex items-center gap-2">
                                    <Zap className="w-3 h-3 fill-current" /> Alta Prioridad
                                </span>
                            )}
                        </div>
                        
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight max-w-3xl drop-shadow-sm uppercase">
                            {auction.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <FileText className="w-5 h-5 text-alteha-turquoise" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Número de Subasta</p>
                                    <p className="text-sm font-black text-white">#{auction.auctionNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <Calendar className="w-5 h-5 text-alteha-violet" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Creación</p>
                                    <p className="text-sm font-black text-white">{new Date(auction.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-12">
                    {/* Main Content Grid inside the card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Summary Section (Left inside) */}
                        <div className="lg:col-span-8 space-y-10">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-alteha-turquoise/20 transition-all" />
                                    
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Presupuesto Máximo</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-alteha-turquoise">$</span>
                                                <span className="text-4xl font-black tracking-tighter">{auction.maxBudget.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 bg-white/5 rounded-[1.25rem] flex items-center justify-center border border-white/10 shadow-inner">
                                            <DollarSign className="w-7 h-7 text-alteha-turquoise" />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-alteha-turquoise" /> Hon. Médicos
                                            </p>
                                            <p className="text-xl font-black text-white">${(auction.doctorBudget || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-alteha-violet" /> Gastos Clínica
                                            </p>
                                            <p className="text-xl font-black text-white">${(auction.clinicBudget || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl shadow-slate-100 flex flex-col justify-between group hover:border-alteha-turquoise/30 transition-all">
                                        <div className="w-12 h-12 bg-alteha-turquoise/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Gavel className="w-6 h-6 text-alteha-turquoise" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ofertas Recibidas</p>
                                            <p className="text-4xl font-black text-slate-900 tracking-tighter">{auction.totalBids || 0}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl shadow-slate-100 flex flex-col justify-between group hover:border-alteha-violet/30 transition-all">
                                        <div className="w-12 h-12 bg-alteha-violet/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-6 h-6 text-alteha-violet" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mín. Requerido</p>
                                            <p className="text-4xl font-black text-slate-900 tracking-tighter">{auction.minBidsRequired}</p>
                                        </div>
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
                        </div>

                        {/* Patient & Attachments (Right inside) */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Patient Info Card (Clean version) */}
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-alteha-violet/5 rounded-full blur-2xl" />
                                
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center overflow-hidden shadow-xl border-4 border-white">
                                        {auction.patient?.profileImageUrl ? (
                                            <img src={auction.patient.profileImageUrl} alt="Patient" className="w-full h-full object-cover" />
                                        ) : <User className="w-10 h-10 text-white/50" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight">
                                            {auction.patient?.firstName}<br />{auction.patient?.lastName}
                                        </h3>
                                        <p className="text-alteha-violet font-black text-[9px] uppercase tracking-widest mt-1">Paciente Beneficiario</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documento</span>
                                        <span className="text-sm font-black text-slate-900">{auction.patient?.identificationNumber}</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edad/Género</span>
                                        <span className="text-sm font-black text-slate-900">
                                            {auction.patientAge} años • {auction.patientGender === 'FEMALE' ? 'F' : 'M'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Attachments inside card */}
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Adjuntos</h3>
                                    <div className="relative">
                                        <input type="file" id="attach-file" className="hidden" multiple onChange={handleFileUpload} />
                                        <label htmlFor="attach-file" className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto thin-scrollbar pr-2">
                                    {attachments.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">Sin documentos</p>
                                    ) : (
                                        attachments.map(att => (
                                            <div key={att.id} className="p-3 bg-white rounded-xl border border-transparent hover:border-alteha-violet transition-all flex items-center justify-between group shadow-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                    <p className="text-[10px] font-black text-slate-900 truncate">{att.fileName}</p>
                                                </div>
                                                <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-alteha-violet">
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                        <div className="space-y-4">
                            <h4 className="text-base font-black text-slate-400 uppercase tracking-widest">Información Médica</h4>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-alteha-violet/10 rounded-xl"><Stethoscope className="w-5 h-5 text-alteha-violet" /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Especialidad</p>
                                        <p className="text-lg font-black text-slate-900">{auction.specialty?.name || auction.specialty?.code || 'No especificada'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-alteha-violet/10 rounded-xl"><AlertCircle className="w-5 h-5 text-alteha-violet" /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Antecedentes</p>
                                        <p className="text-lg font-black text-slate-900 whitespace-pre-wrap leading-tight">{auction.medicalHistory || 'Sin antecedentes registrados.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-base font-black text-slate-400 uppercase tracking-widest">Planificación y Logística</h4>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-alteha-turquoise/10 rounded-xl"><Calendar className="w-5 h-5 text-alteha-turquoise" /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Fecha Estimada Cirugía</p>
                                        <p className="text-lg font-black text-slate-900">{auction.estimatedSurgeryDate ? new Date(auction.estimatedSurgeryDate).toLocaleDateString() : 'Por definir'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-alteha-turquoise/10 rounded-xl"><MapPin className="w-5 h-5 text-alteha-turquoise" /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                                        <p className="text-lg font-black text-slate-900">{auction.preferredLocation}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-alteha-turquoise/10 rounded-xl"><Clock className="w-5 h-5 text-alteha-turquoise" /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Hospitalización / Duración</p>
                                        <p className="text-lg font-black text-slate-900">
                                            {auction.requiresHospitalization ? 'SÍ requiere' : 'NO requiere'} • {auction.estimatedDurationDays} {auction.estimatedDurationDays === 1 ? 'día' : 'días'} est.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-alteha-turquoise/10 rounded-xl"><AlertCircle className="w-5 h-5 text-alteha-turquoise" /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Prioridad</p>
                                        <p className={`text-lg font-black ${auction.urgencyLevel === 'URGENT' || auction.urgencyLevel === 'HIGH' ? 'text-red-600' : 'text-slate-900'}`}>
                                            {auction.urgencyLevel === 'LOW' ? 'Baja' : auction.urgencyLevel === 'MEDIUM' ? 'Media' : auction.urgencyLevel === 'HIGH' ? 'Alta' : 'Urgente'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-50">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-alteha-violet" />
                            Reglas y Requerimientos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Reglas de Cierre</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">Fecha Límite:</span>
                                        <span className="text-xs font-black text-slate-900">{new Date(auction.endDate).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">Auto-extensión:</span>
                                        <span className="text-xs font-black text-slate-900">{(auction.autoExtendMinutes || 0) / 60} Horas</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">Mínimo de Ofertas:</span>
                                        <span className="text-xs font-black text-slate-900">{auction.minBidsRequired}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Requerimientos Especiales</h4>
                                <p className="text-sm font-bold text-slate-900 italic leading-tight">
                                    {auction.specialRequirements || 'No se registraron requerimientos especiales.'}
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-50">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-alteha-turquoise" />
                            Insumos Especiales
                        </h3>
                        {auction.requiredSupplies && auction.requiredSupplies.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {auction.requiredSupplies.map((s, i) => (
                                    <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                        <div>
                                            <p className="text-lg font-black text-slate-900 mb-1">{s.itemName}</p>
                                            <p className="text-sm text-slate-400 font-bold max-w-[200px] leading-tight">{s.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cant x Precio</p>
                                            <p className="text-base font-black text-alteha-violet">{s.quantity} x ${s.referenceAmount.toLocaleString()}</p>
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

            {/* Bids Section */}
            {auction.id && (
                <div className="mt-10 bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10">
                    <AuctionBidsList
                        auctionId={auction.id}
                        auctionNumber={auction.auctionNumber}
                        auctionStatus={auction.status}
                        mode="insurance"
                    />
                </div>
            )}

            {/* Activation Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => !isActivating && setIsStatusModalOpen(false)}
                title="Confirmar Activación"
            >
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <Gavel className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 mb-2">¿Activar esta subasta?</h4>
                        <p className="text-slate-500 font-medium">
                            Al activar la subasta, todos los médicos y clínicas invitados podrán empezar a enviar sus ofertas de inmediato.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={confirmActivate}
                            disabled={isActivating}
                            className="bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                        >
                            {isActivating ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    Sí, Activar Ahora
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => setIsStatusModalOpen(false)}
                            disabled={isActivating}
                            className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Publish Modal */}
            <Modal
                isOpen={isPublishModalOpen}
                onClose={() => !isPublishing && setIsPublishModalOpen(false)}
                title="Publicar Subasta"
            >
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 mb-2">¿Confirmar Publicación?</h4>
                        <p className="text-slate-500 font-medium">
                            Al publicar esta subasta, dejará de ser un borrador y será visible para los especialistas, permitiendo la activación posterior.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={confirmPublish}
                            disabled={isPublishing}
                            className="bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                        >
                            {isPublishing ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    Sí, Publicar Ahora
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => setIsPublishModalOpen(false)}
                            disabled={isPublishing}
                            className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
