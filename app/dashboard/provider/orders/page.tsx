"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Truck, Loader2, Inbox, Package2, Upload, CheckCircle2, Clock, XCircle, ExternalLink, Stethoscope, Building2
} from 'lucide-react';

const STATUS_ES: Record<string, { label: string; cls: string; icon: any }> = {
    PENDING_DISPATCH: { label: 'Por despachar', cls: 'bg-amber-50 text-amber-600', icon: Truck },
    DELIVERY_REPORTED: { label: 'Entrega en validación', cls: 'bg-blue-50 text-blue-600', icon: Clock },
    APPROVED: { label: 'Entrega aprobada — pago en proceso', cls: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
    REJECTED: { label: 'Entrega rechazada — vuelve a cargarla', cls: 'bg-red-50 text-red-500', icon: XCircle },
};

const money = (n: any) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

/**
 * Órdenes de despacho de la casa de salud: se emiten cuando el seguro adjudica
 * la subasta eligiendo esta casa. Los insumos se despachan al dueño de la
 * oferta ganadora (médico o clínica) ANTES de la intervención; al entregar,
 * la casa carga la orden de entrega firmada y Alteha la valida para pagarle.
 */
export default function ProviderOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadFor, setUploadFor] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const load = () => {
        const token = localStorage.getItem('id_token');
        fetch('/api/dispatch-orders/mine', { headers: { 'X-Alteha-Token': token || '' } })
            .then(r => r.json())
            .then(d => setOrders(Array.isArray(d) ? d : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };
    useEffect(load, []);

    const submitDelivery = async (orderId: number) => {
        if (!file) return;
        setSending(true);
        try {
            const token = localStorage.getItem('id_token');
            const fd = new FormData();
            fd.append('proof', file);
            if (notes) fd.append('notes', notes);
            const res = await fetch(`/api/dispatch-orders/${orderId}/delivery`, {
                method: 'POST',
                headers: { 'X-Alteha-Token': token || '' },
                body: fd,
            });
            const d = await res.json();
            if (d?.code === '00') {
                setOrders(prev => prev.map(o => (o.id === orderId ? d.data : o)));
                setUploadFor(null);
                setNotes('');
                setFile(null);
            } else {
                alert(d?.message || 'No se pudo cargar la orden de entrega');
            }
        } catch {
            alert('Error de conexión');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-8 font-outfit max-w-4xl mx-auto pb-20">
            <header className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Truck className="w-8 h-8 text-alteha-turquoise" /> Órdenes de Despacho
                </h1>
                <p className="text-slate-400 text-sm font-medium max-w-2xl">
                    Cuando el seguro adjudica una subasta eligiendo tu casa de salud, se emite una orden de despacho.
                    Entrega los insumos <strong>antes de la intervención</strong>, carga la orden de entrega firmada y
                    Alteha la validará para liberar tu pago.
                </p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">Aún no tienes órdenes de despacho</p>
                    <p className="text-sm text-slate-400">Cuando un seguro adjudique una subasta comprándote los insumos, la orden aparecerá aquí.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((o: any) => {
                        const st = STATUS_ES[o.status] || { label: o.status, cls: 'bg-slate-100 text-slate-500', icon: Clock };
                        const StIcon = st.icon;
                        const canUpload = o.status === 'PENDING_DISPATCH' || o.status === 'REJECTED';
                        return (
                            <div key={o.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="w-12 h-12 rounded-2xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center shrink-0">
                                        <Package2 className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-slate-900">{o.orderNumber} · {money(o.amount)}</p>
                                        <p className="text-xs text-slate-400 font-bold truncate">
                                            {o.auctionNumber}{o.auctionTitle ? ` — ${o.auctionTitle}` : ''}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${st.cls}`}>
                                        <StIcon className="w-3.5 h-3.5" /> {st.label}
                                    </span>
                                </div>

                                {/* A quién se despacha */}
                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                                    {o.recipientRole === 'CLINIC'
                                        ? <Building2 className="w-5 h-5 text-alteha-turquoise shrink-0" />
                                        : <Stethoscope className="w-5 h-5 text-alteha-violet shrink-0" />}
                                    <p className="text-sm font-bold text-slate-700">
                                        Despachar a {o.recipientRole === 'CLINIC' ? 'la clínica' : 'el médico'}:{' '}
                                        <strong className="text-slate-900">{o.recipientName || '—'}</strong>
                                        {o.estimatedSurgeryDate && (
                                            <span className="text-slate-400"> · intervención el {String(o.estimatedSurgeryDate).split('T')[0].split('-').reverse().join('/')}</span>
                                        )}
                                    </p>
                                </div>

                                {/* Insumos de la orden */}
                                {(o.items || []).length > 0 && (
                                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                        {(o.items || []).map((it: any, i: number) => (
                                            <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                                <span className="font-bold text-slate-700">{it.itemName} <span className="text-slate-400">×{it.quantity}</span></span>
                                                <span className="font-black text-slate-900">{money(it.totalPrice)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Estado de la entrega / revisión */}
                                {o.deliveryProofUrl && (
                                    <div className="flex items-center justify-between gap-3 flex-wrap text-xs font-bold text-slate-500">
                                        <span>
                                            Orden de entrega cargada{o.reportedAt ? ` el ${new Date(o.reportedAt).toLocaleString('es-VE')}` : ''}
                                            {o.reviewNotes ? ` · Alteha: "${o.reviewNotes}"` : ''}
                                        </span>
                                        <a href={o.deliveryProofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-alteha-turquoise hover:underline">
                                            Ver comprobante <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                )}

                                {/* Cargar orden de entrega */}
                                {canUpload && (uploadFor === o.id ? (
                                    <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
                                        <p className="text-[10px] font-black text-alteha-turquoise uppercase tracking-widest">
                                            Cargar orden de entrega firmada {o.recipientRole === 'CLINIC' ? 'por la clínica' : 'por el médico'}
                                        </p>
                                        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                            onChange={e => setFile(e.target.files?.[0] || null)} />
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            className="w-full border-2 border-dashed border-white/20 rounded-xl py-4 text-sm font-bold text-slate-300 hover:bg-white/5 transition-all"
                                        >
                                            {file ? `✓ ${file.name}` : 'Seleccionar archivo (PDF/IMG)'}
                                        </button>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Notas de la entrega (opcional): quién recibió, fecha, observaciones..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-alteha-turquoise/50 resize-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => submitDelivery(o.id)}
                                                disabled={!file || sending}
                                                className="flex-1 py-3 bg-alteha-turquoise text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
                                            >
                                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Enviar a validación
                                            </button>
                                            <button onClick={() => { setUploadFor(null); setFile(null); }} className="px-5 py-3 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setUploadFor(o.id); setFile(null); setNotes(''); }}
                                        className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" /> {o.status === 'REJECTED' ? 'Volver a cargar la orden de entrega' : 'Cargar orden de entrega'}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
