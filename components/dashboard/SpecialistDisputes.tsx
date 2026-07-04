"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle, Plus, X, Loader2, CheckCircle2, Clock, Scale,
    FileText, Upload, ExternalLink, ShieldCheck, Building2, HeartHandshake,
    DollarSign, Search, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createDispute, getMyDisputes, getMyInvitations, type AuctionDispute } from '@/lib/api';

// ─── Taxonomía de disputas de la plataforma ───────────────────────────────────
const DISPUTE_TYPES: { id: string; label: string }[] = [
    { id: 'GASTOS_ADICIONALES', label: 'Gastos adicionales no cubiertos' },
    { id: 'MONTO_INCORRECTO', label: 'Monto pagado/liquidado incorrecto' },
    { id: 'RETRASO_LIQUIDACION', label: 'Retraso en liquidación' },
    { id: 'FONDOS_NO_RECIBIDOS', label: 'Fondos no recibidos' },
    { id: 'PAGO_FUERA_DE_PLAZO', label: 'Pago del seguro fuera de plazo' },
    { id: 'PAGO_NO_VERIFICABLE', label: 'Pago reportado no verificable' },
    { id: 'INTERVENCION_NO_REALIZADA', label: 'Intervención no realizada' },
    { id: 'DISPUTA_DUPLA', label: 'Desacuerdo médico-clínica (dupla)' },
    { id: 'FACTURA_RECHAZADA', label: 'Rechazo de factura (formato)' },
    { id: 'OTRO', label: 'Otro' },
];
const typeLabel = (id: string) => DISPUTE_TYPES.find(t => t.id === id)?.label || id;

const RESPONDENTS = [
    { id: 'INSURANCE', label: 'Compañía de Seguros', icon: ShieldCheck },
    { id: 'ALTEHA', label: 'Alteha', icon: HeartHandshake },
    { id: 'CLINIC', label: 'Clínica', icon: Building2 },
];
const respondentLabel = (id: string) => RESPONDENTS.find(r => r.id === id)?.label || id;

