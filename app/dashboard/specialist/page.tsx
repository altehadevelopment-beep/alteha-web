"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Loader } from '@/components/ui/Loader';
import {
    Bell,
    MessageSquare,
    Star,
    Edit3,
    Search,
    Filter,
    ChevronRight,
    Clock,
    TrendingUp,
    Package,
    CheckCircle2,
    DollarSign,
    MapPin,
    Hospital,
    FileText,
    ArrowRight,
    Calendar,
    Building2,
    ExternalLink,
    FileCheck,
    Shield,
    Crown
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getDashboardAds, getMyInvitations, getAuctionBidsCount, getAuctionDetailsAsDoctor, type Advertisement, type Auction, getIdentityCompliance, searchIdentityCompliance } from '@/lib/api';
import AuctionCountdown from '@/components/auctions/AuctionCountdown';
import { RatingExperienceModal } from '@/components/dashboard/RatingExperienceModal';
import { PlanExpiredModal } from '@/components/plan/UpgradeModal';
import { ratedStorageKey } from '@/components/payments/WinnerSettlementSection';

export default function SpecialistDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [currentAd, setCurrentAd] = useState(0);
    const [showAllAds, setShowAllAds] = useState(false);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLoadingAds, setIsLoadingAds] = useState(true);
    const [complianceStatus, setComplianceStatus] = useState<string | null>(null);
    const [isLoadingCompliance, setIsLoadingCompliance] = useState(true);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
    const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);
    const [nextIntervention, setNextIntervention] = useState<Auction | null>(null);
    // Subasta liquidada pendiente de valoración → dispara el modal intrusivo
    const [ratingAuction, setRatingAuction] = useState<any>(null);
    // Plan pago vencido → alerta intrusiva de renovación; y badge del plan en el encabezado
    const [expiredPlanName, setExpiredPlanName] = useState<string | null>(null);
    const [planBadge, setPlanBadge] = useState<{ name: string; code: string; expired: boolean } | null>(null);
    useEffect(() => {
        import('@/lib/api').then(({ getMySubscription }) =>
            getMySubscription()
                .then((s: any) => {
                    setPlanBadge({ name: s?.effectivePlan?.name || '', code: s?.effectivePlan?.code || '', expired: !!s?.expired });
                    let snoozed = false;
                    try { snoozed = !!sessionStorage.getItem('alteha_plan_expired_snooze'); } catch { /* ignore */ }
                    if (!snoozed && s?.expired && s?.contractedPlan?.priceUsd > 0) setExpiredPlanName(s.contractedPlan.name);
                })
                .catch(() => {})
        );
    }, []);
    // Estadísticas reales del dashboard (paquetes y reseñas se cargan aparte)
    const [packagesCount, setPackagesCount] = useState<number | null>(null);
    const [receivedReviews, setReceivedReviews] = useState<{ count: number; avg: number | null } | null>(null);

    // Paquetes publicados por el médico
    useEffect(() => {
        (async () => {
            try {
                const { getMyMedicalPackages } = await import('@/lib/api');
                const res: any = await getMyMedicalPackages();
                const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
                setPackagesCount(Array.isArray(list) ? list.length : 0);
            } catch { setPackagesCount(0); }
        })();
    }, []);

    // Reseñas recibidas (reviews donde el médico es el valorado)
    useEffect(() => {
        const accountId = (userProfile as any)?.account?.id;
        if (!accountId) return;
        (async () => {
            try {
                const resp = await fetch(`/api/reviews?revieweeId.equals=${accountId}&size=200`);
                const data = await resp.json();
                const list: any[] = Array.isArray(data) ? data : (data?.content ?? []);
                const avg = list.length ? list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / list.length : null;
                setReceivedReviews({ count: list.length, avg });
            } catch { setReceivedReviews({ count: 0, avg: null }); }
        })();
    }, [(userProfile as any)?.account?.id]);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await getDashboardAds('DOCTOR');
                if (response.code === '00' && Array.isArray(response.data)) {
                    setAds(response.data.filter(ad => ad.active));
                }
            } catch (error) {
                console.error('Error fetching ads:', error);
            } finally {
                setIsLoadingAds(false);
            }
        };

        fetchAds();
    }, []);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const result = await getMyInvitations('DOCTOR', 0, 20);
                let list: Auction[] = [];
                if (result.code === '00' && result.data) {
                    list = result.data;
                } else if (Array.isArray(result)) {
                    list = result as any;
                } else if ((result as any).content) {
                    list = (result as any).content;
                }
                // Las SETTLED (ya cobradas) no van al dashboard: viven en el Histórico de Subastas
                setAuctions(list.filter((a: any) => a.status !== 'SETTLED').slice(0, 3));
                setAllAuctions(list);
                // Find the next PAID (upcoming intervention) sorted by estimatedSurgeryDate
                const paidAuctions = list
                    .filter((a: any) => a.status === 'PAID' && a.estimatedSurgeryDate)
                    .sort((a: any, b: any) => new Date(a.estimatedSurgeryDate).getTime() - new Date(b.estimatedSurgeryDate).getTime());
                setNextIntervention(paidAuctions[0] || null);
            } catch (e) {
                console.error('Error loading auctions:', e);
            } finally {
                setIsLoadingAuctions(false);
            }
        };
        fetchAuctions();
    }, []);

    // Modal intrusivo de valoración: si una subasta ganada ya tiene fondos liquidados
    // y el médico aún no valoró a todos los actores, se le pide la valoración al entrar.
    useEffect(() => {
        if (!userProfile?.id || allAuctions.length === 0) return;
        let active = true;
        (async () => {
            const candidates = allAuctions.filter((a: any) => {
                if (a.status !== 'PENDING_SETTLEMENT' && a.status !== 'SETTLED') return false;
                try { if (sessionStorage.getItem(`alteha_rating_snooze_${a.auctionNumber}`)) { console.log('[RatingModal]', a.auctionNumber, 'pospuesta en esta sesión (snooze)'); return false; } } catch { /* ignore */ }
                return true;
            });
            console.log('[RatingModal] candidatas:', candidates.map((c: any) => `${c.auctionNumber}:${c.status}`), '| perfil id:', userProfile.id);
            const accountId = Number((userProfile as any)?.account?.id ?? NaN);
            for (const c of candidates) {
                try {
                    const res: any = await getAuctionDetailsAsDoctor(c.auctionNumber);
                    const detail = res?.data || res;
                    if (!detail?.auctionNumber) { console.log('[RatingModal]', c.auctionNumber, 'detalle sin datos:', res?.code, res?.message); continue; }
                    const awardedDoctorId = detail.awardedBid?.doctor?.id ?? (detail.awardedBid as any)?.doctorId;
                    if (!awardedDoctorId || Number(awardedDoctorId) !== Number(userProfile.id)) {
                        console.log('[RatingModal]', c.auctionNumber, 'no es el ganador → awardedDoctorId:', awardedDoctorId, 'vs perfil:', userProfile.id);
                        continue; // solo el ganador valora
                    }
                    const required = ['INSURANCE', 'ALTEHA', ...(detail.awardedBid?.clinic ? ['CLINIC'] : [])];

                    // Verdad del backend: valoraciones reales de este médico en esta subasta.
                    // (localStorage es solo caché por navegador; puede quedar desfasado o venir de otro dispositivo)
                    let backendCount = -1;
                    if (!Number.isNaN(accountId) && detail.id) {
                        try {
                            const { getAuctionReviews } = await import('@/lib/api');
                            const revs = await getAuctionReviews(detail.id, accountId);
                            backendCount = Array.isArray(revs) ? revs.length : -1;
                        } catch { /* sin acceso a reviews: caeremos al caché local */ }
                    }
                    if (backendCount === 0) {
                        // El backend no tiene valoraciones: limpiar marcas locales viejas para no bloquear el modal
                        required.forEach(r => { try { localStorage.removeItem(ratedStorageKey(detail.auctionNumber, r)); } catch { /* ignore */ } });
                    }
                    const pendingLocal = required.some(r => !localStorage.getItem(ratedStorageKey(detail.auctionNumber, r)));
                    // Solo molestar si el backend está incompleto Y hay pasos accionables en este navegador.
                    // (Evita bucles cuando un actor no es valorable, p.ej. clínica sin cuenta registrada.)
                    const backendPending = backendCount >= 0 ? backendCount < required.length : true;
                    const pending = backendPending && pendingLocal;
                    console.log('[RatingModal]', c.auctionNumber, 'ganador OK | reviews backend:', backendCount, '/', required.length, '| pasos locales pendientes:', pendingLocal, '| abrir modal:', pending);
                    if (pending && active) { setRatingAuction(detail); return; }
                } catch (e) { console.log('[RatingModal]', c.auctionNumber, 'error al traer detalle:', e); }
            }
            console.log('[RatingModal] ninguna candidata disparó el modal');
        })();
        return () => { active = false; };
    }, [userProfile?.id, allAuctions]);

    useEffect(() => {
        if (ads.length > 1) {
            const timer = setInterval(() => {
                setCurrentAd((prev) => (prev + 1) % ads.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [ads.length]);

    useEffect(() => {
        const checkCompliance = async () => {
            if (!isLoadingProfile && userProfile?.id) {
                setIsLoadingCompliance(true);
                console.group('[Compliance Debug]');
                const profileId = userProfile.id;
                const accountId = userProfile.account?.id;

                console.log('Profile ID:', profileId);
                console.log('Account ID:', accountId);
                console.log('User Profile Status:', userProfile.status);

                const tryFetchCompliance = async (id: string | number, isAccount: boolean = false) => {
                    if (!id) return null;
                    try {
                        let response;
                        if (isAccount) {
                            console.log(`Searching compliance by accountId.equals=${id}...`);
                            response = await searchIdentityCompliance(`accountId.equals=${id}`);
                        } else {
                            console.log(`Fetching secure compliance for actorId=${id}...`);
                            response = await getIdentityCompliance(id);
                        }

                        console.log(`API Response for ${isAccount ? 'Account' : 'Profile'} ID ${id}:`, response);

                        const actualData = response.data !== undefined ? response.data : response;

                        if (actualData) {
                            if (Array.isArray(actualData)) {
                                if (actualData.length === 0) return null;
                                const verifiedRecord = actualData.find(r =>
                                    ['VERIFIED', 'COMPLETED', 'APPROVED', 'SUCCESS', 'ACTIVE'].includes((r.complianceStatus || r.status)?.toUpperCase())
                                );
                                return verifiedRecord ? (verifiedRecord.complianceStatus || verifiedRecord.status) : (actualData[0]?.complianceStatus || actualData[0]?.status);
                            } else {
                                return actualData.complianceStatus || actualData.status;
                            }
                        }
                    } catch (e) {
                        console.error(`Error fetching compliance for ${isAccount ? 'account' : 'profile'} ID ${id}:`, e);
                    }
                    return null;
                };

                const statusFromProfileId = await tryFetchCompliance(profileId, false);
                let finalStatus = statusFromProfileId;

                const isVerified = (s: string | null) => ['VERIFIED', 'COMPLETED', 'APPROVED', 'SUCCESS', 'ACTIVE'].includes(s?.toUpperCase() || '');

                if (!isVerified(finalStatus) && accountId) {
                    console.log('Compliance not verified for profile ID. Trying account search...');
                    const statusFromAccountId = await tryFetchCompliance(accountId, true);
                    if (statusFromAccountId) {
                        finalStatus = statusFromAccountId;
                    }
                }

                console.log('Final Detected Status:', finalStatus);
                setComplianceStatus(finalStatus);
                setIsLoadingCompliance(false);

                if (isVerified(finalStatus)) {
                    setShowOnboarding(false);
                    console.groupEnd();
                    return;
                }

                console.groupEnd();

                const profileStatus = userProfile.status?.toUpperCase();
                const isProfilePending = ['PENDING', 'INCOMPLETE'].includes(profileStatus || '');
                // Don't nag with the onboarding prompt if they already submitted their verification.
                if (isProfilePending && !finalStatus) {
                    const hasSeenOnboarding = sessionStorage.getItem('hasSeenOnboarding');
                    if (!hasSeenOnboarding) {
                        setShowOnboarding(true);
                    }
                }
            } else if (!isLoadingProfile && !userProfile) {
                setIsLoadingCompliance(false);
            }
        };

        checkCompliance();
    }, [isLoadingProfile, userProfile]);

    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
        sessionStorage.setItem('hasSeenOnboarding', 'true');
    };

    const displayProfile = userProfile || {
        firstName: '...',
        lastName: 'Cargando',
        specialties: [{ name: 'Especialista' }],
        profileImageUrl: null,
        status: 'PENDING'
    };

    const successStatuses = ['VERIFIED', 'COMPLETED', 'APPROVED', 'SUCCESS', 'ACTIVE'];
    const isProfileVerified = successStatuses.includes(userProfile?.status?.toUpperCase() || '');
    const isComplianceVerified = successStatuses.includes(complianceStatus?.toUpperCase() || '');
    const isVerified = isProfileVerified || isComplianceVerified;

    const isPendingProfile = !userProfile?.status || ['PENDING', 'INCOMPLETE'].includes(userProfile.status.toUpperCase());
    const isPending = isPendingProfile && !isVerified;

    // The doctor already submitted their identity (document + liveness) and is waiting for an Alteha
    // agent to validate it: a compliance record exists and is still pending/in-review.
    const inReviewStatuses = ['PENDING', 'INVERIFICATION', 'IN_REVIEW', 'SUBMITTED', 'PROCESSING'];
    const isInReview = !isVerified && !!complianceStatus && inReviewStatuses.includes(complianceStatus.toUpperCase());

    const fullName = displayProfile.firstName && displayProfile.lastName
        ? `Dr. ${displayProfile.firstName} ${displayProfile.lastName}`
        : 'Cargando perfil...';

    const specialtyNames = displayProfile.specialties?.map((s: any) => s.name).filter(Boolean).join(', ') || 'Especialista';

    const formattedDate = displayProfile.createdAt
        ? new Date(displayProfile.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Reciente';

    // Promedio real de reseñas recibidas (5.0 por defecto mientras no haya ninguna)
    const rating = receivedReviews?.avg ?? 5;
    const reviewsCount = receivedReviews?.count ?? null;

    // Derivadas de las subastas del médico
    const activeAuctionsCount = allAuctions.filter((a: any) => a.status === 'ACTIVE' || a.status === 'PUBLISHED').length;
    const now = new Date();
    const monthEarnings = allAuctions
        .filter((a: any) => a.status === 'SETTLED' && a.updatedAt &&
            new Date(a.updatedAt).getMonth() === now.getMonth() &&
            new Date(a.updatedAt).getFullYear() === now.getFullYear())
        .reduce((sum: number, a: any) => sum + Number(a.awardedBid?.bidAmount ?? 0), 0);

    return (
        <div className="space-y-10 font-outfit">
            {/* Onboarding Popup */}
            <AnimatePresence>
                {showOnboarding && !isLoadingProfile && !isLoadingCompliance && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <m.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-10 relative overflow-hidden"
                        >
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-alteha-turquoise/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-alteha-violet/10 rounded-full blur-3xl" />

                            <div className="relative z-10 text-center">
                                <div className="relative mx-auto mb-8 w-24 h-24 group">
                                    <div className="absolute inset-0 bg-alteha-violet/20 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all" />
                                    <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center">
                                        {displayProfile.profileImageUrl ? (
                                            <img src={displayProfile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <img src="/doctor-avatar.png" alt="Profile" className="w-full h-full object-contain opacity-40" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-alteha-turquoise text-white p-2 rounded-2xl border-4 border-white shadow-xl animate-bounce">
                                        <Star className="w-4 h-4 fill-white" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">¡Impulsa tu Perfil Médico!</h3>
                                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                    Completa tu verificación y onboarding para obtener **mayores beneficios**,
                                    prioridad en subastas y el sello de verificado en la plataforma ALTEHA.
                                </p>
                                <div className="space-y-3">
                                    <Button
                                        onClick={() => {
                                            handleCloseOnboarding();
                                            window.location.href = '/dashboard/specialist/verify';
                                        }}
                                        className="w-full py-4 bg-alteha-turquoise text-slate-900 font-black rounded-2xl shadow-lg shadow-alteha-turquoise/20 hover:scale-[1.02] transition-all"
                                    >
                                        Completar Registro Ahora
                                    </Button>
                                    <button
                                        onClick={handleCloseOnboarding}
                                        className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                                    >
                                        Más tarde
                                    </button>
                                </div>
                            </div>
                        </m.div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Pending Notification Banner */}
            <AnimatePresence>
                {(isPending || isInReview) && !isLoadingProfile && !isLoadingCompliance && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {isInReview ? (
                            <div className="bg-gradient-to-r from-amber-400/15 to-transparent border-l-4 border-amber-400 p-6 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-amber-400/20 rounded-xl text-amber-500 flex-shrink-0">
                                    <Clock className="w-6 h-6 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-slate-900">Verificación en proceso</h4>
                                    <p className="text-sm text-slate-500 font-medium">Recibimos tu documento y prueba de vida. Un agente de Alteha está validando tu identidad (un par de horas máximo) — te avisaremos en cuanto esté lista.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-alteha-violet/10 to-transparent border-l-4 border-alteha-violet p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-alteha-violet/20 rounded-xl text-alteha-violet">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-slate-900">Tu cuenta está en estado PENDIENTE</h4>
                                        <p className="text-sm text-slate-500 font-medium">Completa tu perfil para acceder a beneficios exclusivos y prioridad en cirugías.</p>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard/specialist/verify"
                                    className="px-6 py-3 bg-alteha-violet text-white rounded-xl font-bold text-sm shadow-lg shadow-alteha-violet/20 hover:scale-105 transition-all whitespace-nowrap"
                                >
                                    Verificar Cuenta
                                </Link>
                            </div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>

            {/* ===== PRÓXIMA INTERVENCIÓN BANNER ===== */}
            <AnimatePresence>
                {nextIntervention && !isLoadingAuctions && (
                    <m.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="overflow-hidden"
                    >
                        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-[2.5rem] p-8 md:p-10 text-white overflow-hidden shadow-2xl shadow-emerald-500/30">
                            {/* Decorative blobs */}
                            <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-2xl" />

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">
                                            Próxima Intervención Asignada
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black leading-tight max-w-lg">
                                        {nextIntervention.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-emerald-100 text-sm font-semibold">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {nextIntervention.auctionNumber}
                                        </span>
                                        {nextIntervention.estimatedSurgeryDate && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(nextIntervention.estimatedSurgeryDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-[1.5rem] px-8 py-6 min-w-[200px] text-center flex-shrink-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Tiempo Restante</p>
                                    <AuctionCountdown
                                        endDate={nextIntervention.estimatedSurgeryDate!}
                                        variant="white"
                                        className="text-white text-2xl font-black"
                                    />
                                    <Link
                                        href={`/dashboard/specialist/auctions/${nextIntervention.auctionNumber}`}
                                        className="mt-2 px-5 py-2 bg-white text-emerald-700 rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg"
                                    >
                                        Ver Detalle
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Image Expansion Modal */}
            <AnimatePresence>
                {isImageExpanded && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsImageExpanded(false)}
                        className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
                    >
                        <m.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-[90vw] max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20 flex items-center justify-center bg-slate-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={displayProfile.profileImageUrl || "/doctor-avatar.png"}
                                alt="Dr. Profile Expanded"
                                className="max-w-full max-h-[90vh] object-contain"
                            />
                            <button
                                onClick={() => setIsImageExpanded(false)}
                                className="absolute top-6 right-6 p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-2xl text-white transition-colors"
                            >
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                        </m.div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative group shrink-0">
                        {isLoadingProfile && !userProfile ? (
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] bg-slate-100 animate-pulse border-4 border-white shadow-xl" />
                        ) : (
                            <m.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsImageExpanded(true)}
                                className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center cursor-zoom-in relative"
                            >
                                {displayProfile.profileImageUrl ? (
                                    <img
                                        src={displayProfile.profileImageUrl}
                                        alt="Dr. Profile"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <img
                                        src="/doctor-avatar.png"
                                        alt="Dr. Profile"
                                        className="w-full h-full object-contain opacity-50"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Search className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                            </m.div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-4 border-white rounded-full ${isLoadingProfile ? 'bg-amber-400 animate-pulse' : 'bg-green-500 shadow-lg shadow-green-200'}`} />
                        {isVerified && (
                            <m.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                                className="absolute -top-2 -right-2 z-10 w-10 h-10 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center shadow-xl shadow-blue-200/50"
                                title="Médico Verificado"
                            >
                                <CheckCircle2 className="w-6 h-6 text-white fill-white/20" />
                            </m.div>
                        )}
                    </div>
                    <div className="space-y-4">
                        {isLoadingProfile && !userProfile ? (
                            <div className="space-y-3">
                                <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-2xl" />
                                <div className="h-6 w-48 bg-slate-100 animate-pulse rounded-xl" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center flex-wrap gap-3">
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                        {fullName}
                                    </h2>
                                    {isVerified && (
                                        <m.div
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-lg shadow-blue-200/50 border border-blue-400 group"
                                        >
                                            <Shield className="w-4 h-4 fill-white/20" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Sello Verificado</span>
                                            <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                            </div>
                                        </m.div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-slate-500 font-medium text-sm">
                                    <span className="text-xs text-slate-400 font-medium leading-relaxed">{specialtyNames}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                                    <div className="flex items-center gap-1.5 text-slate-400 group">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
                                        <Link href="/dashboard/specialist/reviews" className="hover:text-alteha-violet transition-colors">
                                            ({reviewsCount == null ? '…' : reviewsCount} reseña{reviewsCount === 1 ? '' : 's'})
                                        </Link>
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden md:block" />
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>Miembro desde: <span className="text-slate-900 font-bold">{formattedDate}</span></span>
                                    </div>
                                    {planBadge && (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden md:block" />
                                            <Link
                                                href="/dashboard/specialist/plan"
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105 ${planBadge.expired
                                                    ? 'bg-red-50 text-red-500'
                                                    : 'bg-amber-50 text-amber-600'}`}
                                            >
                                                <Crown className="w-3.5 h-3.5" />
                                                Plan {planBadge.name.replace('Alteha ', '')}
                                                {planBadge.expired && <span className="text-[9px]">· VENCIDO</span>}
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Profile Links */}
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                            <Link
                                href="/dashboard/specialist/clinics"
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 shadow-sm hover:border-alteha-turquoise hover:shadow-md rounded-xl text-slate-600 font-bold text-[11px] uppercase tracking-wider transition-all group"
                            >
                                <Building2 className="w-3.5 h-3.5 text-alteha-turquoise" />
                                <span>Clínicas Asociadas</span>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            {displayProfile.medicalLicenseDocumentUrl && (
                                <a
                                    href={displayProfile.medicalLicenseDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-alteha-violet/5 hover:bg-alteha-violet/10 rounded-xl text-alteha-violet font-bold text-[11px] uppercase tracking-wider transition-all group"
                                >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>Licencia Médica</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-alteha-turquoise hover:shadow-md transition-all relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                    </button>
                    <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-alteha-violet hover:shadow-md transition-all relative">
                        <MessageSquare className="w-5 h-5" />
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full" />
                    </button>
                    <Link href="/dashboard/specialist/profile" className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
                        <Edit3 className="w-4 h-4" />
                        <span>Editar Perfil</span>
                    </Link>
                </div>
            </header>

            {/* Stats Dashboard */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Subastas Activas"
                    value={isLoadingAuctions ? '…' : String(activeAuctionsCount)}
                    icon={TrendingUp}
                    color="text-alteha-turquoise"
                    bg="bg-alteha-turquoise/10"
                />
                <StatCard
                    label="Paquetes Publicados"
                    value={packagesCount == null ? '…' : String(packagesCount).padStart(2, '0')}
                    icon={Package}
                    color="text-alteha-violet"
                    bg="bg-alteha-violet/10"
                />
                <StatCard
                    label="Reseñas Recibidas"
                    value={reviewsCount == null ? '…' : String(reviewsCount)}
                    icon={Star}
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                />
                <StatCard
                    label="Ganancias del Mes"
                    value={isLoadingAuctions ? '…' : `$${monthEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    icon={DollarSign}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
            </section>

            {/* Advertising — multiple cards + "Ver más" */}
            <section className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-alteha-turquoise text-[10px] font-black uppercase tracking-[0.3em]">Publicidad Especializada</span>
                    {ads.length > 3 && (
                        <button
                            type="button"
                            onClick={() => setShowAllAds(v => !v)}
                            className="flex items-center gap-1.5 text-xs font-black text-alteha-violet hover:gap-2.5 transition-all"
                        >
                            {showAllAds ? 'Ver menos' : 'Ver más'}
                            <ChevronRight className={`w-4 h-4 transition-transform ${showAllAds ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>

                {isLoadingAds ? (
                    <div className="flex items-center justify-center py-12 bg-slate-100 rounded-[2rem]">
                        <Loader className="w-8 h-8 text-alteha-turquoise" />
                    </div>
                ) : ads.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(showAllAds ? ads : ads.slice(0, 3)).map((ad: any, i: number) => {
                            const isImg = ad.mediaUrl && ad.mediaType === 'IMAGE';
                            // A pre-designed banner (no overlay title) renders as a clean, full image.
                            const isBanner = isImg && (!ad.title || !ad.title.trim());

                            const adHref = `/dashboard/specialist/ads/${ad.id}`;

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
                                        <span className="text-alteha-turquoise text-[9px] font-black uppercase tracking-[0.2em] mb-1 line-clamp-1">{ad.subtitle || 'Patrocinado'}</span>
                                        <h4 className="text-base font-black text-white leading-tight line-clamp-2 mb-3">{ad.title}</h4>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-alteha-turquoise text-slate-900 rounded-lg font-black text-[10px] uppercase w-fit">
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
                        <span className="text-alteha-turquoise text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">Bienvenido a Alteha</span>
                        <h3 className="text-xl font-black text-white mb-1">Optimiza tu Práctica Médica</h3>
                        <p className="text-white/70 text-sm font-medium">Gestiona tus cirugías y subastas médicas con la tecnología más avanzada.</p>
                    </div>
                )}
            </section>

            {/* Auctions Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Subastas Disponibles</h3>
                        <p className="text-slate-400 text-sm font-medium">Oportunidades de intervención según tu especialidad</p>
                    </div>
                    <Link
                        href="/dashboard/specialist/auctions"
                        className="flex items-center gap-2 px-5 py-2.5 bg-alteha-violet text-white rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-violet-100"
                    >
                        Ver todas
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {isLoadingAuctions ? (
                    <div className="flex items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <m.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Filter className="w-8 h-8 text-alteha-violet" />
                        </m.div>
                    </div>
                ) : auctions.length === 0 ? (
                    <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                        <p className="text-slate-400 font-bold text-sm">No tienes subastas asignadas por el momento</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {auctions.map((auction) => (
                            <AuctionCard key={auction.id} auction={auction} />
                        ))}
                    </div>
                )}
            </section>

            {/* Valoración obligatoria al terminar el proceso de una subasta (fondos liquidados) */}
            {ratingAuction && (
                <RatingExperienceModal auction={ratingAuction} onClose={() => setRatingAuction(null)} />
            )}

            {/* Plan vencido: alerta intrusiva hasta que renueve (o posponga en esta sesión) */}
            {expiredPlanName && !ratingAuction && (
                <PlanExpiredModal
                    planName={expiredPlanName}
                    onClose={() => { try { sessionStorage.setItem('alteha_plan_expired_snooze', '1'); } catch { /* ignore */ } setExpiredPlanName(null); }}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`p-3 w-fit rounded-2xl ${bg} ${color} mb-4`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
            </div>
        </div>
    );
}

// Estados en los que la subasta todavía admite ofertas (mismo criterio que el resto de la app)
const BIDDABLE_STATUSES = ['ACTIVE', 'PUBLISHED'];

// Etiqueta/color para subastas que ya NO son ofertables (adjudicadas o en fase de pago)
const AUCTION_STATUS_BADGE: Record<string, { label: string; color: string; dot: string }> = {
    'AWARDED': { label: 'Adjudicada', color: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500' },
    'PAYMENT_REPORTED': { label: 'Pago Reportado', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
    'PAYMENT_VALIDATION': { label: 'Validando Pago', color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-500' },
    'PAID': { label: 'Pago Confirmado', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    'CLOSED': { label: 'Cerrada', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    'CANCELLED': { label: 'Cancelada', color: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
    // Finiquito subido: en espera de que Alteha liquide los fondos
    'COMPLETED': { label: 'Esperando liquidación', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
    // Alteha ya pagó: el médico debe revisar el comprobante y confirmar recepción
    'PENDING_SETTLEMENT': { label: 'Fondos liquidados', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
    'SETTLED': { label: 'Liquidada', color: 'bg-slate-900 text-white', dot: 'bg-white' },
};

function AuctionCard({ auction }: { auction: Auction }) {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [offerCount, setOfferCount] = useState<number | null>(null);
    // Mi oferta en esta subasta (si ya envié una) + estado de la dupla con la clínica
    const [myBid, setMyBid] = useState<{ amount: number; modality?: string; duplaStatus?: string; clinicName?: string } | null>(null);

    useEffect(() => {
        if (!userProfile?.id) return;
        let active = true;
        (async () => {
            try {
                const { getAuctionBids, getAuctionDuplas } = await import('@/lib/api');
                const res: any = await getAuctionBids(auction.id);
                const list: any[] = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
                const mine = list.find((b: any) => b.doctor?.id && Number(b.doctor.id) === Number(userProfile.id));
                if (!mine || !active) return;
                let duplaStatus: string | undefined;
                let clinicName: string | undefined;
                if (mine.modality === 'SOLO_MEDICO') {
                    try {
                        const duplas = await getAuctionDuplas(auction.id);
                        const d = (duplas || []).find((x: any) => String(x.bidId) === String(mine.id));
                        duplaStatus = d?.status || 'PENDING';
                        clinicName = d?.clinicName || mine.clinic?.name || 'la clínica';
                    } catch { duplaStatus = 'PENDING'; clinicName = mine.clinic?.name || 'la clínica'; }
                }
                if (active) setMyBid({ amount: Number(mine.bidAmount) || 0, modality: mine.modality, duplaStatus, clinicName });
            } catch { /* sin datos de oferta propia */ }
        })();
        return () => { active = false; };
    }, [auction.id, userProfile?.id]);

    useEffect(() => {
        let active = true;
        getAuctionBidsCount(auction.id)
            .then((r) => { if (active) setOfferCount(typeof r?.count === 'number' ? r.count : 0); })
            .catch(() => { if (active) setOfferCount(null); });
        return () => { active = false; };
    }, [auction.id]);

    const urgencyMap: any = {
        'LOW': { label: 'Baja', color: 'bg-slate-50 text-slate-500', dot: 'bg-slate-400' },
        'MEDIUM': { label: 'Media', color: 'bg-amber-50 text-amber-500', dot: 'bg-amber-500' },
        'HIGH': { label: 'Alta', color: 'bg-red-50 text-red-500', dot: 'bg-red-500 animate-pulse' },
        'CRITICAL': { label: 'Urgente', color: 'bg-red-50 text-red-600', dot: 'bg-red-600 animate-pulse' },
        'URGENT': { label: 'Urgente', color: 'bg-red-50 text-red-600', dot: 'bg-red-600 animate-pulse' },
    };

    const urgency = urgencyMap[auction.urgencyLevel] || urgencyMap['LOW'];

    return (
        <m.div
            whileHover={{ y: -4 }}
            onClick={() => router.push(`/dashboard/specialist/auctions/${auction.auctionNumber}`)}
            className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:shadow-2xl transition-all cursor-pointer"
        >
            <div className="flex-1 space-y-4 text-left">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-1.5 bg-alteha-turquoise/10 text-alteha-turquoise rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                        {auction.specialty?.name || 'Especialidad'}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 leading-none ${urgency.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                        {urgency.label}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Ref: {auction.auctionNumber}
                    </span>
                </div>

                <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{auction.title}</h4>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium">
                        {auction.medicalHistory || auction.description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1 rounded-xl">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Cierre: {new Date(auction.endDate).toLocaleDateString('es-ES')}
                        </span>
                    </div>
                    {(auction.status === 'ACTIVE' || auction.status === 'PUBLISHED') && (
                        <div className="flex items-center gap-2 bg-alteha-violet/5 px-3 py-1 rounded-xl">
                            <Clock className="w-3.5 h-3.5 text-alteha-violet" />
                            <AuctionCountdown endDate={auction.endDate} />
                        </div>
                    )}
                </div>

                {/* Offers preview + link to the offers screen */}
                <div className="flex items-center gap-4 pt-1">
                    <span className="inline-flex items-center gap-2 text-xs font-black text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-alteha-violet" />
                        {offerCount === null
                            ? 'Ofertas: —'
                            : `${offerCount} ${offerCount === 1 ? 'oferta' : 'ofertas'} hasta ahora`}
                    </span>
                    <Link
                        onClick={(e) => e.stopPropagation()}
                        href={`/dashboard/specialist/auctions/${auction.auctionNumber}#ofertas`}
                        className="text-xs font-black text-alteha-violet hover:underline inline-flex items-center gap-1"
                    >
                        Ver ofertas <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Estado de MI participación en esta subasta */}
                {myBid && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" /> Tu oferta enviada · ${myBid.amount.toLocaleString()}
                        </span>
                        {myBid.modality === 'SOLO_MEDICO' && myBid.duplaStatus === 'PENDING' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> En espera de {myBid.clinicName}
                            </span>
                        )}
                        {myBid.modality === 'SOLO_MEDICO' && myBid.duplaStatus === 'ACCEPTED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3" /> {myBid.clinicName} aceptó · dupla lista
                            </span>
                        )}
                        {myBid.modality === 'SOLO_MEDICO' && myBid.duplaStatus === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {myBid.clinicName} rechazó · invita otra clínica
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-row lg:flex-col items-center gap-3 min-w-[200px]">
                <Link onClick={(e) => e.stopPropagation()} href={`/dashboard/specialist/auctions/${auction.auctionNumber}`} className="flex-1 lg:w-full">
                    <button className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                        <FileText className="w-4 h-4" />
                        Ver Detalle
                    </button>
                </Link>
                {myBid && BIDDABLE_STATUSES.includes(auction.status) ? (
                    <Link onClick={(e) => e.stopPropagation()} href={`/dashboard/specialist/auctions/${auction.auctionNumber}`} className="flex-1 lg:w-full">
                        <button className="w-full py-4 bg-white border-2 border-emerald-200 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all">
                            <CheckCircle2 className="w-4 h-4" />
                            Oferta enviada
                        </button>
                    </Link>
                ) : BIDDABLE_STATUSES.includes(auction.status) ? (
                    <Link onClick={(e) => e.stopPropagation()} href={`/dashboard/specialist/auctions/${auction.auctionNumber}`} className="flex-1 lg:w-full">
                        <button className="w-full py-4 bg-alteha-turquoise text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-alteha-turquoise/20 hover:scale-[1.02] transition-all">
                            Ofertar
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                ) : (
                    <div className={`flex-1 lg:w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 ${AUCTION_STATUS_BADGE[auction.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${AUCTION_STATUS_BADGE[auction.status]?.dot || 'bg-slate-400'}`} />
                        {AUCTION_STATUS_BADGE[auction.status]?.label || auction.status}
                    </div>
                )}
            </div>
        </m.div>
    );
}
