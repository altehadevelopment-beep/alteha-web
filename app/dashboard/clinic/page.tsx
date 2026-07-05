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
import { Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PlanExpiredModal } from '@/components/plan/UpgradeModal';

export default function ClinicDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();

    // Plan de suscripción de la clínica: badge en el encabezado + alerta intrusiva si venció
    const [expiredPlanName, setExpiredPlanName] = React.useState<string | null>(null);
    const [planBadge, setPlanBadge] = React.useState<{ name: string; expired: boolean } | null>(null);
    React.useEffect(() => {
        import('@/lib/api').then(({ getMySubscription }) =>
            getMySubscription()
                .then((s: any) => {
                    setPlanBadge({ name: s?.effectivePlan?.name || '', expired: !!s?.expired });
                    let snoozed = false;
                    try { snoozed = !!sessionStorage.getItem('alteha_plan_expired_snooze'); } catch { /* ignore */ }
                    if (!snoozed && s?.expired && s?.contractedPlan?.priceUsd > 0) setExpiredPlanName(s.contractedPlan.name);
                })
                .catch(() => {})
        );
    }, []);

    // Subastas reales de la clínica (mismas fuentes que el home del médico)
    const [auctions, setAuctions] = React.useState<any[]>([]);
    const [isLoadingAuctions, setIsLoadingAuctions] = React.useState(true);
    React.useEffect(() => {
        import('@/lib/api').then(({ getMyInvitations }) =>
            getMyInvitations('CLINIC', 0, 20)
                .then((result: any) => {
                    let list: any[] = [];
                    if (result?.code === '00' && result.data) list = result.data;
                    else if (Array.isArray(result)) list = result;
                    else if (result?.content) list = result.content;
                    // Las SETTLED (ya cobradas) no van al dashboard
                    setAuctions(list.filter((a: any) => a.status !== 'SETTLED'));
                })
                .catch(() => {})
                .finally(() => setIsLoadingAuctions(false))
        );
    }, []);

    // Invitaciones de médicos pendientes de respuesta: aviso destacado en el dashboard
    const [pendingInvitations, setPendingInvitations] = React.useState<any[]>([]);
    React.useEffect(() => {
        import('@/lib/api').then(({ getClinicInvitations }) =>
            getClinicInvitations()
                .then((list: any[]) => setPendingInvitations((list || []).filter((i) => i.status === 'PENDING')))
                .catch(() => {})
        );
    }, []);

    const displayProfile = userProfile || {
        name: 'Cargando...',
        legalName: 'Cargando...',
        logoUrl: null,
        status: 'PENDING'
    };

    const clinicName = displayProfile.name || displayProfile.commercialName || displayProfile.legalName || 'Clínica';

    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Invitaciones pendientes: el médico espera tu respuesta para armar la dupla */}
            {pendingInvitations.length > 0 && (
                <Link href="/dashboard/clinic/invitations" className="block">
                    <div className="flex items-center justify-between gap-4 bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] hover:bg-amber-100/70 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                                    {pendingInvitations.length}
                                </span>
                            </div>
                            <div>
                                <p className="font-black text-amber-800">
                                    Tienes {pendingInvitations.length} invitaci{pendingInvitations.length === 1 ? 'ón' : 'ones'} de médico{pendingInvitations.length === 1 ? '' : 's'} sin responder
                                </p>
                                <p className="text-sm text-amber-700 font-medium">
                                    {pendingInvitations[0]?.doctorName ? `${pendingInvitations[0].doctorName} te invitó a "${pendingInvitations[0].auctionTitle}"` : 'Un médico te invitó a una subasta'}
                                    {pendingInvitations.length > 1 ? ' y más…' : ''} Acepta y define tus honorarios para armar la dupla.
                                </p>
                            </div>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-black px-4 py-2.5 rounded-xl">
                            Responder ahora <ChevronRight className="w-4 h-4" />
                        </span>
                    </div>
                </Link>
            )}

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
                            {planBadge && (
                                <Link href="/dashboard/clinic/plan"
                                    className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors ${planBadge.expired ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                                    <Crown className="w-3 h-3" />
                                    {planBadge.name}{planBadge.expired ? ' · Vencido' : ''}
                                </Link>
                            )}
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
                <StatCard label="Subastas Activas" value={isLoadingAuctions ? '…' : String(auctions.filter((a) => ['PUBLISHED', 'ACTIVE', 'AWARDED', 'PAYMENT_VALIDATION', 'PAID'].includes(a.status)).length)} icon={Gavel} trend={`${auctions.length} en total`} color="text-emerald-600" />
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

                    {isLoadingAuctions ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center text-slate-400 font-bold">
                            Cargando subastas…
                        </div>
                    ) : auctions.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center space-y-2">
                            <Gavel className="w-10 h-10 text-slate-200 mx-auto" />
                            <p className="font-black text-slate-700">No tienes subastas disponibles</p>
                            <p className="text-sm text-slate-400">Cuando un seguro publique una subasta para tu red, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {auctions.slice(0, 3).map((a: any) => (
                                <RealAuctionItem key={a.id} auction={a} />
                            ))}
                        </div>
                    )}
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

            {/* Plan vencido: alerta intrusiva hasta que renueve (o posponga en esta sesión) */}
            {expiredPlanName && (
                <PlanExpiredModal
                    planName={expiredPlanName}
                    onClose={() => { try { sessionStorage.setItem('alteha_plan_expired_snooze', '1'); } catch { /* ignore */ } setExpiredPlanName(null); }}
                />
            )}
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

const AUCTION_STATUS_ES: Record<string, string> = {
    PUBLISHED: 'Publicada',
    ACTIVE: 'En puja',
    AWARDED: 'Adjudicada',
    PAYMENT_REPORTED: 'Pago reportado',
    PAYMENT_VALIDATION: 'Validando pago',
    PAID: 'Pagada',
    COMPLETED: 'Completada',
    PENDING_SETTLEMENT: 'Liquidando fondos',
    CLOSED: 'Cerrada',
    CANCELLED: 'Cancelada',
};

function RealAuctionItem({ auction }: { auction: any }) {
    const deadline = auction.biddingDeadline || auction.estimatedSurgeryDate;
    return (
        <Link href={`/dashboard/clinic/auctions/${auction.auctionNumber}`} className="block">
            <div className="group flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 gap-4">
                <div className="flex items-center gap-6 min-w-0">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Gavel className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{auction.title}</h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{AUCTION_STATUS_ES[auction.status] || auction.status}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{auction.auctionNumber}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha límite</p>
                        <p className="text-sm font-bold text-slate-600">{deadline ? new Date(deadline).toLocaleDateString('es-VE') : '—'}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
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
