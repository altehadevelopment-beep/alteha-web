import Image from 'next/image';

export const metadata = {
    title: 'Alteha Médicos — Prueba nuestra app',
    description: 'Ayúdanos a probar la app de Alteha para médicos: subastas médicas de forma rápida y oportuna, desde tu teléfono.',
};

// Ícono de línea (trazos limpios, sin emojis).
function Icono({ d, extra }: { d: string; extra?: string }) {
    return (
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
                {extra && <path d={extra} />}
            </svg>
        </span>
    );
}

const CARACTERISTICAS = [
    {
        titulo: 'Subastas en tiempo real',
        texto: 'Casos de tu especialidad con presupuesto y condiciones claras.',
        icono: 'M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z', // rayo
    },
    {
        titulo: 'Verificación segura',
        texto: 'Prueba de vida guiada por la cámara y revisión del documento.',
        icono: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        extra: 'M9 12l2 2 4-4', // escudo + check
    },
    {
        titulo: 'Notificaciones al instante',
        texto: 'Entérate de nuevas subastas y de la aprobación de tu cuenta.',
        icono: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9',
        extra: 'M10.3 21a1.94 1.94 0 0 0 3.4 0', // campana
    },
    {
        titulo: 'Oferta en segundos',
        texto: 'Participa, gana y cobra tus intervenciones desde el teléfono.',
        icono: 'M2 7h20v10H2z',
        extra: 'M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0', // billete
    },
];

// Página pública de descarga de la app de médicos (fase de pruebas).
export default function AppMedicos() {
    return (
        <main className="min-h-screen bg-white text-slate-800 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 py-10 lg:py-16">
                {/* Marca */}
                <div className="flex items-center gap-3 mb-12">
                    <img src="/logoalteha.svg" alt="Alteha" className="h-12 w-auto" />
                    <span className="text-sm font-bold tracking-widest uppercase text-slate-400">Sistema de Subastas</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* ── Mensaje + CTA ── */}
                    <div className="space-y-7">
                        <span className="inline-block bg-teal-50 text-teal-600 border border-teal-100 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                            Versión de prueba · Android
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-black leading-tight text-slate-900">
                            Ayúdanos a probar
                            <span className="block bg-gradient-to-r from-teal-500 to-violet-600 bg-clip-text text-transparent">nuestra app</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg">
                            Estamos en fase de <strong className="text-slate-700">pulir y mejorar</strong> nuestra
                            aplicación para garantizar a los médicos el acceso a las subastas de forma{' '}
                            <strong className="text-slate-700">rápida y oportuna</strong>. Tu opinión nos ayuda
                            a construir la mejor experiencia.
                        </p>

                        <div className="space-y-3">
                            <a href="/descargas/alteha-medicos.apk"
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 to-violet-600 text-white rounded-2xl px-8 py-4 font-black text-lg shadow-lg shadow-violet-200 hover:scale-[1.02] transition-transform">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" />
                                </svg>
                                Descargar para Android
                            </a>
                            <p className="text-sm text-slate-400 font-semibold">
                                APK · 172 MB · Instalación directa (permite "orígenes desconocidos" si tu teléfono lo pide)
                            </p>
                        </div>

                        {/* Qué puedes probar */}
                        <div className="grid sm:grid-cols-2 gap-4 pt-2 max-w-lg">
                            {CARACTERISTICAS.map((c) => (
                                <div key={c.titulo} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-2.5">
                                    <Icono d={c.icono} extra={c.extra} />
                                    <div>
                                        <p className="font-black text-sm text-slate-800">{c.titulo}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-snug">{c.texto}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-slate-400 font-medium max-w-lg">
                            ¿Encontraste algo raro o tienes una idea? Escríbenos — cada comentario cuenta
                            para que la app llegue perfecta a todos los médicos de la red Alteha.
                        </p>
                    </div>

                    {/* ── Capturas reales de la app en marcos de teléfono ── */}
                    <div className="relative flex justify-center items-center h-[560px] lg:h-[640px]">
                        {/* Mancha de color suave detrás de los teléfonos */}
                        <div className="absolute w-[420px] h-[420px] rounded-full bg-gradient-to-br from-teal-100 to-violet-100 blur-2xl" />
                        <div className="absolute rotate-[-7deg] -translate-x-24 lg:-translate-x-32 translate-y-6">
                            <PhoneFrame src="/app/captura-aprobada.png" alt="Cuenta aprobada en Alteha" />
                        </div>
                        <div className="absolute rotate-[5deg] translate-x-20 lg:translate-x-28">
                            <PhoneFrame src="/app/captura-subastas.png" alt="Subastas activas en Alteha" destacada />
                        </div>
                    </div>
                </div>

                <footer className="mt-14 pt-6 border-t border-slate-100 text-center text-xs font-semibold text-slate-400">
                    AZAlteha · Sistema de Subastas · Versión de prueba para la red de médicos
                </footer>
            </div>
        </main>
    );
}

function PhoneFrame({ src, alt, destacada }: { src: string; alt: string; destacada?: boolean }) {
    return (
        <div className={`bg-slate-900 rounded-[2.4rem] p-2.5 shadow-2xl ${destacada ? 'shadow-slate-400/50' : 'shadow-slate-300/60 opacity-95'}`}>
            <div className="rounded-[1.9rem] overflow-hidden bg-white relative">
                {/* Notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-10" />
                <Image src={src} alt={alt} width={250} height={531} className="w-[230px] lg:w-[250px] h-auto" priority />
            </div>
        </div>
    );
}
