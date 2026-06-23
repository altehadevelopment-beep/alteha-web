"use client";

import React, { useState, useEffect } from 'react';
import {
    Banknote, Clock, CheckCircle2, AlertCircle, FileCheck,
    DollarSign, Upload, Loader2
} from 'lucide-react';
import { getAllAuctions, registerSettlement, type Auction, type SettlementPayload } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
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
                            <div className="text-center py-10 space-y-4">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Liquidación Registrada</h3>
                                <p className="text-slate-400 text-sm">El actor recibirá una notificación por correo.</p>
                                <Button onClick={() => { setSettlementAuction(null); setSuccess(false); }} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">Cerrar</Button>
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
                                        <select value={settlementForm.paymentMethodType} onChange={e => setSettlementForm(p => ({ ...p, paymentMethodType: e.target.value }))} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all">
                                            <option value="BS_PAGO_MOVIL">Pago Móvil (BS)</option>
                                            <option value="BS_BANK_TRANSFER">Transferencia BS</option>
                                            <option value="USD_ACH">ACH / Zelle (USD)</option>
                                            <option value="USD_WIRE_SWIFT">SWIFT (USD)</option>
                                            <option value="USD_IBAN">IBAN (EUR/USD)</option>
                                            <option value="BINANCE_PAY">Binance Pay</option>
                                            <option value="CRYPTO_WALLET">Crypto Wallet</option>
                                        </select>
                                    </div>
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
