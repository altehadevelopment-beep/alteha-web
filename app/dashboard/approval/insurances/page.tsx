"use client";

// Validación de Seguros — módulo de aprobación: revisa RIF y registro mercantil
// de las aseguradoras registradas y las aprueba (ACTIVE) o rechaza (SUSPENDED).
// Hasta no ser aprobadas no pueden publicar subastas.
import React, { useEffect, useState } from 'react';
import {
    Building2, Loader2, RefreshCw, FileText, CheckCircle2, XCircle, Phone, Mail,
    Award, Clock, User, ExternalLink, History, IdCard, ShieldCheck,
} from 'lucide-react';
import { getStoredToken } from '@/lib/api';

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const statusBadge = (s?: string) => {
    const v = String(s || '').toUpperCase();
    const cls = v === 'VERIFIED' || v === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700'
        : v === 'REJECTED' || v === 'SUSPENDED' ? 'bg-red-100 text-red-600'
        : 'bg-amber-100 text-amber-700';
    const label: any = {
        PENDING: 'Pendiente', INVERIFICATION: 'En verificación', VERIFIED: 'Aprobada',
        REJECTED: 'Rechazada', ACTIVE: 'Activa', SUSPENDED: 'Suspendida',
    };
    return <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${cls}`}>{label[v] || v || '—'}</span>;
};

const DOC_LABEL: any = { RIF: 'RIF', REGISTRO_MERCATIL: 'Registro mercantil', REGISTRO_MERCANTIL: 'Registro mercantil' };

async function api(path: string, opts: RequestInit = {}) {
    const token = getStoredToken();
    const res = await fetch(`/api/insurance-approvals${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token || '', ...(opts.headers || {}) },
    });
    return res.json().catch(() => ({}));
}

