"use client";

import React, { useState } from 'react';
import { 
    Globe, 
    Building, 
    Smartphone, 
    Bitcoin, 
    Wallet,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    PlusCircle,
    Building2,
    Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'scope' | 'method' | 'form' | 'success';
type Scope = 'national' | 'international' | null;
type Method = 'transfer_ve' | 'pago_movil' | 'transfer_us' | 'binance' | null;

export default function WithdrawalWizard() {
    const [step, setStep] = useState<Step>('scope');
    const [scope, setScope] = useState<Scope>(null);
    const [method, setMethod] = useState<Method>(null);

    const handleScopeSelect = (selectedScope: Scope) => {
        setScope(selectedScope);
        setStep('method');
    };

    const handleMethodSelect = (selectedMethod: Method) => {
        setMethod(selectedMethod);
        setStep('form');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('success');
    };

    const resetWizard = () => {
        setStep('scope');
        setScope(null);
        setMethod(null);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-50/50 rounded-[2.5rem] shadow-2xl flex-col p-8 lg:p-12 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Mapeo de Fondos</h2>
                    <p className="text-slate-500 font-medium mt-2 max-w-xl">
                        Configura las cuentas donde deseas recibir los pagos de tus subastas. Puedes agregar cuentas nacionales e internacionales.
                    </p>
                </div>
                {step !== 'scope' && step !== 'success' && (
                    <button 
                        onClick={() => setStep(step === 'method' ? 'scope' : 'method')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                )}
            </div>

            {/* Wizard Content */}
            <div className="max-w-4xl w-full mx-auto">
                {step === 'scope' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800">¿Dónde deseas recibir tus fondos?</h3>
                            <p className="text-slate-500 mt-2">Selecciona el alcance geográfico de tu cuenta destino.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={() => handleScopeSelect('national')}
                                className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-alteha-turquoise hover:shadow-2xl hover:shadow-alteha-turquoise/20 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-alteha-turquoise/5 rounded-bl-[100px] -z-10 group-hover:scale-150 transition-transform duration-500" />
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-alteha-turquoise/10 transition-colors">
                                    <Building className="w-8 h-8 text-slate-600 group-hover:text-alteha-turquoise transition-colors" />
                                </div>
                                <h4 className="text-xl font-black text-slate-800 mb-2">Cuenta Nacional (VE)</h4>
                                <p className="text-sm text-slate-500 font-medium">Recibe pagos en Bolívares a través de bancos nacionales (Transferencia o Pago Móvil).</p>
                            </button>

                            <button 
                                onClick={() => handleScopeSelect('international')}
                                className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-alteha-blue hover:shadow-2xl hover:shadow-alteha-blue/20 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-alteha-blue/5 rounded-bl-[100px] -z-10 group-hover:scale-150 transition-transform duration-500" />
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-alteha-blue/10 transition-colors">
                                    <Globe className="w-8 h-8 text-slate-600 group-hover:text-alteha-blue transition-colors" />
                                </div>
                                <h4 className="text-xl font-black text-slate-800 mb-2">Cuenta Internacional / Crypto</h4>
                                <p className="text-sm text-slate-500 font-medium">Recibe pagos en Dólares (Zelle, Wire) o USDT a través de Binance.</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'method' && scope === 'national' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800">Selecciona el método nacional</h3>
                            <p className="text-slate-500 mt-2">¿Cómo prefieres recibir el dinero en tu banco nacional?</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={() => handleMethodSelect('transfer_ve')}
                                className="group bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-alteha-turquoise hover:shadow-xl transition-all text-left"
                            >
                                <Landmark className="w-10 h-10 text-slate-400 group-hover:text-alteha-turquoise mb-4 transition-colors" />
                                <h4 className="text-lg font-black text-slate-800 mb-1">Transferencia Bancaria</h4>
                                <p className="text-sm text-slate-500">20 dígitos de cuenta corriente o ahorro.</p>
                            </button>
                            <button 
                                onClick={() => handleMethodSelect('pago_movil')}
                                className="group bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-alteha-turquoise hover:shadow-xl transition-all text-left"
                            >
                                <Smartphone className="w-10 h-10 text-slate-400 group-hover:text-alteha-turquoise mb-4 transition-colors" />
                                <h4 className="text-lg font-black text-slate-800 mb-1">Pago Móvil</h4>
                                <p className="text-sm text-slate-500">Asociado a teléfono y cédula de identidad.</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'method' && scope === 'international' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800">Selecciona el método internacional</h3>
                            <p className="text-slate-500 mt-2">Opciones en divisas (USD o Crypto).</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={() => handleMethodSelect('transfer_us')}
                                className="group bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-alteha-blue hover:shadow-xl transition-all text-left"
                            >
                                <Building2 className="w-10 h-10 text-slate-400 group-hover:text-alteha-blue mb-4 transition-colors" />
                                <h4 className="text-lg font-black text-slate-800 mb-1">Banco Extranjero (USD)</h4>
                                <p className="text-sm text-slate-500">Wire transfer o depósito ACH.</p>
                            </button>
                            <button 
                                onClick={() => handleMethodSelect('binance')}
                                className="group bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-alteha-blue hover:shadow-xl transition-all text-left"
                            >
                                <Wallet className="w-10 h-10 text-slate-400 group-hover:text-alteha-blue mb-4 transition-colors" />
                                <h4 className="text-lg font-black text-slate-800 mb-1">Binance (USDT)</h4>
                                <p className="text-sm text-slate-500">Recepción instantánea vía Binance ID / Wallet.</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'form' && (
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                        <h3 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-100 pb-6">
                            {method === 'transfer_ve' && 'Detalles de Cuenta Nacional'}
                            {method === 'pago_movil' && 'Detalles de Pago Móvil'}
                            {method === 'transfer_us' && 'Detalles de Banco Extranjero'}
                            {method === 'binance' && 'Billetera Binance'}
                        </h3>
                        
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            {(method === 'transfer_ve' || method === 'pago_movil') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Banco</label>
                                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-turquoise/20 outline-none transition-all">
                                            <option value="">Seleccione un banco...</option>
                                            <option value="banesco">Banesco</option>
                                            <option value="mercantil">Mercantil</option>
                                            <option value="provincial">Provincial</option>
                                            <option value="venezuela">Banco de Venezuela</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cédula / RIF</label>
                                        <input required type="text" placeholder="V-12345678" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-turquoise/20 outline-none transition-all" />
                                    </div>
                                </div>
                            )}

                            {method === 'transfer_ve' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Cuenta</label>
                                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-turquoise/20 outline-none transition-all">
                                            <option value="corrinte">Corriente</option>
                                            <option value="ahorro">Ahorro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Número de Cuenta</label>
                                        <input required type="text" placeholder="0134-..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-turquoise/20 outline-none transition-all" />
                                    </div>
                                </div>
                            )}

                            {method === 'pago_movil' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Teléfono Afiliado</label>
                                    <input required type="tel" placeholder="0414-XXXXXXX" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-turquoise/20 outline-none transition-all" />
                                </div>
                            )}

                            {method === 'transfer_us' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Titular</label>
                                            <input required type="text" placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Banco</label>
                                            <input required type="text" placeholder="Chase, BofA, Wells Fargo..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Número de Cuenta</label>
                                            <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Routing Number (ABA) / SWIFT</label>
                                            <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {method === 'binance' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Binance Pay ID / Billetera USDT (BEP20)</label>
                                    <input required type="text" placeholder="123456789 / 0x..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all" />
                                    <p className="text-xs text-slate-500 mt-2">Asegúrate de que la red sea correcta (BEP20/TRC20) para evitar pérdida de fondos.</p>
                                </div>
                            )}

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button type="submit" className={cn(
                                    "px-8 py-4 text-white font-black rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2",
                                    scope === 'national' ? "bg-alteha-turquoise shadow-alteha-turquoise/30" : "bg-alteha-blue shadow-alteha-blue/30"
                                )}>
                                    Guardar Método de Pago
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                            <CheckCircle2 className="w-12 h-12 relative z-10" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-4">Método Agregado con Éxito</h3>
                        <p className="text-slate-500 font-medium text-lg mb-8">
                            El método de pago ha sido guardado y verificado. Ahora podrás seleccionarlo para retirar tus fondos provenientes de las subastas.
                        </p>
                        <button 
                            onClick={resetWizard}
                            className="px-8 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20"
                        >
                            Agregar otro método
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
