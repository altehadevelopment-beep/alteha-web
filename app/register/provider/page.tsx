"use client";

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ArrowLeft, ArrowRight, Building, Stethoscope } from 'lucide-react';

export default function ProviderRegistration() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 font-outfit relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-alteha-turquoise/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/20 rounded-full blur-[120px]" />
            </div>

            <div className="z-10 bg-white/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl text-center max-w-lg border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-alteha-turquoise/50 to-alteha-violet/50" />

                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Logo className="w-16 h-16 drop-shadow-md" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Registro de Proveedores</h1>
                <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                    Selecciona el tipo de proveedor para comenzar tu registro en la red ALTEHA.
                </p>

                <div className="space-y-4 mb-10">
                    <Link
                        href="/register/pharmacy"
                        className="group flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-indigo-500 hover:bg-white transition-all text-left"
                    >
                        <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Building className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg">Farmacias</h3>
                            <p className="text-sm text-slate-400 font-medium">Venta de medicamentos y suministros</p>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-indigo-500" />
                        </div>
                    </Link>

                    <div className="group flex items-center gap-4 p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 opacity-60 cursor-not-allowed text-left">
                        <div className="w-14 h-14 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                            <Stethoscope className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-400 text-lg">Laboratorios</h3>
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold">PRÓXIMAMENTE</span>
                            </div>
                            <p className="text-sm text-slate-300 font-medium">Servicios diagnósticos y pruebas</p>
                        </div>
                    </div>
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                    <ArrowLeft className="w-5 h-5" /> Volver al Inicio
                </Link>
            </div>
        </div>
    );
}
