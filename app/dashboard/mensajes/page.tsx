"use client";
export const dynamic = "force-dynamic";

// Mensajes: chat en tiempo real entre médicos, clínicas, seguros y casas de
// salud (Firebase Firestore — misma conversación que la app móvil).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStoredToken } from '@/lib/api';
import {
    escucharChats, escucharMensajes, asegurarChat, enviarMensaje, chatIdDe,
    type ActorChat, type Conversacion, type Mensaje,
} from '@/lib/chatFirebase';

const ROL: Record<string, string> = {
    CLINIC: 'Clínica', INSURANCE: 'Seguro', PHARMACY: 'Casa de Salud', DOCTOR: 'Médico',
};

const hace = (ms?: number) => {
    if (!ms) return '';
    const min = Math.floor((Date.now() - ms) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;
    return new Date(ms).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
};

function Foto({ actor, size = 44 }: { actor?: ActorChat | null; size?: number }) {
    const inicial = (actor?.nombre || '?').trim().charAt(0).toUpperCase();
    return actor?.foto ? (
        <img src={actor.foto} alt="" style={{ width: size, height: size }} className="rounded-2xl object-cover shrink-0" />
    ) : (
        <div style={{ width: size, height: size }}
            className="rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center text-white font-black shrink-0">
            {inicial}
        </div>
    );
}

export default function MensajesPage() {
    const [me, setMe] = useState<ActorChat | null>(null);
    const [actores, setActores] = useState<ActorChat[]>([]);
    const [chats, setChats] = useState<Conversacion[]>([]);
    const [sel, setSel] = useState<{ id: string; otro: ActorChat } | null>(null);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [busca, setBusca] = useState('');
    const [nuevo, setNuevo] = useState(false);
    const finRef = useRef<HTMLDivElement>(null);
    const params = useSearchParams();

    // Identidad + directorio del backend; conversaciones en vivo desde Firebase.
    useEffect(() => {
        let salir: (() => void) | null = null;
        (async () => {
            const token = getStoredToken();
            if (!token) { window.location.href = '/login'; return; }
            const r = await fetch('/api/chat-directory', { headers: { 'X-Alteha-Token': token } }).then((x) => x.json()).catch(() => null);
            const d = r?.data ?? {};
            if (d.me) setMe(d.me);
            setActores(Array.isArray(d.actores) ? d.actores : []);
            if (d.me?.email) salir = escucharChats(d.me.email, setChats);
        })();
        return () => { if (salir) salir(); };
    }, []);

    // Abrir una conversación indicada por la URL (?otro=<email>&nombre=&foto=&rol=),
    // p. ej. al pulsar "Contactar al paciente" desde una subasta.
    useEffect(() => {
        if (!me?.email) return;
        const email = params.get('otro');
        if (!email) return;
        const otro: ActorChat = { email, nombre: params.get('nombre') || email, foto: params.get('foto') || undefined, rol: params.get('rol') || '' };
        setSel({ id: chatIdDe(me.email, email), otro });
    }, [me?.email, params]);

    // Mensajes de la conversación seleccionada, en vivo.
    useEffect(() => {
        if (!sel) return;
        const salir = escucharMensajes(sel.id, setMensajes);
        return salir;
    }, [sel?.id]);

    useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes.length]);

    const enviar = async () => {
        const t = texto.trim();
        if (!t || !me || !sel) return;
        setTexto('');
        try {
            await asegurarChat(me, sel.otro);
            await enviarMensaje(sel.id, me.email, t);
        } catch { setTexto(t); }
    };

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return q ? actores.filter((a) => `${a.nombre} ${a.email}`.toLowerCase().includes(q)) : actores;
    }, [actores, busca]);

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Mensajes</h1>
                        <p className="text-sm font-medium text-slate-400">Chatea en tiempo real — la conversación también llega a la app.</p>
                    </div>
                    {me && <div className="flex items-center gap-2.5 bg-white rounded-2xl border border-slate-100 px-4 py-2">
                        <Foto actor={me} size={34} />
                        <div>
                            <p className="text-sm font-black text-slate-700 leading-none">{me.nombre}</p>
                            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">{ROL[me.rol || ''] || me.rol}</p>
                        </div>
                    </div>}
                </div>

                <div className="grid md:grid-cols-[340px,1fr] gap-5 items-start">
                    {/* ── Conversaciones ── */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                            <p className="font-black text-slate-700 text-sm">Conversaciones</p>
                            <button onClick={() => setNuevo(!nuevo)}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-violet-500 text-white text-xs font-black">
                                {nuevo ? 'Cerrar' : '+ Nueva'}
                            </button>
                        </div>

                        {nuevo && (
                            <div className="p-3 border-b border-slate-50 space-y-2">
                                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar contacto…"
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-300" />
                                <div className="max-h-64 overflow-y-auto space-y-1">
                                    {filtrados.map((a) => (
                                        <button key={a.email}
                                            onClick={() => { setSel({ id: chatIdDe(me!.email, a.email), otro: a }); setNuevo(false); }}
                                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-left">
                                            <Foto actor={a} size={36} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-700 truncate">{a.nombre}</p>
                                                <p className="text-[10px] font-bold text-teal-500 uppercase">{ROL[a.rol || ''] || a.rol}</p>
                                            </div>
                                        </button>
                                    ))}
                                    {!filtrados.length && <p className="text-xs font-semibold text-slate-400 p-2">Sin resultados.</p>}
                                </div>
                            </div>
                        )}

                        <div className="max-h-[520px] overflow-y-auto">
                            {chats.map((c) => {
                                const otro = (c.info || []).find((i) => i.email !== me?.email.toLowerCase()) || c.info?.[0];
                                return (
                                    <button key={c.id}
                                        onClick={() => otro && setSel({ id: c.id, otro })}
                                        className={`w-full flex items-center gap-3 p-3.5 text-left border-b border-slate-50 hover:bg-slate-50 ${sel?.id === c.id ? 'bg-teal-50/60' : ''}`}>
                                        <Foto actor={otro} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between gap-2">
                                                <p className="text-sm font-black text-slate-700 truncate">{otro?.nombre}</p>
                                                <span className="text-[10px] font-bold text-slate-300 shrink-0">{hace(c.actualizadoEn)}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-400 truncate">
                                                {c.ultimoDe === me?.email.toLowerCase() ? 'Tú: ' : ''}{c.ultimoMensaje || ROL[otro?.rol || ''] || ''}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                            {!chats.length && (
                                <p className="text-xs font-semibold text-slate-400 p-5 text-center">
                                    Aún no tienes conversaciones. Pulsa “+ Nueva” para empezar.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Conversación ── */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[620px]">
                        {sel ? (
                            <>
                                <div className="flex items-center gap-3 p-4 border-b border-slate-50">
                                    <Foto actor={sel.otro} size={40} />
                                    <div>
                                        <p className="font-black text-slate-800 leading-tight">{sel.otro.nombre}</p>
                                        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">{ROL[sel.otro.rol || ''] || sel.otro.rol}</p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
                                    {mensajes.map((m) => {
                                        const mio = m.de === me?.email.toLowerCase();
                                        return (
                                            <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mio
                                                    ? 'bg-gradient-to-r from-teal-400 to-violet-500 text-white rounded-br-md'
                                                    : 'bg-slate-100 text-slate-700 rounded-bl-md'}`}>
                                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                                                    <p className={`text-[9px] font-bold text-right mt-1 ${mio ? 'text-white/70' : 'text-slate-400'}`}>
                                                        {new Date(m.en).toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!mensajes.length && (
                                        <p className="text-sm font-medium text-slate-400 text-center pt-16">
                                            Escribe el primer mensaje para {sel.otro.nombre}.
                                        </p>
                                    )}
                                    <div ref={finRef} />
                                </div>
                                <div className="p-4 border-t border-slate-50 flex gap-3">
                                    <input value={texto} onChange={(e) => setTexto(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }}
                                        placeholder="Escribe un mensaje…"
                                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-300" />
                                    <button onClick={enviar} disabled={!texto.trim()}
                                        className="px-6 rounded-2xl bg-gradient-to-r from-teal-400 to-violet-500 text-white font-black text-sm disabled:opacity-40">
                                        Enviar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300">
                                <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <p className="text-sm font-black text-slate-400">Elige una conversación o empieza una nueva</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
