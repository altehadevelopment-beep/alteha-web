"use client";

import React, { useState, useEffect } from 'react';
import {
    Banknote, Clock, CheckCircle2, AlertCircle, FileCheck,
    DollarSign, Upload, Loader2
} from 'lucide-react';
import { getAllAuctions, registerSettlement, getWinnerPaymentMethods, getPendingSettlementRedemptions, settleRedemption, type Auction, type SettlementPayload, type PaymentMethod, type PackageRedemptionItem } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const METHOD_LABELS: Record<string, string> = {
    BS_PAGO_MOVIL: 'Pago Móvil (BS)',
    BS_BANK_TRANSFER: 'Transferencia BS',
    USD_ACH: 'ACH / Zelle (USD)',
    USD_WIRE_SWIFT: 'SWIFT (USD)',
    USD_IBAN: 'IBAN (EUR/USD)',
    BINANCE_PAY: 'Binance Pay',
    CRYPTO_WALLET: 'Crypto Wallet',
};

export default function SettlementsPage() {
    const [completedAuctions, setCompletedAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [settlementAuction, setSettlementAuction] = useState<Auction | null>(null);
    const [settlementForm, setSettlementForm] = useState<Partial<SettlementPayload>>({
        recipientRole: 'DOCTOR',
        paymentMethodType: 'BS_BANK_TRANSFER',
        amount: 0,
        referenceNumber: '',
        notes: ''
    });
    const [settlementProof, setSettlementProof] = useState<File | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    // Métodos de cobro que el destinatario (médico/clínica) tiene realmente registrados
    const [recipientMethods, setRecipientMethods] = useState<PaymentMethod[]>([]);
    const [methodsLoading, setMethodsLoading] = useState(false);
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
    // Oferta ganadora (modalidad + monto) y dupla (parte de la clínica en SOLO_MEDICO)
    const [winningBid, setWinningBid] = useState<any>(null);
    const [dupla, setDupla] = useState<any>(null);
    // Intervenciones de paquetes ejecutadas (con finiquito) pendientes de liquidar
    const [pkgRedemptions, setPkgRedemptions] = useState<PackageRedemptionItem[]>([]);
    // Operaciones de cambio GuiaPay activas de la subasta abierta
    const [exchangeOps, setExchangeOps] = useState<any[]>([]);
    const [settlingId, setSettlingId] = useState<number | null>(null);

    const loadPkgRedemptions = async () => {
        try { setPkgRedemptions(await getPendingSettlementRedemptions()); } catch { setPkgRedemptions([]); }
    };
    useEffect(() => { loadPkgRedemptions(); }, []);

    const handleSettleRedemption = async (r: PackageRedemptionItem) => {
        const notes = prompt(`Liquidar ${r.redemptionNumber} (${r.packageName}). Referencia/notas del pago al proveedor:`) ?? '';
        setSettlingId(r.id);
        try {
            const res: any = await settleRedemption(r.id, notes);
            if (res?.status === 'SETTLED' || res?.code === '00') await loadPkgRedemptions();
            else alert(res?.message || 'No se pudo liquidar.');
        } finally { setSettlingId(null); }
    };

    // Operaciones GuiaPay activas de la subasta abierta: marcan la moneda en la que debe ejecutarse el pago
    useEffect(() => {
        if (!settlementAuction?.auctionNumber) { setExchangeOps([]); return; }
        const token = localStorage.getItem('id_token');
        fetch('/api/exchange/all', { headers: { 'X-Alteha-Token': token || '' } })
            .then(r => r.json())
            .then(d => {
                const list = Array.isArray(d) ? d : [];
                setExchangeOps(list.filter((o: any) =>
                    o.auctionNumber === settlementAuction.auctionNumber &&
                    (o.status === 'REQUESTED' || o.status === 'SCHEDULED')
                ));
            })
            .catch(() => setExchangeOps([]));
    }, [settlementAuction?.auctionNumber]);

    // Al abrir el modal, carga la oferta ganadora y (si es dupla) la parte de la clínica
    useEffect(() => {
        if (!settlementAuction) { setWinningBid(null); setDupla(null); return; }
        let active = true;
        (async () => {
            try {
                let wb: any = (settlementAuction as any).awardedBid || null;
                if ((!wb || wb.modality == null || wb.bidAmount == null) && settlementAuction.id) {
                    const { getAuctionBids } = await import('@/lib/api');
                    const res = await getAuctionBids(settlementAuction.id);
                    const bids: any[] = Array.isArray(res) ? res : ((res as any)?.content ?? (res as any)?.data ?? []);
                    const awardedId = (settlementAuction as any).awardedBid?.id ?? null;
                    wb = bids.find((b: any) => awardedId ? b.id === awardedId : (b.isWinning || b.status === 'WINNING' || b.status === 'AWARDED' || b.status === 'ACCEPTED')) || wb || bids[0] || null;
                }
                if (!active) return;
                setWinningBid(wb || null);
                if (wb && (wb.modality === 'SOLO_MEDICO' || wb.modality === 'SOLO_CLINICA') && settlementAuction.id) {
                    try {
                        const { getAuctionDuplas } = await import('@/lib/api');
                        const duplas = await getAuctionDuplas(settlementAuction.id);
                        const d = (duplas || []).find((x: any) => String(x.bidId) === String(wb.id)) || (duplas || [])[0] || null;
                        if (active) setDupla(d);
                    } catch { /* ignore */ }
                } else {
                    setDupla(null);
                }
            } catch { /* ignore */ }
        })();
        return () => { active = false; };
    }, [settlementAuction]);

    // Monto que corresponde según destinatario + modalidad de la oferta ganadora
    const suggestedAmount = (role: string | undefined): number | null => {
        if (!winningBid) return null;
        const bidAmount = Number(winningBid.bidAmount ?? 0);
        if (winningBid.modality === 'SOLO_MEDICO') {
            if (role === 'DOCTOR') return bidAmount;                                  // honorarios médicos
            if (role === 'CLINIC') return dupla?.clinicFee != null ? Number(dupla.clinicFee) : null; // parte de la clínica
            return null;
        }
        if (winningBid.modality === 'SOLO_CLINICA') {
            // Dupla clínica→médico: la clínica cobra su oferta; el médico sus honorarios aceptados
            if (role === 'CLINIC') return bidAmount;
            if (role === 'DOCTOR') return dupla?.doctorFee != null ? Number(dupla.doctorFee) : (dupla?.honorarios != null ? Number(dupla.honorarios) : null);
            return null;
        }
        // PAQUETE_COMPLETO: el dueño de la oferta cobra el total y le paga al otro por fuera
        const clinicOwned = winningBid.bidType === 'BOTH' || winningBid.bidType === 'CLINIC_ONLY';
        if (role === 'DOCTOR') return clinicOwned ? 0 : bidAmount;
        if (role === 'CLINIC') return clinicOwned ? bidAmount : 0;
        return null;
    };

    // Prefija el monto correcto cuando cambia el destinatario o cargan la oferta/dupla
    useEffect(() => {
        const amt = suggestedAmount(settlementForm.recipientRole);
        if (amt != null) setSettlementForm(p => ({ ...p, amount: amt }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winningBid, dupla, settlementForm.recipientRole]);

    // Al abrir el modal (o cambiar el destinatario) trae solo los métodos registrados por ese destinatario
    useEffect(() => {
        const role = settlementForm.recipientRole;
        if (!settlementAuction || (role !== 'DOCTOR' && role !== 'CLINIC')) {
            setRecipientMethods([]);
            setSelectedMethodId(null);
            setSettlementForm(p => ({ ...p, paymentMethodType: '' }));
            return;
        }
        let active = true;
        setMethodsLoading(true);
        getWinnerPaymentMethods(settlementAuction.auctionNumber, role as 'DOCTOR' | 'CLINIC')
            .then(methods => {
                if (!active) return;
                const list = (methods || []).filter(m => m.active !== false);
                setRecipientMethods(list);
                // Si este destinatario es el socio de la dupla y eligió método al aceptar, usarlo
                const partnerRole = winningBid?.modality === 'SOLO_MEDICO' ? 'CLINIC' : (winningBid?.modality === 'SOLO_CLINICA' ? 'DOCTOR' : null);
                const chosen = partnerRole === role && dupla?.settlementMethodId != null
                    ? list.find((m: any) => String(m.id) === String(dupla.settlementMethodId))
                    : null;
                const first = chosen || list[0] || null;
                setSelectedMethodId(first?.id ?? null);
                setSettlementForm(p => ({ ...p, paymentMethodType: first?.methodType || '' }));
            })
            .catch(() => { if (active) { setRecipientMethods([]); setSelectedMethodId(null); setSettlementForm(p => ({ ...p, paymentMethodType: '' })); } })
            .finally(() => { if (active) setMethodsLoading(false); });
        return () => { active = false; };
    }, [settlementAuction, settlementForm.recipientRole]);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const result = await getAllAuctions('COMPLETED,PENDING_SETTLEMENT', 0, 50, 'updatedAt,desc');
                if (result.code === '00' && result.data) {
                    const content = (result.data as any).content || result.data;
                    setCompletedAuctions(Array.isArray(content) ? content : []);
                }
            } catch (err) {
                console.error('Error loading settlements:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    const openModal = (auction: Auction) => {
        setSettlementAuction(auction);
        setSuccess(false);
        setFormError(null);
        setSettlementProof(null);
        setSettlementForm({
            recipientRole: 'DOCTOR',
            paymentMethodType: 'BS_BANK_TRANSFER',
            amount: auction.awardedBid?.bidAmount || 0,
            referenceNumber: '',
            notes: ''
        });
    };

    const handleRegister = async () => {
        if (!settlementAuction || !settlementProof) return;
        if (!settlementForm.amount || !settlementForm.referenceNumber) {
            setFormError('El monto y la referencia son obligatorios.');
            return;
        }
        if (!settlementForm.paymentMethodType) {
            setFormError('El destinatario no tiene un método de cobro registrado. No se puede liquidar.');
            return;
        }
        setIsRegistering(true);
        setFormError(null);
        try {
            const payload: SettlementPayload = {
                auctionNumber: settlementAuction.auctionNumber,
                recipientRole: settlementForm.recipientRole as any,
                amount: Number(settlementForm.amount),
                paymentMethodType: settlementForm.paymentMethodType!,
                referenceNumber: settlementForm.referenceNumber!,
                notes: settlementForm.notes
            };
            const res = await registerSettlement(payload, settlementProof);
            if (res.code === '00') {
                setSuccess(true);
                setCompletedAuctions(prev => prev.map(a =>
                    a.auctionNumber === settlementAuction.auctionNumber ? { ...a, status: 'PENDING_SETTLEMENT' } : a
                ));
            } else {
                setFormError(res.message || 'Error al registrar la liquidación');
            }
        } catch (err: any) {
            setFormError(err.message || 'Error de conexión');
        } finally {
            setIsRegistering(false);
        }
    };

    const pending = completedAuctions.filter(a => a.status !== 'PENDING_SETTLEMENT').length;

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Liquidaciones</h1>
                <p className="text-slate-400 font-medium">Registra los pagos de liquidación para subastas completadas.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-sm">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold">Completadas</p>
                            <p className="text-2xl font-black text-slate-900">{completedAuctions.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold">Por Liquidar</p>
                            <p className="text-2xl font-black text-slate-900">{pending}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl p-6">
                <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-500" /> Subastas Completadas
                </h2>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-9 h-9 text-emerald-400 animate-spin mb-3" />
                        <p className="text-slate-400 text-sm font-bold">Cargando liquidaciones...</p>
                    </div>
                ) : completedAuctions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileCheck className="w-14 h-14 text-emerald-200 mb-3" />
                        <p className="font-black text-slate-700">Sin liquidaciones pendientes</p>
                        <p className="text-slate-400 text-sm mt-1">No hay subastas en estado COMPLETED o PENDING_SETTLEMENT.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {completedAuctions.map(auction => {
                            const isPending = auction.status === 'PENDING_SETTLEMENT';
                            return (
                                <div key={auction.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                            {isPending ? <Clock className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{auction.auctionNumber}</p>
                                            <p className="font-bold text-slate-900 text-sm">{auction.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {isPending ? 'ESPERANDO CONFIRMACIÓN' : 'COMPLETADA'}
                                                </span>
                                                {auction.awardedBid?.bidAmount && (
                                                    <span className="text-xs font-bold text-slate-400">
                                                        ${Number(auction.awardedBid.bidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isPending ? (
                                        <div className="w-full sm:w-auto px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                            <Clock className="w-4 h-4" /> Esperando Confirmación
                                        </div>
                                    ) : (
                                        <button onClick={() => openModal(auction)} className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md">
                                            <DollarSign className="w-4 h-4" /> Registrar Liquidación
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Intervenciones de paquetes por liquidar (redenciones con finiquito) ── */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 mt-8 space-y-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-alteha-violet" /> Intervenciones de Paquetes por Liquidar
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">
                        Intervenciones de paquetes comprados ya ejecutadas (finiquito recibido). Alteha debe liquidar cada una al médico/clínica.
                    </p>
                </div>
                {pkgRedemptions.length === 0 ? (
                    <p className="text-slate-400 font-bold text-sm py-6 text-center bg-slate-50 rounded-2xl">Sin intervenciones pendientes de liquidar. 🎉</p>
                ) : (
                    <div className="space-y-3">
                        {pkgRedemptions.map(r => (
                            <div key={r.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 rounded-2xl px-5 py-4">
                                <div className="min-w-0">
                                    <p className="font-black text-slate-800 truncate">{r.packageName} {r.procedureTypeName ? `· ${r.procedureTypeName}` : ''}</p>
                                    <p className="text-xs text-slate-500 font-bold">
                                        {r.redemptionNumber} · Paciente: {r.patientName || '—'} · Proveedor: {r.providerDoctorName ? `Dr. ${r.providerDoctorName}` : r.providerClinicName || '—'}
                                        {r.insuranceCompanyName ? ` · Seguro: ${r.insuranceCompanyName}` : ''}
                                    </p>
                                    {r.finiquitoUrl && (
                                        <a href={r.finiquitoUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-alteha-violet hover:underline">
                                            Ver finiquito ({r.finiquitoName || 'archivo'})
                                        </a>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleSettleRedemption(r)}
                                    disabled={settlingId === r.id}
                                    className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {settlingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                                    Liquidar al proveedor
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Settlement registration modal */}
            <Modal
                isOpen={!!settlementAuction}
                onClose={() => !isRegistering && (setSettlementAuction(null), setSuccess(false))}
                title="Registrar Pago de Liquidación"
                maxWidth="max-w-2xl"
            >
                {settlementAuction && (
                    <div className="space-y-6">
                        {success ? (
                            <div className="text-center py-8 space-y-5">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900">Liquidación Registrada</h3>
                                    <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
                                        {settlementForm.recipientRole === 'CLINIC' ? 'La clínica' : settlementForm.recipientRole === 'PHARMACY' ? 'La farmacia' : 'El médico'} recibirá
                                        una <strong className="text-slate-700">notificación por correo</strong> con el detalle del pago.
                                    </p>
                                </div>

                                {/* Resumen de lo registrado */}
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 max-w-md mx-auto text-left space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-400 uppercase tracking-wider">Monto</span>
                                        <span className="font-black text-slate-900">${Number(settlementForm.amount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-400 uppercase tracking-wider">Método</span>
                                        <span className="font-black text-slate-900">{METHOD_LABELS[settlementForm.paymentMethodType || ''] || settlementForm.paymentMethodType}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-400 uppercase tracking-wider">Referencia</span>
                                        <span className="font-black text-slate-900">{settlementForm.referenceNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-400 uppercase tracking-wider">Subasta</span>
                                        <span className="font-black text-slate-900">{settlementAuction.auctionNumber}</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                    Próximamente también enviaremos una notificación push a la app móvil del destinatario.
                                </p>

                                <Button onClick={() => { setSettlementAuction(null); setSuccess(false); }} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none px-10 mx-auto">Cerrar</Button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{settlementAuction.auctionNumber}</p>
                                        <p className="text-sm font-bold text-slate-900">{settlementAuction.title}</p>
                                    </div>
                                </div>

                                {/* GuiaPay: el destinatario pidió cobrar en otra moneda — el pago debe ejecutarse en esa moneda */}
                                {exchangeOps.map((op: any) => {
                                    const roleLabel = op.actorRole === 'CLINIC' ? 'La clínica' : op.actorRole === 'PHARMACY' ? 'La casa de salud' : 'El médico';
                                    const cur = (c: string) => c === 'BS' ? 'Bs' : c;
                                    const money = (n: any, c: string) => `${c === 'BS' ? 'Bs ' : c === 'USDT' ? '₮ ' : '$'}${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
                                    const matchesRecipient = op.actorRole === settlementForm.recipientRole;
                                    return (
                                        <div key={op.id} className={`rounded-2xl p-5 border-2 space-y-2 ${matchesRecipient ? 'bg-indigo-950 border-indigo-400' : 'bg-indigo-50 border-indigo-100'}`}>
                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-[#2e86c1] inline-block translate-y-[1px]" />
                                                    <span className="text-lg font-light lowercase tracking-tight leading-none">
                                                        <span className={matchesRecipient ? 'text-white' : 'text-slate-800'}>guia</span><span className="text-[#2e86c1]">pay</span>
                                                    </span>
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${matchesRecipient ? 'bg-amber-400 text-amber-950 animate-pulse' : 'bg-indigo-100 text-indigo-600'}`}>
                                                    Ejecutar el pago en {cur(op.toCurrency)}
                                                </span>
                                            </div>
                                            <p className={`text-sm font-bold ${matchesRecipient ? 'text-white' : 'text-slate-700'}`}>
                                                {roleLabel} ({op.actorEmail}) solicitó cobrar por GuíaPay en <strong>{cur(op.toCurrency)}</strong>:
                                                debe recibir <strong>{money(op.amountTarget, op.toCurrency)}</strong> por sus {money(op.amountOrigin, op.fromCurrency)}.
                                            </p>
                                            <p className={`text-[11px] font-medium ${matchesRecipient ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                Tasa BCV {Number(op.bcvRate || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} · gastos administrativos {op.marginRate}% (ganancia Alteha {money(op.altehaGain, op.toCurrency)}) · estado: {op.status === 'SCHEDULED' ? 'programada' : 'solicitada'}
                                            </p>
                                        </div>
                                    );
                                })}

                                {/* Fila 1: a quién y por qué método */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Destinatario</label>
                                        <select value={settlementForm.recipientRole} onChange={e => setSettlementForm(p => ({ ...p, recipientRole: e.target.value as any }))} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all">
                                            <option value="DOCTOR">Médico</option>
                                            <option value="CLINIC">Clínica</option>
                                            <option value="PHARMACY">Farmacia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Método de Pago</label>
                                        {methodsLoading ? (
                                            <div className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando métodos...
                                            </div>
                                        ) : recipientMethods.length === 0 ? (
                                            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-bold text-amber-700 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" /> Sin métodos de cobro registrados.
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedMethodId ?? ''}
                                                onChange={e => {
                                                    const id = Number(e.target.value);
                                                    const m = recipientMethods.find(x => x.id === id);
                                                    setSelectedMethodId(id);
                                                    setSettlementForm(p => ({ ...p, paymentMethodType: m?.methodType || '' }));
                                                }}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all"
                                            >
                                                {recipientMethods.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {METHOD_LABELS[m.methodType] || m.methodType}{m.displayName ? ` — ${m.displayName}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {/* Datos de la cuenta destino (ancho completo) */}
                                {(() => {
                                    const m = recipientMethods.find(x => x.id === selectedMethodId);
                                    if (!m) return null;
                                    const ba = m.bankAccount;
                                    const rows: { label: string; value: string }[] = [];
                                    if (ba?.holderFullName) rows.push({ label: 'Titular', value: `${ba.holderFullName}${ba?.holderDocument ? ` (${ba.holderDocument})` : ''}` });
                                    if (m.methodType === 'BS_PAGO_MOVIL') {
                                        if (ba?.bankName) rows.push({ label: 'Banco', value: `${ba.bankName}${ba?.bankCode ? ` (${ba.bankCode})` : ''}` });
                                        if (ba?.phone) rows.push({ label: 'Teléfono', value: ba.phone });
                                    } else if (m.methodType === 'BINANCE_PAY') {
                                        if (m.binancePayId) rows.push({ label: 'Binance Pay ID', value: m.binancePayId });
                                    } else if (m.methodType === 'CRYPTO_WALLET') {
                                        if (m.cryptoWalletAddress) rows.push({ label: 'Wallet', value: `${m.cryptoWalletAddress}${m.cryptoNetwork ? ` (${m.cryptoNetwork})` : ''}` });
                                    } else {
                                        if (ba?.bankName) rows.push({ label: 'Banco', value: ba.bankName });
                                        if (ba?.accountNumber) rows.push({ label: 'Cuenta', value: ba.accountNumber });
                                        if (ba?.swiftCode) rows.push({ label: 'SWIFT', value: ba.swiftCode });
                                        if (ba?.iban) rows.push({ label: 'IBAN', value: ba.iban });
                                    }
                                    if (rows.length === 0) return null;
                                    return (
                                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl px-5 py-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Cuenta destino</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1">
                                                {rows.map(r => (
                                                    <p key={r.label} className="text-xs text-slate-600 truncate"><span className="font-black text-slate-700">{r.label}:</span> {r.value}</p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Fila 2: monto y referencia */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Monto</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="number" step="0.01" value={settlementForm.amount} onChange={e => setSettlementForm(p => ({ ...p, amount: Number(e.target.value) }))} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Número de Referencia</label>
                                        <input type="text" value={settlementForm.referenceNumber} onChange={e => setSettlementForm(p => ({ ...p, referenceNumber: e.target.value }))} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all" placeholder="Ej: REF-998877" />
                                    </div>
                                </div>

                                {/* Desglose por modalidad (ancho completo) */}
                                {winningBid && (
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs text-slate-500">
                                        {winningBid.modality === 'SOLO_CLINICA' ? (
                                            <>
                                                <p className="font-black text-slate-600">Modalidad: Solo clínica (dupla con médico)</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                                    <p><span className="font-black text-slate-600">Clínica:</span> ${Number(winningBid.bidAmount ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                                                    <p><span className="font-black text-slate-600">Médico:</span> {dupla?.doctorFee != null ? `$${Number(dupla.doctorFee).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : 'no disponible'}</p>
                                                </div>
                                            </>
                                        ) : winningBid.modality === 'SOLO_MEDICO' ? (
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <p className="font-black text-slate-600">Modalidad: Solo médico (dupla con clínica)</p>
                                                <div className="flex gap-6">
                                                    <p><span className="font-black text-slate-600">Médico:</span> ${Number(winningBid.bidAmount ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                                                    <p><span className="font-black text-slate-600">Clínica:</span> {dupla?.clinicFee != null ? `$${Number(dupla.clinicFee).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : 'no disponible'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p><span className="font-black text-slate-600">Modalidad: Paquete completo.</span> El médico cobra el total (${Number(winningBid.bidAmount ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}) y paga a la clínica por su cuenta; no hay liquidación directa a la clínica.</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Notas (Opcional)</label>
                                    <textarea value={settlementForm.notes} onChange={e => setSettlementForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all resize-none" placeholder="Ej: Honorarios médicos liquidados..." />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Comprobante de Pago</label>
                                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors group">
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => setSettlementProof(e.target.files?.[0] || null)} />
                                        {settlementProof ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{settlementProof.name}</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-emerald-400 transition-colors" />
                                                <p className="text-sm font-bold text-slate-400">Seleccionar comprobante (PDF/IMG)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {formError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="w-1/2" onClick={() => setSettlementAuction(null)} disabled={isRegistering}>Cancelar</Button>
                                    <Button className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white border-none" onClick={handleRegister} disabled={isRegistering || !settlementProof}>
                                        {isRegistering ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</span> : <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Registrar</span>}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
