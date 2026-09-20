"use client";

// Informes de Auditoría Médica de Alteha: el seguro adjunta todo lo que tenga
// del caso (informe médico, factura, presupuesto, informe operatorio, estudios,
// registro de enfermería…), el motor lo analiza bajo la metodología azALTEHA y
// el expediente queda en el historial con su folio, del que salen los dos
// entregables: informe ejecutivo e informe técnico-operativo.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    BrainCircuit, FileText, Loader2, Plus, X, ShieldAlert, ShieldCheck, Shield,
    ChevronRight, Sparkles, UploadCloud, Info, Search, Trash2, AlertTriangle, Clock,
    Calendar, ArrowUpDown, RotateCcw, HardDriveDownload,
} from 'lucide-react';
import { getStoredToken } from '@/lib/api';
import { importarDeDrive, driveConfigurado } from '@/lib/googleDrivePicker';
import AuditContextDocs from '@/components/AuditContextDocs';

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('es-VE', { dateStyle: 'medium' }) : '—');
const fmtMoney = (v?: number | null, cur = 'USD') =>
    v == null ? '—' : `${cur === 'USD' ? '$' : ''}${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RISK: any = {
    BAJO: { label: 'Riesgo bajo', cls: 'bg-emerald-50 text-emerald-600', Icon: ShieldCheck },
    MEDIO: { label: 'Riesgo medio', cls: 'bg-amber-50 text-amber-600', Icon: Shield },
    ALTO: { label: 'Riesgo alto', cls: 'bg-red-50 text-red-500', Icon: ShieldAlert },
};

// Tipos del expediente mínimo auditable de la metodología (Fase 1).
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

const CANALES = [
    { code: 'AVAL', label: 'Carta aval (programado)' },
    { code: 'EMERGENCIA', label: 'Emergencia médica' },
    { code: 'REEMBOLSO', label: 'Reembolso' },
    { code: 'APS', label: 'Atención primaria' },
    { code: 'CONTINUO', label: 'Tratamiento continuo' },
];

// Adivina el tipo por el nombre del archivo para no obligar a clasificar a mano.
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

async function api(path: string, opts: RequestInit = {}) {
    const token = getStoredToken();
    const res = await fetch(`/api/insurance/audits${path}`, {
        ...opts,
        headers: { 'X-Alteha-Token': token || '', ...(opts.headers || {}) },
    });
    return res.json().catch(() => ({}));
}

type Adjunto = { file: File; tipo: string };

export default function AuditsPage() {
    const router = useRouter();
    const [items, setItems] = useState<any[] | null>(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);
    const [busyDrive, setBusyDrive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [filtroRiesgo, setFiltroRiesgo] = useState<string>('');
    const [filtroEstado, setFiltroEstado] = useState<string>('');
    const [filtroResultado, setFiltroResultado] = useState<string>('');
    const [filtroCanal, setFiltroCanal] = useState<string>('');
    const [desde, setDesde] = useState<string>('');
    const [hasta, setHasta] = useState<string>('');
    const [orden, setOrden] = useState<string>('recientes');
    const [borrando, setBorrando] = useState<number | null>(null);

    // Formulario
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
    const [canal, setCanal] = useState('AVAL');
    const [notas, setNotas] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const load = () => api('').then((r) => setItems(Array.isArray(r?.data) ? r.data : []));
    useEffect(() => { load(); }, []);

    // Mientras haya informes generándose, el historial se refresca solo.
    const enProceso = (items || []).some((a) => a.status === 'PROCESANDO');
    useEffect(() => {
        if (!enProceso) return;
        const t = setInterval(load, 6000);
        return () => clearInterval(t);
    }, [enProceso]);

    // Etiqueta del canal por código (a partir del catálogo de creación).
    const canalLabel = (code?: string) => CANALES.find((c) => c.code === code)?.label || code || '—';

    // Resultado de la auditoría, derivado de lo facturado vs. objetado.
    const resultadoDe = (a: any): 'SIN' | 'PARCIAL' | 'TOTAL' | null => {
        if (a.status !== 'LISTA') return null;
        const obj = Number(a.totalObjected || 0);
        const fac = Number(a.totalInvoiced || 0);
        if (obj <= 0) return 'SIN';
        if (fac > 0 && obj >= fac) return 'TOTAL';
        return 'PARCIAL';
    };

    // Canales presentes en el historial (para no mostrar un filtro vacío).
    const canalesDisponibles = useMemo(
        () => [...new Set((items || []).map((a) => a.channel).filter(Boolean))] as string[],
        [items],
    );

    const visibles = useMemo(() => {
        const term = q.trim().toLowerCase();
        const desdeTs = desde ? new Date(desde + 'T00:00:00').getTime() : null;
        const hastaTs = hasta ? new Date(hasta + 'T23:59:59').getTime() : null;
        const out = (items || []).filter((a) => {
            if (filtroEstado && a.status !== filtroEstado) return false;
            if (filtroRiesgo && a.riskLevel !== filtroRiesgo) return false;
            if (filtroCanal && a.channel !== filtroCanal) return false;
            if (filtroResultado && resultadoDe(a) !== filtroResultado) return false;
            if (desdeTs || hastaTs) {
                const t = a.createdAt ? new Date(a.createdAt).getTime() : null;
                if (t == null) return false;
                if (desdeTs && t < desdeTs) return false;
                if (hastaTs && t > hastaTs) return false;
            }
            if (!term) return true;
            return [a.auditNumber, a.patientName, a.procedureSummary].filter(Boolean).join(' ').toLowerCase().includes(term);
        });
        const val = (a: any) => Number(a.totalInvoiced || 0);
        const obj = (a: any) => Number(a.totalObjected || 0);
        const ts = (a: any) => (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        out.sort((a, b) => {
            if (orden === 'antiguas') return ts(a) - ts(b);
            if (orden === 'monto') return val(b) - val(a);
            if (orden === 'objetado') return obj(b) - obj(a);
            return ts(b) - ts(a); // más recientes
        });
        return out;
    }, [items, q, filtroRiesgo, filtroEstado, filtroResultado, filtroCanal, desde, hasta, orden]);

    const hayFiltros = !!(q || filtroRiesgo || filtroEstado || filtroResultado || filtroCanal || desde || hasta);
    const limpiar = () => {
        setQ(''); setFiltroRiesgo(''); setFiltroEstado(''); setFiltroResultado(''); setFiltroCanal(''); setDesde(''); setHasta('');
    };
    const preset = (dias: number | 'mes') => {
        const now = new Date();
        const fin = now.toISOString().slice(0, 10);
        const ini = dias === 'mes'
            ? new Date(now.getFullYear(), now.getMonth(), 1)
            : new Date(now.getTime() - (dias - 1) * 86400000);
        setDesde(ini.toISOString().slice(0, 10));
        setHasta(fin);
    };

    const resumen = useMemo(() => {
        const listos = (items || []).filter((a) => a.status === 'LISTA');
        return {
            total: listos.length,
            facturado: listos.reduce((s, a) => s + Number(a.totalInvoiced || 0), 0),
            objetado: listos.reduce((s, a) => s + Number(a.totalObjected || 0), 0),
        };
    }, [items]);

    const agregarArchivos = (files: FileList | null) => {
        if (!files) return;
        const nuevos = Array.from(files).map((file) => ({ file, tipo: tipoSugerido(file.name) }));
        setAdjuntos((prev) => [...prev, ...nuevos].slice(0, 12));
    };

    // Importa documentos del caso desde Google Drive (selector oficial + descarga).
    const importarDrive = async () => {
        setError(null);
        setBusyDrive(true);
        try {
            const files = await importarDeDrive();
            if (files.length) {
                const nuevos = files.map((file) => ({ file, tipo: tipoSugerido(file.name) }));
                setAdjuntos((prev) => [...prev, ...nuevos].slice(0, 12));
            }
        } catch (e: any) {
            setError(e?.message || 'No se pudo importar de Google Drive.');
        } finally {
            setBusyDrive(false);
        }
    };

    const enviar = async () => {
        if (!adjuntos.length) return;
        setError(null);
        setBusy(true);
        try {
            const fd = new FormData();
            adjuntos.forEach((a) => fd.append('documents', a.file));
            fd.append('docTypes', JSON.stringify(adjuntos.map((a) => a.tipo)));
            fd.append('channel', canal);
            if (notas.trim()) fd.append('notes', notas.trim());

            const saved = await api('', { method: 'POST', body: fd });
            if (saved?.code !== '00' || !saved?.data?.id) throw new Error(saved?.message || 'No se pudo abrir la auditoría');

            setCreating(false);
            setAdjuntos([]);
            setNotas('');
            router.push(`/dashboard/insurance/audits/${saved.data.id}`);
        } catch (e: any) {
            setError(e?.message || 'No se pudo abrir la auditoría. Intenta de nuevo.');
        } finally {
            setBusy(false);
        }
    };

    const borrar = async (id: number) => {
        setBorrando(id);
        await api(`/${id}`, { method: 'DELETE' });
        await load();
        setBorrando(null);
    };

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-alteha-violet" /> Informes de Auditoría
                    </h1>
                    <p className="text-slate-400 font-medium mt-1 max-w-2xl">
                        Adjunta todo lo que tengas de la intervención y Alteha emite el informe ejecutivo y el técnico-operativo
                        bajo la metodología de auditoría médica, barematación y negociación de redes.
                    </p>
                </div>
                <button onClick={() => { setCreating(true); setError(null); }}
                    className="px-5 py-3 rounded-2xl font-black text-white bg-alteha-gradient flex items-center gap-2 shadow-lg shadow-alteha-violet/20">
                    <Plus className="w-4 h-4" /> Nueva auditoría
                </button>
            </header>

            {/* Documentos de contexto que la IA considera en todas las auditorías */}
            <AuditContextDocs />

            {/* Resumen del historial */}
            {!!resumen.total && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'Informes emitidos', value: String(resumen.total), color: 'text-alteha-violet' },
                        { label: 'Monto auditado', value: fmtMoney(resumen.facturado), color: 'text-slate-700' },
                        { label: 'Total objetado', value: fmtMoney(resumen.objetado), color: 'text-red-500' },
                    ].map((k) => (
                        <div key={k.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p>
                            <p className={`text-2xl font-black tabular-nums mt-0.5 ${k.color}`}>{k.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filtros del historial */}
            {!!(items || []).length && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
                    {/* Búsqueda + orden + limpiar */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por folio, paciente o intervención"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-semibold text-sm outline-none focus:border-alteha-turquoise" />
                        </div>
                        <div className="relative">
                            <ArrowUpDown className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select value={orden} onChange={(e) => setOrden(e.target.value)}
                                className="pl-9 pr-8 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:border-alteha-turquoise appearance-none">
                                <option value="recientes">Más recientes</option>
                                <option value="antiguas">Más antiguas</option>
                                <option value="monto">Mayor monto</option>
                                <option value="objetado">Mayor objetado</option>
                            </select>
                        </div>
                        {hayFiltros && (
                            <button onClick={limpiar}
                                className="px-3 py-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 font-black text-xs flex items-center gap-1.5">
                                <RotateCcw className="w-3.5 h-3.5" /> Limpiar
                            </button>
                        )}
                    </div>

                    {/* Rango de fechas + accesos rápidos */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Fecha
                        </span>
                        <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:border-alteha-turquoise" />
                        <span className="text-slate-300 text-xs font-black">→</span>
                        <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:border-alteha-turquoise" />
                        {[{ l: 'Hoy', v: 1 }, { l: 'Últimos 7 días', v: 7 }, { l: 'Este mes', v: 'mes' }].map((p) => (
                            <button key={p.l} onClick={() => preset(p.v as any)}
                                className="px-3 py-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-alteha-turquoise/10 hover:text-alteha-turquoise font-black text-[11px]">
                                {p.l}
                            </button>
                        ))}
                    </div>

                    {/* Estado / Riesgo / Resultado / Canal */}
                    <div className="flex items-start gap-x-6 gap-y-3 flex-wrap">
                        <GrupoFiltro titulo="Estado" valor={filtroEstado} set={setFiltroEstado}
                            opciones={[{ code: '', label: 'Todos' }, { code: 'LISTA', label: 'Realizadas' }, { code: 'PROCESANDO', label: 'En proceso' }, { code: 'ERROR', label: 'Con error' }]} />
                        <GrupoFiltro titulo="Riesgo" valor={filtroRiesgo} set={setFiltroRiesgo}
                            opciones={[{ code: '', label: 'Todos' }, { code: 'ALTO', label: 'Alto' }, { code: 'MEDIO', label: 'Medio' }, { code: 'BAJO', label: 'Bajo' }]} />
                        <GrupoFiltro titulo="Resultado" valor={filtroResultado} set={setFiltroResultado}
                            opciones={[{ code: '', label: 'Todos' }, { code: 'SIN', label: 'Sin objeciones' }, { code: 'PARCIAL', label: 'Parcial' }, { code: 'TOTAL', label: 'Objeción total' }]} />
                        {canalesDisponibles.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Canal</p>
                                <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)}
                                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:border-alteha-turquoise">
                                    <option value="">Todos</option>
                                    {canalesDisponibles.map((c) => <option key={c} value={c}>{canalLabel(c)}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] font-bold text-slate-400">
                        {visibles.length} de {(items || []).length} auditoría{(items || []).length === 1 ? '' : 's'}
                    </p>
                </div>
            )}

            {/* Historial */}
            {items === null ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin" /></div>
            ) : visibles.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-14 text-center space-y-4">
                    <img src="/backgrounds/specialist.png" alt="Auditoría médica Alteha"
                        className="w-44 h-44 object-cover rounded-3xl mx-auto shadow-lg shadow-alteha-violet/10" />
                    <p className="font-black text-lg">{items.length ? 'Ningún informe coincide con la búsqueda' : 'Aún no has emitido informes'}</p>
                    <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
                        Con un informe de Alteha sabrás si lo facturado corresponde a lo realizado, a lo pactado y al mercado —
                        y llegarás a la mesa con el prestador con el pliego ya fundamentado.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibles.map((a) => {
                        const r = RISK[a.riskLevel] || RISK.MEDIO;
                        const procesando = a.status === 'PROCESANDO';
                        const fallo = a.status === 'ERROR';
                        return (
                            <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-alteha-turquoise/50 transition-all">
                                <button onClick={() => router.push(`/dashboard/insurance/audits/${a.id}`)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                        fallo ? 'bg-red-50' : procesando ? 'bg-amber-50' : 'bg-gradient-to-br from-alteha-turquoise/15 to-alteha-violet/15'}`}>
                                        {procesando ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                            : fallo ? <AlertTriangle className="w-5 h-5 text-red-400" />
                                            : <FileText className="w-5 h-5 text-alteha-violet" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black truncate">
                                            {procesando ? 'Generando el informe…' : fallo ? 'El informe no pudo generarse' : (a.procedureSummary || 'Intervención médica')}
                                        </p>
                                        <p className="text-xs text-slate-400 font-semibold truncate">
                                            {a.auditNumber} · {a.patientName || 'Paciente s/d'} · {fmtDate(a.createdAt)}
                                            {a.aiProvider ? ` · ${a.aiProvider}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 space-y-1 hidden sm:block">
                                        {procesando ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-50 text-amber-600">
                                                <Clock className="w-3 h-3" /> En proceso
                                            </span>
                                        ) : fallo ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-red-50 text-red-500">
                                                <AlertTriangle className="w-3 h-3" /> Error
                                            </span>
                                        ) : (
                                            <>
                                                <p className="font-black tabular-nums">{fmtMoney(a.totalInvoiced, a.currency)}</p>
                                                {Number(a.totalObjected) > 0 && (
                                                    <p className="text-[11px] font-black text-red-500 tabular-nums">
                                                        objetado {fmtMoney(a.totalObjected, a.currency)}
                                                    </p>
                                                )}
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${r.cls}`}>
                                                    <r.Icon className="w-3 h-3" /> {r.label}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                                </button>
                                <button onClick={() => borrar(a.id)} disabled={borrando === a.id}
                                    title="Retirar del historial"
                                    className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0">
                                    {borrando === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modal nueva auditoría */}
            {creating && (
                <div className="fixed inset-0 z-50 bg-alteha-gray/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-7 space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5 text-alteha-violet" /> Nueva auditoría
                                </h2>
                                <p className="text-xs text-slate-400 font-semibold mt-1">
                                    Mientras más completo el expediente, más fuerte es la objeción. Puedes adjuntar hasta 12 documentos.
                                </p>
                            </div>
                            {!busy && (
                                <button onClick={() => setCreating(false)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-300"><X className="w-5 h-5" /></button>
                            )}
                        </div>

                        {/* Canal de atención */}
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Canal de atención</p>
                            <div className="flex flex-wrap gap-2">
                                {CANALES.map((ch) => (
                                    <button key={ch.code} onClick={() => setCanal(ch.code)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black ${canal === ch.code ? 'bg-alteha-turquoise text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                        {ch.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Documentos */}
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Documentos del caso</p>
                            <input ref={inputRef} type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden"
                                onChange={(e) => { agregarArchivos(e.target.files); e.target.value = ''; }} />
                            <button type="button" onClick={() => inputRef.current?.click()}
                                className="w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-alteha-turquoise/50 p-5 flex items-center gap-3 transition-all">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center"><UploadCloud className="w-5 h-5" /></div>
                                <div className="text-left">
                                    <p className="font-black text-sm">Seleccionar archivos</p>
                                    <p className="text-[11px] text-slate-400 font-semibold">PDF o imagen · hasta 60 MB cada uno</p>
                                </div>
                            </button>

                            {driveConfigurado() && (
                                <button type="button" onClick={importarDrive} disabled={busyDrive}
                                    className="w-full mt-2 rounded-2xl border-2 border-dashed border-slate-200 hover:border-alteha-violet/50 p-5 flex items-center gap-3 transition-all disabled:opacity-60">
                                    <div className="w-11 h-11 rounded-xl bg-violet-50 text-alteha-violet flex items-center justify-center">
                                        {busyDrive ? <Loader2 className="w-5 h-5 animate-spin" /> : <HardDriveDownload className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-sm">{busyDrive ? 'Importando de Google Drive…' : 'Importar de Google Drive'}</p>
                                        <p className="text-[11px] text-slate-400 font-semibold">Elige los documentos del caso desde tu Drive</p>
                                    </div>
                                </button>
                            )}

                            {adjuntos.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {adjuntos.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-2xl p-3">
                                            <FileText className="w-4 h-4 text-alteha-violet shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black truncate">{a.file.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{(a.file.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                            <select value={a.tipo}
                                                onChange={(e) => setAdjuntos((prev) => prev.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)))}
                                                className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-alteha-turquoise max-w-[190px]">
                                                {TIPOS_DOC.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                                            </select>
                                            <button onClick={() => setAdjuntos((prev) => prev.filter((_, j) => j !== i))}
                                                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notas */}
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas para el auditor (opcional)</p>
                            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
                                placeholder="Reglas de excepción institucional, condiciones del convenio, antecedentes del prestador…"
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 font-semibold text-sm border-2 border-transparent focus:border-alteha-turquoise outline-none resize-none" />
                        </div>

                        {error && <p className="text-sm font-bold text-red-500 bg-red-50 rounded-2xl p-3">{error}</p>}

                        <button onClick={enviar} disabled={!adjuntos.length || busy}
                            className="w-full py-4 rounded-2xl font-black text-white bg-alteha-gradient disabled:opacity-40 flex items-center justify-center gap-2">
                            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {busy ? 'Abriendo el expediente…' : 'Auditar con Alteha'}
                        </button>

                        <p className="text-[10px] text-slate-400 font-semibold flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            El análisis corre en segundo plano y suele tardar entre 1 y 3 minutos: puedes seguir trabajando y volver al historial.
                            Los precios de referencia son estimaciones de mercado y no constituyen tarifas oficiales; las tipologías detectadas son
                            indicadores que exigen confirmación documental.
                        </p>

                        {/* Marcos metodológicos de referencia (tarjetas uniformes en
                            /public/marcos). La leyenda es de alineación, no de patrocinio. */}
                        <div className="border-t border-slate-100 pt-4">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.18em] text-center mb-2.5">
                                Metodología alineada con los marcos de
                            </p>
                            <div className="flex flex-wrap justify-center items-center gap-2">
                                {[
                                    { src: '/marcos/ama.png', alt: 'AMA — CPT®' },
                                    { src: '/marcos/acfe.png', alt: 'ACFE' },
                                    { src: '/marcos/rims.png', alt: 'RIMS' },
                                    { src: '/marcos/iia.png', alt: 'The Institute of Internal Auditors' },
                                ].map((m) => (
                                    <img key={m.src} src={m.src} alt={m.alt} title={m.alt}
                                        className="h-9 w-auto rounded-lg border border-slate-100 opacity-90" />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// Grupo de chips para un filtro (Estado, Riesgo, Resultado).
function GrupoFiltro({ titulo, opciones, valor, set }: {
    titulo: string;
    opciones: { code: string; label: string }[];
    valor: string;
    set: (v: string) => void;
}) {
    return (
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{titulo}</p>
            <div className="flex gap-1.5 flex-wrap">
                {opciones.map((o) => (
                    <button key={o.code} onClick={() => set(o.code)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-colors ${
                            valor === o.code ? 'bg-alteha-gray text-white' : 'bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600'}`}>
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
