"use client";

import React from 'react';
import Link from 'next/link';
import { Lock, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Modal que aparece cuando el médico intenta usar una función que su plan no permite
 * (el backend responde con mensaje "PLAN_LIMIT: ..."). Lo obliga a pasar por Mi Plan.
 */
export function UpgradeModal({ message, onClose }: { message: string; onClose: () => void }) {
    const clean = message.replace(/^PLAN_LIMIT:\s*/i, '');
    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 text-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-xl"><X className="w-5 h-5" /></button>
                <div className="text-center space-y-3 relative z-10">
                    <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Función no incluida en tu plan</h3>
                    <p className="text-slate-300 text-sm font-medium">{clean}</p>
                </div>
                <div className="space-y-2.5 relative z-10">
                    <Link href="/dashboard/specialist/plan" className="block">
                        <Button className="w-full bg-alteha-turquoise text-slate-900 border-none py-3.5 font-black">
                            <span className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4" /> Ver planes y mejorar</span>
                        </Button>
                    </Link>
                    <button onClick={onClose} className="block mx-auto text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2">
                        Ahora no
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Modal intrusivo cuando el plan pago venció: exige actualizar el pago. */
export function PlanExpiredModal({ planName, onClose }: { planName: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 text-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-56 h-56 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="text-center space-y-3 relative z-10">
                    <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Tu plan {planName} venció</h3>
                    <p className="text-slate-300 text-sm font-medium">
                        Mientras no actualices el pago, tu cuenta funciona con los límites del plan gratuito
                        <strong className="text-white"> Alteha Explora</strong>: no podrás ofertar en subastas ni publicar paquetes.
                        Renueva ahora para recuperar todos tus beneficios.
                    </p>
                </div>
                <div className="space-y-2.5 relative z-10">
                    <Link href="/dashboard/specialist/plan" className="block">
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white border-none py-3.5 font-black">
                            Actualizar pago del plan
                        </Button>
                    </Link>
                    <button onClick={onClose} className="block mx-auto text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2">
                        Recordarme más tarde
                    </button>
                </div>
            </div>
        </div>
    );
}
