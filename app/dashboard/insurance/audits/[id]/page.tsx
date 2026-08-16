"use client";

// Expediente de una auditoría médica de Alteha. De un único análisis salen los
// dos entregables de la Fase 4 de la metodología: el informe ejecutivo (corto,
// para Junta) y el técnico-operativo (largo, el que va a la mesa con el
// prestador). Ambos se descargan desde aquí.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, FileText, ShieldAlert, ShieldCheck, Shield, ExternalLink,
    BadgeCheck, AlertTriangle, ListChecks, BrainCircuit, FileBarChart, FileSpreadsheet,
    Stethoscope, Coins, Handshake, RefreshCw, Plus, X, UploadCloud, Gavel,
} from 'lucide-react';
import { getStoredToken } from '@/lib/api';
import { informeEjecutivo, informeTecnico, CANALES, ESCALA_RECHAZO, confianza } from '@/lib/auditPdf';

const RISK: any = {
    BAJO: { label: 'RIESGO BAJO', color: '#10b981', soft: '#ecfdf5', Icon: ShieldCheck },
    MEDIO: { label: 'RIESGO MEDIO', color: '#f59e0b', soft: '#fffbeb', Icon: Shield },
    ALTO: { label: 'RIESGO ALTO', color: '#ef4444', soft: '#fef2f2', Icon: ShieldAlert },
};
const RESULTADO_EJE: any = {
    CONFORME: 'text-emerald-600 bg-emerald-50',
    OBSERVADO: 'text-amber-600 bg-amber-50',
    NO_SUSTENTADO: 'text-red-500 bg-red-50',
    NO_VERIFICABLE: 'text-slate-400 bg-slate-100',
};

// Mismos tipos que el alta del expediente: el motor los usa para saber qué lee.
const TIPOS_DOC = [
    { code: 'INFORME_MEDICO', label: 'Informe del médico tratante' },
    { code: 'FACTURA', label: 'Factura de la intervención' },
    { code: 'PRESUPUESTO', label: 'Presupuesto desglosado' },
    { code: 'INFORME_OPERATORIO', label: 'Informe operatorio' },
    { code: 'EVOLUCION', label: 'Evolución clínica' },
    { code: 'LABORATORIO', label: 'Estudios de laboratorio' },
    { code: 'IMAGEN', label: 'Estudios de imagen' },
    { code: 'ANATOMIA_PATOLOGICA', label: 'Anatomía patológica' },
    { code: 'REGISTRO_ENFERMERIA', label: 'Registro de enfermería' },
    { code: 'CARTA_AVAL', label: 'Carta aval emitida' },
    { code: 'CONVENIO', label: 'Convenio o baremo del prestador' },
    { code: 'POLIZA', label: 'Condicionado de la póliza' },
    { code: 'OTRO', label: 'Otro documento' },
];

