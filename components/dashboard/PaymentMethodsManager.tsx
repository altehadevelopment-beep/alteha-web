"use client";

import React, { useState, useEffect } from 'react';
import { 
    CreditCard, Plus, Trash2, CheckCircle2, ShieldCheck, 
    AlertCircle, X, Wallet, Building2, Globe, Banknote,
    QrCode, ExternalLink, Loader2, Info, ArrowRight,
    MapPin, Hash, Phone as PhoneIcon, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, type PaymentMethod } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface PaymentMethodsManagerProps {
    role: string;
    onSelect?: (method: PaymentMethod) => void;
    selectionMode?: boolean;
}

const METHOD_TYPES = [
    { id: 'BS_PAGO_MOVIL', name: 'Pago Móvil (BS)', icon: Banknote, color: 'bg-emerald-500', description: 'Cobros rápidos en Bolívares' },
    { id: 'BS_BANK_TRANSFER', name: 'Transferencia BS', icon: Building2, color: 'bg-blue-500', description: 'Cuentas nacionales en Bolívares' },
    { id: 'USD_ACH', name: 'ACH / Zelle (USD)', icon: Banknote, color: 'bg-purple-500', description: 'Transferencias domésticas EE.UU.' },
    { id: 'USD_WIRE_SWIFT', name: 'SWIFT (USD)', icon: Globe, color: 'bg-indigo-500', description: 'Transferencias internacionales' },
    { id: 'USD_IBAN', name: 'IBAN (EUR/USD)', icon: Globe, color: 'bg-slate-700', description: 'Cuentas europeas / internacionales' },
    { id: 'BINANCE_PAY', name: 'Binance Pay', icon: QrCode, color: 'bg-amber-500', description: 'Pagos mediante Binance' },
    { id: 'CRYPTO_WALLET', name: 'Crypto Wallet', icon: Wallet, color: 'bg-orange-500', description: 'USDT (TRC20, ERC20, BEP20)' },
];

import { useSearchParams } from 'next/navigation';

