"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gavel, Loader2, Inbox, Package2, ChevronRight, ShieldCheck } from 'lucide-react';

/**
 * Subastas abiertas para casas de salud: solo las que tienen insumos
 * requeridos. La casa oferta únicamente por los insumos, que deben
 * despacharse ANTES de la intervención.
 */
export default function ProviderAuctionsPage() {
    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('id_token');
        fetch('/api/pharmacy-auctions/open', { headers: { 'X-Alteha-Token': token || '' } })
            .then(r => r.json())
            .then(d => setAuctions(Array.isArray(d) ? d : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 font-outfit max-w-5xl mx-auto pb-20">
            <header className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Gavel className="w-8 h-8 text-alteha-turquoise" /> Subastas con Insumos
                </h1>
                <p className="text-slate-400 text-sm font-medium max-w-2xl">
                    Estas subastas requieren insumos médicos: oferta solo por los materiales listados.
                    Recuerda que los insumos se despachan <strong>antes</strong> de la intervención.
                </p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : auctions.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">No hay subastas con insumos por ahora</p>
                    <p className="text-sm text-slate-400">Cuando un seguro publique una subasta que requiera insumos, aparecerá aquí.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {auctions.map((a) => {
                        const ic: any = a.insuranceCompany;
                        const icName = ic?.name || ic?.commercialName || ic?.legalName;
                        return (
                            <Link key={a.id} href={`/dashboard/provider/auctions/${a.auctionNumber}`} className="block">
                                <div className="group bg-white rounded-[2.5rem] border border-slate-100 hover:border-alteha-turquoise/40 hover:shadow-xl transition-all p-6 flex items-center gap-6 cursor-pointer">
                                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Package2 className="w-7 h-7" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-black text-slate-900 group-hover:text-alteha-turquoise transition-colors truncate">{a.title}</h3>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.auctionNumber}</span>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {a.status === 'ACTIVE' ? 'Activa' : 'Próximamente'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-alteha-violet text-[9px] font-black uppercase tracking-widest">
                                                {(a.requiredSupplies || []).length} insumo{(a.requiredSupplies || []).length !== 1 ? 's' : ''}
                                            </span>
                                            {icName && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500">
                                                    {ic?.logoUrl ? <img src={ic.logoUrl} alt="" className="w-4 h-4 rounded object-contain bg-white border border-slate-100" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                                    {icName}
                                                </span>
                                            )}
                                        </div>
                                        {(a.requiredSupplies || []).length > 0 && (
                                            <p className="text-xs text-slate-400 font-medium mt-1.5 truncate">
                                                {(a.requiredSupplies || []).map((sup: any) => `${sup.itemName} ×${sup.quantity || 1}`).join(' · ')}
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight className="w-6 h-6 shrink-0 text-slate-200 group-hover:text-alteha-turquoise group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
