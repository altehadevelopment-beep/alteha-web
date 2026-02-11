"use client";

import React from 'react';
import { motion, AnimatePresence as AP } from 'framer-motion';
import {
    Plus,
    Search,
    Bell,
    ChevronRight,
    Users,
    Calendar,
    TrendingUp,
    Gavel,
    Package,
    Building2,
    Star,
    Edit3
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ClinicDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();

    const displayProfile = userProfile || {
        name: 'Cargando...',
        legalName: 'Cargando...',
        logoUrl: null,
        status: 'PENDING'
    };

    const clinicName = displayProfile.name || displayProfile.commercialName || displayProfile.legalName || 'Clínica';

    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Header section with profile summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-emerald-50/50 p-10 rounded-[3rem] border border-emerald-100/50">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white p-2 flex items-center justify-center">
                        {displayProfile.logoUrl ? (
                            <img src={displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="w-full h-full text-emerald-600 opacity-20" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isLoadingProfile && !userProfile ? 'Cargando...' : clinicName}
                            </h2>
                            <div className={`px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-full ${displayProfile.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                {displayProfile.status}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 font-medium">
                            <span className="text-emerald-600">Centro Hospitalario</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <Link href="/dashboard/clinic/score" className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-slate-900">5.0</span>
                                <span className="text-xs font-medium">(Socio Verificado)</span>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-600 transition-all">
                        <Bell className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard/clinic/profile">
                        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                            <Edit3 className="w-5 h-5 text-emerald-400" />
                            Editar Perfil
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Subastas Activas" value="12" icon={Gavel} trend="+3 este mes" color="text-emerald-600" />
                <StatCard label="Ahorro Generado" value="$42.5k" icon={TrendingUp} trend="15% vs mes anterior" color="text-blue-600" />
                <StatCard label="Paquetes Propios" value="8" icon={Package} trend="2 nuevos" color="text-alteha-violet" />
                <StatCard label="Especialistas en Red" value="45" icon={Users} trend="+5 hoy" color="text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Active Auctions List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-slate-900">Subastas en Progreso</h3>
                        <Link href="/dashboard/clinic/auctions" className="text-sm font-bold text-emerald-600 hover:underline">Ver todas</Link>
                    </div>

                    <div className="space-y-4">
                        <AuctionItem
                            title="Reemplazo de Cadera - Lote 5"
                            status="En Puja"
                            bids={8}
                            bestBid="$3,200"
                            timeLeft="2h 15m"
                        />
                        <AuctionItem
                            title="Insumos Quirúrgicos Mensuales"
                            status="Esperando Ofertas"
                            bids={2}
                            bestBid="$12,500"
                            timeLeft="1d 4h"
                        />
                        <AuctionItem
                            title="Servicio de Imagenología"
                            status="Finalizando"
                            bids={15}
                            bestBid="$850"
                            timeLeft="45m"
                        />
                    </div>
                </div>

                {/* Notifications / Activity */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 px-2">Actividad Reciente</h3>
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 divide-y divide-slate-50">
                        <ActivityItem icon={Star} text="Nueva reseña de Dr. Roberto" time="Hace 10m" color="bg-amber-50 text-amber-500" />
                        <ActivityItem icon={Gavel} text="Oferta recibida en Subasta #102" time="Hace 25m" color="bg-emerald-50 text-emerald-500" />
                        <ActivityItem icon={Users} text="Dr. Elena se unió a tu red" time="Hace 1h" color="bg-blue-50 text-blue-500" />
                        <ActivityItem icon={TrendingUp} text="Reporte mensual listo" time="Hace 3h" color="bg-purple-50 text-purple-500" />
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
                <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                    {trend}
                </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <h4 className="text-3xl font-black text-slate-900 mt-1">{value}</h4>
        </motion.div>
    );
}

function AuctionItem({ title, status, bids, bestBid, timeLeft }: any) {
    return (
        <div className="group flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50/50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Gavel className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{status}</span>
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo</p>
                    <p className="text-sm font-bold text-red-500">{timeLeft}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
}

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
