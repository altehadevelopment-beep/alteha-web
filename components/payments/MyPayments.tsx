"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Receipt, Loader2, Inbox, Printer, ArrowDownLeft, ArrowUpRight, Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { actorDisplayName } from '@/lib/api';

const METHOD_LABEL: Record<string, string> = {
    BS_BANK_TRANSFER: 'Transferencia Bs.',
    BS_PAGO_MOVIL: 'Pago Móvil (Bs)',
    USD_WIRE_SWIFT: 'Wire / SWIFT',
    USD_ACH: 'ACH / Zelle',
    USD_IBAN: 'IBAN',
    BINANCE_PAY: 'Binance Pay',
    BINANCE: 'Binance Pay',
    CRYPTO_WALLET: 'Cripto',
    BS_C2P: 'Débito Bs (C2P)',
    STRIPE_CARD: 'Tarjeta (Stripe)',
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    PAID: { label: 'Pagado', cls: 'bg-emerald-50 text-emerald-600' },
    PENDING: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-600' },
    APPROVED: { label: 'Aprobado', cls: 'bg-blue-50 text-blue-600' },
    CANCELLED: { label: 'Cancelado', cls: 'bg-red-50 text-red-500' },
};

const money = (n: any, cur: string = 'USD') => {
    const v = Number(n);
    if (!isFinite(v)) return '—';
    return `${cur === 'USD' ? '$' : cur + ' '}${v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Abre una ventana con el recibo formateado y lanza la impresión. */
function printReceipt(p: any, actorName: string) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo ${p.receiptNumber || ''}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; padding: 48px; }
        .box { max-width: 640px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 24px; padding: 40px; }
        .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2ECFBF; padding-bottom: 20px; margin-bottom: 28px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { height: 48px; width: auto; }
        .brand .txt { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
        .brand .txt span { color: #2ECFBF; }
        .rec { text-align: right; font-size: 12px; color: #64748b; }
        .rec b { display: block; font-size: 15px; color: #0f172a; }
        .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
        .row .k { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; padding-top: 3px; }
        .row .v { font-weight: 700; text-align: right; max-width: 60%; }
        .amount { text-align: center; margin: 28px 0; }
        .amount .n { font-size: 40px; font-weight: 900; }
        .amount .d { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; }
        .foot { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; }
        @media print { body { padding: 12px; } }
    </style></head><body>
    <div class="box">
        <div class="head">
            <div class="brand"><img src="${window.location.origin}/logoalteha.svg" alt="Alteha" onerror="this.style.display='none'"/><div class="txt">AL<span>TEHA</span></div></div>
            <div class="rec">Recibo de ${p.direction === 'RECIBIDO' ? 'cobro' : 'pago'}<b>${p.receiptNumber || p.id}</b>${p.date ? new Date(p.date).toLocaleString('es-VE') : ''}</div>
        </div>
        <div class="amount">
            <div class="d">${p.direction === 'RECIBIDO' ? 'Monto recibido' : 'Monto pagado'}</div>
            <div class="n">${money(p.amount, p.currency)}</div>
        </div>
        <div class="row"><div class="k">Concepto</div><div class="v">${p.concept || ''}</div></div>
        <div class="row"><div class="k">${p.direction === 'RECIBIDO' ? 'Beneficiario' : 'Pagador'}</div><div class="v">${actorName}</div></div>
        <div class="row"><div class="k">Contraparte</div><div class="v">${p.counterparty || 'Alteha'}</div></div>
        ${p.method ? `<div class="row"><div class="k">Método</div><div class="v">${METHOD_LABEL[p.method] || p.method}</div></div>` : ''}
        ${p.guiaPay ? `<div class="row"><div class="k">Canal</div><div class="v"><span style="color:#2e86c1;font-weight:900">● guia<span style="font-weight:300">pay</span></span> — cambio ${p.guiaPay.fromCurrency} → ${p.guiaPay.toCurrency}</div></div>
        <div class="row"><div class="k">Detalle del cambio</div><div class="v">${money(p.guiaPay.amountOrigin, p.guiaPay.fromCurrency === 'BS' ? 'Bs' : p.guiaPay.fromCurrency)} convertidos a tasa BCV ${Number(p.guiaPay.bcvRate || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} · gastos administrativos ${p.guiaPay.marginRate}%</div></div>` : ''}
        ${p.reference ? `<div class="row"><div class="k">Referencia</div><div class="v">${p.reference}</div></div>` : ''}
        ${p.note ? `<div class="row"><div class="k">Nota</div><div class="v">${p.note}</div></div>` : ''}
        <div class="row"><div class="k">Estado</div><div class="v">${STATUS_LABEL[p.status]?.label || p.status || '—'}</div></div>
        <div class="foot">Documento generado por Alteha — Red Médica · ${new Date().toLocaleDateString('es-VE')}</div>
    </div>
    <script>
        window.onload = () => {
            const img = document.querySelector('.brand img');
            const go = () => window.print();
            if (img && !img.complete) { img.onload = go; img.onerror = go; setTimeout(go, 800); }
            else { go(); }
        };
    </script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=760,height=900');
    if (w) { w.document.write(html); w.document.close(); }
}

/** Historial unificado de pagos del actor (pagados y recibidos) con recibo imprimible. */
export default function MyPayments() {
    const { userProfile } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PAGADO' | 'RECIBIDO'>('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('id_token');
        fetch('/api/payments/mine', { headers: { 'X-Alteha-Token': token || '' } })
            .then(r => r.json())
            .then(d => setItems(Array.isArray(d) ? d : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter(p =>
            (filter === 'ALL' || p.direction === filter) &&
            (!q || `${p.concept}{p.guiaPay ? <span className="ml-2 inline-flex items-center gap-1 align-middle px-2 py-0.5 rounded-md bg-indigo-50 text-[9px] font-black"><span className="w-1.5 h-1.5 rounded-full bg-[#2e86c1] inline-block" /><span className="lowercase tracking-tight font-light text-slate-700">guia<span className="text-[#2e86c1]">pay</span></span></span> : null} ${p.reference} ${p.receiptNumber} ${p.counterparty}`.toLowerCase().includes(q))
        );
    }, [items, filter, search]);

    const totals = useMemo(() => ({
        paid: items.filter(p => p.direction === 'PAGADO' && p.status !== 'CANCELLED').reduce((s, p) => s + (Number(p.amount) || 0), 0),
        received: items.filter(p => p.direction === 'RECIBIDO' && p.status === 'PAID').reduce((s, p) => s + (Number(p.amount) || 0), 0),
    }), [items]);

    return (
        <div className="space-y-8 font-outfit max-w-4xl mx-auto pb-20">
            <header className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Receipt className="w-8 h-8 text-alteha-turquoise" />
                    Mis Pagos
                </h1>
                <p className="text-slate-400 text-sm font-medium">
                    Todos tus pagos y cobros en la plataforma, con su concepto y recibo imprimible.
                </p>
            </header>

            {/* Totales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><ArrowUpRight className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total pagado</p>
                        <p className="text-2xl font-black text-slate-900">{money(totals.paid)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><ArrowDownLeft className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total recibido</p>
                        <p className="text-2xl font-black text-slate-900">{money(totals.received)}</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por concepto, referencia o recibo…"
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 focus:border-alteha-turquoise rounded-2xl font-bold text-sm text-slate-900 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {([['ALL', 'Todos'], ['PAGADO', 'Pagados'], ['RECIBIDO', 'Recibidos']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`px-4 py-3 rounded-2xl text-xs font-black transition-colors ${filter === key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : visible.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">Sin pagos registrados</p>
                    <p className="text-sm text-slate-400">Aquí aparecerán tus pagos y cobros a medida que uses la plataforma.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map((p) => {
                        const st = STATUS_LABEL[p.status] || { label: p.status || '—', cls: 'bg-slate-100 text-slate-500' };
                        const received = p.direction === 'RECIBIDO';
                        return (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 flex items-center gap-4 flex-wrap">
                                <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${received ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'}`}>
                                    {received ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-900 truncate">{p.concept}</p>
                                    <p className="text-xs text-slate-400 font-bold">
                                        {p.receiptNumber} · {p.date ? new Date(p.date).toLocaleDateString('es-VE') : ''}
                                        {p.method ? ` · ${METHOD_LABEL[p.method] || p.method}` : ''}
                                        {p.counterparty ? ` · ${received ? 'de' : 'a'} ${p.counterparty}` : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-lg font-black ${received ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {received ? '+' : '−'}{money(p.amount, p.currency)}
                                    </p>
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${st.cls}`}>{st.label}</span>
                                </div>
                                <button
                                    onClick={() => printReceipt(p, actorDisplayName(userProfile))}
                                    title="Imprimir recibo"
                                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-alteha-turquoise/10 hover:text-alteha-turquoise hover:border-alteha-turquoise/30 transition-colors"
                                >
                                    <Printer className="w-4 h-4" /> Recibo
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
