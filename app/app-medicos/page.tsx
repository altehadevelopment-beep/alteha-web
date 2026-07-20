import Image from 'next/image';

export const metadata = {
    title: 'Alteha Médicos — Prueba nuestra app',
    description: 'Ayúdanos a probar la app de Alteha para médicos: subastas médicas de forma rápida y oportuna, desde tu teléfono.',
};

// Página pública de descarga de la app de médicos (fase de pruebas).
export default function AppMedicos() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-teal-400 via-blue-500 to-violet-600 text-white overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 py-10 lg:py-16">
                {/* Marca */}
                <div className="flex items-center gap-3 mb-10">
                    <img src="/logoalteha.svg" alt="Alteha" className="h-12 w-auto brightness-0 invert" />
                    <span className="text-sm font-bold tracking-widest uppercase text-white/80">Subasta Médica Inversa</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* ── Mensaje + CTA ── */}
                    <div className="space-y-7">
                        <span className="inline-block bg-white/15 border border-white/30 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                            🧪 Versión de prueba · Android
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-black leading-tight">
                            Ayúdanos a probar<br />nuestra app
                        </h1>
                        <p className="text-lg text-white/90 font-medium leading-relaxed max-w-lg">
                            Estamos en fase de <strong>pulir y mejorar</strong> nuestra aplicación para garantizar
                            a los médicos el acceso a las subastas de forma <strong>rápida y oportuna</strong>.
                            Tu opinión nos ayuda a construir la mejor experiencia.
                        </p>

                        <div className="space-y-3">
                            <a href="/descargas/alteha-medicos.apk"
                                className="inline-flex items-center gap-3 bg-white text-slate-900 rounded-2xl px-8 py-4 font-black text-lg shadow-2xl hover:scale-[1.02] transition-transform">
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.6 9.48l1.84-3.18a.63.63 0 00-.22-.85.63.63 0 00-.87.22l-1.88 3.24a11.5 11.5 0 00-8.94 0L5.65 5.67a.63.63 0 00-.87-.22.63.63 0 00-.22.85L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                                </svg>
                                Descargar para Android
                            </a>
                            <p className="text-sm text-white/70 font-semibold">
                                APK · 172 MB · Instalación directa (permite "orígenes desconocidos" si tu teléfono lo pide)
                            </p>
                        </div>

                        {/* Qué puedes probar */}
                        <div className="grid sm:grid-cols-2 gap-3 pt-2 max-w-lg">
                            {[
                                ['⚡', 'Subastas en tiempo real', 'Casos de tu especialidad con presupuesto y condiciones claras.'],
                                ['🛡️', 'Verificación segura', 'Prueba de vida guiada por la cámara y revisión del documento.'],
                                ['🔔', 'Notificaciones push', 'Entérate al instante de nuevas subastas y aprobaciones.'],
                                ['💰', 'Oferta en segundos', 'Participa, gana y cobra tus intervenciones desde el teléfono.'],
                            ].map(([icono, titulo, texto]) => (
                                <div key={titulo as string} className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
                                    <p className="text-2xl">{icono}</p>
                                    <p className="font-black text-sm mt-1">{titulo}</p>
                                    <p className="text-xs text-white/75 font-medium mt-0.5 leading-snug">{texto}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-white/70 font-medium max-w-lg">
                            ¿Encontraste algo raro o tienes una idea? Escríbenos — cada comentario cuenta
                            para que la app llegue perfecta a todos los médicos de la red Alteha.
                        </p>
                    </div>

                    {/* ── Capturas en marcos de teléfono ── */}
                    <div className="relative flex justify-center items-center h-[560px] lg:h-[640px]">
                        <div className="absolute rotate-[-7deg] -translate-x-24 lg:-translate-x-32 translate-y-6">
                            <PhoneFrame src="/app/captura-aprobada.png" alt="Cuenta aprobada en Alteha" />
                        </div>
                        <div className="absolute rotate-[5deg] translate-x-20 lg:translate-x-28">
                            <PhoneFrame src="/app/captura-subastas.png" alt="Subastas activas en Alteha" destacada />
                        </div>
                    </div>
                </div>

                <footer className="mt-14 pt-6 border-t border-white/20 text-center text-xs font-semibold text-white/60">
                    AZAlteha · Subasta Médica Inversa · Versión de prueba para la red de médicos
                </footer>
            </div>
        </main>
    );
}

function PhoneFrame({ src, alt, destacada }: { src: string; alt: string; destacada?: boolean }) {
    return (
        <div className={`bg-slate-900 rounded-[2.4rem] p-2.5 shadow-2xl ${destacada ? 'shadow-black/40' : 'shadow-black/25 opacity-95'}`}>
            <div className="rounded-[1.9rem] overflow-hidden bg-white relative">
                {/* Notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-10" />
                <Image src={src} alt={alt} width={250} height={531} className="w-[230px] lg:w-[250px] h-auto" priority />
            </div>
        </div>
    );
}
