"use client";

// Mensajes del paciente: chat en vivo con clínicas y médicos (Sistema B por correo).
// La conversación se abre desde una oferta (?chat=<id>&otro=<email>...) o desde la lista.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProfile, getStoredToken } from '@/lib/api';
import {
  escucharChats, escucharMensajes, enviarMensaje, asegurarChat, chatIdDe,
  type Conversacion, type Mensaje, type ActorChat,
} from '@/lib/chatFirebase';
import { MessageCircle, Send, Loader2, ArrowLeft, Stethoscope, Building2 } from 'lucide-react';

export default function PatientMessages() {
  const params = useSearchParams();
  const [me, setMe] = useState<ActorChat | null>(null);
  const [chats, setChats] = useState<Conversacion[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [selOtro, setSelOtro] = useState<ActorChat | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const finRef = useRef<HTMLDivElement>(null);

  // Identidad del paciente (su correo es su id de chat).
  useEffect(() => {
    getProfile('PATIENT').then((r) => {
      const p: any = r?.data || {};
      if (p.email) setMe({ email: p.email, nombre: p.firstName || p.fullName || p.email, foto: p.profileImageUrl, rol: 'PATIENT' });
    }).catch(() => {}).finally(() => setCargando(false));
  }, []);

  // Escuchar mis conversaciones.
  useEffect(() => {
    if (!me?.email) return;
    const unsub = escucharChats(me.email, setChats);
    return () => unsub();
  }, [me?.email]);

  // Si llego desde una oferta, abrir/crear la conversación con el prestador.
  useEffect(() => {
    if (!me?.email) return;
    const email = params.get('otro');
    if (!email) return;
    const otro: ActorChat = { email, nombre: params.get('nombre') || email, foto: params.get('foto') || undefined, rol: params.get('rol') || '' };
    asegurarChat(me, otro).then((id) => { setSelId(id); setSelOtro(otro); });
  }, [me?.email, params]);

  // Escuchar mensajes de la conversación abierta.
  useEffect(() => {
    if (!selId) { setMensajes([]); return; }
    const unsub = escucharMensajes(selId, setMensajes);
    return () => unsub();
  }, [selId]);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  const otroDe = (c: Conversacion): ActorChat =>
    (c.info || []).find((i) => i.email !== me?.email) || { email: '', nombre: 'Contacto' };

  const abrir = (c: Conversacion) => { setSelId(c.id); setSelOtro(otroDe(c)); };

  const enviar = async () => {
    if (!selId || !me?.email || !texto.trim()) return;
    const t = texto; setTexto('');
    await enviarMensaje(selId, me.email, t);
  };

  if (cargando) return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><MessageCircle className="w-6 h-6 text-alteha-turquoise" /> Mensajes</h1>
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden grid md:grid-cols-[300px,1fr] h-[600px]">
        {/* Lista */}
        <div className={`border-r border-slate-100 overflow-y-auto ${selId ? 'hidden md:block' : ''}`}>
          {chats.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Aún no tienes conversaciones. Contacta a una clínica o médico desde las ofertas.</div>
          ) : chats.map((c) => {
            const o = otroDe(c);
            return (
              <button key={c.id} onClick={() => abrir(c)} className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${selId === c.id ? 'bg-slate-50' : ''}`}>
                <div className="flex items-center gap-2">
                  {o.rol === 'CLINIC' ? <Building2 className="w-4 h-4 text-slate-400" /> : <Stethoscope className="w-4 h-4 text-slate-400" />}
                  <span className="font-bold text-slate-700 text-sm truncate">{o.nombre}</span>
                </div>
                {c.ultimoMensaje && <p className="text-xs text-slate-400 truncate mt-0.5">{c.ultimoMensaje}</p>}
              </button>
            );
          })}
        </div>

        {/* Ventana */}
        <div className={`flex flex-col ${selId ? '' : 'hidden md:flex'}`}>
          {!selId ? (
            <div className="flex-1 flex items-center justify-center text-slate-300"><MessageCircle className="w-12 h-12" /></div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <button onClick={() => setSelId(null)} className="md:hidden text-slate-400"><ArrowLeft className="w-5 h-5" /></button>
                {selOtro?.rol === 'CLINIC' ? <Building2 className="w-5 h-5 text-alteha-turquoise" /> : <Stethoscope className="w-5 h-5 text-alteha-turquoise" />}
                <span className="font-black text-slate-800">{selOtro?.nombre}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
                {mensajes.map((m) => {
                  const mio = m.de === me?.email?.toLowerCase();
                  return (
                    <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium ${mio ? 'bg-alteha-turquoise text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                        {m.texto}
                      </div>
                    </div>
                  );
                })}
                <div ref={finRef} />
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-2">
                <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviar()}
                  placeholder="Escribe un mensaje…" className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 outline-none font-semibold text-sm" />
                <button onClick={enviar} className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center"><Send className="w-5 h-5" /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
