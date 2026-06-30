"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Hospital,
    Download,
    ShieldCheck,
    Zap,
    Timer,
    Plus,
    MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAuctionDetailsAsDoctor, getInsuranceCompanyById, type Auction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useUnreadCount } from '@/hooks/useChat';
import AdvancedBidForm from '@/components/auctions/AdvancedBidForm';
import AuctionCountdown from '@/components/auctions/AuctionCountdown';
import AuctionBidsList from '@/components/auctions/AuctionBidsList';

import { WinnerSettlementSection } from '@/components/payments/WinnerSettlementSection';

const ChatButtonWithBadge: React.FC<{
    auctionId: string;
    currentUserId: string;
    participantId: string;
    onClick: (e: React.MouseEvent) => void;
    title: string;
    className?: string;
}> = ({ auctionId, currentUserId, participantId, onClick, title, className }) => {
    const unreadCount = useUnreadCount(auctionId, currentUserId, participantId);
    
    return (
        <Button 
            onClick={onClick}
            className={`relative group ${className || ''}`}
            title={title}
        >
            <MessageSquare className="w-3.5 h-3.5" />
            {title === "Chat con Seguro" ? "Chat con Seguro" : ""}
            {unreadCount > 0 && (
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                    {unreadCount}
                </motion.span>
            )}
        </Button>
    );
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
    'DRAFT': { label: 'Borrador', color: 'bg-slate-100 text-slate-600', dotColor: 'bg-slate-400' },
    'PUBLISHED': { label: 'Publicada', color: 'bg-blue-50 text-blue-600', dotColor: 'bg-blue-500' },
    'ACTIVE': { label: 'Activa', color: 'bg-emerald-50 text-emerald-600', dotColor: 'bg-emerald-500 animate-pulse' },
    'AWARDED': { label: 'Adjudicada', color: 'bg-violet-50 text-violet-600', dotColor: 'bg-violet-500' },
    'PAYMENT_REPORTED': { label: 'Pago Reportado', color: 'bg-amber-50 text-amber-600', dotColor: 'bg-amber-500' },
    'PAYMENT_VALIDATION': { label: 'Validando Pago', color: 'bg-amber-50 text-amber-600', dotColor: 'bg-amber-500' },
    'PAID': { label: 'Pagada', color: 'bg-emerald-50 text-emerald-600', dotColor: 'bg-emerald-500' },
    'CANCELLED': { label: 'Cancelada', color: 'bg-red-50 text-red-600', dotColor: 'bg-red-500' },
    'COMPLETED': { label: 'Finalizada', color: 'bg-slate-900 text-white', dotColor: 'bg-white' },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
    'LOW': { label: 'Prioridad Baja', color: 'bg-slate-50 text-slate-500' },
    'MEDIUM': { label: 'Prioridad Media', color: 'bg-amber-50 text-amber-600' },
    'HIGH': { label: 'Prioridad Alta', color: 'bg-orange-50 text-orange-600' },
    'URGENT': { label: 'Urgente', color: 'bg-red-50 text-red-600' },
};

