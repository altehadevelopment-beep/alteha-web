"use client";

import Link from 'next/link';
import { MessageCircle, Mic, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';

/**
 * Ruta propia de Teha (/teha) para enlazarla desde la landing y desde campañas.
 * El chat vive en el widget global: al entrar por esta ruta se abre solo, y el
 * botón de abajo vuelve a abrirlo si el visitante lo cerró.
 */
export default function TehaPage() {
    const abrirTeha = () => window.dispatchEvent(new Event('teha:open'));

    const capacidades = [
        { icon: MessageCircle, title: 'Resuelve tus dudas', text: 'Cómo funcionan las subastas, qué necesitas para registrarte y cómo se paga cada intervención.' },
        { icon: Mic, title: 'Habla o escribe', text: 'Puedes dictarle por voz y ella te responde hablando, o escribirle si prefieres leer.' },
        { icon: Clock, title: 'Disponible siempre', text: 'Atiende a cualquier hora. Si necesitas una persona, te conecta con el equipo de Alteha.' },
        { icon: ShieldCheck, title: 'Conversación privada', text: 'No necesitas cuenta para hablar con ella; si ya tienes sesión, te reconoce y te saluda por tu nombre.' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-outfit">
            <div className="max-w-5xl mx-auto px-6 py-10 md:py-16">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Inicio
                </Link>

                <div className="mt-8 md:mt-12 grid md:grid-cols-[auto,1fr] gap-8 md:gap-12 items-center">
                    <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-alteha-turquoise/20 bg-slate-100 mx-auto md:mx-0">
                        <img src="/tita-avatar.png" alt="Teha, asistente de Alteha" className="w-full h-full object-cover object-top scale-110" />
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-alteha-turquoise mb-3">Asistente virtual de Alteha</p>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Hola, soy Teha.<br />Pregúntame lo que quieras.
                        </h1>
                        <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-xl">
                            Te acompaño dentro del ecosistema Alteha: subastas médicas, registro de clínicas y
                            médicos, auditorías de cuentas y pagos. Escríbeme o háblame — la conversación ya
                            está abierta.
                        </p>
                        <button
                            onClick={abrirTeha}
                            className="mt-8 inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                        >
                            <MessageCircle className="w-5 h-5" /> Conversar con Teha
                        </button>
                    </div>
                </div>

                <div className="mt-14 md:mt-20 grid sm:grid-cols-2 gap-5">
                    {capacidades.map((c) => (
                        <div key={c.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="w-11 h-11 rounded-xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center mb-4">
                                <c.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-lg text-slate-800 mb-1.5">{c.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{c.text}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm text-slate-400">
                        ¿Prefieres empezar de una vez?{' '}
                        <Link href="/register/clinic" className="font-bold text-alteha-turquoise hover:underline">Registra tu clínica</Link>
                        {' '}o{' '}
                        <Link href="/register/specialist" className="font-bold text-alteha-turquoise hover:underline">regístrate como médico</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
