"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Ban, Loader2, Scale, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cancelAuction, withdrawBid } from '@/lib/api';
import {
    AUCTION_CANCEL_REASONS, BID_WITHDRAW_REASONS,
    cancelConsequences, withdrawConsequences,
} from './cancellation';

/** Selector de motivo con su explicación (regla de motivos compartida). */
function ReasonPicker({ reasons, value, onChange, text, setText }: any) {
    const selected = reasons.find((r: any) => r.code === value);
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Motivo</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-red-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all"
            >
                <option value="">— Selecciona el motivo —</option>
                {reasons.map((r: any) => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                ))}
            </select>
            {selected && (
                <p className="text-xs text-slate-500 font-medium bg-slate-50 rounded-xl p-3">{selected.hint}</p>
            )}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={value === 'OTRO' ? 'Describe la razón (obligatorio, mínimo 10 caracteres)…' : 'Detalles adicionales (opcional)…'}
                rows={3}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-red-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all resize-none"
            />
        </div>
    );
}

/**
 * Botón "Cancelar Subasta" del SEGURO. Aplica la matriz por estado:
 * libre sin ofertas, motivo obligatorio con ofertas, y desde AWARDED
 * redirige al módulo de Disputas (nunca unilateral).
 */
export function CancelAuctionButton({ auction, bidsCount, onCancelled }: {
    auction: { auctionNumber: string; status: string };
    bidsCount: number;
    onCancelled?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const rule = useMemo(() => cancelConsequences(auction.status, bidsCount), [auction.status, bidsCount]);
    // En estados terminales no mostramos nada
    if (['CANCELLED', 'SETTLED', 'CLOSED'].includes(auction.status)) return null;

    const submit = async () => {
        setError('');
        if (rule.needsReason && !reason) { setError('Debes seleccionar el motivo de la cancelación.'); return; }
        if (reason === 'OTRO' && text.trim().length < 10) { setError('Describe la razón (mínimo 10 caracteres).'); return; }
        setBusy(true);
        try {
            const res = await cancelAuction(auction.auctionNumber, { reasonCode: reason || undefined, reasonText: text.trim() || undefined });
            if (res?.code === '00') {
                setOpen(false);
                onCancelled ? onCancelled() : window.location.reload();
            } else {
                setError(res?.message || 'No se pudo cancelar la subasta.');
            }
        } catch {
            setError('Error de conexión al cancelar.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-red-100 bg-red-50 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
            >
                <Ban className="w-4 h-4" /> Cancelar Subasta
            </button>

            <Modal isOpen={open} onClose={() => setOpen(false)} title="Cancelar Subasta" maxWidth="max-w-lg">
                <div className="space-y-5">
                    {/* Explicación de lo que va a pasar en ESTE estado */}
                    <div className={`rounded-2xl p-4 flex gap-3 items-start ${rule.canCancel ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${rule.canCancel ? 'text-amber-500' : 'text-red-500'}`} />
                        <p className={`text-sm font-medium leading-relaxed ${rule.canCancel ? 'text-amber-800' : 'text-red-700'}`}>{rule.text}</p>
                    </div>

                    {rule.canCancel ? (
                        <>
                            {(rule.needsReason || true) && (
                                <ReasonPicker reasons={AUCTION_CANCEL_REASONS} value={reason} onChange={setReason} text={text} setText={setText} />
                            )}
                            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                            <div className="flex gap-3">
                                <button
                                    onClick={submit}
                                    disabled={busy}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-black px-5 py-3.5 rounded-xl disabled:opacity-60 transition-colors"
                                >
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                    Confirmar cancelación
                                </button>
                                <button onClick={() => setOpen(false)} className="px-5 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">
                                    Volver
                                </button>
                            </div>
                        </>
                    ) : (
                        <DisputeRedirect />
                    )}
                </div>
            </Modal>
        </>
    );
}

/**
 * Botón "Retirar Oferta" del OFERENTE (médico/clínica). Motivo obligatorio;
 * anula la dupla y avisa al socio. Post-adjudicación redirige a Disputas.
 */
export function WithdrawBidButton({ bid, auctionStatus, isDupla, onWithdrawn }: {
    bid: { id: number; status?: string; isWinning?: boolean };
    auctionStatus: string;
    isDupla: boolean;
    onWithdrawn?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const rule = useMemo(
        () => withdrawConsequences(auctionStatus, isDupla, !!bid.isWinning),
        [auctionStatus, isDupla, bid.isWinning]
    );
    if (bid.status && bid.status !== 'SUBMITTED') return null;

    const submit = async () => {
        setError('');
        if (!reason) { setError('Debes seleccionar el motivo del retiro.'); return; }
        if (reason === 'OTRO' && text.trim().length < 10) { setError('Describe la razón (mínimo 10 caracteres).'); return; }
        setBusy(true);
        try {
            const res = await withdrawBid(bid.id, { reasonCode: reason, reasonText: text.trim() || undefined });
            if (res?.code === '00') {
                setOpen(false);
                onWithdrawn ? onWithdrawn() : window.location.reload();
            } else {
                setError(res?.message || 'No se pudo retirar la oferta.');
            }
        } catch {
            setError('Error de conexión al retirar la oferta.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
            >
                <XCircle className="w-3.5 h-3.5" /> Retirar Oferta
            </button>

            <Modal isOpen={open} onClose={() => setOpen(false)} title="Retirar mi Oferta" maxWidth="max-w-lg">
                <div className="space-y-5">
                    <div className={`rounded-2xl p-4 flex gap-3 items-start ${rule.canWithdraw ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${rule.canWithdraw ? 'text-amber-500' : 'text-red-500'}`} />
                        <p className={`text-sm font-medium leading-relaxed ${rule.canWithdraw ? 'text-amber-800' : 'text-red-700'}`}>{rule.text}</p>
                    </div>

                    {rule.canWithdraw ? (
                        <>
                            <ReasonPicker reasons={BID_WITHDRAW_REASONS} value={reason} onChange={setReason} text={text} setText={setText} />
                            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                            <div className="flex gap-3">
                                <button
                                    onClick={submit}
                                    disabled={busy}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-black px-5 py-3.5 rounded-xl disabled:opacity-60 transition-colors"
                                >
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Confirmar retiro
                                </button>
                                <button onClick={() => setOpen(false)} className="px-5 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">
                                    Volver
                                </button>
                            </div>
                        </>
                    ) : (
                        <DisputeRedirect />
                    )}
                </div>
            </Modal>
        </>
    );
}

/** Guía al módulo de Disputas cuando la acción directa no está permitida. */
function DisputeRedirect() {
    const pathname = usePathname();
    const base = pathname?.includes('/clinic/') ? '/dashboard/clinic'
        : pathname?.includes('/insurance/') ? '/dashboard/insurance'
        : '/dashboard/specialist';
    return (
        <Link
            href={`${base === '/dashboard/insurance' ? base : base + '/disputes'}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-black px-5 py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
            <Scale className="w-4 h-4" /> Ir al módulo de Disputas
        </Link>
    );
}
