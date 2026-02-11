"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion as m, AnimatePresence as AP } from 'framer-motion';
import {
    Bell,
    MessageSquare,
    Star,
    Edit3,
    Search,
    Filter,
    ChevronRight,
    Play,
    TrendingUp,
    Package,
    CheckCircle2,
    DollarSign,
    MapPin,
    Hospital,
    FileText,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

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

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentAd((prev) => (prev + 1) % ADS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Placeholder data while loading or if profile fails
    const displayProfile = userProfile || {
        firstName: '...',
        lastName: 'Cargando',
        specialties: [{ name: 'Especialista' }],
        profileImageUrl: null
    };

    const fullName = displayProfile.firstName && displayProfile.lastName
        ? `Dr. ${displayProfile.firstName} ${displayProfile.lastName}`
        : 'Cargando perfil...';

    const specialtyName = displayProfile.specialties?.[0]?.name || 'Especialista';

    return (
        <div className="space-y-10 font-outfit">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                            {displayProfile.profileImageUrl ? (
                                <img
                                    src={displayProfile.profileImageUrl}
                                    alt="Dr. Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src="/doctor-avatar.png"
                                    alt="Dr. Profile"
                                    className="w-full h-full object-cover opacity-50"
                                />
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white rounded-full ${isLoadingProfile ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isLoadingProfile ? (
                                <span className="animate-pulse">Cargando...</span>
                            ) : fullName}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 font-medium">
                            <span className="text-alteha-violet">{specialtyName}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1.5 text-slate-400 group">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-slate-900">4.9</span>
                                <Link href="/dashboard/specialist/reviews" className="hover:text-alteha-violet transition-colors">
                                    (128 reseñas)
                                </Link>
                            </div>
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