const STATUS_BADGE: Record<string, { label: string; color: string; dot: string }> = {
    OPEN: { label: 'Abierta', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500 animate-pulse' },
    IN_PROGRESS: { label: 'En revisión', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
    ESCALATED: { label: 'Escalada', color: 'bg-red-50 text-red-600', dot: 'bg-red-500 animate-pulse' },
    RESOLVED: { label: 'Resuelta', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
    CLOSED: { label: 'Cerrada', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

// Estados de subasta sobre los que tiene sentido disputar (adjudicada en adelante)
const DISPUTABLE_STATUSES = ['AWARDED', 'PAYMENT_REPORTED', 'PAYMENT_VALIDATION', 'PAID', 'COMPLETED', 'PENDING_SETTLEMENT', 'SETTLED', 'CLOSED'];

export default function SpecialistDisputes() {
    const [disputes, setDisputes] = useState<AuctionDispute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [detail, setDetail] = useState<AuctionDispute | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [search, setSearch] = useState('');

    // ── Formulario nueva disputa ──
    const [myAuctions, setMyAuctions] = useState<any[]>([]);
    const [form, setForm] = useState({ auctionNumber: '', type: 'GASTOS_ADICIONALES', respondentRole: 'INSURANCE', amount: '', description: '' });
    const [evidence, setEvidence] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        getMyDisputes()
            .then(list => setDisputes(list))
            .catch(() => setDisputes([]))
            .finally(() => setIsLoading(false));
    }, []);

    // Subastas disputables del médico (para el select del formulario)
    useEffect(() => {
        if (!isCreating || myAuctions.length > 0) return;
        (async () => {
            try {
                const result: any = await getMyInvitations('DOCTOR', 0, 100);
                let list: any[] = [];
                if (result.code === '00' && result.data) list = result.data;
                else if (Array.isArray(result)) list = result;
                else if (result.content) list = result.content;
                setMyAuctions(list.filter(a => DISPUTABLE_STATUSES.includes(a.status)));
            } catch { /* select quedará vacío */ }
        })();
    }, [isCreating, myAuctions.length]);

    const submit = async () => {
        if (!form.auctionNumber) { setFormError('Selecciona la subasta relacionada.'); return; }
        if (!form.description.trim()) { setFormError('Describe qué ocurrió: es la base de tu reclamo.'); return; }
        setSubmitting(true);
        setFormError(null);
        try {
            const res = await createDispute(
                {
                    auctionNumber: form.auctionNumber,
                    type: form.type,
                    respondentRole: form.respondentRole,
                    description: form.description.trim(),
                    amount: form.amount ? Number(form.amount) : null,
                },
                evidence
            );
            if (res.code === '00' && res.data) {
                setDisputes(prev => [res.data as AuctionDispute, ...prev]);
                setIsCreating(false);
                setForm({ auctionNumber: '', type: 'GASTOS_ADICIONALES', respondentRole: 'INSURANCE', amount: '', description: '' });
                setEvidence(null);
            } else {
                setFormError(res.message || 'No se pudo crear la disputa.');
            }
        } catch {
            setFormError('Error de conexión con el servidor.');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return disputes;
        return disputes.filter(d =>
            (d.disputeNumber || '').toLowerCase().includes(q) ||
            (d.auctionNumber || '').toLowerCase().includes(q) ||
            typeLabel(d.type).toLowerCase().includes(q)
        );
    }, [disputes, search]);

    const counts = useMemo(() => ({
        open: disputes.filter(d => d.status === 'OPEN' || d.status === 'ESCALATED').length,
        inProgress: disputes.filter(d => d.status === 'IN_PROGRESS').length,
        resolved: disputes.filter(d => d.status === 'RESOLVED' || d.status === 'CLOSED').length,
    }), [disputes]);

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                        <Scale className="w-9 h-9 text-alteha-turquoise" /> Disputas
                    </h1>
                    <p className="text-slate-400 font-medium max-w-xl">
                        Reclama diferencias de pago, gastos no cubiertos o retrasos. Cada disputa queda anclada a su subasta y Alteha la arbitra.
                    </p>
                </div>
                <Button
                    onClick={() => { setIsCreating(true); setFormError(null); }}
                    className="bg-slate-900 text-white rounded-2xl px-8 h-14 font-black shadow-xl shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nueva Disputa
                </Button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                {[
                    { label: 'Abiertas', value: counts.open, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'En revisión', value: counts.inProgress, icon: Search, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Resueltas', value: counts.resolved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map(s => (
                    <div key={s.label} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}><s.icon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-slate-800">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Buscador */}
            {disputes.length > 0 && (
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por número, subasta o tipo..."
                        className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-alteha-turquoise/10 transition-all"
                    />
                </div>
            )}

            {/* Lista */}
            {isLoading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
                <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center space-y-3">
                    <Scale className="w-10 h-10 text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-bold text-sm">
                        {disputes.length === 0 ? 'No tienes disputas. Esperamos que siga así 🤝' : 'Ninguna disputa coincide con tu búsqueda.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map(d => {
                        const badge = STATUS_BADGE[d.status] || STATUS_BADGE.OPEN;
                        return (
                            <div
                                key={d.id}
                                onClick={() => setDetail(d)}
                                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:shadow-xl transition-all cursor-pointer group"
                            >
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${badge.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} /> {badge.label}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{d.disputeNumber}</span>
                                        {d.auctionNumber && (
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">· {d.auctionNumber}</span>
                                        )}
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800 leading-tight">{typeLabel(d.type)}</h4>
                                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 font-bold">
                                        <span>Contra: <span className="text-slate-600">{respondentLabel(d.respondentRole)}</span></span>
                                        {d.amount != null && (
                                            <span className="text-emerald-600 flex items-center gap-1"><DollarSign className="w-3 h-3" />{Number(d.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                                        )}
                                        <span>{new Date(d.createdAt).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-alteha-turquoise group-hover:translate-x-1 transition-all shrink-0 hidden lg:block" />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Detalle ── */}
            {detail && (
                <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm overflow-y-auto" onClick={() => setDetail(null)}>
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8 space-y-5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{detail.disputeNumber}</p>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{typeLabel(detail.type)}</h3>
                                </div>
                                <button onClick={() => setDetail(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(() => { const b = STATUS_BADGE[detail.status] || STATUS_BADGE.OPEN; return (
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${b.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} /> {b.label}
                                    </span>
                                ); })()}
                                <span className="px-3 py-1.5 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Contra: {respondentLabel(detail.respondentRole)}
                                </span>
                                {detail.amount != null && (
                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        ${Number(detail.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })} en disputa
                                    </span>
                                )}
                            </div>

                            {detail.auctionNumber && (
                                <div className="bg-slate-50 rounded-2xl px-5 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Subasta relacionada</p>
                                    <p className="text-sm font-bold text-slate-800">{detail.auctionNumber}</p>
                                    {detail.auctionTitle && <p className="text-xs text-slate-500 line-clamp-2">{detail.auctionTitle}</p>}
                                </div>
                            )}

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descripción del reclamo</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-2xl px-5 py-4">{detail.description || '—'}</p>
                            </div>

                            {detail.evidenceUrl && (
                                <a href={detail.evidenceUrl} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 rounded-2xl px-5 py-3 transition-colors group">
                                    <span className="flex items-center gap-2.5 text-sm font-bold text-slate-700 truncate">
                                        <FileText className="w-4 h-4 text-alteha-turquoise shrink-0" />
                                        <span className="truncate">{detail.evidenceName || 'Evidencia adjunta'}</span>
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                                </a>
                            )}

                            {detail.resolutionNotes && (
                                <div className={`rounded-2xl px-5 py-4 ${detail.status === 'RESOLVED' ? 'bg-emerald-50 border border-emerald-100' : 'bg-blue-50 border border-blue-100'}`}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Respuesta de Alteha</p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{detail.resolutionNotes}</p>
                                    {detail.resolvedAt && <p className="text-[10px] text-slate-400 mt-2">{new Date(detail.resolvedAt).toLocaleString('es-ES')}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Nueva disputa ── */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm overflow-y-auto" onClick={() => !submitting && setIsCreating(false)}>
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8 space-y-5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Scale className="w-6 h-6 text-alteha-turquoise" /> Nueva Disputa</h3>
                                <button onClick={() => !submitting && setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Subasta relacionada *</label>
                                <select
                                    value={form.auctionNumber}
                                    onChange={e => setForm(f => ({ ...f, auctionNumber: e.target.value }))}
                                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 outline-none"
                                >
                                    <option value="">Selecciona la subasta...</option>
                                    {myAuctions.map((a: any) => (
                                        <option key={a.id} value={a.auctionNumber}>
                                            {a.auctionNumber} — {(a.title || '').slice(0, 55)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tipo de disputa *</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 outline-none"
                                    >
                                        {DISPUTE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Reclamo contra *</label>
                                    <select
                                        value={form.respondentRole}
                                        onChange={e => setForm(f => ({ ...f, respondentRole: e.target.value }))}
                                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 outline-none"
                                    >
                                        {RESPONDENTS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Monto en disputa (opcional)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full h-12 pl-10 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">¿Qué ocurrió? *</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={4}
                                    placeholder="Describe los hechos con fechas y montos. Mientras más preciso, más rápido se resuelve..."
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Evidencia (opcional — PDF/imagen)</label>
                                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-alteha-turquoise transition-colors group">
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                           onChange={e => setEvidence(e.target.files?.[0] || null)} />
                                    {evidence ? (
                                        <span className="flex items-center justify-center gap-2 text-sm font-bold text-slate-800">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {evidence.name}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
                                            <Upload className="w-4 h-4" /> Adjuntar comprobante, factura o foto
                                        </span>
                                    )}
                                </div>
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <Button variant="outline" className="w-1/3 rounded-2xl border-slate-200 text-slate-600 font-bold" onClick={() => setIsCreating(false)} disabled={submitting}>
                                    Cancelar
                                </Button>
                                <Button onClick={submit} disabled={submitting} className="w-2/3 bg-slate-900 text-white rounded-2xl font-black py-3 disabled:opacity-50">
                                    {submitting
                                        ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</span>
                                        : <span className="flex items-center gap-2 justify-center"><Scale className="w-4 h-4" /> Presentar Disputa</span>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