export default function PaymentMethodsManager({ role, onSelect, selectionMode = false }: PaymentMethodsManagerProps) {
    const searchParams = useSearchParams();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<PaymentMethod>>({
        displayName: '',
        beneficiaryType: 'PERSON',
        methodType: 'BS_PAGO_MOVIL' as any,
        country: { id: 1 },
        bankAccount: {
            currency: 'VES',
            holderFullName: '',
            holderDocument: '',
            bankName: '',
            bankCode: '',
            phone: '',
            accountNumber: '',
            swiftCode: '',
            abaRoutingNumber: '',
            iban: '',
            bankCountry: '',
            bankAddress: ''
        }
    });

    useEffect(() => {
        loadMethods();
        
        // Auto-select method type if passed via query params
        const addMethod = searchParams.get('addMethod');
        if (addMethod && METHOD_TYPES.some(t => t.id === addMethod)) {
            setIsAdding(true);
            
            setSelectedType(addMethod);
            setFormData(prev => ({
                ...prev,
                methodType: addMethod as any,
                displayName: `Mi ${METHOD_TYPES.find(t => t.id === addMethod)?.name}`,
                bankAccount: {
                    ...prev.bankAccount!,
                    currency: addMethod.startsWith('BS') ? 'VES' : (addMethod === 'USD_IBAN' ? 'EUR' : 'USD')
                }
            }));
        }
    }, [role, searchParams]);

    async function loadMethods() {
        setIsLoading(true);
        try {
            const res = await getPaymentMethods(role);
            if (res.code === '00') {
                const data = res.data;
                if (Array.isArray(data)) {
                    setMethods(data);
                } else if (data && typeof data === 'object' && Array.isArray((data as any).content)) {
                    // Handle Spring Boot Page object
                    setMethods((data as any).content);
                } else {
                    setMethods([]);
                }
            }
        } catch (error) {
            console.error('Error loading methods:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(method: PaymentMethod) {
        if (!confirm(`¿Eliminar "${method.displayName}"? Esta acción no se puede deshacer.`)) return;
        setIsLoading(true);
        try {
            await deletePaymentMethod(method.id!, role);
            await loadMethods();
        } catch (error) {
            console.error('Error deleting method:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const resetForm = () => {
        setFormData({
            displayName: '',
            beneficiaryType: 'PERSON',
            methodType: 'BS_PAGO_MOVIL' as any,
            country: { id: 1 },
            bankAccount: {
                currency: 'VES',
                holderFullName: '',
                holderDocument: '',
                bankName: '',
                bankCode: '',
                phone: '',
                accountNumber: '',
                swiftCode: '',
                abaRoutingNumber: '',
                iban: '',
                bankCountry: '',
                bankAddress: ''
            }
        });
        setSelectedType(null);
        setIsAdding(false);
        setEditingMethod(null);
    };

    const handleTypeSelect = (type: string) => {
        setSelectedType(type);
        setFormData(prev => ({
            ...prev,
            methodType: type as any,
            displayName: `Mi ${METHOD_TYPES.find(t => t.id === type)?.name}`,
            bankAccount: {
                ...prev.bankAccount!,
                currency: type.startsWith('BS') ? 'VES' : (type === 'USD_IBAN' ? 'EUR' : 'USD')
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Clone and clean payload
            const payload = JSON.parse(JSON.stringify({ ...formData, actorRole: role }));
            
            // Backend expects specific structures
            if (payload.methodType === 'BINANCE_PAY' || payload.methodType === 'CRYPTO_WALLET') {
                delete payload.bankAccount;
            } else if (payload.bankAccount) {
                // Filter bankAccount fields based on type
                const bank = payload.bankAccount;
                const cleanBank: any = {
                    currency: bank.currency,
                    holderFullName: bank.holderFullName,
                    holderDocument: bank.holderDocument,
                    bankName: bank.bankName
                };

                if (payload.methodType === 'BS_PAGO_MOVIL') {
                    cleanBank.phone = bank.phone;
                    cleanBank.bankCode = bank.bankCode;
                } else if (payload.methodType === 'BS_BANK_TRANSFER') {
                    cleanBank.accountNumber = bank.accountNumber;
                    cleanBank.bankCode = bank.bankCode;
                } else if (payload.methodType === 'USD_WIRE_SWIFT') {
                    cleanBank.swiftCode = bank.swiftCode;
                    cleanBank.accountNumber = bank.accountNumber;
                    cleanBank.bankCountry = bank.bankCountry;
                    cleanBank.bankAddress = bank.bankAddress;
                } else if (payload.methodType === 'USD_ACH') {
                    cleanBank.abaRoutingNumber = bank.abaRoutingNumber;
                    cleanBank.accountNumber = bank.accountNumber;
                } else if (payload.methodType === 'USD_IBAN') {
                    cleanBank.iban = bank.iban;
                    cleanBank.swiftCode = bank.swiftCode;
                    cleanBank.bankCountry = bank.bankCountry;
                }
                payload.bankAccount = cleanBank;
            }

            let res;
            if (editingMethod?.id) {
                res = await updatePaymentMethod(editingMethod.id, payload, role);
            } else {
                res = await createPaymentMethod(payload);
            }

            if (res.code === '00' || (res as any).id) {
                await loadMethods();
                resetForm();
            } else {
                alert(res.message || 'Error al guardar el método de pago');
            }
        } catch (error) {
            console.error('Error saving method:', error);
            alert('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleActive = async (method: PaymentMethod) => {
        if (!method.id) return;
        try {
            const updated = { ...method, active: !method.active };
            const res = await updatePaymentMethod(method.id, updated, role);
            if (res.code === '00') loadMethods();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-alteha-turquoise" />
                        {selectionMode ? 'Seleccionar Método de Cobro' : 'Métodos de Cobro'}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {selectionMode 
                            ? 'Elige una de tus cuentas guardadas o agrega una nueva para procesar el pago.'
                            : 'Configura tus cuentas para gestionar tus cobros de forma segura.'}
                    </p>
                </div>
                {!isAdding && !editingMethod && (
                    <Button 
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900 text-white rounded-2xl px-8 h-14 font-black shadow-xl shadow-slate-900/20 hover:scale-105 transition-all"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Agregar Método
                    </Button>
                )}
            </div>

            {isLoading && methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 text-alteha-turquoise animate-spin" />
                    <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Cargando métodos...</p>
                </div>
            ) : isAdding || editingMethod ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-8 md:p-12">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-slate-900">
                                {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                            </h3>
                            <button onClick={resetForm} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {!selectedType && !editingMethod ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {METHOD_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className="flex items-center gap-5 p-6 rounded-[2rem] border-2 border-slate-50 hover:border-alteha-turquoise/30 hover:bg-slate-50 transition-all text-left group"
                                    >
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", type.color)}>
                                            <type.icon className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 text-lg leading-tight">{type.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{type.description}</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-alteha-turquoise group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    {/* Common Fields */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre de Identificación (Alias)</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input 
                                                required
                                                value={formData.displayName}
                                                onChange={e => setFormData({...formData, displayName: e.target.value})}
                                                placeholder="Ej: Mi Cuenta Personal Banesco"
                                                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-alteha-turquoise/10 outline-none font-bold text-slate-700 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Beneficiario</label>
                                        <select 
                                            value={formData.beneficiaryType}
                                            onChange={e => setFormData({...formData, beneficiaryType: e.target.value as any})}
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-alteha-turquoise/10 outline-none font-bold text-slate-700 transition-all appearance-none"
                                        >
                                            <option value="PERSON">Persona Natural</option>
                                            <option value="BUSINESS">Persona Jurídica (Empresa)</option>
                                        </select>
                                    </div>

                                    {/* Specific Fields based on Method */}
                                    {formData.methodType === 'BINANCE_PAY' ? (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Binance Pay ID</label>
                                                <div className="relative">
                                                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input 
                                                        value={formData.binancePayId || ''}
                                                        onChange={e => setFormData({...formData, binancePayId: e.target.value})}
                                                        placeholder="9 dígitos (opcional si usas email)"
                                                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email o User ID de Binance</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input 
                                                        value={formData.binanceUserIdentifier || ''}
                                                        onChange={e => setFormData({...formData, binanceUserIdentifier: e.target.value})}
                                                        placeholder="usuario@email.com"
                                                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : formData.methodType === 'CRYPTO_WALLET' ? (
                                        <>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Dirección de Wallet</label>
                                                <div className="relative">
                                                    <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input 
                                                        required
                                                        value={formData.cryptoWalletAddress || ''}
                                                        onChange={e => setFormData({...formData, cryptoWalletAddress: e.target.value})}
                                                        placeholder="0x... o T... (Asegúrate de que la dirección sea correcta)"
                                                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Red (Network)</label>
                                                <select 
                                                    value={formData.cryptoNetwork || 'TRC20'}
                                                    onChange={e => setFormData({...formData, cryptoNetwork: e.target.value})}
                                                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                >
                                                    <option value="TRC20">TRC20 (Tron)</option>
                                                    <option value="ERC20">ERC20 (Ethereum)</option>
                                                    <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                                                    <option value="SOL">Solana</option>
                                                    <option value="POLYGON">Polygon (Matic)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Criptoactivo</label>
                                                <input 
                                                    value={formData.cryptoAsset || 'USDT'}
                                                    onChange={e => setFormData({...formData, cryptoAsset: e.target.value})}
                                                    placeholder="USDT, USDC, BTC..."
                                                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Bank Account Fields */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Titular Completo</label>
                                                <div className="relative">
                                                    <Info className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input 
                                                        required
                                                        value={formData.bankAccount?.holderFullName}
                                                        onChange={e => setFormData({
                                                            ...formData, 
                                                            bankAccount: {...formData.bankAccount!, holderFullName: e.target.value}
                                                        })}
                                                        placeholder="Nombre como aparece en el banco"
                                                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cédula / RIF / ID Fiscal</label>
                                                <div className="relative">
                                                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input 
                                                        required
                                                        value={formData.bankAccount?.holderDocument}
                                                        onChange={e => setFormData({
                                                            ...formData, 
                                                            bankAccount: {...formData.bankAccount!, holderDocument: e.target.value}
                                                        })}
                                                        placeholder="V-12345678 o J-12345678"
                                                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre del Banco</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input 
                                                        required
                                                        value={formData.bankAccount?.bankName}
                                                        onChange={e => setFormData({
                                                            ...formData, 
                                                            bankAccount: {...formData.bankAccount!, bankName: e.target.value}
                                                        })}
                                                        placeholder="Ej: Banesco, Wells Fargo, BBVA..."
                                                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                    />
                                                </div>
                                            </div>

                                            {/* Conditional Bank Fields */}
                                            {formData.methodType === 'BS_PAGO_MOVIL' ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número Celular</label>
                                                        <div className="relative">
                                                            <PhoneIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                            <input 
                                                                required
                                                                value={formData.bankAccount?.phone}
                                                                onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, phone: e.target.value}})}
                                                                placeholder="04121234567"
                                                                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Código Banco (4 dígitos)</label>
                                                        <input 
                                                            required
                                                            maxLength={4}
                                                            value={formData.bankAccount?.bankCode}
                                                            onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, bankCode: e.target.value}})}
                                                            placeholder="0134"
                                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número de Cuenta</label>
                                                    <div className="relative">
                                                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                        <input 
                                                            required
                                                            value={formData.bankAccount?.accountNumber}
                                                            onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, accountNumber: e.target.value}})}
                                                            placeholder="00000000000000000000"
                                                            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {formData.methodType === 'BS_BANK_TRANSFER' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Código Banco</label>
                                                    <input 
                                                        required
                                                        maxLength={4}
                                                        value={formData.bankAccount?.bankCode}
                                                        onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, bankCode: e.target.value}})}
                                                        placeholder="0134"
                                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                    />
                                                </div>
                                            )}

                                            {formData.methodType === 'USD_WIRE_SWIFT' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Código SWIFT</label>
                                                        <input 
                                                            required
                                                            value={formData.bankAccount?.swiftCode}
                                                            onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, swiftCode: e.target.value}})}
                                                            placeholder="SWIFTCODE"
                                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">País del Banco</label>
                                                        <input 
                                                            required
                                                            value={formData.bankAccount?.bankCountry}
                                                            onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, bankCountry: e.target.value}})}
                                                            placeholder="United States, Spain, etc."
                                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Dirección del Banco</label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                            <input 
                                                                required
                                                                value={formData.bankAccount?.bankAddress}
                                                                onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, bankAddress: e.target.value}})}
                                                                placeholder="Dirección física de la sucursal"
                                                                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {formData.methodType === 'USD_ACH' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número de Ruta (ABA)</label>
                                                    <input 
                                                        required
                                                        value={formData.bankAccount?.abaRoutingNumber}
                                                        onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, abaRoutingNumber: e.target.value}})}
                                                        placeholder="121000248"
                                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                    />
                                                </div>
                                            )}

                                            {formData.methodType === 'USD_IBAN' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">IBAN</label>
                                                        <input 
                                                            required
                                                            value={formData.bankAccount?.iban}
                                                            onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, iban: e.target.value}})}
                                                            placeholder="ES91..."
                                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">SWIFT / BIC</label>
                                                        <input 
                                                            required
                                                            value={formData.bankAccount?.swiftCode}
                                                            onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, swiftCode: e.target.value}})}
                                                            placeholder="SWIFTCODE"
                                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">País del Banco</label>
                                                        <input 
                                                            required
                                                            value={formData.bankAccount?.bankCountry}
                                                            onChange={e => setFormData({...formData, bankAccount: {...formData.bankAccount!, bankCountry: e.target.value}})}
                                                            placeholder="Spain, Germany, etc."
                                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 font-bold"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-sm">
                                        Al guardar, confirmas que la información proporcionada es veraz y eres el titular legal de la cuenta.
                                    </p>
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <Button variant="outline" onClick={resetForm} className="flex-1 md:flex-none h-14 rounded-2xl px-10 font-black">
                                            Cancelar
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="flex-1 md:flex-none h-14 bg-alteha-turquoise hover:bg-alteha-turquoise/90 text-white rounded-2xl px-16 font-black shadow-xl shadow-teal-500/20 transition-all hover:scale-105"
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingMethod ? 'Actualizar' : 'Guardar Método'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            ) : methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm text-center px-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-8">
                        <CreditCard className="w-12 h-12 text-slate-200" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Configura tus Pagos</h3>
                    <p className="text-slate-400 font-medium mb-10 max-w-md mx-auto">
                        No tienes métodos de pago registrados. Agrega una cuenta para empezar a recibir o realizar transacciones en la plataforma.
                    </p>
                    <Button 
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900 text-white rounded-2xl px-12 h-16 font-black text-lg shadow-2xl shadow-slate-900/20 hover:scale-105 transition-all"
                    >
                        Agregar mi primer método
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {methods.map(method => {
                        const typeInfo = METHOD_TYPES.find(t => t.id === method.methodType) || METHOD_TYPES[0];
                        return (
                            <div 
                                key={method.id} 
                                onClick={() => selectionMode && onSelect?.(method)}
                                className={cn(
                                    "group relative bg-white p-8 rounded-[2.5rem] border-2 transition-all overflow-hidden isolate",
                                    selectionMode ? "cursor-pointer hover:border-alteha-turquoise shadow-sm hover:shadow-2xl hover:shadow-teal-500/10" : "border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-2"
                                )}
                            >
                                <div className={cn("absolute top-0 right-0 w-40 h-40 blur-[80px] -z-10 opacity-10 transition-opacity group-hover:opacity-20", typeInfo.color)} />
                                
                                <div className="flex justify-between items-start mb-8">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", typeInfo.color)}>
                                        <typeInfo.icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleActive(method);
                                            }}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                method.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                                            )}
                                        >
                                            {method.active ? 'Activo' : 'Inactivo'}
                                        </button>
                                        {method.verificationStatus === 'VERIFIED' ? (
                                            <div className="w-8 h-8 rounded-xl bg-alteha-turquoise/10 flex items-center justify-center text-alteha-turquoise" title="Verificado">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500" title="Pendiente de verificación">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 leading-tight mb-1">{method.displayName}</h4>
                                        <p className="text-[10px] font-black text-alteha-turquoise uppercase tracking-[0.2em]">{typeInfo.name}</p>
                                    </div>

                                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 group-hover:bg-white transition-colors">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Hash className="w-3 h-3" /> Información de Cuenta
                                        </p>
                                        <p className="font-mono text-sm font-bold text-slate-700 break-all leading-relaxed">
                                            {method.methodType === 'BINANCE_PAY' 
                                                ? (method.binancePayId || method.binanceUserIdentifier)
                                                : method.methodType === 'CRYPTO_WALLET'
                                                ? method.cryptoWalletAddress
                                                : method.methodType === 'BS_PAGO_MOVIL'
                                                ? method.bankAccount?.phone
                                                : method.bankAccount?.accountNumber}
                                        </p>
                                        {method.bankAccount?.bankName && (
                                            <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                                                <Building2 className="w-3 h-3" /> {method.bankAccount.bankName}
                                            </p>
                                        )}
                                    </div>

                                    {!selectionMode && (
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingMethod(method);
                                                        setFormData(method);
                                                        setSelectedType(method.methodType);
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-alteha-turquoise hover:text-white transition-all flex items-center justify-center"
                                                    title="Editar detalles"
                                                >
                                                    <Info className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(method);
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID de Registro</p>
                                                <p className="text-xs font-black text-slate-300">#{method.id}</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectionMode && (
                                        <div className="flex items-center justify-end text-alteha-turquoise opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-black uppercase tracking-widest mr-2">Seleccionar cuenta</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="bg-slate-900 p-10 rounded-[3rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                        <ShieldCheck className="w-10 h-10 text-alteha-turquoise" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h4 className="text-xl font-black text-white mb-2">Seguridad de Nivel Bancario</h4>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                            Toda tu información financiera está protegida con los estándares más altos de la industria. 
                            Alteha no almacena credenciales bancarias directas, solo la información necesaria para procesar tus transferencias.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sistemas Verificados</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