export default function InsuranceApprovalPage() {
    const [pending, setPending] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes');

    const load = () => {
        setLoading(true);
        api('')
            .then((r) => {
                const d = r?.data || {};
                setPending(d.pending || []);
                setHistory(d.history || []);
                setSelected((prev: any) => (prev ? (d.pending || []).find((x: any) => x.id === prev.id) || null : null));
                if (r?.code && r.code !== '00') setMsg(r.message);
            })
            .finally(() => setLoading(false));
    };
    useEffect(load, []);

    const review = async (approved: boolean) => {
        if (!selected) return;
        setBusy(true); setMsg(null);
        const r = await api(`/${selected.id}/review`, {
            method: 'POST',
            body: JSON.stringify({ approved, rejectionReason: reason }),
        });
        setMsg(r?.message || 'Error');
        if (r?.code === '00') { setSelected(null); setRejecting(false); setReason(''); load(); }
        setBusy(false);
    };

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-alteha-turquoise" /> Validación de Seguros
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">
                        Revisa el RIF y el registro mercantil de las aseguradoras registradas. Hasta no ser aprobadas no pueden publicar subastas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white rounded-2xl border border-slate-100 p-1 flex">
                        {(['pendientes', 'historial'] as const).map((t) => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    tab === t ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                                {t === 'pendientes' ? `Pendientes (${pending.length})` : 'Historial'}
                            </button>
                        ))}
                    </div>
                    <button onClick={load} className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-alteha-turquoise"><RefreshCw className="w-4 h-4" /></button>
                </div>
            </header>
            {msg && <p className="text-sm font-bold text-alteha-violet">{msg}</p>}

            {tab === 'historial' ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-slate-50">
                            {['Aseguradora', 'Resultado', 'Revisado por', 'Fecha', 'Motivo'].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {history.map((h: any) => (
                                <tr key={h.id} className="border-t border-slate-50">
                                    <td className="px-5 py-3 font-black">{h.insuranceName || '—'}</td>
                                    <td className="px-5 py-3">{statusBadge(h.status)}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-600">{h.approvedBy || '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{fmtDate(h.approvedAt)}</td>
                                    <td className="px-5 py-3 text-slate-500 max-w-[240px] truncate">{h.rejectionReason || '—'}</td>
                                </tr>
                            ))}
                            {!history.length && <tr><td colSpan={5} className="text-center py-14 text-slate-400 font-semibold">Sin revisiones registradas.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Lista de pendientes */}
                    <aside className="w-full lg:w-96 shrink-0 space-y-3">
                        {pending.length === 0 && (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center space-y-2">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                                <p className="font-black">Sin aseguradoras por aprobar</p>
                                <p className="text-xs text-slate-400 font-medium">Cuando una aseguradora se registre con sus documentos aparecerá aquí.</p>
                            </div>
                        )}
                        {pending.map((i: any) => (
                            <button key={i.id} onClick={() => { setSelected(i); setRejecting(false); setReason(''); setMsg(null); }}
                                className={`w-full text-left bg-white rounded-3xl border shadow-sm p-4 flex items-center gap-3 transition-all ${
                                    selected?.id === i.id ? 'border-alteha-turquoise ring-2 ring-alteha-turquoise/20' : 'border-slate-100 hover:border-slate-200'}`}>
                                {i.logo
                                    ? <img src={i.logo} alt="" className="w-12 h-12 rounded-2xl object-cover bg-slate-100" />
                                    : <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-alteha-turquoise/20 to-alteha-violet/20 flex items-center justify-center font-black text-alteha-violet">
                                        {(i.name || '?').slice(0, 1).toUpperCase()}
                                    </div>}
                                <div className="flex-1 min-w-0">
                                    <p className="font-black truncate">{i.name || i.email}</p>
                                    <p className="text-xs text-slate-400 font-semibold truncate">{i.email}</p>
                                </div>
                                {statusBadge(i.status)}
                            </button>
                        ))}
                    </aside>

                    {/* Expediente */}
                    <section className="flex-1 min-w-0 w-full">
                        {!selected ? (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center text-slate-400 font-semibold">
                                <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                Selecciona una aseguradora para revisar sus documentos y aprobarla.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Cabecera */}
                                <div className="bg-slate-900 text-white rounded-3xl p-6 flex items-center gap-4 flex-wrap">
                                    {selected.logo
                                        ? <img src={selected.logo} alt="" className="w-16 h-16 rounded-2xl object-cover bg-white/10" />
                                        : <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center"><Building2 className="w-7 h-7 text-alteha-turquoise" /></div>}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-black truncate">{selected.name || selected.email}</h2>
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-300 font-semibold mt-1">
                                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selected.email}</span>
                                            {selected.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selected.phone}</span>}
                                            {selected.license && <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />Licencia {selected.license}</span>}
                                            {selected.identification && <span className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5" />{selected.identification}</span>}
                                        </div>
                                    </div>
                                    {statusBadge(selected.status)}
                                </div>

                                {/* Datos + documentos */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
                                    <h3 className="font-black text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-alteha-violet" /> Documentos de la empresa</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                            <p className="font-black pt-1 truncate">{selected.legalName || '—'}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Razón social</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                            <p className="font-black pt-1">{selected.identification || '—'}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Identificación</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                            <p className="font-black pt-1">{selected.license || '—'}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Licencia de seguros</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                            <p className="font-black pt-1 flex items-center justify-center gap-1"><Clock className="w-4 h-4 text-slate-300" />{fmtDate(selected.createdAt).split(',')[0]}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Registrada</p>
                                        </div>
                                    </div>
                                    {selected.contactPerson && (
                                        <p className="text-sm font-semibold text-slate-500 flex items-center gap-2"><User className="w-4 h-4 text-slate-300" /> Persona de contacto: <span className="font-black text-slate-700">{selected.contactPerson}</span></p>
                                    )}
                                    {(selected.documents || []).length === 0 ? (
                                        <p className="text-sm font-semibold bg-amber-50 text-amber-600 rounded-2xl p-4">
                                            Esta aseguradora no adjuntó documentos en el registro. Solicítalos por correo antes de aprobarla, o apruébala si ya los validaste por otra vía.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(selected.documents || []).map((doc: any, i: number) => (
                                                <div key={i} className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <FileText className="w-3.5 h-3.5" /> {DOC_LABEL[doc.type] || doc.type} {doc.number ? `· ${doc.number}` : ''}
                                                    </p>
                                                    {String(doc.url || '').match(/\.(png|jpe?g|webp|gif)(\?|$)/i) ? (
                                                        <a href={doc.url} target="_blank" rel="noreferrer" className="block group relative">
                                                            <img src={doc.url} alt="" className="w-full h-56 object-contain bg-slate-50 rounded-2xl border border-slate-100" />
                                                            <span className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-4 h-4 text-slate-500" /></span>
                                                        </a>
                                                    ) : (
                                                        <a href={doc.url} target="_blank" rel="noreferrer"
                                                            className="flex items-center justify-center gap-2 h-56 bg-slate-50 rounded-2xl border border-slate-100 font-black text-alteha-violet hover:border-alteha-turquoise transition-colors">
                                                            <FileText className="w-6 h-6" /> Abrir documento <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Decisión */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                                    {!rejecting ? (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button onClick={() => review(true)} disabled={busy}
                                                className="flex-1 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-500 to-alteha-turquoise flex items-center justify-center gap-2 disabled:opacity-50">
                                                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} Aprobar aseguradora
                                            </button>
                                            <button onClick={() => setRejecting(true)} disabled={busy}
                                                className="flex-1 py-4 rounded-2xl font-black text-red-500 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2 disabled:opacity-50">
                                                <XCircle className="w-5 h-5" /> Rechazar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo del rechazo (se registra en el expediente)</label>
                                            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
                                                placeholder="Ej.: el RIF está vencido o no coincide con la razón social…"
                                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-semibold text-sm outline-none border-2 border-transparent focus:border-red-300" />
                                            <div className="flex gap-3">
                                                <button onClick={() => review(false)} disabled={busy || !reason.trim()}
                                                    className="px-6 py-3 rounded-2xl font-black text-white bg-red-500 flex items-center gap-2 disabled:opacity-40">
                                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirmar rechazo
                                                </button>
                                                <button onClick={() => { setRejecting(false); setReason(''); }} className="px-4 py-3 font-black text-sm text-slate-400">Cancelar</button>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5" />
                                        Al aprobar, la aseguradora queda ACTIVA y puede publicar subastas; al rechazar queda SUSPENDIDA y no puede publicar.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
