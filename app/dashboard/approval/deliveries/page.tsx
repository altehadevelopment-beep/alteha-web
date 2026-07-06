"use client";

import React, { useEffect, useState } from 'react';
import { Truck, Loader2, Inbox, CheckCircle2, XCircle, ExternalLink, Stethoscope, Building2 } from 'lucide-react';

const STATUS_ES: Record<string, { label: string; cls: string }> = {
    PENDING_DISPATCH: { label: 'Por despachar', cls: 'bg-amber-50 text-amber-600' },
    DELIVERY_REPORTED: { label: 'Por validar', cls: 'bg-blue-50 text-blue-600' },
    APPROVED: { label: 'Aprobada', cls: 'bg-emerald-50 text-emerald-600' },
    REJECTED: { label: 'Rechazada', cls: 'bg-red-50 text-red-500' },
};

const money = (n: any) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

/**
 * Validación de Entregas (Alteha): revisa las órdenes de entrega que cargan las
 * casas de salud. Al aprobar una, se genera la orden de liquidación PENDIENTE
 * de la casa — cobrable en Liquidaciones junto a las del médico y la clínica.
 */
export default function AdminDeliveriesPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [rejectFor, setRejectFor] = useState<number | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');

    const token = () => localStorage.getItem('id_token') || '';

    useEffect(() => {
        fetch('/api/dispatch-orders/all', { headers: { 'X-Alteha-Token': token() } })
            .then(r => r.json())
            .then(d => setOrders(Array.isArray(d) ? d : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const review = async (id: number, approved: boolean, notes?: string) => {
        setBusyId(id);
        try {
            const res = await fetch(`/api/dispatch-orders/${id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token() },
                body: JSON.stringify({ approved, notes }),
            });
            const d = await res.json();
            if (d?.code === '00') {
                setOrders(prev => prev.map(o => (o.id === id ? d.data : o)));
                setRejectFor(null);
                setRejectNotes('');
            } else {
                alert(d?.message || 'No se pudo actualizar la orden');
            }
        } catch {
            alert('Error de conexión');
        } finally {
            setBusyId(null);
        }
    };

    const pending = orders.filter(o => o.status === 'DELIVERY_REPORTED');
    const rest = orders.filter(o => o.status !== 'DELIVERY_REPORTED');

    const OrderCard = ({ o }: { o: any }) => {
        const st = STATUS_ES[o.status] || { label: o.status, cls: 'bg-slate-100 text-slate-500' };
        return (
            <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900">{o.orderNumber} · {money(o.amount)}</p>
                        <p className="text-xs text-slate-400 font-bold truncate">
                            {o.auctionNumber}{o.auctionTitle ? ` — ${o.auctionTitle}` : ''} · Casa de salud: {o.pharmacyEmail}
                        </p>
                        <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1.5">
                            {o.recipientRole === 'CLINIC' ? <Building2 className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                            Despacho a {o.recipientRole === 'CLINIC' ? 'la clínica' : 'el médico'}: <strong>{o.recipientName || '—'}</strong>
                        </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${st.cls}`}>{st.label}</span>
                </div>

                {(o.items || []).length > 0 && (
                    <p className="text-xs text-slate-400 font-medium">
                        {(o.items || []).map((it: any) => `${it.itemName} ×${it.quantity}`).join(' · ')}
                    </p>
                )}

                {o.deliveryProofUrl && (
                    <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 rounded-xl px-4 py-3">
                        <span className="text-xs font-bold text-slate-500">
                            Entrega reportada{o.reportedAt ? ` el ${new Date(o.reportedAt).toLocaleString('es-VE')}` : ''}
                            {o.deliveryNotes ? ` · "${o.deliveryNotes}"` : ''}
                        </span>
                        <a href={o.deliveryProofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:underline">
                            Ver orden de entrega <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )}
                {o.reviewNotes && o.status === 'REJECTED' && (
                    <p className="text-xs font-bold text-red-500">Motivo del rechazo: {o.reviewNotes}</p>
                )}

                {o.status === 'DELIVERY_REPORTED' && (
                    rejectFor === o.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                value={rejectNotes}
                                onChange={e => setRejectNotes(e.target.value)}
                                placeholder="Motivo del rechazo..."
                                className="flex-1 min-w-[220px] px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-red-200"
                            />
                            <button
                                onClick={() => review(o.id, false, rejectNotes)}
                                disabled={!rejectNotes || busyId === o.id}
                                className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40"
                            >
                                Confirmar rechazo
                            </button>
                            <button onClick={() => setRejectFor(null)} className="px-4 py-2.5 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap border-t border-slate-50 pt-4">
                            <button
                                onClick={() => review(o.id, true)}
                                disabled={busyId === o.id}
                                className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5 hover:scale-105 transition-all disabled:opacity-40"
                            >
                                {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Aprobar y liberar liquidación
                            </button>
                            <button
                                onClick={() => { setRejectFor(o.id); setRejectNotes(''); }}
                                disabled={busyId === o.id}
                                className="px-6 py-2.5 bg-red-50 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-red-100 transition-all disabled:opacity-40"
                            >
                                <XCircle className="w-3.5 h-3.5" /> Rechazar
                            </button>
                        </div>
                    )
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 font-outfit max-w-5xl mx-auto pb-20">
            <header className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Truck className="w-8 h-8 text-alteha-turquoise" /> Validación de Entregas
                </h1>
                <p className="text-slate-400 text-sm font-medium max-w-2xl">
                    Órdenes de entrega cargadas por las casas de salud. Al aprobar una, la liquidación de la casa
                    queda pendiente de pago en el módulo de Liquidaciones, junto a las del médico y la clínica.
                </p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">No hay órdenes de despacho</p>
                    <p className="text-sm text-slate-400">Se emiten automáticamente al adjudicar subastas con casa de salud.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {pending.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-black text-slate-900 px-1">Por validar ({pending.length})</h3>
                            {pending.map((o: any) => <OrderCard key={o.id} o={o} />)}
                        </div>
                    )}
                    {rest.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-black text-slate-400 px-1">Historial</h3>
                            {rest.map((o: any) => <OrderCard key={o.id} o={o} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
