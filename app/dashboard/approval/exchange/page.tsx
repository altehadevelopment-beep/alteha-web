"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Loader2, Inbox, Save, Percent, CalendarClock, CheckCircle2, XCircle } from 'lucide-react';
import { GuiaPayLogo } from '@/components/payments/GuiaPayExchange';

const STATUS_ES: Record<string, { label: string; cls: string }> = {
    REQUESTED: { label: 'Solicitada', cls: 'bg-amber-50 text-amber-600' },
    SCHEDULED: { label: 'Programada', cls: 'bg-blue-50 text-blue-600' },
    COMPLETED: { label: 'Completada', cls: 'bg-emerald-50 text-emerald-600' },
    CANCELLED: { label: 'Cancelada', cls: 'bg-red-50 text-red-500' },
};

const fmt = (n: any, cur: string) =>
    `${cur === 'BS' ? 'Bs ' : cur === 'USDT' ? '₮ ' : '$'}${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

/**
 * Módulo administrativo de Guía Pay: margen de ganancia configurable (%)
 * sobre la tasa BCV y programación del pago en la moneda destino de cada
 * operación de cambio solicitada por médicos, clínicas y casas de salud.
 */
export default function AdminExchangePage() {
    const [ops, setOps] = useState<any[]>([]);
    const [cfg, setCfg] = useState<any>(null);
    const [margin, setMargin] = useState('');
    const [savingMargin, setSavingMargin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [scheduleFor, setScheduleFor] = useState<number | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [msg, setMsg] = useState<string | null>(null);

    const token = () => localStorage.getItem('id_token') || '';

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/exchange/all', { headers: { 'X-Alteha-Token': token() } }).then(r => r.json()).catch(() => []),
            fetch('/api/exchange/config', { headers: { 'X-Alteha-Token': token() } }).then(r => r.json()).catch(() => null),
        ]).then(([o, c]) => {
            setOps(Array.isArray(o) ? o : []);
            setCfg(c);
            if (c?.marginRate != null) setMargin(String(c.marginRate));
        }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const saveMargin = async () => {
        setSavingMargin(true);
        setMsg(null);
        try {
            const res = await fetch('/api/exchange/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token() },
                body: JSON.stringify({ marginRate: parseFloat(margin) }),
            });
            const d = await res.json();
            setMsg(d?.code === '00' ? 'Margen actualizado correctamente' : (d?.message || 'No se pudo actualizar'));
        } catch {
            setMsg('Error de conexión');
        } finally {
            setSavingMargin(false);
        }
    };

    const updateStatus = async (id: number, status: string, scheduledAt?: string) => {
        setBusyId(id);
        try {
            const body: any = { status };
            if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();
            const res = await fetch(`/api/exchange/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token() },
                body: JSON.stringify(body),
            });
            const d = await res.json();
            if (d?.code === '00') {
                setOps(prev => prev.map(o => (o.id === id ? d.data : o)));
                setScheduleFor(null);
                setScheduleDate('');
            } else {
                alert(d?.message || 'No se pudo actualizar la operación');
            }
        } catch {
            alert('Error de conexión');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-8 font-outfit max-w-5xl mx-auto pb-20">
            <header className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 flex-wrap">
                    <ArrowRightLeft className="w-8 h-8 text-indigo-500" /> Operaciones de Cambio
                    <GuiaPayLogo dark={false} size="text-3xl" />
                </h1>
                <p className="text-slate-400 text-sm font-medium max-w-2xl">
                    Solicitudes de conversión de moneda (Bs / USD / USDT) de médicos, clínicas y casas de salud.
                    Programa el pago en la moneda destino según el método de origen.
                </p>
            </header>

            {/* Margen configurable */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row md:items-end gap-5">
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Percent className="w-4 h-4 text-indigo-500" /> Gastos administrativos (ganancia de Alteha)
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                        Porcentaje que se descuenta de cada conversión sobre la tasa BCV
                        {cfg?.bcvRate ? ` (tasa actual: Bs ${Number(cfg.bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}/USD)` : ''}.
                        Se guarda en la tabla exchange_setting.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="50"
                            value={margin}
                            onChange={e => setMargin(e.target.value)}
                            className="w-28 px-4 py-3 pr-8 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-900 outline-none focus:border-indigo-300"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">%</span>
                    </div>
                    <button
                        onClick={saveMargin}
                        disabled={savingMargin || !margin}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm inline-flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-40"
                    >
                        {savingMargin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
                    </button>
                </div>
            </div>
            {msg && <p className="text-sm font-bold text-indigo-600 px-2">{msg}</p>}

            {/* Operaciones */}
            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : ops.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">No hay operaciones de cambio</p>
                    <p className="text-sm text-slate-400">Cuando un ganador solicite convertir sus fondos con Guía Pay, aparecerá aquí.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {ops.map((op: any) => {
                        const st = STATUS_ES[op.status] || { label: op.status, cls: 'bg-slate-100 text-slate-500' };
                        return (
                            <div key={op.id} className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-6 space-y-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-slate-900">
                                            {fmt(op.amountOrigin, op.fromCurrency)} → <span className="text-indigo-600">{fmt(op.amountTarget, op.toCurrency)}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 font-bold">
                                            {op.actorRole === 'DOCTOR' ? 'Médico' : op.actorRole === 'CLINIC' ? 'Clínica' : 'Casa de Salud'} · {op.actorEmail}
                                            {op.auctionNumber ? ` · ${op.auctionNumber}` : ''} · {op.createdAt ? new Date(op.createdAt).toLocaleString('es-VE') : ''}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                                            Tasa BCV {Number(op.bcvRate || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} · gastos administrativos {op.marginRate}% ·
                                            ganancia Alteha <strong className="text-slate-600">{fmt(op.altehaGain, op.toCurrency)}</strong>
                                            {op.scheduledAt ? ` · programada para ${new Date(op.scheduledAt).toLocaleString('es-VE')}` : ''}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${st.cls}`}>{st.label}</span>
                                </div>

                                {(op.status === 'REQUESTED' || op.status === 'SCHEDULED') && (
                                    <div className="flex items-center gap-2 flex-wrap border-t border-slate-50 pt-4">
                                        {scheduleFor === op.id ? (
                                            <>
                                                <input
                                                    type="datetime-local"
                                                    value={scheduleDate}
                                                    onChange={e => setScheduleDate(e.target.value)}
                                                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-300"
                                                />
                                                <button
                                                    onClick={() => updateStatus(op.id, 'SCHEDULED', scheduleDate)}
                                                    disabled={!scheduleDate || busyId === op.id}
                                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40"
                                                >
                                                    {busyId === op.id ? '...' : 'Confirmar programación'}
                                                </button>
                                                <button onClick={() => setScheduleFor(null)} className="px-4 py-2.5 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => { setScheduleFor(op.id); setScheduleDate(''); }}
                                                    className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-blue-100 transition-all"
                                                >
                                                    <CalendarClock className="w-3.5 h-3.5" /> Programar pago
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(op.id, 'COMPLETED')}
                                                    disabled={busyId === op.id}
                                                    className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-emerald-100 transition-all disabled:opacity-40"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Marcar pagada
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(op.id, 'CANCELLED')}
                                                    disabled={busyId === op.id}
                                                    className="px-5 py-2.5 bg-red-50 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-red-100 transition-all disabled:opacity-40"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Cancelar
                                                </button>
                                            </>
                                        )}
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
