"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import PaymentMethodsManager from '@/components/dashboard/PaymentMethodsManager';
import { CreditCard, ShieldCheck, Loader2, CheckCircle2, Wallet, ArrowRight, Building2, User } from 'lucide-react';
import { type PaymentMethod, type BidDetailed } from '@/lib/api';

interface PaymentProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    bid: BidDetailed | null;
    auctionTitle: string;
    role: string;
}

export default function PaymentProcessModal({ isOpen, onClose, bid, auctionTitle, role }: PaymentProcessModalProps) {
    const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
        setStep('confirm');
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        // Simulation of payment processing
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStep('success');
        } catch (error) {
            console.error('Error processing payment:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setStep('select');
        setSelectedMethod(null);
        setIsProcessing(false);
    };

    useEffect(() => {
        if (!isOpen) reset();
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => !isProcessing && onClose()}
            title={step === 'success' ? "" : "Procesar Pago de Adjudicación"}
            maxWidth={step === 'select' ? "max-w-6xl" : "max-w-2xl"}
        >
            <div className="py-4">
                {step === 'select' && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Subasta</h4>
                                <p className="text-xl font-black text-slate-900">{auctionTitle}</p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Monto a Pagar</h4>
                                <p className="text-3xl font-black text-alteha-violet">${bid?.bidAmount?.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="px-2">
                            <PaymentMethodsManager 
                                role={role} 
                                selectionMode={true} 
                                onSelect={handleMethodSelect} 
                            />
                        </div>
                    </div>
                )}

                {step === 'confirm' && selectedMethod && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-alteha-turquoise/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-alteha-turquoise">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">Confirmar Transacción</h3>
                            <p className="text-slate-500 font-medium">Estás a punto de transferir los fondos correspondientes a la adjudicación.</p>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 space-y-6 shadow-xl shadow-slate-100">
                            <div className="flex justify-between items-center pb-6 border-b border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total</p>
                                    <p className="text-3xl font-black text-slate-900">${bid?.bidAmount?.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Subasta</p>
                                    <p className="font-bold text-slate-600">#{(bid as any)?.auctionNumber || '---'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desde (Tu Cuenta)</p>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-xl bg-alteha-turquoise text-white flex items-center justify-center">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">{selectedMethod.displayName}</p>
                                        <p className="text-xs font-bold text-slate-400">{selectedMethod.methodType.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hacia (Plataforma)</p>
                                <div className="flex items-center gap-4 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg">
                                    <div className="w-12 h-12 rounded-xl bg-alteha-turquoise text-slate-900 flex items-center justify-center">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black">ALTEHA PLATFORM</p>
                                        <p className="text-xs font-bold text-slate-400">Servicios de Custodia y Pago</p>
                                    </div>
                                </div>
                            </div>

                            {/* Manual Payment Instructions based on method */}
                            {(selectedMethod.methodType === 'BS_BANK_TRANSFER' || 
                              selectedMethod.methodType === 'USD_WIRE_SWIFT' || 
                              selectedMethod.methodType === 'BINANCE_PAY') && (
                                <div className="p-6 bg-alteha-turquoise/5 border-2 border-dashed border-alteha-turquoise/20 rounded-3xl space-y-4 animate-in zoom-in-95">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-alteha-turquoise animate-pulse" />
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Instrucciones de Depósito</p>
                                    </div>
                                    
                                    {selectedMethod.methodType === 'BS_BANK_TRANSFER' && (
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex justify-between border-b border-alteha-turquoise/10 pb-2">
                                                <span className="text-xs font-bold text-slate-500">Banco</span>
                                                <span className="text-xs font-black text-slate-900 uppercase italic">Banesco Banco Universal</span>
                                            </div>
                                            <div className="flex justify-between border-b border-alteha-turquoise/10 pb-2">
                                                <span className="text-xs font-bold text-slate-500">Número de Cuenta</span>
                                                <span className="text-xs font-black text-slate-900">0134 0000 0000 0000 0000</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-slate-500">RIF</span>
                                                <span className="text-xs font-black text-slate-900">J-50123456-7</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod.methodType === 'USD_WIRE_SWIFT' && (
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex justify-between border-b border-alteha-turquoise/10 pb-2">
                                                <span className="text-xs font-bold text-slate-500">Bank</span>
                                                <span className="text-xs font-black text-slate-900">CHASE BANK (NY)</span>
                                            </div>
                                            <div className="flex justify-between border-b border-alteha-turquoise/10 pb-2">
                                                <span className="text-xs font-bold text-slate-500">SWIFT/BIC</span>
                                                <span className="text-xs font-black text-slate-900">CHASUS33</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-slate-500">Account</span>
                                                <span className="text-xs font-black text-slate-900">1234567890</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod.methodType === 'BINANCE_PAY' && (
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex justify-between border-b border-alteha-turquoise/10 pb-2">
                                                <span className="text-xs font-bold text-slate-500">Binance ID</span>
                                                <span className="text-xs font-black text-slate-900">88776655</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-slate-500">Email</span>
                                                <span className="text-xs font-black text-slate-900">payments@alteha.com</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <p className="text-[10px] text-center text-slate-400 font-bold mt-4">
                                        * Por favor incluya el ID de Subasta #{(bid as any)?.auctionNumber} en la referencia.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing}
                                className="w-full h-16 bg-alteha-turquoise hover:bg-alteha-turquoise/90 text-white rounded-2xl font-black text-lg shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Confirmar y Pagar
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setStep('select')}
                                disabled={isProcessing}
                                className="w-full h-16 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all"
                            >
                                Cambiar método de pago
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center space-y-8 py-10 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
                            <CheckCircle2 className="w-14 h-14" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">¡Pago Exitoso!</h3>
                            <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto">
                                Los fondos han sido reservados y serán transferidos al finalizar la intervención médica.
                            </p>
                        </div>
                        
                        <div className="bg-slate-50 rounded-[2rem] p-6 max-w-sm mx-auto border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400">Comprobante</span>
                                <span className="text-xs font-black text-slate-900">#PAY-{Math.floor(Math.random() * 1000000)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Fecha</span>
                                <span className="text-xs font-black text-slate-900">{new Date().toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            onClick={onClose}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200"
                        >
                            Volver al Dashboard
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
