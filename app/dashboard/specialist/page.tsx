"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion as m, AnimatePresence as AP, AnimatePresence } from 'framer-motion';
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

// Mock Data for the banner
const ADS = [
    { id: 1, title: 'Equipamiento Médico Premium', subtitle: 'Financiamiento exclusivo para especialistas Alteha.', color: 'from-blue-600 to-indigo-600' },
    { id: 2, title: 'Congreso Internacional 2026', subtitle: 'Inscríbete hoy y obtén un 20% de descuento como miembro.', color: 'from-alteha-turquoise to-teal-500' },
    { id: 3, title: 'Software de Gestión Clínica', subtitle: 'Optimiza tu consultorio con tecnología de punta.', color: 'from-alteha-violet to-purple-600' },
];

// Mock Data for Auctions
const AUCTIONS = [
    {
        id: 'SUB-2025-001',
        specialty: 'Traumatología y Ortopedia',
        procedure: 'Artroplastia de Cadera Total',
        reportDetail: 'Paciente femenina de 65 años con osteoartritis avanzada grado IV en cadera derecha. Dolor crónico limitante...',
        clinics: ['Clínica Metropolitana', 'Centro Médico Docente La Trinidad'],
        date: '12 Feb, 2026',
        urgency: 'Media'
    },
    {
        id: 'SUB-2025-002',
        specialty: 'Cardiología Intervencionista',
        procedure: 'Angioplastia Coronaria',
        reportDetail: 'Paciente masculino de 58 años con cuadro de angina inestable. Obstrucción detectada en arteria coronaria derecha...',
        clinics: ['Policlínica Metropolitana', 'Clínica El Ávila'],
        date: '15 Feb, 2026',
        urgency: 'Alta'
    },
    {
        id: 'SUB-2025-003',
        specialty: 'Oftalmología',
        procedure: 'Cirugía de Cataratas (Facoemulsificación)',
        reportDetail: 'Paciente con visión borrosa progresiva. Opacidad lenticular bilateral moderada...',
        clinics: ['Unidad Oftalmológica de Caracas', 'Clínica Santa Sofía'],
        date: '18 Feb, 2026',
        urgency: 'Baja'
    }
];

export default function SpecialistDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [currentAd, setCurrentAd] = useState(0);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentAd((prev) => (prev + 1) % ADS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Check for pending status to show onboarding popup
    useEffect(() => {
        if (!isLoadingProfile && userProfile?.status === 'PENDING') {
            const hasSeenOnboarding = sessionStorage.getItem('hasSeenOnboarding');
            if (!hasSeenOnboarding) {
                setShowOnboarding(true);
            }
        }
    }, [isLoadingProfile, userProfile]);

    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
        sessionStorage.setItem('hasSeenOnboarding', 'true');
    };

    // Placeholder data while loading or if profile fails
    const displayProfile = userProfile || {
        firstName: '...',
        lastName: 'Cargando',
        specialties: [{ name: 'Especialista' }],
        profileImageUrl: null,
        status: 'PENDING'
    };

    const isPending = displayProfile.status === 'PENDING';

    const fullName = displayProfile.firstName && displayProfile.lastName
        ? `Dr. ${displayProfile.firstName} ${displayProfile.lastName}`
        : 'Cargando perfil...';

    const specialtyNames = displayProfile.specialties?.map((s: any) => s.name).filter(Boolean).join(', ') || 'Especialista';

    const formattedDate = displayProfile.createdAt
        ? new Date(displayProfile.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Reciente';

    const rating = 5; // Default as requested

    return (
        <div className="space-y-10 font-outfit">
            {/* Onboarding Popup */}
            <AP>
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
                            {/* Decorative Background */}
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
            </AP>

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
                                <div>
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
            <AP>
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
            </AP>

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
                    </div>
                    <div className="space-y-4">
                        {isLoadingProfile && !userProfile ? (
                            <div className="space-y-3">
                                <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-2xl" />
                                <div className="h-6 w-48 bg-slate-100 animate-pulse rounded-xl" />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                    {fullName}
                                </h2>
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
            <section className="relative h-44 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <AP mode="wait">
                    <m.div
                        key={currentAd}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`absolute inset-0 bg-gradient-to-r ${ADS[currentAd].color} p-10 flex flex-col justify-center`}
                    >
                        <div className="max-w-xl relative z-10">
                            <span className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] mb-2 block">Publicidad Especializada</span>
                            <h3 className="text-3xl font-black text-white mb-2">{ADS[currentAd].title}</h3>
                            <p className="text-white/80 font-medium">{ADS[currentAd].subtitle}</p>
                        </div>
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20">
                            <Hospital className="w-32 h-32 text-white" />
                        </div>
                    </m.div>
                </AP>
                <div className="absolute bottom-6 left-10 flex gap-2 z-20">
                    {ADS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentAd ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                        />
                    ))}
                </div>
            </section>

            {/* Auctions Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Subastas Disponibles</h3>
                        <p className="text-slate-400 text-sm font-medium">Oportunidades de intervención según tu especialidad</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="hidden md:flex items-center bg-white px-4 rounded-2xl border border-slate-100 shadow-sm">
                            <Search className="w-4 h-4 text-slate-400 mr-2" />
                            <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none py-3 text-sm font-medium w-48 text-slate-600" />
                        </div>
                        <button className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-600 hover:bg-slate-50 transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {AUCTIONS.map((auction) => (
                        <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
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

function AuctionCard({ auction }: any) {
    return (
        <m.div
            whileHover={{ y: -4 }}
            className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:shadow-2xl transition-all"
        >
            <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-1.5 bg-alteha-turquoise/10 text-alteha-turquoise rounded-full text-xs font-bold uppercase tracking-widest leading-none">
                        {auction.specialty}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none ${auction.urgency === 'Alta' ? 'bg-red-50 text-red-500' :
                        auction.urgency === 'Media' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-500'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${auction.urgency === 'Alta' ? 'bg-red-500 animate-pulse' :
                            auction.urgency === 'Media' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                        {auction.urgency}
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                        Ref: {auction.id}
                    </span>
                </div>

                <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{auction.procedure}</h4>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                        {auction.reportDetail}
                    </p>
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{auction.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Hospital className="w-4 h-4" />
                        <div className="flex gap-2">
                            {auction.clinics.map((c: string, i: number) => (
                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-slate-500">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-row lg:flex-col items-center gap-3 min-w-[200px]">
                <button className="flex-1 lg:w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                    <FileText className="w-4 h-4" />
                    Ver Detalle
                </button>
                <button className="flex-1 lg:w-full py-4 bg-alteha-turquoise text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-alteha-turquoise/20 hover:scale-[1.02] transition-all">
                    Postularme
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </m.div>
    );
}
