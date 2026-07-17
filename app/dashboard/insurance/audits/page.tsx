"use client";

// Auditoría Médica IA: el seguro sube el informe médico + la factura de una
// intervención y Alteha entrega una evaluación auditable (CPT, precios de
// referencia de mercado, hallazgos y nivel de riesgo) con folio propio.
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    BrainCircuit, FileText, Receipt, Loader2, Plus, X, ShieldAlert, ShieldCheck,
    Shield, ChevronRight, Sparkles, UploadCloud, Info,
} from 'lucide-react';
import { getStoredToken } from '@/lib/api';

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('es-VE', { dateStyle: 'medium' }) : '—');
const fmtMoney = (v?: number | null, cur = 'USD') =>
    v == null ? '—' : `${cur === 'USD' ? '$' : ''}${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RISK: any = {
    BAJO: { label: 'Riesgo bajo', cls: 'bg-emerald-50 text-emerald-600', Icon: ShieldCheck },
    MEDIO: { label: 'Riesgo medio', cls: 'bg-amber-50 text-amber-600', Icon: Shield },
    ALTO: { label: 'Riesgo alto', cls: 'bg-red-50 text-red-500', Icon: ShieldAlert },
};

async function api(path: string, opts: RequestInit = {}) {
    const token = getStoredToken();
    const res = await fetch(`/api/insurance/audits${path}`, {
        ...opts,
        headers: { 'X-Alteha-Token': token || '', ...(opts.headers || {}) },
    });
    return res.json().catch(() => ({}));
}

const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1] || '');
        r.onerror = reject;
        r.readAsDataURL(file);
    });

function FilePick({ label, icon: Icon, file, onFile }: { label: string; icon: any; file: File | null; onFile: (f: File | null) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <input ref={ref} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] || null)} />
            <button type="button" onClick={() => ref.current?.click()}
                className={`w-full rounded-2xl border-2 border-dashed p-5 text-left transition-all flex items-center gap-3 ${
                    file ? 'border-alteha-turquoise bg-alteha-turquoise/5' : 'border-slate-200 hover:border-alteha-turquoise/50'}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${file ? 'bg-alteha-turquoise text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {file ? <Icon className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{file ? file.name : 'Selecciona el archivo'}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'PDF o imagen (PNG/JPG)'}</p>
                </div>
                {file && (
                    <span onClick={(e) => { e.stopPropagation(); onFile(null); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400">
                        <X className="w-4 h-4" />
                    </span>
                )}
            </button>
        </div>
    );
}

export default function AuditsPage() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [report, setReport] = useState<File | null>(null);
    const [invoice, setInvoice] = useState<File | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        api('').then((r) => setItems(Array.isArray(r?.data) ? r.data : [])).finally(() => setLoading(false));
    };
    useEffect(load, []);

    const run = async () => {
        if (!report || !invoice) return;
        setError(null);
        try {
            // 1) Análisis con IA (Gemini lee ambos documentos)
            setBusy('Analizando informe y factura con IA… esto puede tardar 1-2 minutos');
            const [reportBase64, invoiceBase64] = await Promise.all([toBase64(report), toBase64(invoice)]);
            const res = await fetch('/api/insurance/audit-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportBase64, reportMime: report.type || 'application/pdf',
                    invoiceBase64, invoiceMime: invoice.type || 'application/pdf',
                }),
            });
            const analyzed = await res.json().catch(() => ({}));
            if (!res.ok || !analyzed?.result) throw new Error(analyzed?.error || 'El análisis no produjo resultados');
            const result = analyzed.result;

            // 2) Guardar expediente auditable en Alteha (documentos + resultado)
            setBusy('Guardando el expediente de auditoría…');
            const fd = new FormData();
            fd.append('report', report);
            fd.append('invoice', invoice);
            fd.append('data', JSON.stringify({
                patientName: result.patientName || null,
                procedureSummary: result.procedureSummary || null,
                riskLevel: result.riskLevel || null,
                currency: result.currency || 'USD',
                totalInvoiced: result.totalInvoiced ?? null,
                totalReference: result.totalReferenceHigh ?? null,
                result,
            }));
            const saved = await api('', { method: 'POST', body: fd });
            if (saved?.code !== '00' || !saved?.data?.id) throw new Error(saved?.message || 'No se pudo guardar la auditoría');

            setBusy(null); setCreating(false); setReport(null); setInvoice(null);
            router.push(`/dashboard/insurance/audits/${saved.data.id}`);
        } catch (e: any) {
            setBusy(null);
            setError(e?.message || 'No se pudo completar la auditoría. Intenta de nuevo.');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-alteha-violet" /> Auditoría Médica IA
                    </h1>
                    <p className="text-slate-400 font-medium mt-1 max-w-2xl">
                        Sube el informe médico y la factura de una intervención: Alteha genera una evaluación auditable
                        con códigos CPT, precios de referencia del mercado y hallazgos.
                    </p>
                </div>
                <button onClick={() => { setCreating(true); setError(null); }}
                    className="px-5 py-3 rounded-2xl font-black text-white bg-alteha-gradient flex items-center gap-2 shadow-lg shadow-alteha-violet/20">
                    <Plus className="w-4 h-4" /> Nueva auditoría
                </button>
            </header>

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin" /></div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-14 text-center space-y-3">
                    <Sparkles className="w-10 h-10 text-alteha-violet/40 mx-auto" />
                    <p className="font-black text-lg">Aún no has realizado auditorías</p>
                    <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
                        Con una auditoría IA sabrás en minutos si lo facturado corresponde a lo realizado y a los precios del mercado.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((a) => {
                        const r = RISK[a.riskLevel] || RISK.MEDIO;
                        return (
                            <motion.button key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                onClick={() => router.push(`/dashboard/insurance/audits/${a.id}`)}
                                className="w-full text-left bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-alteha-turquoise/50 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-alteha-turquoise/15 to-alteha-violet/15 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-alteha-violet" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black truncate">{a.procedureSummary || 'Intervención médica'}</p>
                                    <p className="text-xs text-slate-400 font-semibold truncate">
                                        {a.auditNumber} · {a.patientName || 'Paciente s/d'} · {fmtDate(a.createdAt)}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                    <p className="font-black tabular-nums">{fmtMoney(a.totalInvoiced, a.currency)}</p>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${r.cls}`}>
                                        <r.Icon className="w-3 h-3" /> {r.label}
                                    </span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {/* Modal nueva auditoría */}
            {creating && (
                <div className="fixed inset-0 z-50 bg-alteha-gray/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-alteha-violet" /> Nueva auditoría IA</h2>
                                <p className="text-xs text-slate-400 font-semibold mt-1">Ambos documentos de la misma intervención.</p>
                            </div>
                            {!busy && (
                                <button onClick={() => setCreating(false)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-300"><X className="w-5 h-5" /></button>
                            )}
                        </div>

                        <FilePick label="1 · Informe médico" icon={FileText} file={report} onFile={setReport} />
                        <FilePick label="2 · Factura de la intervención" icon={Receipt} file={invoice} onFile={setInvoice} />

                        {error && <p className="text-sm font-bold text-red-500 bg-red-50 rounded-2xl p-3">{error}</p>}

                        {busy ? (
                            <div className="rounded-2xl bg-slate-50 p-5 text-center space-y-3">
                                <Loader2 className="w-7 h-7 text-alteha-violet animate-spin mx-auto" />
                                <p className="text-sm font-black text-slate-600">{busy}</p>
                                <p className="text-[11px] text-slate-400 font-semibold">No cierres esta ventana.</p>
                            </div>
                        ) : (
                            <button onClick={run} disabled={!report || !invoice}
                                className="w-full py-4 rounded-2xl font-black text-white bg-alteha-gradient disabled:opacity-40 flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5" /> Auditar con IA
                            </button>
                        )}

                        <p className="text-[10px] text-slate-400 font-semibold flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Los precios de referencia son estimaciones de mercado generadas por IA y no constituyen tarifas oficiales.
                            La evaluación es un apoyo a la decisión del auditor humano.
                        </p>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
