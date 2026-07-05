"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getAuctionBids, type BidDetailed, type Auction , actorDisplayName, actorDisplayPhoto } from '@/lib/api';
import { Trophy, Building2, User, Clock, Wallet, ShieldCheck, ArrowRight, Loader2, CreditCard, Calendar, Star, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useUnreadCount } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import PaymentProcessModal from './PaymentProcessModal';

interface AwardedBidSectionProps {
    auction: Auction;
    role: string;
}

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
            {title}
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

export default function AwardedBidSection({ auction, role }: AwardedBidSectionProps) {
    const [winningBid, setWinningBid] = useState<BidDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const { userProfile } = useAuth();
    const [activeChat, setActiveChat] = useState<{
        participantId: string;
        participantName: string;
        participantPhoto?: string;
        participantProfileUrl?: string;
    } | null>(null);

    useEffect(() => {
        loadWinningBid();
    }, [auction.id]);

    // Auto-open the "Reportar Pago" modal when arriving from the award summary (?pay=1).
    const searchParams = useSearchParams();
    const autoOpenedRef = useRef(false);
    useEffect(() => {
        if (
            !autoOpenedRef.current &&
            searchParams?.get('pay') === '1' &&
            auction.status === 'AWARDED' &&
            winningBid &&
            role === 'INSURANCE_COMPANY'
        ) {
            autoOpenedRef.current = true;
            setIsPaymentModalOpen(true);
        }
    }, [searchParams, auction.status, winningBid, role]);

    async function loadWinningBid() {
        // If auction already has winningBid, use it directly
        if (auction.winningBid) {
            setWinningBid(auction.winningBid);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await getAuctionBids(auction.id);
            let bids: BidDetailed[] = [];
            if (Array.isArray(res)) bids = res;
            else if (res.code === '00' && res.data) bids = res.data;
            else if ((res as any).content) bids = (res as any).content;

            const winner = bids.find(b => b.isWinning || b.status === 'WINNING' || b.status === 'AWARDED' || b.status === 'ACCEPTED');
            setWinningBid(winner || null);
        } catch (error) {
            console.error('Error loading winning bid:', error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10 gap-3 bg-white rounded-[2.5rem] border border-slate-100">
                <Loader2 className="w-6 h-6 text-alteha-violet animate-spin" />
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando detalles de adjudicación...</span>
            </div>
        );
    }

    if (!winningBid) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Executive Summary Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-slate-900 rounded-[3.5rem] transform translate-y-2 scale-[0.98] blur-2xl opacity-20" />
                <div className="relative bg-white border border-slate-100 rounded-[3.5rem] p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -skew-x-12 translate-x-1/4" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="space-y-6 flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                                <Trophy className="w-3 h-3" /> Adjudicación Oficial
                            </div>
                            <h3 className="text-5xl font-black text-slate-900 leading-none tracking-tighter">Resumen de <br/>Asignación</h3>
                            <p className="text-slate-400 font-medium text-lg max-w-md">Se ha formalizado la selección del equipo médico para la intervención quirúrgica programada.</p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Inversión Total</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-300">$</span>
                                <span className="text-7xl font-black text-slate-900 tracking-tighter">{winningBid.bidAmount.toLocaleString()}</span>
                            </div>
                            <Badge variant="outline" className="mt-2 border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[9px] py-1 px-4">Fondos en Custodia Alteha</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* The Winning Duo (Doctor & Clinic) */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Winner 1: Doctor */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-slate-200 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
                            <div className="relative bg-white rounded-[3rem] border border-slate-100 p-8 space-y-6 shadow-sm hover:border-slate-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                        <User className="w-7 h-7" />
                                    </div>
                                    <Badge className="bg-slate-50 text-slate-400 border-none font-bold text-[9px]">ESPECIALISTA</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-slate-900">{winningBid.doctor?.fullName || 'Especialista Registrado'}</h4>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Responsable de Intervención</p>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">Profesional Certificado</span>
                                </div>
                                
                                <ChatButtonWithBadge
                                    auctionId={String(auction.id)}
                                    currentUserId={String(userProfile?.id || 'guest')}
                                    participantId={String(role === 'INSURANCE_COMPANY' ? winningBid.doctor?.id : auction.insuranceCompany?.id)}
                                    title={role === 'INSURANCE_COMPANY' ? 'Chat con Médico' : 'Chat con Seguro'}
                                    onClick={async () => {
                                        if (role === 'INSURANCE_COMPANY') {
                                            // Resolve the doctor's real name + photo (fallback to getDoctorById)
                                            let name = winningBid.doctor?.fullName || `${winningBid.doctor?.firstName || ''} ${winningBid.doctor?.lastName || ''}`.trim();
                                            let photo = winningBid.doctor?.profileImageUrl || (winningBid.doctor as any)?.imageUrl || (winningBid as any)?.doctorPhoto;
                                            if (winningBid.doctor?.id && (!name || !photo)) {
                                                try {
                                                    const { getDoctorById } = await import('@/lib/api');
                                                    const res = await getDoctorById(winningBid.doctor.id);
                                                    const data = res.code === '00' && res.data ? res.data : (res as any).id ? res as any : null;
                                                    if (data) {
                                                        if (!name) name = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
                                                        if (!photo) photo = data.profileImageUrl || data.logoUrl;
                                                    }
                                                } catch { /* use fallback */ }
                                            }
                                            setActiveChat({
                                                participantId: String(winningBid.doctor?.id),
                                                participantName: name || 'Médico',
                                                participantPhoto: photo,
                                                participantProfileUrl: winningBid.doctor?.id ? `/doctor/${winningBid.doctor.id}` : undefined
                                            });
                                        } else {
                                            // Insurance photo: try from auction data, fallback to API
                                            let photo = auction.insuranceCompany?.logoUrl || (auction.insuranceCompany as any)?.logo || (auction.insuranceCompany as any)?.profileImageUrl;
                                            if (!photo && auction.insuranceCompany?.id) {
                                                try {
                                                    const { getInsuranceCompanyById } = await import('@/lib/api');
                                                    const res = await getInsuranceCompanyById(auction.insuranceCompany.id);
                                                    const data = res.code === '00' && res.data ? res.data : (res as any).id ? res as any : null;
                                                    if (data) photo = data.logoUrl || data.profileImageUrl;
                                                } catch { /* use initials */ }
                                            }
                                            setActiveChat({
                                                participantId: String(auction.insuranceCompany?.id),
                                                participantName: auction.insuranceCompany?.name || 'Compañía de Seguros',
                                                participantPhoto: photo
                                            });
                                        }
                                    }}
                                    className="w-full bg-slate-50 text-slate-500 hover:bg-alteha-turquoise hover:text-slate-900 rounded-2xl py-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 transition-all"
                                />
                            </div>
                        </div>

                        {/* Winner 2: Clinic */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-slate-200 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
                            <div className="relative bg-white rounded-[3rem] border border-slate-100 p-8 space-y-6 shadow-sm hover:border-slate-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200">
                                        <Building2 className="w-7 h-7" />
                                    </div>
                                    <Badge className="bg-slate-50 text-slate-400 border-none font-bold text-[9px]">SEDE HOSPITALARIA</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-slate-900">{winningBid.clinic?.name || 'Clínica Asociada'}</h4>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Lugar de Intervención</p>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">Infraestructura Verificada</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Summary */}
                    <div className="bg-slate-50/50 rounded-[3rem] p-10 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Programación</p>
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-slate-900" />
                                <span className="text-lg font-black text-slate-900">
                                    {auction.estimatedSurgeryDate ? new Date(auction.estimatedSurgeryDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : 'TBD'}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Honorarios Médicos</p>
                            <p className="text-2xl font-black text-slate-900">${winningBid.doctorFee?.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costos Clínicos</p>
                            <p className="text-2xl font-black text-slate-900">${winningBid.clinicFee?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Formalization Side Card */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white space-y-10 shadow-2xl shadow-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        {auction.status === 'AWARDED' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h5 className="text-2xl font-black leading-tight">Acción Requerida: <br/>Formalizar Pago</h5>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Para completar la reserva del equipo médico y los quirófanos, proceda con la emisión de fondos.</p>
                                </div>

                                <Button 
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="w-full h-20 bg-white text-slate-900 hover:bg-slate-100 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02]"
                                >
                                    <CreditCard className="w-6 h-6" />
                                    Pagar Ahora
                                </Button>
                            </div>
                        )}

                        {(auction.status === 'PAYMENT_REPORTED' || auction.status === 'PAYMENT_VALIDATION') && (
                            <div className="space-y-6 text-center">
                                <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                                    <Clock className="w-10 h-10 animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-2xl font-black leading-tight text-amber-500">Verificación en Proceso</h5>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Su comprobante ha sido recibido. Alteha está validando los fondos para confirmar la cirugía.</p>
                                </div>
                            </div>
                        )}

                        {auction.status === 'PAID' && (
                            <div className="space-y-6 text-center">
                                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                                    <ShieldCheck className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-2xl font-black leading-tight text-emerald-500">Pago Confirmado</h5>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Los fondos han sido validados y están en custodia de Alteha. La cirugía está garantizada.</p>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>

            <PaymentProcessModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                bid={winningBid}
                auctionTitle={auction.title}
                auctionNumber={auction.auctionNumber}
                role={role}
                allowedPaymentMethods={auction.allowedPaymentMethods}
            />

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
                            participantProfileUrl={activeChat.participantProfileUrl}
                            currentUserId={String(userProfile?.id || 'guest')}
                            currentUserName={actorDisplayName(userProfile)}
                            currentUserPhoto={actorDisplayPhoto(userProfile)}
                            onClose={() => setActiveChat(null)}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
