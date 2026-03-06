"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Bell,
    ChevronRight,
    Users,
    Calendar,
    TrendingDown,
    Gavel,
    FileText,
    ShieldCheck,
    Star,
    DollarSign,
    Clock,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAuctions, type Auction } from '@/lib/api';
import { useState, useEffect } from 'react';

export default function InsuranceDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [recentAuctions, setRecentAuctions] = useState<Auction[]>([]);
    const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);

    const displayProfile = userProfile || {
        commercialName: 'Cargando...',
        legalName: 'Cargando...',
        logoUrl: null,
        status: 'PENDING'
    };

    useEffect(() => {
        const loadRecent = async () => {
            setIsLoadingAuctions(true);
            try {
                const result = await getMyAuctions(undefined, 0, 3);
                if (result.code === '00') {
                    setRecentAuctions(result.data || []);
                }
            } catch (err) {
                console.error('Error loading recent auctions:', err);
            } finally {
                setIsLoadingAuctions(false);
            }
        };
        loadRecent();
    }, []);

    const rating = 5.0; // Default or from profile if available

    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Header section with company summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-violet-50/50 p-10 rounded-[3rem] border border-violet-100/50">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white p-3 flex items-center justify-center">
                        {displayProfile.logoUrl ? (
                            <img src={displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <ShieldCheck className="w-full h-full text-alteha-violet opacity-20" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isLoadingProfile && !userProfile ? 'Cargando...' : (displayProfile.commercialName || displayProfile.legalName)}
                            </h2>
                            <div className="px-3 py-1 bg-alteha-violet text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                {displayProfile.status}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 font-medium">
                            <span className="text-alteha-violet">Aseguradora de Salud</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
                                <span className="text-xs font-medium text-slate-400">(Socio Verificado)</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-alteha-violet transition-all">
                        <Bell className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard/insurance/profile">
                        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-slate-200">
                            Editar Perfil
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Subastas Abiertas" value={isLoadingAuctions ? '...' : recentAuctions.filter(a => a.status === 'ACTIVE').length.toString()} icon={Gavel} trend="Tiempo Real" color="text-alteha-violet" />
                <StatCard label="Ahorro en Siniestros" value="$128k" icon={TrendingDown} trend="22% vs mes anterior" color="text-emerald-600" />
                <StatCard label="Subastas Draft" value={isLoadingAuctions ? '...' : recentAuctions.filter(a => a.status === 'DRAFT').length.toString()} icon={FileText} trend="Pendientes" color="text-blue-600" />
                <StatCard label="Médicos Conectados" value="156" icon={Users} trend="+12 este mes" color="text-amber-600" />
            </div>

            {/* Patients Link */}
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <Users className="w-8 h-8 text-alteha-turquoise" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">Gestión de Pacientes</h3>
                    </div>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Registra nuevos beneficiarios, busca por su documento de identidad y mantén sus perfiles médicos actualizados.
                    </p>
                </div>
                <Link href="/dashboard/insurance/patients">
                    <button className="px-10 py-5 bg-alteha-turquoise text-slate-900 rounded-[1.5rem] font-black hover:scale-105 transition-all shadow-xl shadow-alteha-turquoise/20 flex items-center gap-3 w-full md:w-auto justify-center">
                        Administrar Pacientes
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </Link>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Active Auctions List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-slate-900">Subastas en Curso</h3>
                        <Link href="/dashboard/insurance/auctions" className="text-sm font-bold text-alteha-violet hover:underline">Ver todas</Link>
                    </div>

                    <div className="space-y-4">
                        {isLoadingAuctions ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-8 h-8 text-alteha-violet animate-spin" />
                            </div>
                        ) : recentAuctions.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 font-bold">No hay subastas recientes</p>
                            </div>
                        ) : (
                            recentAuctions.map(auction => (
                                <AuctionItem
                                    key={auction.id}
                                    id={auction.auctionNumber}
                                    title={auction.title}
                                    status={auction.status}
                                    bids={auction.totalBids || 0}
                                    bestBid={auction.currentLowestBid ? `$${auction.currentLowestBid.toLocaleString()}` : 'N/A'}
                                    timeLeft={new Date(auction.endDate).toLocaleDateString()}
                                    savings="-"
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 px-2">Actividad Reciente</h3>
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 divide-y divide-slate-50">
                        <ActivityItem icon={DollarSign} text="Puja ganadora en Subasta #4520" time="Hace 5m" color="bg-emerald-50 text-emerald-500" />
                        <ActivityItem icon={Users} text="Dr. Martínez aceptó la orden" time="Hace 20m" color="bg-blue-50 text-blue-500" />
                        <ActivityItem icon={Gavel} text="Nueva oferta en Subasta #4521" time="Hace 45m" color="bg-violet-50 text-alteha-violet" />
                        <ActivityItem icon={Clock} text="Subasta #4518 finalizada" time="Hace 2h" color="bg-slate-50 text-slate-500" />
                    </div>

                    <div className="bg-alteha-violet/5 p-6 rounded-[2rem] border border-alteha-violet/10">
                        <h4 className="font-black text-alteha-violet mb-3 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5" />
                            Ahorro del Mes
                        </h4>
                        <p className="text-4xl font-black text-slate-900">$128,450</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">vs. precios tradicionales</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-alteha-violet bg-violet-50 px-2 py-1 rounded-lg uppercase">
                    {trend}
                </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <h4 className="text-3xl font-black text-slate-900 mt-1">{value}</h4>
        </motion.div>
    );
}

function AuctionItem({ id, title, status, bids, bestBid, timeLeft, savings }: any) {
    return (
        <div className="group flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-violet-50/50 flex items-center justify-center text-alteha-violet group-hover:scale-110 transition-transform">
                    <Gavel className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-alteha-violet transition-colors">{title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-alteha-violet uppercase tracking-widest">{status}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-xs font-medium text-slate-400">{bids} ofertas</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-10">
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mejor Puja</p>
                    <p className="text-xl font-black text-slate-900">{bestBid}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Límite</p>
                    <p className="text-sm font-bold text-slate-600">{timeLeft}</p>
                </div>
                <Link href={`/dashboard/insurance/auctions/${id}`}>
                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-alteha-violet group-hover:translate-x-1 transition-all" />
                </Link>
            </div>
        </div>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className={className}>
        <Clock className="w-full h-full" />
    </motion.div>
);

function ActivityItem({ icon: Icon, text, time, color }: any) {
    return (
        <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{text}</p>
                <p className="text-xs text-slate-400 font-medium">{time}</p>
            </div>
        </div>
    );
}
