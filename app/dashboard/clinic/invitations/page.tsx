"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Mail, Building2, Stethoscope, DollarSign, CheckCircle2, XCircle, Clock,
    Loader2, AlertTriangle, CreditCard, Gavel, Inbox
} from 'lucide-react';
import { getClinicInvitations, respondClinicInvitation, getPaymentMethods } from '@/lib/api';

const METHOD_NAMES: Record<string, string> = {
    BS_BANK_TRANSFER: 'Transferencia Bs.',
    BS_PAGO_MOVIL: 'Pago Móvil',
    USD_WIRE_SWIFT: 'Wire / SWIFT (USD)',
    USD_ACH: 'ACH (USD)',
    USD_IBAN: 'IBAN (USD)',
    BINANCE_PAY: 'Binance Pay',
    CRYPTO_WALLET: 'Cripto',
};

const money = (n: any) => {
    const v = Number(n);
    if (!isFinite(v)) return '—';
    return v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ClinicInvitationsPage() {
    const [invitations, setInvitations] = useState<any[]>([]);
    const [clinicMethods, setClinicMethods] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [feeInputs, setFeeInputs] = useState<Record<number, string>>({});
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const [invs, methods] = await Promise.all([
                getClinicInvitations().catch(() => []),
                getPaymentMethods('CLINIC').catch(() => []),
            ]);
            setInvitations(Array.isArray(invs) ? invs : []);
            const types = (Array.isArray(methods) ? methods : [])
                .filter((m: any) => m.active !== false)
                .map((m: any) => m.methodType);
            setClinicMethods(types);
        } catch (e) {
            console.error('Error loading invitations', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Which of the auction's allowed methods the clinic is missing.
    const compatibility = (inv: any) => {
        const allowed: string[] = inv.allowedPaymentMethods || [];
        if (!allowed.length) return { ok: true, missing: [] as string[] };
        const has = allowed.some((a) => clinicMethods.includes(a));
        return { ok: has, missing: allowed };
    };

    const pending = invitations.filter((i) => i.status === 'PENDING');
    const answered = invitations.filter((i) => i.status !== 'PENDING');

    const accept = async (inv: any) => {
        setError('');
        const raw = feeInputs[inv.id];
        const fee = parseFloat(raw);
        if (raw === undefined || raw === '' || isNaN(fee) || fee < 0) {
            setError('Ingresa el monto de tus honorarios para aceptar.');
            return;
        }
        if (inv.clinicBudget != null && fee > Number(inv.clinicBudget)) {
            setError(`Tus honorarios no pueden superar el presupuesto de clínica de la subasta ($${money(inv.clinicBudget)}).`);
            return;
        }
        setBusyId(inv.id);
        try {
            const res = await respondClinicInvitation(inv.id, { accepted: true, clinicFee: fee });
            if (res?.id || res?.status === 'ACCEPTED') {
                await load();
            } else {
                setError(res?.message || 'No se pudo aceptar la invitación.');
            }
        } catch {
            setError('Error de conexión al responder la invitación.');
        } finally {
            setBusyId(null);
        }
    };

    const reject = async (inv: any) => {
        if (!confirm('¿Rechazar esta invitación?')) return;
        setError('');
        setBusyId(inv.id);
        try {
            const res = await respondClinicInvitation(inv.id, { accepted: false });
            if (res?.id || res?.status === 'REJECTED') {
                await load();
            } else {
                setError(res?.message || 'No se pudo rechazar la invitación.');
            }
        } catch {
            setError('Error de conexión al responder la invitación.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-8 font-outfit max-w-4xl mx-auto pb-20">
            <header className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Mail className="w-8 h-8 text-alteha-turquoise" />
                    Invitaciones
                </h1>
                <p className="text-slate-400 text-sm font-medium">
                    Invitaciones de médicos para participar en subastas. Si aceptas, defines tus honorarios y se arma la dupla visible para el seguro.
                </p>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5" /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : invitations.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">No tienes invitaciones todavía</p>
                    <p className="text-sm text-slate-400">Cuando un médico te invite a una subasta, aparecerá aquí.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {pending.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Pendientes ({pending.length})
                            </h2>
                            {pending.map((inv) => {
                                const compat = compatibility(inv);
                                const busy = busyId === inv.id;
                                return (
                                    <div key={inv.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise flex items-center gap-1.5">
                                                    <Gavel className="w-3.5 h-3.5" /> Subasta #{inv.auctionNumber || inv.auctionId}
                                                </p>
                                                <h3 className="text-lg font-black text-slate-900">{inv.auctionTitle || 'Subasta'}</h3>
                                                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                                                    <Stethoscope className="w-4 h-4 text-slate-400" />
                                                    Te invitó: <span className="font-bold text-slate-700">{inv.doctorName || 'Médico'}</span>
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-black">Pendiente</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Honorarios del médico</p>
                                                <p className="text-xl font-black text-slate-900">${money(inv.honorarios)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tu tope (presupuesto clínica)</p>
                                                <p className="text-xl font-black text-slate-900">{inv.clinicBudget != null ? `$${money(inv.clinicBudget)}` : 'Sin tope'}</p>
                                            </div>
                                        </div>

                                        {/* Payment-method compatibility guard */}
                                        {!compat.ok ? (
                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <CreditCard className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-black text-amber-800">Falta un método de cobro compatible</p>
                                                        <p className="text-xs text-amber-700 font-medium">
                                                            Esta subasta acepta: {compat.missing.map((m) => METHOD_NAMES[m] || m).join(', ')}. Agrega uno para poder aceptar.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/dashboard/clinic/payments?addMethod=${compat.missing[0]}&returnTo=${encodeURIComponent('/dashboard/clinic/invitations')}`}
                                                    className="inline-flex items-center gap-2 bg-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors"
                                                >
                                                    <CreditCard className="w-4 h-4" /> Configurar ahora
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                                    Tus honorarios (USD) — puedes bajarlos para ser más competitivo
                                                </label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={inv.clinicBudget != null ? Number(inv.clinicBudget) : undefined}
                                                        value={feeInputs[inv.id] ?? ''}
                                                        onChange={(e) => setFeeInputs((p) => ({ ...p, [inv.id]: e.target.value }))}
                                                        placeholder={inv.clinicBudget != null ? `Máximo ${money(inv.clinicBudget)}` : '0.00'}
                                                        className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise focus:bg-white rounded-xl font-black text-slate-900 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 pt-1">
                                            <button
                                                onClick={() => accept(inv)}
                                                disabled={busy || !compat.ok}
                                                className="flex-1 inline-flex items-center justify-center gap-2 bg-alteha-turquoise text-slate-900 font-black px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition-all"
                                            >
                                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Aceptar y armar dupla
                                            </button>
                                            <button
                                                onClick={() => reject(inv)}
                                                disabled={busy}
                                                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-500 font-bold px-5 py-3 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-50 transition-all"
                                            >
                                                <XCircle className="w-4 h-4" /> Rechazar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}

                    {answered.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Respondidas ({answered.length})</h2>
                            {answered.map((inv) => {
                                const accepted = inv.status === 'ACCEPTED';
                                return (
                                    <div key={inv.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                {inv.auctionTitle || `Subasta #${inv.auctionNumber}`}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">{inv.doctorName} · Honorarios médico ${money(inv.honorarios)}</p>
                                        </div>
                                        <div className="text-right">
                                            {accepted ? (
                                                <>
                                                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black inline-flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Aceptada
                                                    </span>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                                        Tus honorarios: <span className="font-black text-slate-800">${money(inv.clinicFee)}</span> · Total dupla: <span className="font-black text-slate-800">${money(inv.total)}</span>
                                                    </p>
                                                </>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-red-50 text-red-500 text-xs font-black inline-flex items-center gap-1">
                                                    <XCircle className="w-3.5 h-3.5" /> Rechazada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
