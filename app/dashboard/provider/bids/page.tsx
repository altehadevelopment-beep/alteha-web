"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Inbox, ChevronRight } from 'lucide-react';

const STATUS_ES: Record<string, { label: string; cls: string }> = {
    SUBMITTED: { label: 'Enviada', cls: 'bg-blue-50 text-blue-600' },
    ACCEPTED: { label: 'Aceptada', cls: 'bg-emerald-50 text-emerald-600' },
    REJECTED: { label: 'Rechazada', cls: 'bg-red-50 text-red-500' },
    WITHDRAWN: { label: 'Retirada', cls: 'bg-slate-100 text-slate-500' },
    EXPIRED: { label: 'Expirada', cls: 'bg-slate-100 text-slate-500' },
};

/** Ofertas de insumos enviadas por la casa de salud. */
export default function ProviderBidsPage() {
    const [bids, setBids] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('id_token');
        fetch('/api/pharmacy-auctions/my-bids', { headers: { 'X-Alteha-Token': token || '' } })
            .then(r => r.json())
            .then(d => setBids(Array.isArray(d) ? d : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 font-outfit max-w-4xl mx-auto pb-20">
            <header className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <FileText className="w-8 h-8 text-alteha-turquoise" /> Mis Ofertas de Insumos
                </h1>
                <p className="text-slate-400 text-sm font-medium">Tus ofertas por insumos médicos y su estado en cada subasta.</p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : bids.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">Aún no has enviado ofertas</p>
                    <p className="text-sm text-slate-400">Entra a Subastas Disponibles y oferta por los insumos requeridos.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bids.map((b) => {
                        const st = STATUS_ES[b.status] || { label: b.status, cls: 'bg-slate-100 text-slate-500' };
                        const auctionNumber = b.auction?.auctionNumber;
                        return (
                            <Link key={b.id} href={auctionNumber ? `/dashboard/provider/auctions/${auctionNumber}` : '#'} className="block">
                                <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-alteha-turquoise/40 hover:shadow-md transition-all cursor-pointer">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-slate-900 truncate">{b.auction?.title || `Subasta ${auctionNumber || ''}`}</p>
                                        <p className="text-xs text-slate-400 font-bold">
                                            {b.bidNumber} · {b.createdAt ? new Date(b.createdAt).toLocaleDateString('es-VE') : ''}
                                            {(b.bidItems || []).length > 0 ? ` · ${(b.bidItems || []).length} ítem(s)` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-black text-slate-900">${Number(b.bidAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${st.cls}`}>{st.label}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-200 shrink-0" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
