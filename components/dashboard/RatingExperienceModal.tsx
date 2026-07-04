"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
    PartyPopper, Sparkles, Loader2, CheckCircle2, ShieldCheck, Building2,
    HeartHandshake, FileText, ExternalLink, AlertTriangle, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { rateAuctionActor, validateSettlementReceipt, getAuctionAttachments } from '@/lib/api';
import { StarPicker, ratedStorageKey } from '@/components/payments/WinnerSettlementSection';

const RATING_HINTS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

type Step = { role: 'INSURANCE' | 'ALTEHA' | 'CLINIC'; label: string; sublabel: string | null; icon: any };
type Phase = 'confirm' | 'reject' | 'rejected' | 'rate' | 'done';

// Modal bloqueante post-liquidación:
// 1) Informa que los fondos fueron liquidados y muestra el comprobante.
// 2) El médico ACEPTA (→ SETTLED) o RECHAZA (→ vuelve a COMPLETED y Alteha re-registra el pago).
// 3) Solo si acepta, pide la valoración de cada actor (wizard, un actor por paso).
export function RatingExperienceModal({ auction, onClose }: { auction: any; onClose: () => void }) {
    const auctionNumber: string = auction.auctionNumber;

    const [phase, setPhase] = useState<Phase>(auction.status === 'PENDING_SETTLEMENT' ? 'confirm' : 'rate');
    const [proofs, setProofs] = useState<any[]>([]);
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');

    // Comprobante(s) de la liquidación para que el médico verifique antes de aceptar
    useEffect(() => {
        if (phase !== 'confirm') return;
        let active = true;
        getAuctionAttachments(auctionNumber, 'DOCTOR')
            .then((res: any) => {
                if (!active) return;
                const list: any[] = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
                setProofs(list.filter(a => (a.description || '').startsWith('Comprobante de Liquidación')));
            })
            .catch(() => { /* sin comprobante visible */ });
        return () => { active = false; };
    }, [auctionNumber, phase]);

    const acceptFunds = async () => {
        setConfirming(true);
        setConfirmError(null);
        try {
            const res = await validateSettlementReceipt({ auctionNumber, isReceived: true, notes: '' });
            if (res.code === '00') setPhase('rate'); // subasta → SETTLED; ahora sí, valoraciones
            else setConfirmError(res.message || 'Error al confirmar la recepción');
        } catch {
            setConfirmError('Error de conexión');
        } finally {
            setConfirming(false);
        }
    };

    const rejectFunds = async () => {
        setConfirming(true);
        setConfirmError(null);
        try {
            const res = await validateSettlementReceipt({ auctionNumber, isReceived: false, notes: rejectNotes });
            if (res.code === '00') setPhase('rejected'); // subasta → COMPLETED; Alteha re-registra
            else setConfirmError(res.message || 'Error al reportar el problema');
        } catch {
            setConfirmError('Error de conexión');
        } finally {
            setConfirming(false);
        }
    };

    // ===== Wizard de valoraciones =====
    const steps: Step[] = useMemo(() => {
        const all: Step[] = [
            { role: 'INSURANCE', label: 'Compañía de Seguros', sublabel: auction.insuranceCompany?.name || null, icon: ShieldCheck },
            { role: 'ALTEHA', label: 'Alteha', sublabel: 'Plataforma y gestión de pagos', icon: HeartHandshake },
        ];
        if (auction.awardedBid?.clinic) {
            all.push({ role: 'CLINIC', label: 'Clínica', sublabel: auction.awardedBid?.clinic?.name || null, icon: Building2 });
        }
        return all.filter(s => typeof window === 'undefined' || !localStorage.getItem(ratedStorageKey(auctionNumber, s.role)));
    }, [auction, auctionNumber]);

    const [stepIndex, setStepIndex] = useState(0);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [rateError, setRateError] = useState<string | null>(null);

    const step = steps[stepIndex];
    const Icon = step?.icon;
    const noStepsLeft = steps.length === 0;

    useEffect(() => {
        if (phase === 'rate' && noStepsLeft) setPhase('done');
    }, [phase, noStepsLeft]);

    const advance = () => {
        if (stepIndex + 1 < steps.length) {
            setStepIndex(i => i + 1);
            setRating(0);
            setComment('');
        } else {
            setPhase('done');
        }
    };

    const saveAndNext = async () => {
        if (!step || rating === 0) return;
        setSaving(true);
        setRateError(null);
        try {
            const res = await rateAuctionActor(auctionNumber, { targetRole: step.role, rating, comment });
            if (res.code !== '00') {
                // Actor no valorable (ej: clínica sin cuenta registrada): marcarlo y saltar en vez de trabar el flujo
                if ((res.message || '').includes('No account found')) {
                    try { localStorage.setItem(ratedStorageKey(auctionNumber, step.role), 'N/A'); } catch { /* ignore */ }
                    advance();
                    return;
                }
                setRateError(res.message || 'Error al guardar la valoración');
                return;
            }
            try { localStorage.setItem(ratedStorageKey(auctionNumber, step.role), String(Date.now())); } catch { /* ignore */ }
            advance();
        } catch {
            setRateError('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const snoozeAndClose = () => {
        try { sessionStorage.setItem(`alteha_rating_snooze_${auctionNumber}`, '1'); } catch { /* ignore */ }
        onClose();
    };

    const closeAndRefresh = () => {
        onClose();
        // El estado de la subasta cambió (SETTLED o COMPLETED): refrescar para actualizar badges
        try { window.location.reload(); } catch { /* ignore */ }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="bg-slate-900 text-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {/* ===== FASE 1: confirmar recepción de fondos ===== */}
                    {phase === 'confirm' && (
                        <>
                            <div className="text-center space-y-2 relative z-10">
                                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                    <Banknote className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">¡Tus fondos fueron liquidados!</h3>
                                <p className="text-slate-400 text-xs font-medium">
                                    Alteha registró el pago de la subasta <strong className="text-white">{auctionNumber}</strong> a tu método de cobro.
                                    Verifica el comprobante y confírmanos si recibiste los fondos.
                                </p>
                            </div>

                            {proofs.length > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comprobante de pago</p>
                                    {proofs.map(p => (
                                        <a key={p.id} href={p.fileUrl} target="_blank" rel="noopener noreferrer"
                                           className="flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2.5 transition-colors group">
                                            <span className="flex items-center gap-2.5 text-sm font-bold text-white truncate">
                                                <FileText className="w-4 h-4 text-alteha-turquoise shrink-0" />
                                                <span className="truncate">{p.fileName || 'Comprobante'}</span>
                                            </span>
                                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            )}

                            {confirmError && <p className="text-xs font-bold text-red-400 text-center relative z-10">{confirmError}</p>}

                            <div className="space-y-2.5 relative z-10">
                                <Button onClick={acceptFunds} disabled={confirming}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none py-4 font-black">
                                    {confirming
                                        ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</span>
                                        : <span className="flex items-center gap-2 justify-center"><CheckCircle2 className="w-4 h-4" /> Sí, recibí mis fondos</span>}
                                </Button>
                                <Button onClick={() => setPhase('reject')} disabled={confirming}
                                        className="w-full bg-white/5 hover:bg-white/10 text-red-400 border border-red-500/30 py-3.5 font-bold">
                                    <span className="flex items-center gap-2 justify-center"><AlertTriangle className="w-4 h-4" /> No he recibido los fondos</span>
                                </Button>
                                <button onClick={snoozeAndClose} className="block mx-auto text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2">
                                    Recordarme más tarde
                                </button>
                            </div>
                        </>
                    )}

                    {/* ===== FASE 1b: reportar que NO recibió ===== */}
                    {phase === 'reject' && (
                        <>
                            <div className="text-center space-y-2 relative z-10">
                                <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">¿No recibiste los fondos?</h3>
                                <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto">
                                    Al confirmar, la liquidación registrada se <strong className="text-white">cancelará</strong> y
                                    Alteha revisará el caso para <strong className="text-white">registrar el pago nuevamente</strong>.
                                </p>
                            </div>

                            <textarea
                                value={rejectNotes}
                                onChange={e => setRejectNotes(e.target.value)}
                                rows={3}
                                disabled={confirming}
                                placeholder="Cuéntanos qué pasó (ej: no veo el abono en mi cuenta)..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-red-400/50 resize-none relative z-10"
                            />
                            {confirmError && <p className="text-xs font-bold text-red-400 text-center relative z-10">{confirmError}</p>}

                            <div className="space-y-2.5 relative z-10">
                                <Button onClick={rejectFunds} disabled={confirming}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white border-none py-4 font-black">
                                    {confirming
                                        ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Reportando...</span>
                                        : 'Confirmar: no recibí los fondos'}
                                </Button>
                                <Button onClick={() => { setPhase('confirm'); setConfirmError(null); }} disabled={confirming}
                                        className="w-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 py-3.5 font-bold">
                                    Volver
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ===== FASE 1c: rechazo registrado ===== */}
                    {phase === 'rejected' && (
                        <div className="text-center space-y-5 relative z-10 py-6">
                            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black tracking-tight">Reporte registrado</h3>
                                <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">
                                    La liquidación fue cancelada y la subasta volvió a estado pendiente.
                                    <strong className="text-white"> Alteha revisará el caso y registrará el pago nuevamente.</strong> Te avisaremos por correo.
                                </p>
                            </div>
                            <Button onClick={closeAndRefresh} className="bg-white/10 hover:bg-white/20 text-white border-none px-10 py-3.5 mx-auto font-black">
                                Entendido
                            </Button>
                        </div>
                    )}

                    {/* ===== FASE 2: valoraciones (wizard) ===== */}
                    {phase === 'rate' && step && (
                        <>
                            <div className="text-center space-y-2 relative z-10">
                                <div className="w-12 h-12 bg-alteha-turquoise/20 text-alteha-turquoise rounded-full flex items-center justify-center mx-auto">
                                    <PartyPopper className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">¡El proceso de subasta ha terminado!</h3>
                                <p className="text-slate-400 text-xs font-medium">
                                    Recepción confirmada. Para cerrar, <span className="text-alteha-turquoise font-bold">cuéntanos cómo fue tu experiencia</span> con cada actor.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-2 relative z-10">
                                {steps.map((s, i) => (
                                    <div key={s.role} className={`h-1.5 w-12 rounded-full transition-colors ${i < stepIndex ? 'bg-emerald-400' : i === stepIndex ? 'bg-alteha-turquoise' : 'bg-white/10'}`} />
                                ))}
                                <span className="text-[11px] font-black text-slate-400 ml-1">{stepIndex + 1}/{steps.length}</span>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-alteha-turquoise/10 text-alteha-turquoise rounded-xl flex items-center justify-center shrink-0">
                                        {Icon && <Icon className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-black text-white leading-tight">{step.label}</p>
                                        {step.sublabel && <p className="text-[11px] text-slate-400 font-medium truncate">{step.sublabel}</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-1.5 py-1">
                                    <StarPicker value={rating} onChange={v => setRating(v)} disabled={saving} />
                                    <p className={`text-xs font-black h-4 ${rating > 0 ? 'text-amber-400' : 'text-transparent'}`}>{RATING_HINTS[rating]}</p>
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    rows={2}
                                    disabled={saving}
                                    placeholder="Comentario (opcional)..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-alteha-turquoise/50 resize-none"
                                />
                                {rateError && <p className="text-xs font-bold text-red-400">{rateError}</p>}
                            </div>

                            <div className="text-center space-y-2.5 relative z-10">
                                <Button
                                    onClick={saveAndNext}
                                    disabled={saving || rating === 0}
                                    className="w-full bg-alteha-turquoise text-slate-900 border-none py-4 font-black disabled:opacity-30"
                                >
                                    {saving
                                        ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</span>
                                        : rating === 0
                                            ? 'Selecciona una calificación'
                                            : stepIndex + 1 < steps.length ? 'Guardar y continuar' : 'Guardar y finalizar'}
                                </Button>
                                <button onClick={snoozeAndClose} className="block mx-auto text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2">
                                    Recordarme más tarde
                                </button>
                            </div>
                        </>
                    )}

                    {/* ===== FASE 3: gracias ===== */}
                    {phase === 'done' && (
                        <div className="text-center space-y-5 relative z-10 py-6">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black tracking-tight">¡Gracias por tu valoración!</h3>
                                <p className="text-slate-400 text-sm font-medium">El proceso de esta subasta quedó cerrado. Tu opinión nos ayuda a mejorar la red Alteha.</p>
                            </div>
                            <Button onClick={closeAndRefresh} className="bg-alteha-turquoise text-slate-900 border-none px-10 py-3.5 mx-auto font-black">
                                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Finalizar</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
