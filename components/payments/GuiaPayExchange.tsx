"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Loader2, CheckCircle2, Crown, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

const CUR_LABEL: Record<string, string> = { BS: 'Bolívares (Bs)', USD: 'Dólares (USD)', USDT: 'USDT (cripto)' };

/**
 * Guía Pay — operación de cambio de moneda al recibir los fondos.
 * La moneda de origen depende del método de cobro (Pago Móvil/Transferencia → Bs,
 * ACH/Zelle/SWIFT/IBAN → USD, Binance/Crypto → USDT). La conversión usa la tasa
 * BCV más el margen configurable de Alteha. Requiere plan Expansión o Élite:
 * con un plan menor la opción se muestra, pero invita a mejorar el plan.
 */
export default function GuiaPayExchange({ role, auctionNumber, defaultAmount, methodType }: {
    role: 'DOCTOR' | 'CLINIC' | 'PHARMACY';
    auctionNumber?: string;
    defaultAmount?: number | null;
    methodType?: string | null;
}) {
    const [cfg, setCfg] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : '');
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [myOps, setMyOps] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('id_token');
        fetch('/api/exchange/config', { headers: { 'X-Alteha-Token': token || '' } })
            .then(r => r.json())
            .then(d => {
                setCfg(d);
                const origin = (methodType && d?.methodCurrency?.[methodType]) || 'USD';
                setFrom(origin);
                setTo(origin === 'BS' ? 'USD' : 'BS');
            })
            .catch(() => {});
        fetch(`/api/exchange/mine?role=${role}`, { headers: { 'X-Alteha-Token': token || '' } })
            .then(r => r.json())
            .then(d => setMyOps(Array.isArray(d) ? d : []))
            .catch(() => {});
    }, [role, methodType]);

    const bcv = Number(cfg?.bcvRate) || 0;
    const margin = Number(cfg?.marginRate) || 0;

    // Cotización en vivo (mismo cálculo del backend): BS↔USD por BCV, USDT 1:1 con USD
    const preview = useMemo(() => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0 || !from || !to || from === to || bcv <= 0) return null;
        const usd = from === 'BS' ? amt / bcv : amt;
        const gross = to === 'BS' ? usd * bcv : usd;
        const gain = Math.round(gross * margin) / 100;
        return { gross, gain, target: Math.round(gross * 100) / 100 - gain };
    }, [amount, from, to, bcv, margin]);

    const fmt = (n: number, cur: string) =>
        `${cur === 'BS' ? 'Bs ' : cur === 'USDT' ? '₮ ' : '$'}${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const planPath = role === 'CLINIC' ? '/dashboard/clinic/plan' : '/dashboard/specialist/plan';

    const submit = async () => {
        setError(null);
        setSending(true);
        try {
            const token = localStorage.getItem('id_token');
            const res = await fetch('/api/exchange/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token || '' },
                body: JSON.stringify({
                    role,
                    auctionNumber,
                    methodType,
                    fromCurrency: from,
                    toCurrency: to,
                    amount: parseFloat(amount),
                }),
            });
            const data = await res.json();
            const msg = String(data?.message || '');
            if (data?.code === '00') {
                setDone(data.data);
                setMyOps(prev => [data.data, ...prev]);
            } else if (msg.includes('PLAN_LIMIT')) {
                setShowUpgrade(true);
            } else {
                setError(msg || 'No se pudo solicitar la operación');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <ArrowRightLeft className="w-3 h-3" /> Guía Pay · Operación de cambio
                        </div>
                        <h3 className="text-2xl font-black">¿Prefieres recibir tus fondos en otra moneda?</h3>
                        <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-xl">
                            Con <strong className="text-white">Guía Pay</strong> puedes convertir lo que te paga el seguro entre
                            <strong className="text-white"> Bolívares, USD y USDT</strong> usando la tasa oficial del BCV
                            {bcv > 0 && <> (hoy <strong className="text-indigo-300">Bs {bcv.toLocaleString('es-VE', { minimumFractionDigits: 2 })}/USD</strong>)</>}.
                            Alteha programa el pago en la moneda que elijas.
                        </p>
                    </div>
                    {!open && !done && (
                        <button
                            onClick={() => setOpen(true)}
                            className="shrink-0 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-900/40 inline-flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> Quiero hacer el cambio
                        </button>
                    )}
                </div>

                {done ? (
                    <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-2xl p-6 space-y-2">
                        <p className="font-black text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Operación de cambio solicitada
                        </p>
                        <p className="text-sm text-slate-300 font-medium">
                            Recibirás <strong className="text-white">{fmt(Number(done.amountTarget), done.toCurrency)}</strong> ({CUR_LABEL[done.toCurrency] || done.toCurrency}) por tus {fmt(Number(done.amountOrigin), done.fromCurrency)}.
                            El equipo de Alteha programará el pago en la moneda seleccionada y te notificará.
                        </p>
                    </div>
                ) : open && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recibes (según tu método)</label>
                                <select
                                    value={from}
                                    onChange={e => { setFrom(e.target.value); if (e.target.value === to) setTo(e.target.value === 'BS' ? 'USD' : 'BS'); }}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-indigo-400"
                                >
                                    {(cfg?.currencies || ['BS', 'USD', 'USDT']).map((c: string) => (
                                        <option key={c} value={c}>{CUR_LABEL[c] || c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quieres recibir en</label>
                                <select
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-indigo-400"
                                >
                                    {(cfg?.currencies || ['BS', 'USD', 'USDT']).filter((c: string) => c !== from).map((c: string) => (
                                        <option key={c} value={c}>{CUR_LABEL[c] || c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto a convertir ({from})</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-indigo-400"
                                />
                            </div>
                        </div>

                        {preview && (
                            <div className="bg-slate-800/60 rounded-xl p-4 space-y-1.5 text-sm font-bold">
                                <div className="flex justify-between text-slate-300"><span>Conversión a tasa BCV</span><span className="text-white">{fmt(preview.gross, to)}</span></div>
                                <div className="flex justify-between text-slate-300"><span>Servicio Guía Pay ({margin}%)</span><span className="text-white">− {fmt(preview.gain, to)}</span></div>
                                <div className="flex justify-between border-t border-white/10 pt-1.5"><span className="text-indigo-300 font-black">Recibirás</span><span className="text-indigo-300 font-black text-lg">{fmt(preview.target, to)}</span></div>
                            </div>
                        )}

                        {error && <p className="text-sm font-bold text-red-400">{error}</p>}

                        <div className="flex gap-3">
                            <button
                                onClick={submit}
                                disabled={sending || !preview}
                                className="flex-1 py-4 bg-indigo-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                                Solicitar cambio con Guía Pay
                            </button>
                            <button onClick={() => setOpen(false)} className="px-6 py-4 bg-white/5 rounded-2xl font-black text-sm text-slate-400 hover:text-white transition-all">
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Historial corto de operaciones */}
                {myOps.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tus operaciones de cambio</p>
                        {myOps.slice(0, 3).map((op: any) => (
                            <div key={op.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 text-sm font-bold">
                                <span className="text-slate-300">{fmt(Number(op.amountOrigin), op.fromCurrency)} → <strong className="text-white">{fmt(Number(op.amountTarget), op.toCurrency)}</strong></span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${op.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : op.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-300' : op.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {op.status === 'REQUESTED' ? 'Solicitada' : op.status === 'SCHEDULED' ? 'Programada' : op.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de upgrade de plan */}
            {showUpgrade && (
                <div className="fixed inset-0 z-[999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowUpgrade(false)}>
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center space-y-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowUpgrade(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-200">
                            <Crown className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Función de planes superiores</h4>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">
                                La operación de cambio <strong>Guía Pay</strong> está disponible en los planes
                                <strong> Alteha Expansión</strong> y <strong>Alteha Élite</strong>.
                                Mejora tu plan para programar la conversión de tus fondos a Bs, USD o USDT.
                            </p>
                        </div>
                        {role === 'PHARMACY' ? (
                            <p className="text-xs font-bold text-slate-400">
                                Próximamente podrás activar planes para casas de salud. Contacta al equipo de Alteha para habilitarlo.
                            </p>
                        ) : (
                            <Link
                                href={planPath}
                                className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
                            >
                                Ver planes y mejorar
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
