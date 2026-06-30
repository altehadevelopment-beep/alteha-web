"use client";

import React, { useEffect, useState } from 'react';
import { Users, Stethoscope, Building2, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { getAuctionDuplas } from '@/lib/api';

const money = (n: any) => {
    const v = Number(n);
    if (!isFinite(v)) return '—';
    return v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Insurer-facing view of the doctor+clinic "duplas" produced by SOLO_MEDICO bids:
 * a doctor invited a clinic; once the clinic accepts and sets its fee, the pair (honorarios + clínica)
 * becomes a valid combined offer.
 */
export default function DuplasSection({ auctionId }: { auctionId: number }) {
    const [duplas, setDuplas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getAuctionDuplas(auctionId)
            .then((d) => { if (active) setDuplas(Array.isArray(d) ? d : []); })
            .catch(() => { if (active) setDuplas([]); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [auctionId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-slate-300">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }
    if (!duplas.length) return null;

    const badge = (status: string) => {
        if (status === 'ACCEPTED') return { cls: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2, label: 'Dupla confirmada' };
        if (status === 'REJECTED') return { cls: 'bg-red-50 text-red-500', icon: XCircle, label: 'Clínica rechazó' };
        return { cls: 'bg-amber-50 text-amber-600', icon: Clock, label: 'Esperando a la clínica' };
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-alteha-violet" /> Duplas Médico + Clínica
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                    Ofertas en modalidad “Solo Médico”: el médico invitó a una clínica. Cuando la clínica acepta y fija sus honorarios, la dupla queda confirmada.
                </p>
            </div>

            <div className="space-y-3">
                {duplas.map((d) => {
                    const b = badge(d.status);
                    return (
                        <div key={d.id} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${b.cls}`}>
                                    <b.icon className="w-3.5 h-3.5" /> {b.label}
                                </span>
                                {d.status === 'ACCEPTED' && (
                                    <span className="text-sm font-black text-slate-900">Total: ${money(d.total)}</span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                                    <Stethoscope className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Médico</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{d.doctorName || 'Médico'}</p>
                                        <p className="text-xs text-slate-500">Honorarios: ${money(d.honorarios)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clínica</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{d.clinicName || 'Clínica'}</p>
                                        <p className="text-xs text-slate-500">
                                            {d.status === 'ACCEPTED' ? `Honorarios: $${money(d.clinicFee)}` : 'Aún sin confirmar'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
