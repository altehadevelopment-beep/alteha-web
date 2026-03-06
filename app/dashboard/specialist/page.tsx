"use client";

import React, { useState, useEffect } from 'react';
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
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getDashboardAds, getMyInvitations, type Advertisement, type Auction, getIdentityCompliance, searchIdentityCompliance } from '@/lib/api';

export default function SpecialistDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [currentAd, setCurrentAd] = useState(0);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLoadingAds, setIsLoadingAds] = useState(true);
    const [complianceStatus, setComplianceStatus] = useState<string | null>(null);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);

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
                const result = await getMyInvitations('DOCTOR', 0, 3);
                if (result.code === '00' && result.data) {
                    setAuctions(result.data);
                } else if (Array.isArray(result)) {
                    setAuctions(result as any);
                } else if ((result as any).content) {
                    setAuctions((result as any).content);
                }
            } catch (e) {
                console.error('Error loading auctions:', e);
            } finally {
                setIsLoadingAuctions(false);
            }
        };
        fetchAuctions();
    }, []);

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

                if (isVerified(finalStatus)) {
                    setShowOnboarding(false);
                    console.groupEnd();
                    return;
                }

                console.groupEnd();

                const profileStatus = userProfile.status?.toUpperCase();
                const isProfilePending = ['PENDING', 'INCOMPLETE'].includes(profileStatus || '');
                if (isProfilePending) {
                    const hasSeenOnboarding = sessionStorage.getItem('hasSeenOnboarding');
                    if (!hasSeenOnboarding) {
                        setShowOnboarding(true);
                    }
                }
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

    const fullName = displayProfile.firstName && displayProfile.lastName
        ? `Dr. ${displayProfile.firstName} ${displayProfile.lastName}`
        : 'Cargando perfil...';

    const specialtyNames = displayProfile.specialties?.map((s: any) => s.name).filter(Boolean).join(', ') || 'Especialista';

    const formattedDate = displayProfile.createdAt
        ? new Date(displayProfile.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Reciente';

    const rating = 5;

    return (
        <div className="space-y-10 font-outfit">
            {/* Onboarding Popup */}
            <AnimatePresence>
                {showOnboarding && (
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
                                <div className="w-20 h-20 bg-alteha-violet/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-alteha-violet">
                                    <Star className="w-10 h-10 fill-alteha-violet" />
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
                {isPending && !isLoadingProfile && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
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
                                    <span className="text-alteha-violet font-bold">{specialtyNames}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                                    <div className="flex items-center gap-1.5 text-slate-400 group">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
                                        <Link href="/dashboard/specialist/reviews" className="hover:text-alteha-violet transition-colors">
                                            (128 reseñas)
                                        </Link>
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden md:block" />
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>Miembro desde: <span className="text-slate-900 font-bold">{formattedDate}</span></span>
                                    </div>
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
                    value="12"
                    icon={TrendingUp}
                    color="text-alteha-turquoise"
                    bg="bg-alteha-turquoise/10"
                />
                <StatCard
                    label="Paquetes Publicados"
                    value="08"
                    icon={Package}
                    color="text-alteha-violet"
                    bg="bg-alteha-violet/10"
                />
                <StatCard
                    label="Órdenes Completadas"
                    value="156"
                    icon={CheckCircle2}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <StatCard
                    label="Ganancias del Mes"
                    value="$4,250"
                    icon={DollarSign}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
            </section>

            {/* Rotating Banner */}
            <section className="relative h-40 max-w-5xl mx-auto rounded-[2rem] overflow-hidden shadow-xl bg-slate-100 group">
                {isLoadingAds ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader className="w-8 h-8 text-alteha-turquoise" />
                    </div>
                ) : ads.length > 0 ? (
                    <>
                        <AnimatePresence mode="wait">
                            <m.div
                                key={currentAd}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="absolute inset-0 p-8 flex flex-col justify-center"
                                style={{
                                    backgroundImage: ads[currentAd].mediaUrl && ads[currentAd].mediaType === 'IMAGE'
                                        ? `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.4)), url(${ads[currentAd].mediaUrl})`
                                        : `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.4)), url(/images/ads/cardiology.png)`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            >
                                <div className="max-w-xl relative z-10 space-y-1">
                                    <span className="text-alteha-turquoise text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">Publicidad Especializada</span>
                                    <h3 className="text-2xl font-black text-white leading-tight">{ads[currentAd].title}</h3>
                                    <p className="text-white/70 text-sm font-medium line-clamp-1">{ads[currentAd].subtitle}</p>
                                    {ads[currentAd].ctaText && (
                                        <div className="mt-3">
                                            <a
                                                href={ads[currentAd].clickUrl}
                                                target={ads[currentAd].openInNewTab ? "_blank" : "_self"}
                                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-alteha-turquoise text-slate-900 rounded-lg font-black text-[10px] uppercase hover:scale-105 transition-all"
                                            >
                                                {ads[currentAd].ctaText}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </m.div>
                        </AnimatePresence>
                        <div className="absolute bottom-4 right-8 flex gap-1.5 z-20">
                            {ads.map((_, i: number) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-300 ${i === currentAd ? 'w-6 bg-alteha-turquoise' : 'w-1.5 bg-white/30'}`}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col justify-center px-10"
                        style={{
                            backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.4)), url(/images/ads/traumatology.png)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="max-w-xl relative z-10">
                            <span className="text-alteha-turquoise text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">Bienvenido a Alteha</span>
                            <h3 className="text-2xl font-black text-white mb-1">Optimiza tu Práctica Médica</h3>
                            <p className="text-white/70 text-sm font-medium">Gestiona tus cirugías y subastas médicas con la tecnología más avanzada.</p>
                        </div>
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

function AuctionCard({ auction }: { auction: Auction }) {
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
            className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:shadow-2xl transition-all"
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
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Fin: {new Date(auction.endDate).toLocaleDateString('es-ES')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-row lg:flex-col items-center gap-3 min-w-[200px]">
                <Link href={`/dashboard/specialist/auctions/${auction.auctionNumber}`} className="flex-1 lg:w-full">
                    <button className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                        <FileText className="w-4 h-4" />
                        Ver Detalle
                    </button>
                </Link>
                <Link href={`/dashboard/specialist/auctions/${auction.auctionNumber}`} className="flex-1 lg:w-full">
                    <button className="w-full py-4 bg-alteha-turquoise text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-alteha-turquoise/20 hover:scale-[1.02] transition-all">
                        Postularme
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>
        </m.div>
    );
}
