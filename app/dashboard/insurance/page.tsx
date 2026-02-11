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
    Clock
} from 'lucide-react';
import Link from 'next/link';

export default function InsuranceDashboard() {
    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Header section with company summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-violet-50/50 p-10 rounded-[3rem] border border-violet-100/50">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white p-3">
                        <ShieldCheck className="w-full h-full text-alteha-violet" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Seguros Metropolitanos</h2>
                            <div className="px-3 py-1 bg-alteha-violet text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                Premium
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 font-medium">
                            <span className="text-alteha-violet">Aseguradora de Salud</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-slate-900">4.7</span>
                                <span className="text-xs font-medium text-slate-400">(89 valoraciones)</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-alteha-violet transition-all">
                        <Bell className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard/insurance/auctions/new">
                        <button className="flex items-center gap-3 px-8 py-4 bg-alteha-violet text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-alteha-violet/20">
                            <Plus className="w-5 h-5" />
                            Nueva Subasta
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Subastas Abiertas" value="8" icon={Gavel} trend="+2 esta semana" color="text-alteha-violet" />
                <StatCard label="Ahorro en Siniestros" value="$128k" icon={TrendingDown} trend="22% vs mes anterior" color="text-emerald-600" />
                <StatCard label="Órdenes Emitidas" value="34" icon={FileText} trend="5 pendientes" color="text-blue-600" />
                <StatCard label="Médicos Conectados" value="156" icon={Users} trend="+12 este mes" color="text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Active Auctions List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-slate-900">Subastas en Curso</h3>
                        <Link href="/dashboard/insurance/auctions" className="text-sm font-bold text-alteha-violet hover:underline">Ver todas</Link>
                    </div>

                    <div className="space-y-4">
                        <AuctionItem
                            title="Cirugía de Rodilla - Caso #4521"
                            status="En Puja"
                            bids={12}
                            bestBid="$2,800"
                            timeLeft="4h 30m"
                            savings="15%"
                        />
                        <AuctionItem
                            title="Imagenología Mensual - Lote Mayo"
                            status="Esperando"
                            bids={3}
                            bestBid="$8,200"
                            timeLeft="2d 6h"
                            savings="8%"
                        />
                        <AuctionItem
                            title="Procedimiento Cardiológico #7899"
                            status="Finalizando"
                            bids={18}
                            bestBid="$5,100"
                            timeLeft="1h 15m"
                            savings="28%"
                        />
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

function AuctionItem({ title, status, bids, bestBid, timeLeft, savings }: any) {
    return (
        <div className="group flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-violet-50/50 flex items-center justify-center text-alteha-violet group-hover:scale-110 transition-transform">
                    <Gavel className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-alteha-violet transition-colors">{title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-black text-alteha-violet uppercase tracking-widest">{status}</span>
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ahorro</p>
                    <p className="text-sm font-bold text-emerald-500">-{savings}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo</p>
                    <p className="text-sm font-bold text-red-500">{timeLeft}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-alteha-violet group-hover:translate-x-1 transition-all" />
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
