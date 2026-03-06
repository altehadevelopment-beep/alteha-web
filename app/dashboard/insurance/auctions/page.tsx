"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Gavel,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getMyAuctions, type Auction } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    'DRAFT': { label: 'Borrador', color: 'bg-slate-100 text-slate-600', icon: FileText },
    'PUBLISHED': { label: 'Publicada', color: 'bg-blue-50 text-blue-600', icon: Clock },
    'ACTIVE': { label: 'Activa', color: 'bg-emerald-50 text-emerald-600', icon: Gavel },
    'AWARDED': { label: 'Adjudicada', color: 'bg-alteha-violet/10 text-alteha-violet', icon: CheckCircle2 },
    'CANCELLED': { label: 'Cancelada', color: 'bg-red-50 text-red-600', icon: AlertCircle },
    'COMPLETED': { label: 'Finalizada', color: 'bg-slate-900 text-white', icon: CheckCircle2 }
};

export default function AuctionsPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const loadAuctions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getMyAuctions(statusFilter || undefined);

            // Handle different possible successful backend responses:
            // 1. Wrapped in ApiResponse (result.code === '00')
            // 2. Raw array (Array.isArray(result))
            // 3. Paginated object (result.content exists)

            if (result.code === '00' && result.data) {
                setAuctions(result.data);
            } else if (Array.isArray(result)) {
                setAuctions(result);
            } else if ((result as any).content && Array.isArray((result as any).content)) {
                setAuctions((result as any).content);
            } else {
                console.error("Unexpected response format:", result);
                setError(result.message || 'Error al cargar subastas (formato inesperado)');
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
    }, [statusFilter]);

    return (
        <div className="max-w-7xl mx-auto font-outfit pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Gestión de Subastas</h1>
                    <p className="text-slate-500 font-medium mt-2">Administra y monitorea tus convocatorias médicas</p>
                </div>
                <Link href="/dashboard/insurance/auctions/new">
                    <Button className="bg-alteha-violet text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Nueva Subasta
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 mb-10 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-alteha-violet transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por número o título..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <FilterButton
                        active={statusFilter === ''}
                        onClick={() => setStatusFilter('')}
                        label="Todas"
                    />
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <FilterButton
                            key={key}
                            active={statusFilter === key}
                            onClick={() => setStatusFilter(key)}
                            label={config.label}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <Loader2 className="w-12 h-12 text-alteha-violet animate-spin mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sincronizando subastas...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-40 bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 px-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-red-900 font-black text-xl mb-2">{error}</p>
                    <Button onClick={loadAuctions} className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-xl font-bold">Reintentar</Button>
                </div>
            ) : auctions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center px-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Gavel className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No hay subastas aún</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mb-8">
                        Comienza publicando tu primera subasta para recibir ofertas de los mejores especialistas.
                    </p>
                    <Link href="/dashboard/insurance/auctions/new">
                        <Button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black">
                            Publicar Ahora
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode='popLayout'>
                        {auctions.map((auction, idx) => (
                            <AuctionCard key={auction.id} auction={auction} index={idx} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-all ${active
                ? 'bg-alteha-violet text-white shadow-lg shadow-violet-100 scale-105'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
        >
            {label}
        </button>
    );
}

function AuctionCard({ auction, index }: { auction: Auction, index: number }) {
    const config = STATUS_CONFIG[auction.status] || STATUS_CONFIG['DRAFT'];
    const StatusIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 flex flex-col md:flex-row items-center gap-8 group transition-all"
        >
            <div className={`w-20 h-20 rounded-[1.5rem] ${config.color.split(' ')[0]} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <StatusIcon className={`w-10 h-10 ${config.color.split(' ')[1]}`} />
            </div>

            <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {auction.auctionNumber}
                    </span>
                    <span className={`w-fit mx-auto md:mx-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                        {config.label}
                    </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-alteha-violet transition-colors">
                    {auction.title}
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                        <Clock className="w-4 h-4" />
                        Fin: {new Date(auction.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-alteha-turquoise text-sm font-black">
                        <Gavel className="w-4 h-4" />
                        {auction.totalBids || 0} Ofertas
                    </div>
                </div>
            </div>

            <div className="text-center md:text-right flex flex-col items-center md:items-end gap-2">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Presupuesto Máx.</div>
                <div className="text-3xl font-black text-slate-900">
                    ${auction.maxBudget.toLocaleString()}
                </div>
            </div>

            <Link href={`/dashboard/insurance/auctions/${auction.auctionNumber}`}>
                <Button className="w-14 h-14 rounded-[1.5rem] bg-slate-50 hover:bg-alteha-violet hover:text-white flex items-center justify-center transition-all p-0">
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </Link>
        </motion.div>
    );
}
