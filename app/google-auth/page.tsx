"use client";

// Puente del ingreso con Google de la app móvil: Google exige una redirección
// https, así que aterriza aquí y esta página reenvía el token (viene en el
// fragmento #id_token=…) al esquema nativo alteha:// para volver a la app.
import { useEffect, useState } from 'react';

export default function GoogleAuthBridge() {
    const [target, setTarget] = useState('');

    useEffect(() => {
        const frag = window.location.hash
            || (window.location.search ? '#' + window.location.search.slice(1) : '');
        const t = 'alteha://google-auth' + frag;
        setTarget(t);
        window.location.replace(t);
    }, []);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 max-w-sm w-full text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                </div>
                <h1 className="text-xl font-black text-slate-800">Volviendo a Alteha…</h1>
                <p className="text-sm text-slate-500 font-medium">
                    Estamos regresando a la app para completar tu ingreso con Google.
                    Si no ocurre automáticamente, toca el botón.
                </p>
                {target && (
                    <a href={target}
                        className="inline-block w-full py-3 rounded-2xl bg-gradient-to-r from-teal-400 to-violet-500 text-white font-black text-sm">
                        Abrir la app Alteha
                    </a>
                )}
            </div>
        </main>
    );
}
