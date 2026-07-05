"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Inbox, ChevronDown, ExternalLink, Package2, StickyNote, Calendar } from 'lucide-react';

const STATUS_ES: Record<string, { label: string; cls: string }> = {
    SUBMITTED: { label: 'Enviada', cls: 'bg-blue-50 text-blue-600' },
    ACCEPTED: { label: 'Aceptada', cls: 'bg-emerald-50 text-emerald-600' },
    REJECTED: { label: 'Rechazada', cls: 'bg-red-50 text-red-500' },
    WITHDRAWN: { label: 'Retirada', cls: 'bg-slate-100 text-slate-500' },
    EXPIRED: { label: 'Expirada', cls: 'bg-slate-100 text-slate-500' },
};

const money = (n: any) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

/** Ofertas de insumos enviadas por la casa de salud, con detalle expandible. */
export default function ProviderBidsPage() {
    const [bids, setBids] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState<number | null>(null);

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
                <p className="text-slate-400 text-sm font-medium">
                    Tus ofertas por insumos médicos y su estado en cada subasta. Haz clic en una oferta para ver el detalle.
                </p>
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
                        const items: any[] = b.bidItems || [];
                        const isOpen = openId === b.id;
                        return (
                            <div key={b.id} className={`bg-white rounded-[1.75rem] border shadow-sm transition-all ${isOpen ? 'border-alteha-turquoise/40 shadow-md' : 'border-slate-100 hover:border-alteha-turquoise/30'}`}>
                                {/* Cabecera clicable */}
                                <button
                                    type="button"
                                    onClick={() => setOpenId(isOpen ? null : b.id)}
                                    className="w-full p-5 flex items-center gap-4 text-left cursor-pointer"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-slate-900 truncate">
                                            {b.auction?.title || `Subasta ${auctionNumber || ''}`}
                                        </p>
                                        <p className="text-xs text-slate-400 font-bold">
                                            {b.bidNumber} · {b.createdAt ? new Date(b.createdAt).toLocaleDateString('es-VE') : ''}
                                            {items.length > 0 ? ` · ${items.length} insumo(s)` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-black text-slate-900">{money(b.bidAmount)}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${st.cls}`}>{st.label}</span>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-300 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-alteha-turquoise' : ''}`} />
                                </button>

                                {/* Detalle expandible */}
                                {isOpen && (
                                    <div className="px-5 pb-5 space-y-4 border-t border-slate-50 pt-4">
                                        {/* Desglose de insumos */}
                                        {items.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Package2 className="w-3.5 h-3.5" /> Insumos ofertados
                                                </p>
                                                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                                    {items.map((it: any, i: number) => (
                                                        <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-slate-800 truncate">{it.itemName}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    {it.quantity} × {money(it.unitPrice)}
                                                                </p>
                                                            </div>
                                                            <p className="font-black text-slate-900 shrink-0 ml-3">{money(it.totalPrice)}</p>
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise">Total de la oferta</p>
                                                        <p className="font-black text-alteha-turquoise">{money(b.bidAmount)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notas */}
                                        {b.notes && (
                                            <div className="flex gap-3 bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
                                                <StickyNote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-900 font-medium leading-relaxed">{b.notes}</p>
                                            </div>
                                        )}

                                        {/* Fechas + acceso a la subasta */}
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Enviada el {b.createdAt ? new Date(b.createdAt).toLocaleString('es-VE') : '—'}
                                                {b.auction?.estimatedSurgeryDate && (
                                                    <span className="ml-2 text-amber-600">· Intervención: {String(b.auction.estimatedSurgeryDate).split('T')[0].split('-').reverse().join('/')}</span>
                                                )}
                                            </div>
                                            {auctionNumber && (
                                                <Link
                                                    href={`/dashboard/provider/auctions/${auctionNumber}`}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:scale-105 transition-all"
                                                >
                                                    Ver subasta <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
