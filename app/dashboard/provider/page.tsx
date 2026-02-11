"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Bell,
    ChevronRight,
    TrendingUp,
    Gavel,
    Package,
    Truck,
    Star,
    DollarSign,
    Clock,
    FileText,
    CheckCircle,
    Edit3
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ProviderDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();

    const displayProfile = userProfile || {
        name: 'Cargando...',
        legalName: 'Cargando...',
        logoUrl: null,
        status: 'PENDING'
    };

    const providerName = displayProfile.name || displayProfile.commercialName || displayProfile.legalName || 'Proveedor';

    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Header section with company summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-50/50 p-10 rounded-[3rem] border border-indigo-100/50">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white p-3 flex items-center justify-center">
                        {displayProfile.logoUrl ? (
                            <img src={displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Truck className="w-full h-full text-indigo-600 opacity-20" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isLoadingProfile && !userProfile ? 'Cargando...' : providerName}
                            </h2>
                            <div className={`px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-full ${displayProfile.status === 'ACTIVE' ? 'bg-indigo-600' : 'bg-amber-500'}`}>
                                {displayProfile.status}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 font-medium">
                            <span className="text-indigo-600">Proveedor de Insumos Médicos</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-slate-900">5.0</span>
                                <span className="text-xs font-medium text-slate-400">(Socio Verificado)</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                        <Bell className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard/provider/profile">
                        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                            <Edit3 className="w-5 h-5 text-indigo-400" />
                            Editar Perfil
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Subastas Activas" value="24" icon={Gavel} trend="+8 nuevas hoy" color="text-indigo-600" />
                <StatCard label="Ofertas Enviadas" value="18" icon={FileText} trend="5 pendientes" color="text-blue-600" />
                <StatCard label="Ventas del Mes" value="$89k" icon={TrendingUp} trend="+32% vs anterior" color="text-emerald-600" />
                <StatCard label="Productos Activos" value="142" icon={Package} trend="12 destacados" color="text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Available Auctions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-slate-900">Subastas Disponibles</h3>
                        <Link href="/dashboard/provider/auctions" className="text-sm font-bold text-indigo-600 hover:underline">Ver todas</Link>
                    </div>

                    <div className="space-y-4">
                        <AuctionItem
                            title="Prótesis de Rodilla - Hospital Central"
                            category="Ortopédicos"
                            budget="$3,500 - $4,200"
                            timeLeft="6h 45m"
                            urgent={true}
                        />
                        <AuctionItem
                            title="Kit de Sutura Quirúrgica x100"
                            category="Consumibles"
                            budget="$800 - $1,200"
                            timeLeft="1d 2h"
                            urgent={false}
                        />
                        <AuctionItem
                            title="Equipo de Imagenología Portátil"
                            category="Equipos"
                            budget="$12,000 - $15,000"
                            timeLeft="3d 8h"
                            urgent={false}
                        />
                    </div>
                </div>

                {/* Recent Activity & Stats */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 px-2">Actividad Reciente</h3>
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 divide-y divide-slate-50">
                        <ActivityItem icon={CheckCircle} text="Oferta aceptada - Subasta #892" time="Hace 15m" color="bg-emerald-50 text-emerald-500" />
                        <ActivityItem icon={DollarSign} text="Pago recibido por $2,450" time="Hace 1h" color="bg-blue-50 text-blue-500" />
                        <ActivityItem icon={Gavel} text="Nueva subasta en tu categoría" time="Hace 2h" color="bg-indigo-50 text-indigo-600" />
                        <ActivityItem icon={Clock} text="Oferta superada en Subasta #887" time="Hace 4h" color="bg-amber-50 text-amber-500" />
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] text-white text-center">
                        <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-80" />
                        <p className="font-black text-2xl">Ventas del Mes</p>
                        <p className="text-4xl font-black mt-2">$89,320</p>
                        <p className="text-xs uppercase tracking-widest mt-2 opacity-70">+32% vs mes anterior</p>
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
                <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                    {trend}
                </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <h4 className="text-3xl font-black text-slate-900 mt-1">{value}</h4>
        </motion.div>
    );
}

function AuctionItem({ title, category, budget, timeLeft, urgent }: any) {
    return (
        <div className="group flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${urgent ? 'bg-red-50 text-red-500' : 'bg-indigo-50/50 text-indigo-600'}`}>
                    <Package className="w-8 h-8" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h4>
                        {urgent && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-full">Urgente</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-xs font-medium text-slate-400">Presupuesto: {budget}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo Restante</p>
                    <p className={`text-sm font-bold ${urgent ? 'text-red-500' : 'text-slate-600'}`}>{timeLeft}</p>
                </div>
                <Link href="/dashboard/provider/auctions">
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all">
                        Ofertar
                    </button>
                </Link>
                <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
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
