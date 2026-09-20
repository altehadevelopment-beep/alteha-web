"use client";

// Documentos de contexto de la aseguradora (condicionado, baremos, reglas) que la IA
// toma en cuenta en el análisis de TODAS sus auditorías. Subir / listar / eliminar.
import React, { useEffect, useRef, useState } from 'react';
import { getStoredToken } from '@/lib/api';
import { toast } from 'sonner';
import { BookMarked, UploadCloud, Loader2, Trash2, FileText, ChevronDown, ChevronRight, Info } from 'lucide-react';

type Doc = { id: number; fileName: string; mimeType?: string; sizeBytes?: number; createdAt?: string };

const fmtSize = (b?: number) => (b == null ? '' : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export default function AuditContextDocs() {
    const [abierto, setAbierto] = useState(false);
    const [docs, setDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [subiendo, setSubiendo] = useState(false);
    const [borrando, setBorrando] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const api = (path: string, opts: RequestInit = {}) =>
        fetch(`/api/insurance/audits/context${path}`, {
            ...opts,
            headers: { 'X-Alteha-Token': getStoredToken() || '', ...(opts.headers || {}) },
        }).then((r) => r.json().catch(() => ({})));

    const load = async () => {
        setLoading(true);
        const r = await api('');
        setDocs(r?.code === '00' && Array.isArray(r.data) ? r.data : []);
        setLoading(false);
    };
    useEffect(() => { void load(); }, []);

    const subir = async (files: FileList | null) => {
        if (!files || !files.length) return;
        setSubiendo(true);
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append('files', f));
        const r = await api('', { method: 'POST', body: fd });
        setSubiendo(false);
        if (r?.code === '00') { toast.success(r.message || 'Documentos cargados'); void load(); }
        else toast.error(r?.message || 'No se pudieron cargar los documentos');
    };

    const borrar = async (id: number) => {
        setBorrando(id);
        const r = await api(`/${id}`, { method: 'DELETE' });
        setBorrando(null);
        if (r?.code === '00') { toast.success('Documento eliminado'); void load(); }
        else toast.error(r?.message || 'No se pudo eliminar');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setAbierto((v) => !v)} className="w-full flex items-center gap-3 p-5 text-left">
                <div className="w-11 h-11 rounded-2xl bg-violet-50 text-alteha-violet flex items-center justify-center shrink-0"><BookMarked className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800">Documentos de contexto para la IA</p>
                    <p className="text-xs text-slate-400 font-semibold">Condicionado, baremos o reglas que se aplican a <b>todas</b> tus auditorías{docs.length ? ` · ${docs.length} cargado${docs.length === 1 ? '' : 's'}` : ''}</p>
                </div>
                {abierto ? <ChevronDown className="w-5 h-5 text-slate-300" /> : <ChevronRight className="w-5 h-5 text-slate-300" />}
            </button>

            {abierto && (
                <div className="px-5 pb-5 space-y-3">
                    <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-alteha-turquoise" />
                        <span>Estos archivos se envían al motor de IA como contexto en <b>cada</b> auditoría que abras, para que considere tu condicionado, baremos o reglas al analizar. No sustituyen los documentos del caso.</span>
                    </div>

                    <input ref={inputRef} type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp,text/plain" className="hidden"
                        onChange={(e) => { subir(e.target.files); e.target.value = ''; }} />
                    <button type="button" onClick={() => inputRef.current?.click()} disabled={subiendo}
                        className="w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-alteha-violet/50 p-4 flex items-center gap-3 transition-all disabled:opacity-60">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                            {subiendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                            <p className="font-black text-sm">{subiendo ? 'Cargando…' : 'Cargar documentos de contexto'}</p>
                            <p className="text-[11px] text-slate-400 font-semibold">PDF, imagen o texto · hasta 20 MB c/u · máx. 10</p>
                        </div>
                    </button>

                    {loading ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-alteha-violet animate-spin" /></div>
                    ) : docs.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 font-semibold py-2">Aún no hay documentos de contexto.</p>
                    ) : (
                        <div className="space-y-2">
                            {docs.map((d) => (
                                <div key={d.id} className="flex items-center gap-3 bg-slate-50/70 rounded-2xl p-3">
                                    <FileText className="w-4 h-4 text-alteha-violet shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-700 truncate">{d.fileName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{fmtSize(d.sizeBytes)}</p>
                                    </div>
                                    <button type="button" onClick={() => borrar(d.id)} disabled={borrando === d.id}
                                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0">
                                        {borrando === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
