"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    History, CheckCircle2, Calendar, DollarSign, FileText,
    ArrowRight, Search, Loader2, ShieldCheck
} from 'lucide-react';
import { getMyInvitations, type Auction } from '@/lib/api';

// Histórico de subastas del médico: las que ya cerraron su ciclo completo
// (SETTLED = fondos liquidados y cobrados). Salen del dashboard y viven aquí.
export default function AuctionHistoryPage() {
    const [items, setItems] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const result = await getMyInvitations('DOCTOR', 0, 100);
                let list: Auction[] = [];
                if ((result as any).code === '00' && (result as any).data) {
                    list = (result as any).data;
                } else if (Array.isArray(result)) {
                    list = result as any;
                } else if ((result as any).content) {
                    list = (result as any).content;
                }
                setItems(list.filter((a: any) => a.status === 'SETTLED'));
            } catch (e) {
                console.error('Error loading auction history:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((a: any) =>
            (a.title || '').toLowerCase().includes(q) ||
            (a.auctionNumber || '').toLowerCase().includes(q)
        );
    }, [items, search]);

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                        <History className="w-9 h-9 text-alteha-turquoise" />
                        Histórico de Subastas
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Subastas finalizadas y cobradas: el proceso completo terminó y los fondos fueron liquidados a tu cuenta.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por título o número..."
                        className="w-full md:w-80 h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-alteha-turquoise/10 transition-all"
                    />
                </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="p-3 w-fit rounded-2xl bg-emerald-50 text-emerald-500 mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Subastas liquidadas</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">{items.length}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="p-3 w-fit rounded-2xl bg-alteha-turquoise/10 text-alteha-turquoise mb-3">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total cobrado</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">
                        ${items
                            .reduce((sum: number, a: any) => sum + Number(a.awardedBid?.bidAmount ?? 0), 0)
                            .toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Lista */}
            {isLoading ? (
                <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin mx-auto" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center space-y-2">
                    <History className="w-10 h-10 text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-bold text-sm">
                        {items.length === 0
                            ? 'Aún no tienes subastas finalizadas. Cuando cobres tu primera subasta aparecerá aquí.'
                            : 'Ninguna subasta coincide con tu búsqueda.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((auction: any) => (
                        <div
                            key={auction.id}
                            className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl transition-all"
                        >
                            <div className="flex-1 space-y-3 text-left min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                        <CheckCircle2 className="w-3 h-3" /> Liquidada
                                    </span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        Ref: {auction.auctionNumber}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 tracking-tight line-clamp-2">{auction.title}</h4>
                                <div className="flex flex-wrap gap-4">
                                    {auction.awardedBid?.bidAmount != null && (
                                        <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            {Number(auction.awardedBid.bidAmount).toLocaleString('es-VE', { minimumFractionDigits: 2 })} cobrados
                                        </span>
                                    )}
                                    {auction.insuranceCompany?.name && (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-xl">
                                            <ShieldCheck className="w-3.5 h-3.5" /> {auction.insuranceCompany.name}
                                        </span>
                                    )}
                                    {(auction.updatedAt || auction.endDate) && (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-xl">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(auction.updatedAt || auction.endDate).toLocaleDateString('es-ES')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Link href={`/dashboard/specialist/auctions/${auction.auctionNumber}`} className="shrink-0">
                                <button className="w-full lg:w-auto px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                                    <FileText className="w-4 h-4" />
                                    Ver Detalle
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
