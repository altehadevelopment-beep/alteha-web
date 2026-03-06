"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gavel,
    Search,
    Filter,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Loader2,
    DollarSign,
    Calendar,
    Stethoscope,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { getMyInvitations, type Auction } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: any }> = {
    'DRAFT': { label: 'Borrador', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: FileText },
    'PUBLISHED': { label: 'Publicada', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500', icon: Clock },
    'ACTIVE': { label: 'Activa', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', icon: Gavel },
    'AWARDED': { label: 'Adjudicada', color: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500', icon: CheckCircle2 },
    'CANCELLED': { label: 'Cancelada', color: 'bg-red-50 text-red-600', dot: 'bg-red-500', icon: AlertCircle },
    'COMPLETED': { label: 'Finalizada', color: 'bg-slate-900 text-white', dot: 'bg-white', icon: CheckCircle2 },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
    'LOW': { label: 'Baja', color: 'bg-slate-50 text-slate-500' },
    'MEDIUM': { label: 'Media', color: 'bg-amber-50 text-amber-600' },
    'HIGH': { label: 'Alta', color: 'bg-orange-50 text-orange-600' },
    'CRITICAL': { label: 'Urgente', color: 'bg-red-50 text-red-600' },
    'URGENT': { label: 'Urgente', color: 'bg-red-50 text-red-600' },
};

export default function DoctorAuctionsPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    const loadAuctions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getMyInvitations('DOCTOR', 0, 50);

            if (result.code === '00' && result.data) {
                setAuctions(result.data);
            } else if (Array.isArray(result)) {
                setAuctions(result as any);
            } else if ((result as any).content && Array.isArray((result as any).content)) {
                setAuctions((result as any).content);
            } else {
                setError(result.message || 'Error al cargar subastas');
            }
        } catch (err) {
            console.error('Error loading auctions:', err);
            setError('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAuctions();
    }, []);

    const filtered = auctions.filter(a => {
        const matchStatus = !statusFilter || a.status === statusFilter;
        const matchSearch = !search ||
            a.title?.toLowerCase().includes(search.toLowerCase()) ||
            a.auctionNumber?.toLowerCase().includes(search.toLowerCase()) ||
            a.specialty?.name?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <div className="max-w-5xl mx-auto font-outfit pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-alteha-violet mb-2">Mis Subastas</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Convocatorias Disponibles</h1>
                    <p className="text-slate-500 font-medium mt-2">Subastas asignadas a tu especialidad y clínicas asociadas</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-alteha-violet transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por número, título o especialidad..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    {(['', 'PUBLISHED', 'ACTIVE', 'AWARDED', 'COMPLETED', 'CANCELLED'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-5 py-2.5 rounded-xl font-black text-xs whitespace-nowrap transition-all ${statusFilter === s
                                    ? 'bg-alteha-violet text-white shadow-lg shadow-violet-100 scale-105'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {s ? STATUS_CONFIG[s]?.label : 'Todas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <Loader2 className="w-12 h-12 text-alteha-violet animate-spin mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando convocatorias...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 text-center px-6">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                    <p className="text-red-700 font-black text-lg mb-4">{error}</p>
                    <Button onClick={loadAuctions} className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-xl font-bold">
                        Reintentar
                    </Button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center px-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Gavel className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Sin convocatorias</h3>
                    <p className="text-slate-400 font-medium max-w-sm">
                        {auctions.length === 0
                            ? 'No tienes subastas asignadas por el momento. Cuando una aseguradora te invite, aparecerán aquí.'
                            : 'No hay subastas que coincidan con los filtros seleccionados.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((auction, idx) => (
                            <AuctionCard key={auction.id} auction={auction} index={idx} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function AuctionCard({ auction, index }: { auction: Auction; index: number }) {
    const status = STATUS_CONFIG[auction.status] || STATUS_CONFIG['PUBLISHED'];
    const urgency = URGENCY_CONFIG[auction.urgencyLevel] || URGENCY_CONFIG['LOW'];
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 p-8 flex flex-col lg:flex-row items-start lg:items-center gap-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
            {/* Status icon */}
            <div className={`w-16 h-16 rounded-[1.5rem] ${status.color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`w-8 h-8 ${status.color.split(' ')[1]}`} />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{auction.auctionNumber}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${auction.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                        {status.label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${urgency.color}`}>
                        {urgency.label}
                    </span>
                </div>

                <h3 className="text-xl font-black text-slate-900">{auction.title}</h3>

                <div className="flex flex-wrap gap-5">
                    {auction.specialty?.name && (
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                            <Stethoscope className="w-3.5 h-3.5" />
                            {auction.specialty.name}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        Presup. máx: <span className="text-slate-700">${(auction.maxBudget || 0).toLocaleString()}</span>
                    </span>
                    {auction.estimatedSurgeryDate && (
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            Cirugía: <span className="text-slate-700">{new Date(auction.estimatedSurgeryDate).toLocaleDateString('es-ES')}</span>
                        </span>
                    )}
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <Activity className="w-3.5 h-3.5" />
                        {auction.totalBids || 0} oferta{(auction.totalBids || 0) !== 1 ? 's' : ''}
                    </span>
                </div>

                {auction.medicalHistory && (
                    <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed">
                        {auction.medicalHistory}
                    </p>
                )}
            </div>

            {/* Action */}
            <Link href={`/dashboard/specialist/auctions/${auction.auctionNumber}`} className="flex-shrink-0">
                <Button className="w-14 h-14 rounded-[1.5rem] bg-slate-50 hover:bg-alteha-violet hover:text-white flex items-center justify-center transition-all p-0 group">
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                </Button>
            </Link>
        </motion.div>
    );
}
