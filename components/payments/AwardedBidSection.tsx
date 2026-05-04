"use client";

import React, { useState, useEffect } from 'react';
import { getAuctionBids, type BidDetailed, type Auction } from '@/lib/api';
import { Trophy, Building2, User, Clock, Wallet, ShieldCheck, ArrowRight, Loader2, CreditCard, Calendar, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import PaymentProcessModal from './PaymentProcessModal';

interface AwardedBidSectionProps {
    auction: Auction;
    role: string;
}

export default function AwardedBidSection({ auction, role }: AwardedBidSectionProps) {
    const [winningBid, setWinningBid] = useState<BidDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        loadWinningBid();
    }, [auction.id]);

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

                        <div className="pt-6 border-t border-white/10 space-y-6">
                            {/* 24h Payment Limit Warning - Monochromatic Sleek */}
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Límite de Tiempo</p>
                                    <p className="text-[11px] font-medium text-slate-400 leading-snug">
                                        Vence en 24 horas tras la adjudicación.
                                    </p>
                                    {auction.updatedAt && (
                                        <p className="text-[12px] font-black text-white mt-1">
                                            {(() => {
                                                const awardDate = new Date(auction.updatedAt).getTime();
                                                const now = new Date().getTime();
                                                const diff = (awardDate + (24 * 60 * 60 * 1000)) - now;
                                                if (diff <= 0) return "EXPIRADO";
                                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                return `QUEDAN: ${hours}H ${mins}M`;
                                            })()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PaymentProcessModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                bid={winningBid}
                auctionTitle={auction.title}
                role={role}
            />
        </div>
    );
}
