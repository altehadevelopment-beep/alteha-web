"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import PaymentMethodsManager from '@/components/dashboard/PaymentMethodsManager';
import { CreditCard, ShieldCheck, Loader2, CheckCircle2, Wallet, ArrowRight, Building2, User, Landmark, Phone, CalendarDays, Hash, Banknote, Globe, QrCode } from 'lucide-react';
import { type PaymentMethod, type BidDetailed, getAvailablePaymentMethodsForAuction, registerAuctionPaymentProof } from '@/lib/api';
import { cn } from '@/lib/utils';

const METHOD_TYPES = [
    { id: 'BS_PAGO_MOVIL', name: 'Pago Móvil (BS)', icon: Banknote, color: 'bg-emerald-500', description: 'Cobros rápidos en Bolívares' },
    { id: 'BS_BANK_TRANSFER', name: 'Transferencia BS', icon: Building2, color: 'bg-blue-500', description: 'Cuentas nacionales en Bolívares' },
    { id: 'USD_ACH', name: 'ACH / Zelle (USD)', icon: Banknote, color: 'bg-purple-500', description: 'Transferencias domésticas EE.UU.' },
    { id: 'USD_WIRE_SWIFT', name: 'SWIFT (USD)', icon: Globe, color: 'bg-indigo-500', description: 'Transferencias internacionales' },
    { id: 'USD_IBAN', name: 'IBAN (EUR/USD)', icon: Globe, color: 'bg-slate-700', description: 'Cuentas europeas / internacionales' },
    { id: 'BINANCE_PAY', name: 'Binance Pay', icon: QrCode, color: 'bg-amber-500', description: 'Pagos mediante Binance' },
    { id: 'CRYPTO_WALLET', name: 'Crypto Wallet', icon: Wallet, color: 'bg-orange-500', description: 'USDT (TRC20, ERC20, BEP20)' },
];

interface PaymentProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    bid: BidDetailed | null;
    auctionTitle: string;
    auctionNumber?: string;
    role: string;
    allowedPaymentMethods?: string[];
}

