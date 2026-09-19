"use client";

// Chat del agente de IA acotado a UNA auditoría: responde el porqué de cifras/objeciones
// y propone ediciones del expediente (modo "proponer y confirmar"). Widget flotante.
import React, { useEffect, useRef, useState } from 'react';
import { getStoredToken } from '@/lib/api';
import { MessageCircle, X, Send, Loader2, Sparkles, Check, Ban, Pencil } from 'lucide-react';

type Msg = { rol: 'usuario' | 'asistente' | 'sistema'; texto: string };
type Propuesta = { mensaje: string; resumen: string; cambios: Record<string, any> };

const ETIQUETA: Record<string, string> = {
    patientName: 'Paciente', procedureSummary: 'Resumen', riskLevel: 'Nivel de riesgo',
    currency: 'Moneda', totalInvoiced: 'Total facturado', totalReference: 'Total referencia',
    totalObjected: 'Total objetado', resultJson: 'Análisis del expediente',
};

export default function AuditChat({ auditId, initialChat, onApplied }: {
    auditId: string | number;
    initialChat?: string | null;
    onApplied?: () => void;
}) {
    const [abierto, setAbierto] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [texto, setTexto] = useState('');
    const [busy, setBusy] = useState(false);
    const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
    const [aplicando, setAplicando] = useState(false);
    const finRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            if (initialChat) {
                const arr = JSON.parse(initialChat);
                if (Array.isArray(arr)) setMsgs(arr.map((m: any) => ({ rol: m.rol, texto: m.texto })));
            }
        } catch { /* historial vacío */ }
    }, [initialChat]);

    useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, propuesta, abierto]);

    const api = async (path: string, body: any) => {
        const token = getStoredToken();
        const res = await fetch(`/api/insurance/audits/${auditId}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token || '' },
            body: JSON.stringify(body),
        });
        return res.json().catch(() => ({}));
    };

    const enviar = async () => {
        const q = texto.trim();
        if (!q || busy) return;
        setTexto('');
        setPropuesta(null);
        setMsgs((m) => [...m, { rol: 'usuario', texto: q }]);
        setBusy(true);
        const r = await api('/chat', { message: q });
        setBusy(false);
        if (r?.code !== '00') {
            setMsgs((m) => [...m, { rol: 'asistente', texto: r?.message || 'No se pudo responder. Intenta de nuevo.' }]);
            return;
        }
        const d = r.data || {};
        if (d.tipo === 'edicion') {
            setMsgs((m) => [...m, { rol: 'asistente', texto: d.mensaje || 'Propongo un cambio en el expediente.' }]);
            setPropuesta({ mensaje: d.mensaje || '', resumen: d.resumen || '', cambios: d.cambios || {} });
        } else {
            setMsgs((m) => [...m, { rol: 'asistente', texto: d.mensaje || '' }]);
        }
    };

    const confirmar = async () => {
        if (!propuesta) return;
        setAplicando(true);
        const r = await api('/chat/apply', { cambios: propuesta.cambios });
        setAplicando(false);
        if (r?.code === '00') {
            setMsgs((m) => [...m, { rol: 'sistema', texto: '✓ Cambios aplicados al expediente.' }]);
            setPropuesta(null);
            onApplied?.();
        } else {
            setMsgs((m) => [...m, { rol: 'sistema', texto: r?.message || 'No se pudieron aplicar los cambios.' }]);
        }
    };

    const fmtVal = (k: string, v: any) => (k === 'resultJson' ? '(se actualiza el desglose del análisis)' : String(v));

    return (
        <>
            {/* Botón flotante */}
            <button type="button" onClick={() => setAbierto((v) => !v)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-black text-sm shadow-2xl shadow-alteha-violet/30 bg-gradient-to-r from-alteha-turquoise to-alteha-violet hover:scale-105 transition-transform">
                {abierto ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                {!abierto && <span>Preguntar al agente</span>}
            </button>

            {abierto && (
                <div className="fixed bottom-24 right-6 z-40 w-[92vw] max-w-[400px] h-[70vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <div className="flex-1">
                            <p className="font-black leading-tight">Agente de auditoría</p>
                            <p className="text-[11px] text-white/80">Pregunta o pide cambios de este expediente</p>
                        </div>
                        <button onClick={() => setAbierto(false)} className="p-1.5 rounded-lg hover:bg-white/15"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {msgs.length === 0 && (
                            <div className="text-center text-slate-400 text-xs font-semibold mt-6 px-4">
                                Pregúntale al agente el porqué de un precio, una objeción o el nivel de riesgo.
                                También puedes pedirle que cambie un monto o un detalle — te lo propondrá para confirmar.
                            </div>
                        )}
                        {msgs.map((m, i) => (
                            m.rol === 'sistema' ? (
                                <div key={i} className="text-center"><span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{m.texto}</span></div>
                            ) : (
                                <div key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.rol === 'usuario' ? 'bg-alteha-gray text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'}`}>
                                        {m.texto}
                                    </div>
                                </div>
                            )
                        ))}

                        {propuesta && (
                            <div className="bg-white border-2 border-alteha-violet/30 rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-alteha-violet flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Cambio propuesto</p>
                                {propuesta.resumen && <p className="text-sm font-bold text-slate-800">{propuesta.resumen}</p>}
                                <div className="space-y-1.5">
                                    {Object.entries(propuesta.cambios || {}).map(([k, v]) => (
                                        <div key={k} className="text-xs bg-slate-50 rounded-lg px-3 py-2">
                                            <span className="font-black text-slate-500">{ETIQUETA[k] || k}: </span>
                                            <span className="font-semibold text-slate-800">{fmtVal(k, v)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button onClick={confirmar} disabled={aplicando}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-alteha-violet text-white font-black text-xs py-2.5 rounded-xl disabled:opacity-50">
                                        {aplicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirmar
                                    </button>
                                    <button onClick={() => setPropuesta(null)} disabled={aplicando}
                                        className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-500 font-black text-xs py-2.5 px-4 rounded-xl">
                                        <Ban className="w-4 h-4" /> Descartar
                                    </button>
                                </div>
                            </div>
                        )}

                        {busy && (
                            <div className="flex justify-start"><div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5"><Loader2 className="w-4 h-4 text-alteha-violet animate-spin" /></div></div>
                        )}
                        <div ref={finRef} />
                    </div>

                    <div className="p-3 border-t border-slate-100 flex items-center gap-2">
                        <input value={texto} onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                            placeholder="Escribe tu pregunta…" disabled={busy}
                            className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-semibold outline-none border-2 border-transparent focus:border-alteha-turquoise" />
                        <button onClick={enviar} disabled={busy || !texto.trim()}
                            className="p-2.5 rounded-xl bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white disabled:opacity-40">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
