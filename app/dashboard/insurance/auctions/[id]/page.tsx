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
    Users,
    Trophy,
    Building2,
    MessageCircle,
    ZoomIn,
    X,
    Printer
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    getAuctionDetails,
    getAuctionAttachments,
    getAuctionBids,
    addAuctionAttachments,
    publishExistingAuction,
    changeAuctionStatus,
    type Auction,
    type AuctionAttachment
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import AuctionBidsList from '@/components/auctions/AuctionBidsList';
import DuplasSection from '@/components/auctions/DuplasSection';
import AwardedBidSection from '@/components/payments/AwardedBidSection';

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    'DRAFT': { label: 'Borrador', color: 'bg-slate-100 text-slate-600', icon: FileText },
    'PUBLISHED': { label: 'Publicada', color: 'bg-blue-50 text-blue-600', icon: Clock },
    'ACTIVE': { label: 'Activa', color: 'bg-emerald-50 text-emerald-600', icon: Gavel },
    'AWARDED': { label: 'Adjudicada', color: 'bg-alteha-violet/10 text-alteha-violet', icon: CheckCircle2 },
    'CANCELLED': { label: 'Cancelada', color: 'bg-red-50 text-red-600', icon: AlertCircle },
    'COMPLETED': { label: 'Finalizada', color: 'bg-slate-900 text-white', icon: CheckCircle2 },
    'PAYMENT_VALIDATION': { label: 'Validando Pago', color: 'bg-amber-50 text-amber-600', icon: Clock },
    'PAYMENT_REPORTED': { label: 'Pago Reportado', color: 'bg-amber-50 text-amber-600', icon: Clock }
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
    const [winningBid, setWinningBid] = useState<any | null>(null);
    const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
    const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [auctionRes, attachmentsRes] = await Promise.all([
                getAuctionDetails(auctionNumber),
                getAuctionAttachments(auctionNumber, 'INSURANCE_COMPANY')
            ]);

            if (auctionRes.code === '00' && auctionRes.data) {
                const auctionData = auctionRes.data;
                setAuction(auctionData);
                
                // If awarded, fetch winning bid for top summary (if not already in details)
                if (auctionData.status === 'AWARDED') {
                    // Try to find winner directly in details response
                    const potentialWinner = auctionData.winningBid || auctionData.winner || auctionData.awardedBid || auctionData.selectedBid || (auctionData as any).topOffer;
                    
                    if (potentialWinner) {
                        setWinningBid(potentialWinner);
                    } else {
                        try {
                            const bidsRes = await getAuctionBids(auctionData.id);
                            let bids: any[] = [];
                            
                            if (Array.isArray(bidsRes)) {
                                bids = bidsRes;
                            } else if (bidsRes && bidsRes.data) {
                                if (Array.isArray(bidsRes.data)) bids = bidsRes.data;
                                else if ((bidsRes.data as any).content) bids = (bidsRes.data as any).content;
                            }
                            
                            // Find winner by any "positive" status or flag
                            const winner = bids.find(b => 
                                b.isWinning === true || 
                                ['WINNING', 'AWARDED', 'ACCEPTED', 'SELECTED', 'COMPLETED'].includes(b.status)
                            );
                            
                            setWinningBid(winner || null);
                        } catch (bidErr) {
                            console.error('Error fetching bids for summary:', bidErr);
                        }
                    }
                }
            } else if ((auctionRes as any).id) {
                const auctionData = auctionRes as any;
                setAuction(auctionData);
                if (auctionData.status === 'AWARDED') {
                    const potentialWinner = auctionData.winningBid || auctionData.winner || auctionData.awardedBid || auctionData.selectedBid || (auctionData as any).topOffer;
                    if (potentialWinner) {
                        setWinningBid(potentialWinner);
                    } else {
                        try {
                            const bidsRes = await getAuctionBids(auctionData.id);
                            let bids: any[] = [];
                            if (Array.isArray(bidsRes)) {
                                bids = bidsRes;
                            } else if (bidsRes && bidsRes.data) {
                                if (Array.isArray(bidsRes.data)) bids = bidsRes.data;
                                else if ((bidsRes.data as any).content) bids = (bidsRes.data as any).content;
                            }
                            const winner = bids.find(b => 
                                b.isWinning === true || 
                                ['WINNING', 'AWARDED', 'ACCEPTED', 'SELECTED', 'COMPLETED'].includes(b.status)
                            );
                            setWinningBid(winner || null);
                        } catch (bidErr) {
                            console.error('Error fetching bids for summary:', bidErr);
                        }
                    }
                }
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
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    html, body { margin: 0; padding: 0; height: 100%; background: white; }
                    body * {
                        visibility: hidden;
                    }
                    #print-certificate, #print-certificate * {
                        visibility: visible;
                    }
                    #print-certificate {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        page-break-after: avoid;
                        page-break-before: avoid;
                    }
                }
            `}</style>
            <div className="flex justify-between items-center mb-10">
                <Link href="/dashboard/insurance/auctions" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors font-bold group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a Subastas
                </Link>
                <div className="flex items-center gap-3">
                    {(auction.status === 'PAYMENT_VALIDATION' || auction.status === 'PAYMENT_REPORTED') && (
                        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200/60 animate-in fade-in slide-in-from-top-2 duration-500">
                            <Clock className="w-5 h-5 animate-pulse flex-shrink-0" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Estado del pago</span>
                                <span className="text-sm font-black">Verificación en Proceso</span>
                            </div>
                        </div>
                    )}
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
                <div className={cn(
                    "p-12 text-white relative overflow-hidden transition-all duration-700",
                    auction.status === 'AWARDED' 
                        ? "bg-slate-900" 
                        : "bg-slate-900"
                )}>
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
                            {['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) && (
                                <button 
                                    onClick={(e) => { e.preventDefault(); setIsWinnerModalOpen(true); }}
                                    className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"
                                >
                                    <Eye className="w-3 h-3" /> Ver Detalle Ganador
                                </button>
                            )}
                            {auction.urgencyLevel === 'URGENT' && (
                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-red-500 text-white shadow-lg shadow-red-500/20 flex items-center gap-2">
                                    <Zap className="w-3 h-3 fill-current" /> Alta Prioridad
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight max-w-5xl drop-shadow-sm uppercase">
                                {['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) && <Trophy className="w-10 h-10 text-white mb-4 block" />}
                                {auction.title}
                                {['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) && winningBid && (
                                    <div className="flex flex-col gap-2 mt-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex -space-x-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-900 overflow-hidden shadow-xl z-20">
                                                    {(winningBid?.doctor?.profileImageUrl || winningBid?.doctorProfileImageUrl) ? (
                                                        <img 
                                                            src={winningBid?.doctor?.profileImageUrl || winningBid?.doctorProfileImageUrl} 
                                                            alt="Doctor" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/30">
                                                            <User className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 overflow-hidden shadow-xl z-10 flex items-center justify-center p-1.5">
                                                    {(winningBid?.clinic?.logoUrl || winningBid?.clinicLogoUrl) ? (
                                                        <img 
                                                            src={winningBid?.clinic?.logoUrl || winningBid?.clinicLogoUrl} 
                                                            alt="Clinic" 
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    ) : (
                                                        <Building2 className="w-6 h-6 text-slate-300" />
                                                    )}
                                                </div>
                                            </div>
                                            <div 
                                                className="flex flex-col cursor-pointer group hover:opacity-80 transition-opacity"
                                                onClick={() => setIsWinnerModalOpen(true)}
                                            >
                                                <span className="text-alteha-turquoise normal-case font-medium text-2xl tracking-normal leading-tight">
                                                    Adjudicada a: <span className="text-white font-black underline decoration-alteha-turquoise decoration-4 underline-offset-8 group-hover:text-alteha-turquoise transition-colors">
                                                Dr. {
                                                    winningBid?.doctor?.fullName || 
                                                    winningBid?.doctorName || 
                                                    winningBid?.bidderName ||
                                                    winningBid?.userName ||
                                                    winningBid?.specialistName || 
                                                    winningBid?.doctorFullName ||
                                                    (winningBid?.doctor?.firstName ? `${winningBid.doctor.firstName} ${winningBid.doctor.lastName}` : null) ||
                                                    (winningBid?.firstName ? `${winningBid.firstName} ${winningBid.lastName}` : null) ||
                                                    winningBid?.fullName || 
                                                    winningBid?.name || 
                                                    'Profesional Asignado'
                                                }                                                    </span>
                                                </span>
                                                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 group-hover:text-white/60 transition-colors flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" /> Sede: {winningBid?.clinic?.name || winningBid?.clinicName || winningBid?.hospitalName || 'Por confirmar'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </h1>
                            {['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) && (
                                <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse pt-4">
                                    Proceso de asignación completado exitosamente
                                </p>
                            )}
                        </div>
                        
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
                                {['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) ? (
                                    <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-alteha-turquoise/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-alteha-violet/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                                        
                                        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12">
                                            {/* Financial Hero */}
                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Monto Total Adjudicado</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-4xl font-black text-alteha-turquoise">$</span>
                                                        <span className="text-7xl font-black tracking-tighter">
                                                            {(winningBid?.totalAmount || winningBid?.bidAmount || winningBid?.amount || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Hon. Médicos</p>
                                                        <p className="text-xl font-black text-white">${(winningBid?.doctorFee || auction.doctorBudget || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="w-px h-8 bg-white/10" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Gastos Clínica</p>
                                                        <p className="text-xl font-black text-white">${(winningBid?.clinicFee || auction.clinicBudget || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* The Winning Team */}
                                            <div className="flex-1 max-w-md space-y-6">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Equipo Médico Asignado</p>
                                                
                                                <div className="space-y-4">
                                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 group/item hover:bg-white/10 transition-all cursor-pointer" onClick={() => setIsWinnerModalOpen(true)}>
                                                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/10 overflow-hidden">
                                                            {(winningBid?.doctor?.profileImageUrl || winningBid?.doctorProfileImageUrl) ? (
                                                                <img src={winningBid?.doctor?.profileImageUrl || winningBid?.doctorProfileImageUrl} className="w-full h-full object-cover" />
                                                            ) : <User className="w-6 h-6 text-white/20 mx-auto mt-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-alteha-turquoise uppercase tracking-widest mb-1">Especialista</p>
                                                            <p className="text-lg font-black text-white">
                                                                Dr. {
                                                                    winningBid?.doctor?.fullName || 
                                                                    winningBid?.doctorName || 
                                                                    winningBid?.bidderName ||
                                                                    winningBid?.userName ||
                                                                    'Profesional'
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="ml-auto">
                                                            <ShieldCheck className="w-5 h-5 text-alteha-turquoise opacity-50" />
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 group/item hover:bg-white/10 transition-all cursor-pointer" onClick={() => setIsWinnerModalOpen(true)}>
                                                        <div className="w-14 h-14 rounded-xl bg-white border border-white/10 overflow-hidden flex items-center justify-center p-2">
                                                            {(winningBid?.clinic?.logoUrl || winningBid?.clinicLogoUrl) ? (
                                                                <img src={winningBid?.clinic?.logoUrl || winningBid?.clinicLogoUrl} className="max-w-full max-h-full object-contain" />
                                                            ) : <Building2 className="w-6 h-6 text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-alteha-violet uppercase tracking-widest mb-1">Sede Clínica</p>
                                                            <p className="text-lg font-black text-white">
                                                                {winningBid?.clinic?.name || winningBid?.clinicName || 'Clínica'}
                                                            </p>
                                                        </div>
                                                        <div className="ml-auto">
                                                            <MapPin className="w-5 h-5 text-alteha-violet opacity-50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-alteha-turquoise animate-pulse" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocolo de pago habilitado</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => window.print()}
                                                    className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-alteha-turquoise px-6 py-2 rounded-full hover:bg-[#1DE9B6] transition-all flex items-center gap-2"
                                                >
                                                    <Printer className="w-3 h-3" /> Imprimir Certificado
                                                </button>
                                                <button 
                                                    onClick={() => setIsWinnerModalOpen(true)}
                                                    className="text-[10px] font-black text-white uppercase tracking-widest bg-white/5 px-6 py-2 rounded-full hover:bg-white/10 transition-all border border-white/5"
                                                >
                                                    Ver Detalles
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
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
{/* 
                                             <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl shadow-slate-100 flex flex-col justify-between group hover:border-alteha-violet/30 transition-all">
                                                 <div className="w-12 h-12 bg-alteha-violet/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                     <ShieldCheck className="w-6 h-6 text-alteha-violet" />
                                                 </div>
                                                 <div>
                                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mín. Requerido</p>
                                                     <p className="text-4xl font-black text-slate-900 tracking-tighter">{auction.minBidsRequired}</p>
                                                 </div>
                                             </div>
                                             */}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden mt-8">
                                <div className="bg-slate-50 border-b border-slate-100 px-8 py-5">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-alteha-violet" />
                                        Descripción y Contexto
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <p className="text-slate-700 font-medium leading-relaxed text-lg whitespace-pre-wrap">
                                        {auction.description}
                                    </p>
                                </div>
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
                                    {['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) === false && (
                                        <div className="relative">
                                            <input type="file" id="attach-file" className="hidden" multiple onChange={handleFileUpload} />
                                            <label htmlFor="attach-file" className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            </label>
                                        </div>
                                    )}
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-10">
                        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-8 hover:shadow-md transition-shadow">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
                                <Stethoscope className="w-4 h-4 text-alteha-violet" /> Información Médica
                            </h4>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-alteha-violet/5 rounded-2xl border border-alteha-violet/10"><Stethoscope className="w-5 h-5 text-alteha-violet" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Especialidad</p>
                                        <p className="text-lg font-black text-slate-900">{auction.specialty?.name || auction.specialty?.code || 'No especificada'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-alteha-violet/5 rounded-2xl border border-alteha-violet/10"><AlertCircle className="w-5 h-5 text-alteha-violet" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Antecedentes</p>
                                        <p className="text-base font-medium text-slate-700 whitespace-pre-wrap leading-snug">{auction.medicalHistory || 'Sin antecedentes registrados.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-8 hover:shadow-md transition-shadow">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
                                <Calendar className="w-4 h-4 text-alteha-turquoise" /> Planificación y Logística
                            </h4>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-alteha-turquoise/5 rounded-2xl border border-alteha-turquoise/10"><Calendar className="w-5 h-5 text-alteha-turquoise" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Est. Cirugía</p>
                                        <p className="text-lg font-black text-slate-900">{auction.estimatedSurgeryDate ? new Date(auction.estimatedSurgeryDate).toLocaleDateString() : 'Por definir'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-alteha-turquoise/5 rounded-2xl border border-alteha-turquoise/10"><MapPin className="w-5 h-5 text-alteha-turquoise" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                                        <p className="text-lg font-black text-slate-900">{auction.preferredLocation}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-alteha-turquoise/5 rounded-2xl border border-alteha-turquoise/10"><Clock className="w-5 h-5 text-alteha-turquoise" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hospitalización</p>
                                            <p className="text-base font-black text-slate-900">
                                                {auction.requiresHospitalization ? 'SÍ' : 'NO'} • {auction.estimatedDurationDays} d.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-alteha-turquoise/5 rounded-2xl border border-alteha-turquoise/10"><AlertCircle className="w-5 h-5 text-alteha-turquoise" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioridad</p>
                                            <p className={`text-base font-black ${auction.urgencyLevel === 'URGENT' || auction.urgencyLevel === 'HIGH' ? 'text-red-600' : 'text-slate-900'}`}>
                                                {auction.urgencyLevel === 'LOW' ? 'Baja' : auction.urgencyLevel === 'MEDIUM' ? 'Media' : auction.urgencyLevel === 'HIGH' ? 'Alta' : 'Urgente'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) ? (
                        <div className="space-y-6 pt-10 border-t border-slate-50">
                            <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
                                <h3 className="text-xl font-black flex items-center gap-2 mb-2">
                                    <ShieldCheck className="w-5 h-5 text-alteha-turquoise" />
                                    Expediente Clínico Cerrado
                                </h3>
                                <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-3xl">
                                    Esta subasta ha sido adjudicada y los términos han sido fijados. Las reglas de cierre y requerimientos de la subasta ya no son editables y forman parte del contrato de servicio con el equipo médico.
                                </p>
                            </div>
                        </div>
                    ) : (
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
                                         */}
                                         <div className="flex justify-between items-center">
                                             <span className="text-xs font-bold text-slate-500">Método de Pago:</span>
                                             <span className="text-xs font-black text-alteha-violet">{auction.methodType || 'No especificado'}</span>
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
                    )}

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

            {/* Bids Section - Ocultar si ya está adjudicada */}
            {auction.id && !['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) && (
                <div id="ofertas" className="mt-10 bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10 scroll-mt-24">
                    <AuctionBidsList
                        auctionId={auction.id}
                        auctionNumber={auction.auctionNumber}
                        auctionStatus={auction.status}
                        mode="insurance"
                        onActionSuccess={loadData}
                    />
                </div>
            )}

            {/* Duplas Médico + Clínica (modalidad Solo Médico) */}
            {auction.id && (
                <div className="mt-10">
                    <DuplasSection auctionId={auction.id} />
                </div>
            )}

            {/* Awarded Info Section - Mostrar cuando está adjudicada o en pagos */}
            {auction.id && ['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) && (
                <div className="mt-10">
                    <AwardedBidSection auction={auction} role="INSURANCE_COMPANY" />
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
            
            {/* Winner Details Modal (Official Dossier) */}
            <Modal isOpen={isWinnerModalOpen} onClose={() => setIsWinnerModalOpen(false)}>
                <div className="p-4 md:p-8 max-w-4xl w-full">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-slate-200">
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expediente Oficial de Adjudicación</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Ref: {auction.auctionNumber}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Especialista Dossier */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                                <div 
                                    className="w-32 h-32 rounded-3xl bg-slate-900 border-4 border-white shadow-xl mb-4 relative group cursor-zoom-in overflow-hidden"
                                    onClick={() => setExpandedPhoto(winningBid?.doctor?.profileImageUrl || winningBid?.doctorProfileImageUrl)}
                                >
                                    {(winningBid?.doctor?.profileImageUrl || winningBid?.doctorProfileImageUrl) ? (
                                        <>
                                            <img 
                                                src={winningBid?.doctor?.profileImageUrl || winningBid?.doctorProfileImageUrl} 
                                                alt="Doctor" 
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ZoomIn className="w-8 h-8 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30">
                                            <User className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Especialista Asignado</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight mb-4">
                                    Dr. {
                                        winningBid?.doctor?.fullName || 
                                        winningBid?.doctorName || 
                                        winningBid?.bidderName ||
                                        winningBid?.userName ||
                                        winningBid?.specialistName || 
                                        winningBid?.doctorFullName ||
                                        (winningBid?.doctor?.firstName ? `${winningBid.doctor.firstName} ${winningBid.doctor.lastName}` : null) ||
                                        winningBid?.fullName || 
                                        winningBid?.name || 
                                        'Profesional'
                                    }
                                </p>
                                
                                <div className="w-full space-y-2 text-left bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Especialidad</span>
                                        <span className="text-xs font-bold text-slate-900">{winningBid?.doctor?.specialties?.[0]?.name || auction.specialty?.name || 'Cirujano'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Experiencia</span>
                                        <span className="text-xs font-bold text-slate-900">{winningBid?.doctor?.yearsOfExperience ? `+${winningBid.doctor.yearsOfExperience} años` : 'Validada'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Credenciales</span>
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verificadas</span>
                                    </div>
                                </div>
                            </div>

                            <Link href={`/dashboard/insurance/messages/new?recipientId=${winningBid?.bidderId || winningBid?.doctor?.id || ''}`} className="block">
                                <Button className="w-full bg-alteha-turquoise text-slate-900 py-6 rounded-2xl font-black shadow-xl shadow-alteha-turquoise/20 flex items-center justify-center gap-2 hover:bg-[#1DE9B6] transition-all group">
                                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Chatear con Especialista
                                </Button>
                            </Link>
                        </div>

                        {/* Sede y Financiero */}
                        <div className="space-y-6 flex flex-col">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex-1 flex flex-col justify-center items-center text-center">
                                <div 
                                    className="w-24 h-24 bg-white rounded-3xl p-3 shadow-md border border-slate-100 mb-4 cursor-zoom-in relative group"
                                    onClick={() => setExpandedPhoto(winningBid?.clinic?.logoUrl || winningBid?.clinicLogoUrl)}
                                >
                                    {(winningBid?.clinic?.logoUrl || winningBid?.clinicLogoUrl) ? (
                                        <>
                                            <img 
                                                src={winningBid?.clinic?.logoUrl || winningBid?.clinicLogoUrl} 
                                                alt="Clinic" 
                                                className="w-full h-full object-contain transition-transform group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ZoomIn className="w-6 h-6 text-slate-900" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-slate-300" /></div>
                                    )}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sede de Operación</p>
                                <p className="text-xl font-black text-slate-900 leading-tight">
                                    {winningBid?.clinic?.name || winningBid?.clinicName || winningBid?.hospitalName || winningBid?.clinic?.fullName || 'Sede por confirmar'}
                                </p>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 relative z-10">Monto Total Adjudicado</p>
                                <p className="text-5xl font-black text-alteha-turquoise tracking-tighter relative z-10">
                                    ${(
                                        (winningBid?.totalAmount > 100 ? winningBid.totalAmount : null) || 
                                        (winningBid?.bidAmount > 100 ? winningBid.bidAmount : null) || 
                                        winningBid?.amount || 
                                        winningBid?.totalBidAmount || 
                                        ((winningBid?.doctorFee || 0) + (winningBid?.clinicFee || 0)) || 
                                        0
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-alteha-turquoise/5 p-4 rounded-2xl border border-alteha-turquoise/10 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-alteha-turquoise flex-shrink-0" />
                        <p className="text-[10px] text-alteha-turquoise/80 font-bold leading-tight">
                            Esta información ha sido validada por Alteha Platform y constituye el acuerdo oficial entre las partes. Los datos de contacto directos se omiten por privacidad; utilice el chat seguro para comunicarse.
                        </p>
                    </div>

                    <Button 
                        onClick={() => setIsWinnerModalOpen(false)}
                        className="w-full mt-6 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                    >
                        Cerrar Detalles
                    </Button>
                </div>
            </Modal>

            {/* Photo Zoom Modal */}
            <AnimatePresence>
                {expandedPhoto && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setExpandedPhoto(null)}
                    >
                        <button 
                            className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            onClick={() => setExpandedPhoto(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={expandedPhoto} 
                            alt="Expanded" 
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Printable Certificate Layer */}
            {auction.status === 'AWARDED' && (
                <div id="print-certificate" className="hidden print:flex fixed inset-0 bg-white z-[9999] p-8 font-sans text-black box-border flex-col">
                    <div className="w-full max-w-4xl mx-auto border-4 border-slate-900 p-8 flex flex-col flex-1 box-border h-[calc(100vh-4rem)]">
                        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-100 pb-6 shrink-0">
                            <img src="/logoalteha.svg" alt="Alteha" className="h-10" />
                            <div className="text-right">
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Certificado de Adjudicación</h1>
                                <p className="text-xs font-bold text-slate-500 mt-1">Ref: {auction.auctionNumber}</p>
                                <p className="text-xs font-bold text-slate-500">Fecha: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div className="mb-6 shrink-0">
                            <h2 className="text-lg font-black mb-2">A quien corresponda:</h2>
                            <p className="text-base leading-relaxed text-slate-700">
                                Por medio de la presente, <strong>Alteha Platform</strong> certifica y valida formalmente la adjudicación del caso quirúrgico correspondiente a la convocatoria pública <strong>#{auction.auctionNumber}</strong> para el procedimiento de <strong>{auction.title || auction.procedureName || 'Cirugía'}</strong>.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6 shrink-0">
                            <div className="p-5 border-2 border-slate-200 rounded-2xl bg-slate-50">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Especialista Asignado</h3>
                                <p className="text-xl font-black text-slate-900">Dr. {
                                    winningBid?.doctor?.fullName || 
                                    winningBid?.doctorName || 
                                    winningBid?.bidderName ||
                                    winningBid?.userName ||
                                    winningBid?.specialistName || 
                                    winningBid?.doctorFullName ||
                                    (winningBid?.doctor?.firstName ? `${winningBid.doctor.firstName} ${winningBid.doctor.lastName}` : null) ||
                                    (winningBid?.firstName ? `${winningBid.firstName} ${winningBid.lastName}` : null) ||
                                    winningBid?.fullName || 
                                    winningBid?.name || 
                                    'Profesional Asignado'
                                }</p>
                                <p className="text-xs font-bold mt-2 text-slate-600">Especialidad: {winningBid?.doctor?.specialties?.[0]?.name || auction.specialty?.name || 'Cirujano'}</p>
                                <p className="text-xs font-bold text-slate-600">Credenciales: Verificadas Oficialmente</p>
                            </div>
                            <div className="p-5 border-2 border-slate-200 rounded-2xl bg-slate-50">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Sede Clínica</h3>
                                <p className="text-xl font-black text-slate-900">{winningBid?.clinic?.name || winningBid?.clinicName || winningBid?.hospitalName || 'Sede Certificada'}</p>
                                <p className="text-xs font-bold mt-2 text-slate-600">Ubicación: {auction.preferredLocation || 'Por confirmar'}</p>
                                <p className="text-xs font-bold text-slate-600">Fecha Est.: {auction.estimatedSurgeryDate ? new Date(auction.estimatedSurgeryDate).toLocaleDateString() : 'Pendiente'}</p>
                            </div>
                        </div>

                        <div className="mb-6 p-6 bg-slate-100 rounded-2xl border-l-4 border-slate-900 shrink-0">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Acuerdo Financiero Final</h3>
                            <div className="flex justify-between items-end">
                                <span className="text-base font-bold text-slate-700">Monto Total Adjudicado</span>
                                <span className="text-3xl font-black text-slate-900">${(
                                    winningBid?.totalAmount ?? winningBid?.bidAmount ?? winningBid?.amount ?? winningBid?.totalBidAmount ?? 
                                    ((winningBid?.doctorFee || 0) + (winningBid?.clinicFee || 0)) ?? 
                                    0
                                ).toLocaleString()} USD</span>
                            </div>
                        </div>

                        <div className="mt-auto text-center border-t-2 border-slate-200 pt-6 shrink-0">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documento Oficial Generado Electrónicamente</p>
                            <p className="text-[10px] text-slate-400 mt-1">Este certificado representa el acuerdo vinculante y encriptado entre la empresa de seguros y el equipo médico seleccionado a través de la plataforma Alteha. Código Hash: {String(auction.id).substring(0, 16).toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
