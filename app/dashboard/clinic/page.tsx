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
import { Crown, ExternalLink, DollarSign, MessageSquare, Loader2 } from 'lucide-react';
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

    // Invitaciones de médicos: aviso de pendientes + actividad reciente
    const [pendingInvitations, setPendingInvitations] = React.useState<any[]>([]);
    const [allInvitations, setAllInvitations] = React.useState<any[]>([]);
    React.useEffect(() => {
        import('@/lib/api').then(({ getClinicInvitations }) =>
            getClinicInvitations()
                .then((list: any[]) => {
                    setAllInvitations(list || []);
                    setPendingInvitations((list || []).filter((i) => i.status === 'PENDING'));
                })
                .catch(() => {})
        );
    }, []);

    // Paquetes publicados por la clínica (conteo real)
    const [packagesCount, setPackagesCount] = React.useState<number | null>(null);
    React.useEffect(() => {
        import('@/lib/api').then(({ getMyMedicalPackages }) =>
            getMyMedicalPackages()
                .then((res: any) => {
                    const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
                    setPackagesCount(Array.isArray(list) ? list.length : 0);
                })
                .catch(() => setPackagesCount(0))
        );
    }, []);

    // Reseñas recibidas (la clínica es la valorada)
    const [reviews, setReviews] = React.useState<any[]>([]);
    const [reviewsLoaded, setReviewsLoaded] = React.useState(false);
    const accountId = (userProfile as any)?.account?.id;
    React.useEffect(() => {
        if (!accountId) return;
        (async () => {
            try {
                const resp = await fetch(`/api/reviews?revieweeId.equals=${accountId}&size=200`);
                const data = await resp.json();
                setReviews(Array.isArray(data) ? data : (data?.content ?? []));
            } catch { /* sin reseñas */ } finally { setReviewsLoaded(true); }
        })();
    }, [accountId]);

    // Publicidades del dashboard (igual que el perfil del médico)
    const [ads, setAds] = React.useState<any[]>([]);
    const [isLoadingAds, setIsLoadingAds] = React.useState(true);
    const [showAllAds, setShowAllAds] = React.useState(false);
    React.useEffect(() => {
        import('@/lib/api').then(({ getDashboardAds }) =>
            getDashboardAds('CLINIC')
                .then((res: any) => {
                    const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
                    setAds(Array.isArray(list) ? list : []);
                })
                .catch(() => {})
                .finally(() => setIsLoadingAds(false))
        );
    }, []);

    // Ganancias del mes: subastas SETTLED de este mes (misma regla que el médico)
    const now = new Date();
    const monthEarnings = auctions
        .filter((a: any) => a.status === 'SETTLED' && a.updatedAt &&
            new Date(a.updatedAt).getMonth() === now.getMonth() &&
            new Date(a.updatedAt).getFullYear() === now.getFullYear())
        .reduce((sum: number, a: any) => sum + Number(a.awardedBid?.bidAmount ?? 0), 0);

    const reviewsAvg = reviews.length
        ? reviews.reduce((s2: number, r: any) => s2 + (Number(r.rating) || 0), 0) / reviews.length
        : null;

    // Actividad reciente real: invitaciones (recibidas/respondidas) + reseñas
    const activity = React.useMemo(() => {
        const items: { icon: any; text: string; date: Date; color: string }[] = [];
        allInvitations.forEach((inv: any) => {
            if (inv.invitedAt) {
                items.push({
                    icon: Bell,
                    text: `${inv.doctorName || 'Un médico'} te invitó a "${inv.auctionTitle || inv.auctionNumber}"`,
                    date: new Date(inv.invitedAt),
                    color: 'bg-amber-50 text-amber-500',
                });
            }
            if (inv.respondedAt) {
                items.push({
                    icon: Gavel,
                    text: inv.status === 'ACCEPTED'
                        ? `Aceptaste la dupla de "${inv.auctionTitle || inv.auctionNumber}"`
                        : `Rechazaste la invitación de "${inv.auctionTitle || inv.auctionNumber}"`,
                    date: new Date(inv.respondedAt),
                    color: inv.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400',
                });
            }
        });
        reviews.forEach((r: any) => {
            if (r.createdAt) {
                items.push({
                    icon: Star,
                    text: `Nueva reseña recibida (${Number(r.rating) || 0}★)`,
                    date: new Date(r.createdAt),
                    color: 'bg-amber-50 text-amber-500',
                });
            }
        });
        return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [allInvitations, reviews]);

    // Cambiar el logo haciendo clic en la foto del encabezado
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = React.useState(false);
    const handleLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        setUploadingLogo(true);
        try {
            const { updateClinicProfile } = await import('@/lib/api');
            const res = await updateClinicProfile({
                name: (userProfile as any)?.name || (userProfile as any)?.commercialName || '',
                legalName: (userProfile as any)?.legalName || '',
                email: (userProfile as any)?.email || '',
                phone: (userProfile as any)?.phone || '',
                website: (userProfile as any)?.website || '',
            }, file);
            if (res?.code === '00') setLogoPreview(URL.createObjectURL(file));
        } catch { /* silencioso: el perfil tiene su propio flujo con toasts */ } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

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
                    <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        title="Cambiar logo"
                        className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white p-2 flex items-center justify-center group cursor-pointer"
                    >
                        {logoPreview || displayProfile.logoUrl ? (
                            <img src={logoPreview || displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="w-full h-full text-emerald-600 opacity-20" />
                        )}
                        <span className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {uploadingLogo
                                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                                : <Edit3 className="w-6 h-6 text-white" />}
                        </span>
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelected} />
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
                    <Link
                        href="/dashboard/clinic/notifications"
                        title="Notificaciones"
                        className="relative p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-600 transition-all"
                    >
                        <Bell className="w-6 h-6" />
                        {pendingInvitations.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                                {pendingInvitations.length}
                            </span>
                        )}
                    </Link>
                    <Link href="/dashboard/clinic/profile">
                        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                            <Edit3 className="w-5 h-5 text-emerald-400" />
                            Editar Perfil
                        </button>
                    </Link>
                </div>
            </div>

            {/* Publicidad — igual que el perfil del médico */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em]">Publicidad Especializada</span>
                    {ads.length > 3 && (
                        <button
                            type="button"
                            onClick={() => setShowAllAds(v => !v)}
                            className="flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:gap-2.5 transition-all"
                        >
                            {showAllAds ? 'Ver menos' : 'Ver más'}
                            <ChevronRight className={`w-4 h-4 transition-transform ${showAllAds ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>

                {isLoadingAds ? (
                    <div className="flex items-center justify-center py-12 bg-slate-100 rounded-[2rem]">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                ) : ads.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(showAllAds ? ads : ads.slice(0, 3)).map((ad: any, i: number) => {
                            const isImg = ad.mediaUrl && ad.mediaType === 'IMAGE';
                            const isBanner = isImg && (!ad.title || !ad.title.trim());
                            const adHref = `/dashboard/clinic/ads/${ad.id}`;

                            if (isBanner) {
                                return (
                                    <Link
                                        key={ad.id ?? i}
                                        href={adHref}
                                        className="relative h-44 rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200/60 hover:-translate-y-1 transition-transform bg-slate-50 flex items-center justify-center"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={ad.mediaUrl} alt={ad.subtitle || 'Publicidad'} className="w-full h-full object-contain" />
                                    </Link>
                                );
                            }
                            return (
                                <Link
                                    key={ad.id ?? i}
                                    href={adHref}
                                    className="relative h-44 rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200/60 hover:-translate-y-1 transition-transform block"
                                    style={{
                                        backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.96), rgba(15,23,42,0.3)), url(${isImg ? ad.mediaUrl : '/images/ads/cardiology.png'})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                                        <span className="text-emerald-300 text-[9px] font-black uppercase tracking-[0.2em] mb-1 line-clamp-1">{ad.subtitle || 'Patrocinado'}</span>
                                        <h4 className="text-base font-black text-white leading-tight line-clamp-2 mb-3">{ad.title}</h4>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 text-slate-900 rounded-lg font-black text-[10px] uppercase w-fit">
                                            {ad.ctaText || 'Ver más'}
                                            <ExternalLink className="w-3 h-3" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        className="relative h-44 rounded-[2rem] overflow-hidden shadow-lg flex flex-col justify-end p-6"
                        style={{
                            backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.35)), url(/images/ads/traumatology.png)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <span className="text-emerald-300 text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">Bienvenido a Alteha</span>
                        <h3 className="text-xl font-black text-white mb-1">Potencia tu Centro de Salud</h3>
                        <p className="text-white/70 text-sm font-medium">Gestiona tus subastas, duplas y paquetes con la tecnología más avanzada.</p>
                    </div>
                )}
            </section>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Subastas Activas" value={isLoadingAuctions ? '…' : String(auctions.filter((a) => ['PUBLISHED', 'ACTIVE', 'AWARDED', 'PAYMENT_VALIDATION', 'PAID'].includes(a.status)).length)} icon={Gavel} trend={`${auctions.length} en total`} color="text-emerald-600" />
                <StatCard label="Ganancias del Mes" value={isLoadingAuctions ? '…' : `$${monthEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} icon={TrendingUp} trend="Subastas liquidadas" color="text-blue-600" />
                <StatCard label="Paquetes Propios" value={packagesCount == null ? '…' : String(packagesCount)} icon={Package} trend="Publicados" color="text-alteha-violet" />
                <StatCard label="Reseñas Recibidas" value={!reviewsLoaded ? '…' : String(reviews.length)} icon={Star} trend={reviewsAvg != null ? `${reviewsAvg.toFixed(1)} ★ promedio` : 'Sin reseñas aún'} color="text-amber-600" />
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
                        {activity.length === 0 ? (
                            <p className="text-sm text-slate-400 font-medium py-6 text-center">
                                Sin actividad todavía. Aquí verás invitaciones, duplas y reseñas a medida que participes.
                            </p>
                        ) : (
                            activity.map((item, i) => (
                                <ActivityItem key={i} icon={item.icon} text={item.text} time={timeAgo(item.date)} color={item.color} />
                            ))
                        )}
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

function timeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Hace ${days}d`;
    return date.toLocaleDateString('es-VE');
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
                        {(() => {
                            const ic: any = auction.insuranceCompany;
                            const icName = ic?.name || ic?.commercialName || ic?.legalName;
                            if (!icName) return null;
                            return (
                                <span className="inline-flex items-center gap-1.5 mt-0.5">
                                    {ic?.logoUrl ? <img src={ic.logoUrl} alt={icName} className="w-4 h-4 rounded object-contain bg-white border border-slate-100" /> : null}
                                    <span className="text-[10px] font-black text-slate-500">{icName}</span>
                                </span>
                            );
                        })()}
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