function tipoSugerido(nombre: string) {
    const n = nombre.toLowerCase();
    if (/factura|invoice|recibo/.test(n)) return 'FACTURA';
    if (/presupuesto|cotiza/.test(n)) return 'PRESUPUESTO';
    if (/operatori|quirurgic|protocolo/.test(n)) return 'INFORME_OPERATORIO';
    if (/evoluc/.test(n)) return 'EVOLUCION';
    if (/lab|hematolog|quimica/.test(n)) return 'LABORATORIO';
    if (/rx|tomograf|resonan|eco|imagen|radiolog/.test(n)) return 'IMAGEN';
    if (/biopsia|patolog/.test(n)) return 'ANATOMIA_PATOLOGICA';
    if (/enfermer/.test(n)) return 'REGISTRO_ENFERMERIA';
    if (/aval/.test(n)) return 'CARTA_AVAL';
    if (/convenio|baremo|tarifa/.test(n)) return 'CONVENIO';
    if (/poliza|póliza|condicionado/.test(n)) return 'POLIZA';
    if (/informe|medico|médico/.test(n)) return 'INFORME_MEDICO';
    return 'OTRO';
}

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short' }) : '—');
const fmtCorta = (v?: string) => (v ? new Date(v).toLocaleDateString('es-VE', { dateStyle: 'medium' }) : '—');
const peso = (b?: number) => (b == null ? '—' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const money = (v?: number | null, cur = 'USD') =>
    v == null || isNaN(Number(v))
        ? '—'
        : `${cur === 'USD' ? '$' : ''}${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Card({ title, icon: Icon, children }: any) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-3 font-black flex items-center gap-2">
                <Icon className="w-5 h-5 text-alteha-violet" /> {title}
            </div>
            {children}
        </div>
    );
}

export default function AuditDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [audit, setAudit] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pdfBusy, setPdfBusy] = useState<string | null>(null);

    // Ampliación del expediente
    const [ampliando, setAmpliando] = useState(false);
    const [nuevos, setNuevos] = useState<{ file: File; tipo: string }[]>([]);
    const [subiendoDoc, setSubiendoDoc] = useState(false);
    const [errorDoc, setErrorDoc] = useState<string | null>(null);
    const inputDoc = useRef<HTMLInputElement>(null);

    const cargar = useCallback(() => {
        const token = getStoredToken();
        return fetch(`/api/insurance/audits/${id}`, { headers: { 'X-Alteha-Token': token || '' } })
            .then((r) => r.json())
            .then((r) => (r?.code === '00' ? setAudit(r.data) : setError(r?.message || 'No se pudo cargar la auditoría')))
            .catch(() => setError('No se pudo cargar la auditoría'));
    }, [id]);

    useEffect(() => { cargar(); }, [cargar]);

    const agregarNuevos = (files: FileList | null) => {
        if (!files) return;
        setNuevos((prev) => [...prev, ...Array.from(files).map((file) => ({ file, tipo: tipoSugerido(file.name) }))]);
    };

    /** Sube los documentos nuevos y dispara el recálculo del expediente completo. */
    const ampliarYRecalcular = async () => {
        if (!nuevos.length) return;
        setErrorDoc(null);
        setSubiendoDoc(true);
        try {
            const fd = new FormData();
            nuevos.forEach((a) => fd.append('documents', a.file));
            fd.append('docTypes', JSON.stringify(nuevos.map((a) => a.tipo)));
            const r = await fetch(`/api/insurance/audits/${id}/documents`, {
                method: 'POST',
                headers: { 'X-Alteha-Token': getStoredToken() || '' },
                body: fd,
            }).then((x) => x.json());
            if (r?.code !== '00') throw new Error(r?.message || 'No se pudo ampliar el expediente');
            setAmpliando(false);
            setNuevos([]);
            await cargar();
        } catch (e: any) {
            setErrorDoc(e?.message || 'No se pudo ampliar el expediente');
        } finally {
            setSubiendoDoc(false);
        }
    };

    // Mientras el motor trabaja, el expediente se refresca solo.
    useEffect(() => {
        if (audit?.status !== 'PROCESANDO') return;
        const t = setInterval(cargar, 5000);
        return () => clearInterval(t);
    }, [audit?.status, cargar]);

    if (error) return <p className="text-red-500 font-bold p-10">{error}</p>;
    if (!audit) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin" /></div>;

    // ── En proceso ──
    if (audit.status === 'PROCESANDO') {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-alteha-turquoise/15 to-alteha-violet/15 flex items-center justify-center mx-auto">
                    <Loader2 className="w-9 h-9 text-alteha-violet animate-spin" />
                </div>
                <h1 className="text-2xl font-black">
                    {(audit.version ?? 1) > 1 ? 'Alteha está recalculando el expediente' : 'Alteha está auditando el expediente'}
                </h1>
                <p className="text-sm font-semibold text-slate-400 max-w-md mx-auto">
                    {(audit.version ?? 1) > 1
                        ? `Se rehace el análisis completo con el expediente ampliado (versión ${audit.version}). Los dictámenes ya emitidos pueden cambiar si los documentos nuevos los sustentan.`
                        : 'Se están recorriendo las cinco fases de la metodología: pertinencia médica, codificación CPT, barematación, consolidación del pliego y vulnerabilidades del canal.'}
                    {' '}Suele tardar entre 1 y 3 minutos.
                </p>
                <p className="text-xs font-bold text-slate-400">{audit.auditNumber}</p>
                <button onClick={() => router.push('/dashboard/insurance/audits')}
                    className="px-6 py-3 rounded-2xl bg-white border border-slate-100 font-black text-sm text-slate-500">
                    Volver al historial — te avisamos aquí cuando esté listo
                </button>
            </div>
        );
    }

    // ── Falló ──
    if (audit.status === 'ERROR') {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-9 h-9 text-red-400" />
                </div>
                <h1 className="text-2xl font-black">El informe no pudo generarse</h1>
                <p className="text-sm font-semibold text-slate-500 bg-red-50 rounded-2xl p-4 max-w-lg mx-auto">{audit.statusMessage}</p>
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => router.push('/dashboard/insurance/audits')}
                        className="px-6 py-3 rounded-2xl bg-white border border-slate-100 font-black text-sm text-slate-500">Volver al historial</button>
                    <button onClick={cargar} className="px-6 py-3 rounded-2xl bg-alteha-gray text-white font-black text-sm flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Actualizar
                    </button>
                </div>
            </div>
        );
    }

    let r: any = {};
    try { r = audit.resultJson ? JSON.parse(audit.resultJson) : {}; } catch { r = {}; }

    const cur = audit.currency || 'USD';
    const risk = RISK[audit.riskLevel] || RISK.MEDIO;
    const exp = r.expediente || {};
    const f1 = r.fase1 || {};
    const f2 = r.fase2 || {};
    const f3 = r.fase3 || {};
    const f4 = r.fase4 || {};
    const f5 = r.fase5 || {};
    const items: any[] = Array.isArray(f2.items) ? f2.items : [];
    const lineas: any[] = Array.isArray(f4.lineasRechazo) ? f4.lineasRechazo : [];
    const documentos: any[] = Array.isArray(audit.documents) ? audit.documents : [];

    const descargar = async (tipo: 'corto' | 'largo') => {
        setPdfBusy(tipo);
        try {
            if (tipo === 'corto') await informeEjecutivo(audit, r);
            else await informeTecnico(audit, r);
        } finally {
            setPdfBusy(null);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            <header className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/dashboard/insurance/audits')} className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-alteha-turquoise">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-alteha-violet" /> {audit.auditNumber}
                        </h1>
                        <p className="text-xs text-slate-400 font-semibold">
                            {fmtDate(audit.createdAt)}
                            {audit.aiProvider ? ` · analizado con ${audit.aiProvider}${audit.aiModel ? ` (${audit.aiModel})` : ''}` : ''}
                            {(audit.version ?? 1) > 1 && (
                                <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-alteha-turquoise/10 text-alteha-turquoise uppercase tracking-wider">
                                    Versión {audit.version} · recalculada {fmtCorta(audit.recalculatedAt)}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </header>

            {/* ══ Los dos entregables ══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => descargar('corto')} disabled={!!pdfBusy}
                    className="text-left bg-white rounded-3xl border-2 border-slate-100 hover:border-alteha-turquoise p-6 transition-all disabled:opacity-60 group">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-alteha-turquoise/10 flex items-center justify-center shrink-0">
                            {pdfBusy === 'corto' ? <Loader2 className="w-6 h-6 text-alteha-turquoise animate-spin" /> : <FileBarChart className="w-6 h-6 text-alteha-turquoise" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregable I</p>
                            <p className="font-black text-lg group-hover:text-alteha-turquoise transition-colors">Generar informe corto</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">
                                Ejecutivo, para Presidencia y Junta: tablero de impacto, hallazgo central y decisiones a aprobar.
                            </p>
                        </div>
                    </div>
                </button>

                <button onClick={() => descargar('largo')} disabled={!!pdfBusy}
                    className="text-left bg-white rounded-3xl border-2 border-slate-100 hover:border-alteha-violet p-6 transition-all disabled:opacity-60 group">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-alteha-violet/10 flex items-center justify-center shrink-0">
                            {pdfBusy === 'largo' ? <Loader2 className="w-6 h-6 text-alteha-violet animate-spin" /> : <FileSpreadsheet className="w-6 h-6 text-alteha-violet" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregable II</p>
                            <p className="font-black text-lg group-hover:text-alteha-violet transition-colors">Generar informe largo</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">
                                Técnico-operativo, para Auditoría y Redes: las cinco fases y el pliego de rechazos línea por línea.
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* ══ Cabecera del expediente ══ */}
            <div className="bg-alteha-gray text-white rounded-3xl p-6 flex items-center gap-5 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Intervención auditada{f5.canal ? ` · ${CANALES[f5.canal] || f5.canal}` : ''}
                    </p>
                    <h2 className="text-xl font-black mt-1">{exp.procedimientoResumen || audit.procedureSummary || '—'}</h2>
                    <p className="text-sm text-slate-300 font-semibold mt-1">
                        {exp.paciente || audit.patientName || 'Paciente s/d'} · {exp.prestador || 'Prestador s/d'}
                        {exp.categoriaPrestador ? ` (categoría ${exp.categoriaPrestador})` : ''}
                        {exp.fechaEvento ? ` · ${exp.fechaEvento}` : ''}
                    </p>
                </div>
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background: risk.soft }}>
                    <risk.Icon className="w-7 h-7 mx-auto" style={{ color: risk.color }} />
                    <p className="font-black text-sm mt-1" style={{ color: risk.color }}>{risk.label}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total facturado</p>
                    <p className="text-2xl font-black text-alteha-turquoise">{money(f3.totalFacturado ?? audit.totalInvoiced, cur)}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">
                        Procedente {money(f3.totalProcedente, cur)} · <span className="text-red-300">objetado {money(f3.totalRechazado, cur)}</span>
                    </p>
                </div>
            </div>

            {f4.hallazgoCentral && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 border-l-4 border-l-alteha-violet">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hallazgo central</p>
                    <p className="text-base font-black text-slate-700 mt-1">{f4.hallazgoCentral}</p>
                </div>
            )}

            {r.riskJustification && (
                <p className="text-sm font-semibold text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">{r.riskJustification}</p>
            )}

            {/* ══ Fase 1 ══ */}
            <Card title="Fase 1 · Pertinencia médica" icon={Stethoscope}>
                <div className="px-6 pb-5 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1.5 rounded-xl bg-alteha-violet/10 text-alteha-violet font-black text-sm">{f1.nivel || '—'}</span>
                        <p className="font-black text-sm">{f1.calificacion || '—'}</p>
                        <p className="text-xs font-semibold text-slate-400">{f1.efectoSobreAval}</p>
                    </div>
                    {(f1.ejes || []).map((e: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4">
                            <span className={`text-[9px] font-black rounded-full px-2.5 py-1 mt-0.5 shrink-0 ${RESULTADO_EJE[e.resultado] || RESULTADO_EJE.NO_VERIFICABLE}`}>
                                {(e.resultado || '').replace(/_/g, ' ')}
                            </span>
                            <div className="min-w-0">
                                <p className="font-black text-sm">{e.eje}</p>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">{e.evidencia}</p>
                                {e.comentario && <p className="text-xs text-slate-400 font-medium mt-1">{e.comentario}</p>}
                            </div>
                        </div>
                    ))}
                    {f1.fuenteAplicada && (
                        <p className="text-[11px] font-bold text-slate-400">
                            Fuente aplicada: {f1.fuenteAplicada}{f1.nivelJerarquico ? ` · nivel jerárquico ${f1.nivelJerarquico}` : ''}
                        </p>
                    )}
                </div>
            </Card>

            {/* ══ Fase 2 ══ */}
            <Card title="Fase 2 · Auditoría de codificación (CPT)" icon={ListChecks}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-slate-50">
                            {['CPT', 'Renglón facturado', 'Cant.', 'Facturado', 'Procedente', 'Rechazado', 'Tipología'].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {items.map((it, i) => (
                                <tr key={i} className="border-t border-slate-50 align-top">
                                    <td className="px-5 py-3 font-black text-alteha-violet whitespace-nowrap">
                                        {it.cpt || 'N/A'}
                                        {it.cptPropuesto && it.cptPropuesto !== it.cpt && (
                                            <span className="block text-[10px] text-emerald-600">→ {it.cptPropuesto}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 font-semibold">
                                        {it.invoicedDescription || it.descripcion}
                                        {it.senalDeteccion && <p className="text-[11px] text-slate-400 mt-0.5">{it.senalDeteccion}</p>}
                                    </td>
                                    <td className="px-5 py-3 font-bold tabular-nums">{it.quantity ?? 1}</td>
                                    <td className="px-5 py-3 font-black tabular-nums whitespace-nowrap">{money(it.invoicedAmount, cur)}</td>
                                    <td className="px-5 py-3 font-bold tabular-nums text-emerald-600 whitespace-nowrap">{money(it.montoProcedente, cur)}</td>
                                    <td className="px-5 py-3 font-black tabular-nums text-red-500 whitespace-nowrap">{money(it.montoRechazado, cur)}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
                                            it.tipologia === 'CONFORME' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                            {(it.tipologia || 'CONFORME').replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!items.length && <tr><td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">Sin renglones identificados.</td></tr>}
                        </tbody>
                    </table>
                </div>
                {!!(f2.equipoQuirurgico || []).length && (
                    <div className="px-6 py-5 border-t border-slate-50 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Composición del equipo quirúrgico</p>
                        {f2.equipoQuirurgico.map((e: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <span className={`text-[9px] font-black rounded-full px-2 py-0.5 ${e.procede ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                    {e.procede ? 'PROCEDE' : 'RECHAZA'}
                                </span>
                                <span className="font-black">{e.rol}</span>
                                <span className="text-slate-400 font-semibold">{e.profesional || 'sin identificar'}</span>
                                {e.porcentajeReferencia != null && <span className="text-slate-400 font-bold">{e.porcentajeReferencia}%</span>}
                                <span className="font-black tabular-nums ml-auto">{money(e.montoFacturado, cur)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* ══ Fase 3 ══ */}
            <Card title="Fase 3 · Barematación e indicadores" icon={Coins}>
                <div className="px-6 pb-5 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {(f3.bloques || []).map((b: any, i: number) => (
                            <div key={i} className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.bloque}</p>
                                <p className="font-black tabular-nums mt-1">{money(b.montoFacturado, cur)}</p>
                                <p className="text-[11px] font-bold text-emerald-600 tabular-nums">proc. {money(b.montoProcedente, cur)}</p>
                                <span className="inline-block mt-1.5 text-[9px] font-black px-2 py-0.5 rounded-full bg-alteha-violet/10 text-alteha-violet">
                                    ancla {b.anclaAplicada}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(f3.indicadores || []).map((ind: any, i: number) => (
                            <div key={i} className={`rounded-2xl px-4 py-3 ${
                                ind.estado === 'ALERTA' ? 'bg-red-50' : ind.estado === 'CONFORME' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ind.indice} · {ind.umbral}</p>
                                <p className={`font-black tabular-nums ${
                                    ind.estado === 'ALERTA' ? 'text-red-500' : ind.estado === 'CONFORME' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {ind.valor != null ? Number(ind.valor).toLocaleString('es-VE', { maximumFractionDigits: 2 }) : 'n/d'}
                                </p>
                                <p className="text-[10px] font-semibold text-slate-400 max-w-[210px]">{ind.lectura}</p>
                            </div>
                        ))}
                    </div>
                    {f3.benchmarking?.comentario && (
                        <p className="text-xs font-semibold text-slate-500 bg-slate-50 rounded-2xl p-4">
                            <span className="font-black text-alteha-violet">Benchmarking {f3.benchmarking.nivel}</span> — {f3.benchmarking.comentario}
                        </p>
                    )}
                </div>
            </Card>

            {/* ══ Fase 4 · Pliego ══ */}
            <Card title="Fase 4 · Pliego de rechazos" icon={AlertTriangle}>
                {!lineas.length ? (
                    <p className="mx-6 mb-6 text-sm text-emerald-600 font-bold bg-emerald-50 rounded-2xl p-4 flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5" /> Sin líneas objetables: la cuenta es consistente con el expediente y con el anclaje tarifario aplicado.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50">
                                {['Clase', 'Línea facturada', 'Código', 'Ancla', 'Facturado', 'Procedente', 'Rechazado', 'Fundamento'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {lineas.map((l, i) => (
                                    <tr key={i} className="border-t border-slate-50 align-top">
                                        <td className="px-5 py-3">
                                            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-red-50 text-red-500 whitespace-nowrap">{l.escalaRechazo}</span>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">{ESCALA_RECHAZO[l.escalaRechazo] || ''}</p>
                                        </td>
                                        <td className="px-5 py-3 font-semibold max-w-[240px]">
                                            {l.lineaFacturada}
                                            <p className="text-[11px] text-slate-400 mt-0.5">{(l.tipologia || '').replace(/_/g, ' ')}</p>
                                        </td>
                                        <td className="px-5 py-3 font-bold whitespace-nowrap">
                                            {l.codigoFacturado}
                                            {l.codigoPropuesto && <span className="block text-[11px] text-emerald-600">→ {l.codigoPropuesto}</span>}
                                        </td>
                                        <td className="px-5 py-3 font-black text-alteha-violet">{l.anclaAplicada}</td>
                                        <td className="px-5 py-3 font-bold tabular-nums whitespace-nowrap">{money(l.montoFacturado, cur)}</td>
                                        <td className="px-5 py-3 font-bold tabular-nums text-emerald-600 whitespace-nowrap">{money(l.montoProcedente, cur)}</td>
                                        <td className="px-5 py-3 font-black tabular-nums text-red-500 whitespace-nowrap">{money(l.montoRechazado, cur)}</td>
                                        <td className="px-5 py-3 text-xs font-semibold text-slate-500 max-w-[280px]">
                                            {l.fundamento}
                                            {l.documentoRequerido && <p className="text-[11px] text-amber-600 font-bold mt-1">Requiere: {l.documentoRequerido}</p>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* ══ Fase 5 ══ */}
            {!!(f5.tipologiasDetectadas || []).length && (
                <Card title={`Fase 5 · Vulnerabilidades del canal — ${CANALES[f5.canal] || f5.canal || ''}`} icon={ShieldAlert}>
                    <div className="px-6 pb-5 space-y-2">
                        {f5.tipologiasDetectadas.map((t: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4">
                                <span className={`text-[9px] font-black text-white rounded-full px-2.5 py-1 mt-0.5 shrink-0 ${
                                    t.riesgo === 'ALTA' ? 'bg-red-500' : t.riesgo === 'MEDIA' ? 'bg-amber-500' : 'bg-slate-400'}`}>{t.riesgo}</span>
                                <div>
                                    <p className="font-black text-sm">{t.tipologia}</p>
                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.comoOpera}</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1">Señal: {t.senalDeteccion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* ══ Mesa de negociación ══ */}
            {r.hojaNegociacion?.aperturaSugerida && (
                <Card title="Hoja de ruta de la mesa" icon={Handshake}>
                    <div className="px-6 pb-5 space-y-3">
                        <p className="text-sm font-semibold text-slate-600 bg-slate-50 rounded-2xl p-4">{r.hojaNegociacion.aperturaSugerida}</p>
                        {[
                            { t: 'Bloques de discusión', l: r.hojaNegociacion.bloquesDiscusion },
                            { t: 'Ceder primero (ancla A-5)', l: r.hojaNegociacion.cederPrimero },
                            { t: 'Compromisos a incorporar en el acta', l: r.hojaNegociacion.compromisosSugeridos },
                        ].filter((s) => (s.l || []).length).map((s) => (
                            <div key={s.t}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{s.t}</p>
                                <ul className="space-y-1.5">
                                    {s.l.map((x: string, i: number) => (
                                        <li key={i} className="text-sm font-semibold text-slate-600 flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-alteha-violet mt-1.5 shrink-0" /> {x}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* ══ Conclusión ══ */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="border-l-4 border-alteha-turquoise pl-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conclusión ejecutiva</p>
                    <p className="text-sm font-semibold text-slate-600 mt-1">{r.conclusionEjecutiva || '—'}</p>
                </div>
                {!!(r.recomendaciones || []).length && (
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recomendaciones</p>
                        <ul className="space-y-1.5">
                            {r.recomendaciones.map((x: any, i: number) => (
                                <li key={i} className="text-sm font-semibold text-slate-600 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-alteha-violet mt-1.5 shrink-0" />
                                    <span>{x.accion}{x.montoAsociado != null ? ` · ${money(x.montoAsociado, cur)}` : ''}{x.plazo ? ` · ${x.plazo}` : ''}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {!!(r.requerimientosPrevios || []).length && (
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requerimientos previos</p>
                        <ul className="space-y-1.5">
                            {r.requerimientosPrevios.map((x: string, i: number) => (
                                <li key={i} className="text-sm font-semibold text-amber-600 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" /> {x}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <p className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3">
                    Las tipologías descritas son indicadores de irregularidad que exigen confirmación documental y no equivalen a una determinación
                    de conducta sancionable. Los precios de referencia son estimaciones de mercado y no constituyen tarifas oficiales.
                    Confiabilidad documental estimada: {confianza(r.confidence) != null ? `${confianza(r.confidence)}%` : 'n/d'}.
                </p>
            </div>

            {/* ══ Documentos del expediente ══ */}
            <Card title="Documentos del expediente" icon={FileText}>
                <div className="px-6 pb-2 flex items-center justify-between flex-wrap gap-2 -mt-1">
                    <p className="text-xs font-semibold text-slate-400">
                        Cada archivo tal como se cargó, con su enlace para control.
                    </p>
                    <button onClick={() => { setAmpliando(true); setErrorDoc(null); }}
                        className="px-4 py-2.5 rounded-xl font-black text-xs text-white bg-alteha-gray flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Agregar documento y recalcular
                    </button>
                </div>
                {!documentos.length ? (
                    <p className="px-6 pb-6 text-sm font-semibold text-slate-400">Este expediente no tiene documentos archivados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50">
                                {['Tipo', 'Archivo', 'Tamaño', 'Incorporado', 'Versión', ''].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {documentos.map((d) => (
                                    <tr key={d.id} className="border-t border-slate-50">
                                        <td className="px-5 py-3 font-black text-alteha-violet whitespace-nowrap">{(d.docType || 'OTRO').replace(/_/g, ' ')}</td>
                                        <td className="px-5 py-3 font-semibold max-w-[280px] truncate" title={d.fileName}>{d.fileName}</td>
                                        <td className="px-5 py-3 font-bold tabular-nums text-slate-500 whitespace-nowrap">{peso(d.sizeBytes)}</td>
                                        <td className="px-5 py-3 font-semibold text-slate-400 whitespace-nowrap">{fmtCorta(d.createdAt)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                                (d.addedInVersion ?? 1) > 1 ? 'bg-alteha-turquoise/10 text-alteha-turquoise' : 'bg-slate-100 text-slate-400'}`}>
                                                v{d.addedInVersion ?? 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {d.fileUrl ? (
                                                <a href={d.fileUrl} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 font-black text-[11px] text-slate-500 hover:bg-slate-100 whitespace-nowrap">
                                                    Abrir <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-[11px] font-bold text-amber-600">Sin archivar</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* ══ Llamado a subastar ══ */}
            <div className="bg-alteha-gray text-white rounded-3xl p-7 flex items-center gap-6 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise">El siguiente paso</p>
                    <h2 className="text-xl font-black mt-1">¿Subastar esta intervención con Alteha?</h2>
                    <p className="text-sm text-slate-300 font-semibold mt-1.5 max-w-2xl">
                        Ya sabes lo que la red te cobraría por este caso. Publícalo y deja que los médicos de la
                        especialidad compitan por él: la auditoría te dice qué es un precio razonable, la subasta te lo consigue.
                    </p>
                </div>
                <button onClick={() => router.push(`/dashboard/insurance/auctions/new?fromAudit=${audit.id}`)}
                    className="px-7 py-4 rounded-2xl font-black bg-alteha-gradient text-white flex items-center gap-2 shadow-lg shadow-alteha-violet/30 shrink-0">
                    <Gavel className="w-5 h-5" /> Subastar con Alteha
                </button>
            </div>

            {/* ══ Modal: ampliar el expediente ══ */}
            {ampliando && (
                <div className="fixed inset-0 z-50 bg-alteha-gray/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 space-y-5 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-alteha-turquoise" /> Ampliar el expediente
                                </h2>
                                <p className="text-xs text-slate-400 font-semibold mt-1 max-w-sm">
                                    Al agregar documentos se vuelve a auditar el expediente <b>completo</b>, no solo lo nuevo:
                                    un soporte que llega después puede cambiar un dictamen ya emitido.
                                </p>
                            </div>
                            {!subiendoDoc && (
                                <button onClick={() => setAmpliando(false)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-300">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <input ref={inputDoc} type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden"
                            onChange={(e) => { agregarNuevos(e.target.files); e.target.value = ''; }} />
                        <button type="button" onClick={() => inputDoc.current?.click()}
                            className="w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-alteha-turquoise/60 p-5 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center"><UploadCloud className="w-5 h-5" /></div>
                            <div className="text-left">
                                <p className="font-black text-sm">Seleccionar archivos</p>
                                <p className="text-[11px] text-slate-400 font-semibold">
                                    PDF o imagen · quedan {Math.max(0, 12 - documentos.length)} espacios en este expediente
                                </p>
                            </div>
                        </button>

                        {nuevos.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-2xl p-3">
                                <FileText className="w-4 h-4 text-alteha-violet shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate">{a.file.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{(a.file.size / 1024 / 1024).toFixed(1)} MB</p>
                                </div>
                                <select value={a.tipo}
                                    onChange={(e) => setNuevos((p) => p.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)))}
                                    className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none max-w-[190px]">
                                    {TIPOS_DOC.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                                </select>
                                <button onClick={() => setNuevos((p) => p.filter((_, j) => j !== i))}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {errorDoc && <p className="text-sm font-bold text-red-500 bg-red-50 rounded-2xl p-3">{errorDoc}</p>}

                        <button onClick={ampliarYRecalcular} disabled={!nuevos.length || subiendoDoc}
                            className="w-full py-4 rounded-2xl font-black text-white bg-alteha-gradient disabled:opacity-40 flex items-center justify-center gap-2">
                            {subiendoDoc ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                            {subiendoDoc ? 'Recalculando…' : 'Agregar y recalcular la auditoría'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
