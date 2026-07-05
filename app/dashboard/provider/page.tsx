"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
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
    Edit3,
    Inbox,
    Package2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuctionCountdown from '@/components/auctions/AuctionCountdown';

const relTime = (d: string | undefined) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Ahora';
    if (m < 60) return `Hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hace ${h}h`;
    return `Hace ${Math.floor(h / 24)}d`;
};

export default function ProviderDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [openAuctions, setOpenAuctions] = useState<any[]>([]);
    const [myBids, setMyBids] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('id_token');
        const headers = { 'X-Alteha-Token': token || '' };
        Promise.all([
            fetch('/api/pharmacy-auctions/open', { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/pharmacy-auctions/my-bids', { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/payments/mine', { headers }).then(r => r.json()).catch(() => []),
        ]).then(([a, b, p]) => {
            setOpenAuctions(Array.isArray(a) ? a : []);
            setMyBids(Array.isArray(b) ? b : []);
            setPayments(Array.isArray(p) ? p : []);
        }).finally(() => setLoadingData(false));
    }, []);

    const stats = useMemo(() => {
        const active = openAuctions.filter(a => a.status === 'ACTIVE').length;
        const upcoming = openAuctions.filter(a => a.status === 'PUBLISHED').length;
        const submitted = myBids.filter(b => b.status === 'SUBMITTED').length;
        const accepted = myBids.filter(b => b.status === 'ACCEPTED').length;
        const now = new Date();
        const received = payments.filter(p => p.direction === 'RECIBIDO' && p.status === 'PAID');
        const monthSales = received
            .filter(p => {
                const d = p.date ? new Date(p.date) : null;
                return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const totalSales = received.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        return { active, upcoming, submitted, accepted, monthSales, totalSales, receivedCount: received.length };
    }, [openAuctions, myBids, payments]);

    const activity = useMemo(() => {
        const items: { icon: any; text: string; time: string; ts: number; color: string }[] = [];
        myBids.forEach(b => {
            const title = b.auction?.title || b.auction?.auctionNumber || 'Subasta';
            if (b.createdAt) {
                items.push({
                    icon: Gavel,
                    text: `Oferta enviada · ${title}`,
                    time: relTime(b.createdAt),
                    ts: new Date(b.createdAt).getTime(),
                    color: 'bg-indigo-50 text-indigo-600',
                });
            }
            if (b.status === 'ACCEPTED') {
                const ts = new Date(b.updatedAt || b.createdAt || Date.now()).getTime();
                items.push({
                    icon: CheckCircle,
                    text: `Oferta aceptada · ${title}`,
                    time: relTime(b.updatedAt || b.createdAt),
                    ts,
                    color: 'bg-emerald-50 text-emerald-500',
                });
            }
        });
        payments.filter(p => p.direction === 'RECIBIDO' && p.status === 'PAID').forEach(p => {
            items.push({
                icon: DollarSign,
                text: `Pago recibido por $${Number(p.amount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
                time: relTime(p.date),
                ts: p.date ? new Date(p.date).getTime() : 0,
                color: 'bg-blue-50 text-blue-500',
            });
        });
        return items.sort((a, b) => b.ts - a.ts).slice(0, 5);
    }, [myBids, payments]);

    const displayProfile = userProfile || {
        name: 'Cargando...',
        legalName: 'Cargando...',
        logoUrl: null,
        status: 'PENDING'
    };

    const providerName = displayProfile.name || displayProfile.commercialName || displayProfile.legalName || 'Proveedor';
    const logoOk = typeof displayProfile.logoUrl === 'string' && displayProfile.logoUrl.startsWith('http');
    const rating = Number(displayProfile.rating) > 0 ? Number(displayProfile.rating).toFixed(1) : '5.0';

    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Header section with company summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-50/50 p-10 rounded-[3rem] border border-indigo-100/50">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white p-3 flex items-center justify-center">
                        {logoOk ? (
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
                                <span className="font-bold text-slate-900">{rating}</span>
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
                <StatCard label="Subastas Activas" value={loadingData ? '…' : String(stats.active)} icon={Gavel} trend={`${stats.upcoming} próximamente`} color="text-indigo-600" />
                <StatCard label="Ofertas Enviadas" value={loadingData ? '…' : String(myBids.length)} icon={FileText} trend={`${stats.submitted} en curso`} color="text-blue-600" />
                <StatCard label="Ventas del Mes" value={loadingData ? '…' : `$${stats.monthSales.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`} icon={TrendingUp} trend={`${stats.receivedCount} cobros`} color="text-emerald-600" />
                <StatCard label="Ofertas Aceptadas" value={loadingData ? '…' : String(stats.accepted)} icon={Package} trend="insumos adjudicados" color="text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Available Auctions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-slate-900">Subastas Disponibles</h3>
                        <Link href="/dashboard/provider/auctions" className="text-sm font-bold text-indigo-600 hover:underline">Ver todas</Link>
                    </div>

                    {loadingData ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center text-slate-400 font-bold">Cargando subastas…</div>
                    ) : openAuctions.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center space-y-2">
                            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="font-black text-slate-700">No hay subastas con insumos por ahora</p>
                            <p className="text-sm text-slate-400">Cuando un seguro publique una subasta con insumos requeridos, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {openAuctions.slice(0, 4).map((a) => (
                                <AuctionItem key={a.id} auction={a} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity & Stats */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 px-2">Actividad Reciente</h3>
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 divide-y divide-slate-50">
                        {loadingData ? (
                            <p className="text-sm text-slate-400 font-bold text-center py-4">Cargando…</p>
                        ) : activity.length === 0 ? (
                            <div className="text-center py-6 space-y-2">
                                <Clock className="w-8 h-8 text-slate-200 mx-auto" />
                                <p className="text-sm font-bold text-slate-400">Sin actividad todavía</p>
                            </div>
                        ) : (
                            activity.map((it, i) => (
                                <ActivityItem key={i} icon={it.icon} text={it.text} time={it.time} color={it.color} />
                            ))
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] text-white text-center">
                        <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-80" />
                        <p className="font-black text-2xl">Ventas del Mes</p>
                        <p className="text-4xl font-black mt-2">
                            {loadingData ? '…' : `$${stats.monthSales.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                        </p>
                        <p className="text-xs uppercase tracking-widest mt-2 opacity-70">
                            {loadingData ? '' : `$${stats.totalSales.toLocaleString('es-VE', { minimumFractionDigits: 2 })} histórico`}
                        </p>
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

function AuctionItem({ auction }: { auction: any }) {
    const supplies = auction.requiredSupplies || [];
    const active = auction.status === 'ACTIVE';
    const ic: any = auction.insuranceCompany;
    const icName = ic?.name || ic?.commercialName || ic?.legalName;
    return (
        <Link href={`/dashboard/provider/auctions/${auction.auctionNumber}`} className="block">
            <div className="group flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-6 min-w-0">
                    <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${active ? 'bg-indigo-50/50 text-indigo-600' : 'bg-amber-50 text-amber-500'}`}>
                        <Package2 className="w-8 h-8" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{auction.title}</h4>
                            {!active && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded-full shrink-0">Próximamente</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{supplies.length} insumo{supplies.length !== 1 ? 's' : ''}</span>
                            {icName && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-xs font-medium text-slate-400 truncate">{icName}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                    {auction.endDate && (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo Restante</p>
                            <div className="text-sm font-bold text-slate-600"><AuctionCountdown endDate={auction.endDate} /></div>
                        </div>
                    )}
                    {active && (
                        <span className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm group-hover:scale-105 transition-all">
                            Ofertar
                        </span>
                    )}
                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    );
}

function ActivityItem({ icon: Icon, text, time, color }: any) {
    return (
        <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{text}</p>
                <p className="text-xs text-slate-400 font-medium">{time}</p>
            </div>
        </div>
    );
}