export default function DoctorAuctionDetailPage() {
    const params = useParams();
    const auctionNumber = params.id as string;

    const [auction, setAuction] = useState<Auction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { userProfile } = useAuth();
    const [activeChat, setActiveChat] = useState<{
        participantId: string;
        participantName: string;
        participantPhoto?: string;
    } | null>(null);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await getAuctionDetailsAsDoctor(auctionNumber);
                let auctionData = null;
                if (res.code === '00' && res.data) {
                    auctionData = res.data;
                } else if ((res as any).id) {
                    auctionData = res as any;
                }
                
                if (auctionData) {
                    setAuction(auctionData);
                    
                    // Handle deep link to chat
                    if (typeof window !== 'undefined') {
                        const params = new URLSearchParams(window.location.search);
                        if (params.get('openChat') === 'true') {
                            const pId = params.get('participantId');
                            if (pId && auctionData.insuranceCompany?.id === Number(pId)) {
                                setActiveChat({
                                    participantId: String(pId),
                                    participantName: auctionData.insuranceCompany?.name || 'Compañía de Seguros',
                                    participantPhoto: auctionData.insuranceCompany?.logoUrl || (auctionData.insuranceCompany as any)?.logo
                                });
                            }
                        }
                    }
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
        <div className="max-w-6xl mx-auto font-outfit pb-20">
            <Link href="/dashboard/specialist/auctions" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-8 font-bold group w-fit">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver a Convocatorias
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                {/* Header Card Section */}
                <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-alteha-turquoise/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${status.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                                {status.label}
                            </span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${urgency.color}`}>
                                {urgency.label}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight max-w-4xl uppercase leading-tight">
                            {auction.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4 border-t border-white/10">
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
                                    <Clock className="w-5 h-5 text-alteha-violet" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cierre de Ofertas</p>
                                    <div className="text-sm font-black text-white">
                                        <AuctionCountdown endDate={auction.endDate} variant="white" />
                                    </div>
                                </div>
                            </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ChatButtonWithBadge
                                    auctionId={String(auction.id)}
                                    currentUserId={String(userProfile?.id || 'guest')}
                                    participantId={String(auction.insuranceCompany?.id)}
                                    title="Chat con Seguro"
                                    onClick={async () => {
                                        const insuranceId = auction.insuranceCompany?.id;
                                        const insuranceName = auction.insuranceCompany?.name || 'Compañía de Seguros';
                                        if (insuranceId) {
                                            // Try to get photo from auction data first, then fetch if missing
                                            let photo = auction.insuranceCompany?.logoUrl || (auction.insuranceCompany as any)?.logo || (auction.insuranceCompany as any)?.profileImageUrl;
                                            if (!photo) {
                                                try {
                                                    const res = await getInsuranceCompanyById(insuranceId);
                                                    const data = res.code === '00' && res.data ? res.data : (res as any).id ? res as any : null;
                                                    if (data) photo = data.logoUrl || data.profileImageUrl || (data as any).logo;
                                                } catch { /* use initials fallback in ChatWindow */ }
                                            }
                                            setActiveChat({
                                                participantId: String(insuranceId),
                                                participantName: insuranceName,
                                                participantPhoto: photo
                                            });
                                        } else {
                                            alert('No se pudo identificar a la compañía de seguros para iniciar el chat.');
                                        }
                                    }}
                                    className="bg-alteha-turquoise text-slate-900 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-lg shadow-alteha-turquoise/20"
                                />
                            </div>
                        </div>

                <div className="p-10 lg:p-12 space-y-12">
                    {/* Settlement Section for Winner */}
                    {(auction.status === 'AWARDED' || auction.status === 'PAID' || auction.status === 'PAYMENT_REPORTED' || auction.status === 'PAYMENT_VALIDATION' || auction.status === 'COMPLETED') && (
                        (() => {
                            const awardedDoctorId = auction.awardedBid?.doctor?.id || (auction.awardedBid as any)?.doctorId;
                            const isWinner = userProfile?.id && Number(awardedDoctorId) === Number(userProfile.id);
                            
                            if (isWinner) {
                                return <WinnerSettlementSection auction={auction} role="DOCTOR" />;
                            }
                            return null;
                        })()
                    )}

                    {/* TOP SUMMARY ROW: Budget, Time & Patient */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Budget */}
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-slate-200">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-alteha-turquoise/10 rounded-full blur-2xl" />
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Presupuesto Máximo</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-xl font-black text-alteha-turquoise">$</span>
                                <span className="text-4xl font-black tracking-tighter">{(auction.maxBudget || 0).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Hon. Médicos</p>
                                    <p className="text-sm font-black text-white">${(auction.doctorBudget || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Gastos Clínica</p>
                                    <p className="text-sm font-black text-white">${(auction.clinicBudget || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Plazos */}
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Timer className="w-3 h-3" /> Plazos de la Subasta
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Calendar className="w-5 h-5 text-alteha-violet" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fecha de Cierre</p>
                                            <p className="text-sm font-black text-slate-900">{new Date(auction.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Zap className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Auto-extensión</p>
                                            <p className="text-sm font-black text-slate-900">{auction.autoExtendMinutes || 0} Minutos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient */}
                        {auction.patient && (
                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl shadow-slate-100 flex items-center gap-5">
                                <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                    {auction.patient.profileImageUrl
                                        ? <img src={auction.patient.profileImageUrl} alt="Patient" className="w-full h-full object-cover" />
                                        : <User className="w-10 h-10 text-white/30" />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-alteha-violet uppercase tracking-widest mb-1">Paciente</p>
                                    <h4 className="text-lg font-black text-slate-900 leading-tight truncate">
                                        {auction.patient.firstName}<br />{auction.patient.lastName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[8px] font-black text-slate-500">
                                            {auction.patientAge} años
                                        </span>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase">
                                            {auction.patientGender === 'FEMALE' ? 'Femenino' : 'Masculino'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FULL WIDTH: Medical Detail */}
                    <div className="space-y-8 pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-alteha-violet/10 rounded-2xl">
                                <Stethoscope className="w-6 h-6 text-alteha-violet" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Detalle Médico</h3>
                                <p className="text-sm font-bold text-slate-400">Contexto clínico del procedimiento</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex items-start gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm"><MapPin className="w-5 h-5 text-alteha-turquoise" /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                                    <p className="text-base font-black text-slate-900">{auction.preferredLocation}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm"><Hospital className="w-5 h-5 text-alteha-turquoise" /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hospitalización</p>
                                    <p className="text-base font-black text-slate-900">{auction.requiresHospitalization ? 'Sí requiere' : 'No requiere'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm"><Timer className="w-5 h-5 text-alteha-turquoise" /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duración</p>
                                    <p className="text-base font-black text-slate-900">{auction.estimatedDurationDays} días est.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm"><Calendar className="w-5 h-5 text-alteha-turquoise" /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Est. Cirugía</p>
                                    <p className="text-base font-black text-slate-900">{auction.estimatedSurgeryDate ? new Date(auction.estimatedSurgeryDate).toLocaleDateString() : 'Por definir'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border-l-4 border-alteha-violet h-full">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Historia Médica / Antecedentes</p>
                                <p className="text-base font-medium text-slate-600 leading-relaxed italic">
                                    "{auction.medicalHistory || 'Sin antecedentes registrados.'}"
                                </p>
                            </div>
                            
                            <div className="space-y-6">
                                {auction.medicalReportUrl && (
                                    <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                <FileText className="w-7 h-7 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-900 leading-none">Informe Médico</p>
                                                <p className="text-xs font-bold text-slate-400 mt-2">Archivo PDF Adjunto</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <a href={auction.medicalReportUrl} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-xl text-blue-500 shadow-sm hover:scale-110 transition-transform"><Activity className="w-5 h-5" /></a>
                                            <a href={auction.medicalReportUrl} download className="p-3 bg-blue-500 rounded-xl text-white shadow-md hover:scale-110 transition-transform"><Download className="w-5 h-5" /></a>
                                        </div>
                                    </div>
                                )}
                                
                                {auction.requiredSupplies && auction.requiredSupplies.length > 0 && (
                                    <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100">
                                        <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-4">Insumos Especiales Requeridos</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {auction.requiredSupplies.map((s, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white/50 p-3 rounded-xl text-sm font-bold text-slate-700">
                                                    <span>{s.itemName}</span>
                                                    <span className="text-amber-600">×{s.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Button to Open Modal */}
                    {(auction.status === 'ACTIVE' || auction.status === 'PUBLISHED') && (
                        <div className="pt-10 flex justify-center">
                            <Button
                                onClick={() => setIsBidModalOpen(true)}
                                className="bg-alteha-violet text-white px-12 py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-3 group"
                            >
                                <Gavel className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                Participar en esta Subasta
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Previous Bids Section - only shown while auction is open/active */}
            {auction.id && !['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED'].includes(auction.status) && (
                <div id="ofertas" className="mt-10 bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10 scroll-mt-24">
                    <AuctionBidsList
                        auctionId={auction.id}
                        auctionNumber={auction.auctionNumber}
                        auctionStatus={auction.status}
                        mode="doctor"
                        insuranceId={auction.insuranceCompany?.id}
                        insuranceName={auction.insuranceCompany?.name}
                    />
                </div>
            )}

            {/* PAID: Próxima Intervención Panel */}
            {auction.status === 'PAID' && (
                <div className="mt-10 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-500/30 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-300/20 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <CheckCircle2 className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">
                                    Adjudicación Confirmada — Pago Recibido
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black leading-tight max-w-xl">
                                Estás listo para ejecutar esta intervención
                            </h2>
                            <p className="text-emerald-100 font-medium leading-relaxed max-w-lg">
                                El seguro ha confirmado el pago. Debes presentarte en la clínica y ejecutar el procedimiento en la fecha acordada. Una vez completado, adjunta el finiquito de la intervención.
                            </p>
                            {auction.estimatedSurgeryDate && (
                                <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl w-fit">
                                    <Calendar className="w-5 h-5 text-emerald-200" />
                                    <span className="font-black text-white">
                                        {new Date(auction.estimatedSurgeryDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                        </div>
                        {auction.estimatedSurgeryDate && (
                            <div className="flex flex-col items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-[2rem] px-10 py-8 min-w-[220px] text-center flex-shrink-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Tiempo Restante</p>
                                <AuctionCountdown
                                    endDate={auction.estimatedSurgeryDate}
                                    variant="white"
                                    className="text-2xl font-black"
                                />
                                <p className="text-[10px] text-emerald-300 font-bold">para la intervención</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Participation Modal */}
            <Modal
                isOpen={isBidModalOpen}
                onClose={() => setIsBidModalOpen(false)}
                title="Enviar Propuesta"
                maxWidth="max-w-4xl"
            >
                <div className="p-0">
                    <AdvancedBidForm 
                        auction={auction} 
                        hideHeader={true}
                        onSuccess={() => {
                            setIsBidModalOpen(false);
                            window.location.reload();
                        }} 
                    />
                </div>
            </Modal>
            {/* Chat Modal */}
            <Modal
                isOpen={!!activeChat}
                onClose={() => setActiveChat(null)}
                title="Mensajería Directa"
                maxWidth="max-w-xl"
            >
                <div className="h-[600px] -m-6">
                    {activeChat && (
                        <ChatWindow 
                            auctionId={String(auction.id)}
                            auctionNumber={auction.auctionNumber}
                            participantId={activeChat.participantId}
                            participantName={activeChat.participantName}
                            participantPhoto={activeChat.participantPhoto}
                            currentUserId={String(userProfile?.id || 'guest')}
                            currentUserName={userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : (userProfile?.name || 'Usuario')}
                            currentUserPhoto={userProfile?.profileImageUrl || userProfile?.logoUrl || (userProfile as any)?.imageUrl || (userProfile as any)?.avatarUrl}
                            onClose={() => setActiveChat(null)}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
