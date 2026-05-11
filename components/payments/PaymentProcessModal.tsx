"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import PaymentMethodsManager from '@/components/dashboard/PaymentMethodsManager';
import { CreditCard, ShieldCheck, Loader2, CheckCircle2, Wallet, ArrowRight, Building2, User, Landmark, Phone, CalendarDays, Hash } from 'lucide-react';
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

    // Form State
    const [reference, setReference] = useState('');
    const [originBank, setOriginBank] = useState('');
    const [originPhone, setOriginPhone] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
        setStep('confirm');
    };

    const isFormValid = () => {
        if (!selectedMethod) return false;
        if (!reference.trim()) return false;
        if (!transactionDate) return false;

        const type = selectedMethod.methodType;
        if (type === 'BS_PAGO_MOVIL') {
            if (!originBank.trim() || !originPhone.trim()) return false;
        } else if (type === 'BS_BANK_TRANSFER' || type === 'USD_WIRE_SWIFT' || type === 'USD_ACH' || type === 'USD_IBAN') {
            if (!originBank.trim()) return false;
        }

        return true;
    };

    const handleConfirmPayment = async () => {
        if (!isFormValid()) return;

        setIsProcessing(true);
        // Simulation of payment reporting
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStep('success');
        } catch (error) {
            console.error('Error reporting payment:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setStep('select');
        setSelectedMethod(null);
        setIsProcessing(false);
        setReference('');
        setOriginBank('');
        setOriginPhone('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
    };

    useEffect(() => {
        if (!isOpen) reset();
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => !isProcessing && onClose()}
            title={step === 'success' ? "" : "Reportar Pago de Adjudicación"}
            maxWidth={step === 'select' ? "max-w-6xl" : "max-w-2xl"}
        >
            <div className="py-4 max-h-[80vh] overflow-y-auto no-scrollbar px-2">
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
                        
                        <div>
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
                            <h3 className="text-2xl font-black text-slate-900">Reportar Transferencia</h3>
                            <p className="text-slate-500 font-medium">Por favor, realiza la transferencia a la cuenta de Alteha correspondiente y llena el formulario.</p>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 space-y-6 shadow-xl shadow-slate-100">
                            <div className="flex justify-between items-center pb-6 border-b border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total a Transferir</p>
                                    <p className="text-3xl font-black text-slate-900">${bid?.bidAmount?.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Subasta</p>
                                    <p className="font-bold text-slate-600">#{(bid as any)?.auctionNumber || '---'}</p>
                                </div>
                            </div>

                            {/* Alteha Instructions */}
                            <div className="p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl space-y-4 shadow-lg text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-5 h-5 text-alteha-turquoise" />
                                    <p className="text-xs font-black uppercase tracking-widest text-alteha-turquoise">Cuentas Recaudadoras Alteha</p>
                                </div>
                                
                                {selectedMethod.methodType === 'BS_BANK_TRANSFER' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Banco</span>
                                            <span className="text-xs font-black uppercase italic">Banesco Banco Universal</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Número de Cuenta</span>
                                            <span className="text-xs font-black">0134 0000 0000 0000 0000</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Titular</span>
                                            <span className="text-xs font-black">Alteha C.A.</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">RIF</span>
                                            <span className="text-xs font-black">J-50123456-7</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'BS_PAGO_MOVIL' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Banco</span>
                                            <span className="text-xs font-black uppercase italic">Banesco (0134)</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Teléfono</span>
                                            <span className="text-xs font-black">0414-1234567</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">RIF</span>
                                            <span className="text-xs font-black">J-50123456-7</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'USD_WIRE_SWIFT' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Bank</span>
                                            <span className="text-xs font-black">CHASE BANK (NY)</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">SWIFT/BIC</span>
                                            <span className="text-xs font-black">CHASUS33</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Account Name</span>
                                            <span className="text-xs font-black">Alteha Inc.</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Account Number</span>
                                            <span className="text-xs font-black">1234567890</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'USD_ACH' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Bank</span>
                                            <span className="text-xs font-black">CHASE BANK</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Routing Number</span>
                                            <span className="text-xs font-black">021000021</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Account Name</span>
                                            <span className="text-xs font-black">Alteha Inc.</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Account Number</span>
                                            <span className="text-xs font-black">1234567890</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'USD_IBAN' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Bank</span>
                                            <span className="text-xs font-black">BBVA (Spain)</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">IBAN</span>
                                            <span className="text-xs font-black">ES12 3456 7890 1234 5678 9012</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">BIC</span>
                                            <span className="text-xs font-black">BBVAESMMXXX</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Account Name</span>
                                            <span className="text-xs font-black">Alteha Europe S.L.</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'BINANCE_PAY' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Binance ID</span>
                                            <span className="text-xs font-black">88776655</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Email</span>
                                            <span className="text-xs font-black">payments@alteha.com</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Moneda</span>
                                            <span className="text-xs font-black">USDT</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'CRYPTO_WALLET' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Network</span>
                                            <span className="text-xs font-black">TRC20 (Tron)</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Asset</span>
                                            <span className="text-xs font-black">USDT</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Address</span>
                                            <span className="text-[10px] sm:text-xs font-black break-all">Txyz1234567890abcdefghijklmnopqrstuv</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {/* Payment Report Form */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-alteha-turquoise" />
                                    Datos de tu Operación
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Referencia / Hash / TXID *</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Hash className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={reference}
                                                onChange={(e) => setReference(e.target.value)}
                                                placeholder="Ej. 12345678" 
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-alteha-violet/50 focus:border-alteha-violet text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Fecha de Transacción *</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CalendarDays className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input 
                                                type="date" 
                                                value={transactionDate}
                                                onChange={(e) => setTransactionDate(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-alteha-violet/50 focus:border-alteha-violet text-sm font-medium"
                                            />
                                        </div>
                                    </div>

                                    {(selectedMethod.methodType === 'BS_BANK_TRANSFER' || 
                                      selectedMethod.methodType === 'BS_PAGO_MOVIL' || 
                                      selectedMethod.methodType === 'USD_WIRE_SWIFT' || 
                                      selectedMethod.methodType === 'USD_ACH' || 
                                      selectedMethod.methodType === 'USD_IBAN') && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Banco de Origen *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Landmark className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={originBank}
                                                    onChange={(e) => setOriginBank(e.target.value)}
                                                    placeholder="Ej. Banesco" 
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-alteha-violet/50 focus:border-alteha-violet text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod.methodType === 'BS_PAGO_MOVIL' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Teléfono de Origen *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={originPhone}
                                                    onChange={(e) => setOriginPhone(e.target.value)}
                                                    placeholder="Ej. 04141234567" 
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-alteha-violet/50 focus:border-alteha-violet text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing || !isFormValid()}
                                className={`w-full h-16 rounded-2xl font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all ${
                                    isFormValid() 
                                    ? 'bg-alteha-turquoise hover:bg-alteha-turquoise/90 text-white shadow-teal-500/20 hover:scale-[1.02]' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Reportar Pago
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
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">¡Reporte Enviado!</h3>
                            <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto">
                                Hemos recibido los datos de tu transferencia. Nuestro equipo de finanzas verificará los fondos en breve.
                            </p>
                        </div>
                        
                        <div className="bg-slate-50 rounded-[2rem] p-6 max-w-sm mx-auto border border-slate-100 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span className="text-xs font-bold text-slate-400">Referencia</span>
                                <span className="text-xs font-black text-slate-900">{reference}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span className="text-xs font-bold text-slate-400">Método</span>
                                <span className="text-xs font-black text-slate-900">{selectedMethod?.methodType.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Monto</span>
                                <span className="text-xs font-black text-alteha-violet">${bid?.bidAmount?.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            onClick={onClose}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform"
                        >
                            Cerrar Ventana
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