export default function PaymentProcessModal({ isOpen, onClose, bid, auctionTitle, auctionNumber, role, allowedPaymentMethods }: PaymentProcessModalProps) {
    const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form State
    const [reference, setReference] = useState('');
    const [originBank, setOriginBank] = useState('');
    const [originPhone, setOriginPhone] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);

    // Available Methods State
    const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
    const [isLoadingMethods, setIsLoadingMethods] = useState(false);

    useEffect(() => {
        if (isOpen && step === 'select' && bid) {
            const fetchMethods = async () => {
                setIsLoadingMethods(true);
                try {
                    const auctionNum = auctionNumber || (bid as any).auctionNumber;
                    if (auctionNum) {
                        let methods = await getAvailablePaymentMethodsForAuction(auctionNum);
                        
                        // Filter by allowedPaymentMethods if present
                        if (allowedPaymentMethods && allowedPaymentMethods.length > 0) {
                            methods = methods.filter(m => allowedPaymentMethods.includes(m.methodType));
                        }
                        
                        setAvailableMethods(methods || []);
                    } else {
                        console.error('No auctionNumber provided to fetch payment methods');
                    }
                } catch (error) {
                    console.error('Error fetching available methods:', error);
                } finally {
                    setIsLoadingMethods(false);
                }
            };
            fetchMethods();
        }
    }, [isOpen, step, bid, auctionNumber]);

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
        if (!isFormValid() || !selectedMethod) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            
            const paymentPayload: any = {
                auctionNumber: auctionNumber || (bid as any)?.auctionNumber,
                paymentMethodId: selectedMethod.id,
                paymentMethodType: selectedMethod.methodType,
                referenceNumber: reference.trim(),
                notes: notes.trim()
            };

            // Add payee if available in the method or use fallback (from logs it was 10)
            const payeeId = selectedMethod.owner?.id || (selectedMethod as any).payeeId || 10;
            paymentPayload.payee = { id: payeeId };
            
            // As user specified, payment is a string with type application/json
            formData.append('payment', new Blob([JSON.stringify(paymentPayload)], { type: 'application/json' }));
            
            if (proofFile) {
                formData.append('proof', proofFile);
            }

            const response = await registerAuctionPaymentProof(formData);
            console.log('Payment Proof Response:', response);
            
            if (response.code === '00' || response.status === 'success' || !response.code) {
                setStep('success');
            } else {
                console.log('Payment Proof Error Condition Hit. Code:', response.code);
                throw new Error(response.message || 'Error al registrar el pago');
            }
        } catch (error: any) {
            console.error('Error reporting payment. Full error:', error);
            alert(error.message || 'No se pudo registrar el pago. Por favor intente de nuevo.');
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
        setNotes('');
        setProofFile(null);
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
                            {isLoadingMethods ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-[2rem] border border-slate-100">
                                    <Loader2 className="w-12 h-12 text-alteha-turquoise animate-spin" />
                                    <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Cargando cuentas recaudadoras...</p>
                                </div>
                            ) : availableMethods.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-center px-6 gap-6">
                                    <div className="space-y-2">
                                        <Wallet className="w-12 h-12 text-slate-200 mx-auto" />
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">No hay cuentas disponibles</h3>
                                        <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm">
                                            No se encontraron cuentas recaudadoras configuradas para esta subasta. Contacta con soporte.
                                        </p>
                                    </div>
                                    
                                    {/* Diagnostic Curl Section */}
                                    <div className="w-full max-w-md bg-slate-900 rounded-3xl p-5 text-left shadow-2xl border border-slate-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-alteha-turquoise uppercase tracking-widest">Diagnóstico (cURL)</span>
                                            <span className="text-[10px] text-slate-500 font-mono">Prueba este comando en tu terminal</span>
                                        </div>
                                        <pre className="text-[11px] text-slate-300 font-mono break-all whitespace-pre-wrap leading-relaxed select-all">
                                            curl -X GET 'https://qaback.alteha.com:3232/api/auctions/{auctionNumber || 'AUC-ID'}/available-payment-methods' \<br/>
                                            &nbsp;&nbsp;-H 'X-Alteha-Token: {typeof window !== 'undefined' ? localStorage.getItem('alteha_token') || 'TU_TOKEN' : 'TU_TOKEN'}'
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <CreditCard className="w-6 h-6 text-alteha-turquoise" />
                                        <h3 className="text-xl font-black text-slate-900">
                                            {role === 'INSURANCE_COMPANY' ? 'Selecciona tu Método de Pago' : 'Cuentas Recaudadoras Alteha'}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableMethods.map(method => {
                                            const typeInfo = METHOD_TYPES.find(t => t.id === method.methodType) || METHOD_TYPES[0];
                                            const isPreferred = allowedPaymentMethods?.includes(method.methodType);
                                            return (
                                                <div 
                                                    key={method.id} 
                                                    onClick={() => handleMethodSelect(method)}
                                                    className="group relative bg-white p-6 rounded-[2rem] border-2 border-slate-100 cursor-pointer transition-all hover:border-alteha-turquoise shadow-sm hover:shadow-xl hover:shadow-teal-500/10 overflow-hidden isolate"
                                                >
                                                    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] -z-10 opacity-10 transition-opacity group-hover:opacity-20", typeInfo.color)} />
                                                    
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110", typeInfo.color)}>
                                                            <typeInfo.icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {isPreferred && (
                                                                <span className="bg-alteha-turquoise text-slate-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Preferido</span>
                                                            )}
                                                            <div className="w-8 h-8 rounded-xl bg-alteha-turquoise/10 flex items-center justify-center text-alteha-turquoise" title="Verificado">
                                                                <ShieldCheck className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-lg font-black text-slate-900 leading-tight mb-1">{method.displayName}</h4>
                                                            <p className="text-[9px] font-black text-alteha-turquoise uppercase tracking-[0.2em]">{typeInfo.name}</p>
                                                        </div>

                                                        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group-hover:bg-white transition-colors">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                                <Hash className="w-3 h-3" /> Información de Cuenta
                                                            </p>
                                                            <p className="font-mono text-xs font-bold text-slate-700 break-all leading-relaxed">
                                                                {method.methodType === 'BINANCE_PAY' 
                                                                    ? (method.binancePayId || method.binanceUserIdentifier)
                                                                    : method.methodType === 'CRYPTO_WALLET'
                                                                    ? method.cryptoWalletAddress
                                                                    : method.methodType === 'BS_PAGO_MOVIL'
                                                                    ? method.bankAccount?.phone
                                                                    : method.bankAccount?.accountNumber}
                                                            </p>
                                                            {method.bankAccount?.bankName && (
                                                                <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                                                                    <Building2 className="w-3 h-3" /> {method.bankAccount.bankName}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-end text-alteha-turquoise opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[10px] font-black uppercase tracking-widest mr-2">Pagar a esta cuenta</span>
                                                            <ArrowRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
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
                                            <span className="text-xs font-black uppercase italic">{selectedMethod.bankAccount?.bankName || 'BANCO'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Número de Cuenta</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.accountNumber || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Titular</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.holderFullName || '---'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Documento</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.holderDocument || '---'}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'BS_PAGO_MOVIL' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Banco</span>
                                            <span className="text-xs font-black uppercase italic">{selectedMethod.bankAccount?.bankName || 'BANCO'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Teléfono</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.phone || '---'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Documento</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.holderDocument || '---'}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'USD_WIRE_SWIFT' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Bank</span>
                                            <span className="text-xs font-black uppercase">{selectedMethod.bankAccount?.bankName || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">SWIFT/BIC</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.swiftCode || selectedMethod.bankAccount?.bic || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Account Name</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.holderFullName || '---'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Account Number</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.accountNumber || '---'}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'USD_ACH' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Bank</span>
                                            <span className="text-xs font-black uppercase">{selectedMethod.bankAccount?.bankName || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Routing Number</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.abaRoutingNumber || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Account Name</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.holderFullName || '---'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Account Number</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.accountNumber || '---'}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'USD_IBAN' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Bank</span>
                                            <span className="text-xs font-black uppercase">{selectedMethod.bankAccount?.bankName || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">IBAN</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.iban || selectedMethod.bankAccount?.accountNumber || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">BIC</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.bic || selectedMethod.bankAccount?.swiftCode || '---'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Account Name</span>
                                            <span className="text-xs font-black">{selectedMethod.bankAccount?.holderFullName || '---'}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'BINANCE_PAY' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Binance ID</span>
                                            <span className="text-xs font-black">{selectedMethod.binancePayId || '---'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">User / Email</span>
                                            <span className="text-xs font-black">{selectedMethod.binanceUserIdentifier || '---'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Instrucciones</span>
                                            <span className="text-[10px] font-bold text-alteha-turquoise">{selectedMethod.instructions || 'Usar Binance Pay'}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod.methodType === 'CRYPTO_WALLET' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Network</span>
                                            <span className="text-xs font-black">{selectedMethod.cryptoNetwork || 'TBD'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-400">Asset</span>
                                            <span className="text-xs font-black uppercase">{selectedMethod.cryptoSymbol || 'USDT'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">Address</span>
                                            <span className="text-[10px] sm:text-xs font-black break-all text-alteha-turquoise">{selectedMethod.cryptoWalletAddress || '---'}</span>
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
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Notas Adicionales (Opcional)</label>
                                    <textarea 
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Cualquier información relevante sobre el pago..." 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-alteha-violet/50 focus:border-alteha-violet text-sm font-medium min-h-[80px]"
                                    />
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Comprobante (Opcional pero recomendado)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-alteha-violet/50 focus:border-alteha-violet text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-alteha-violet/10 file:text-alteha-violet hover:file:bg-alteha-violet/20"
                                    />
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
