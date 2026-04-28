"use client";

import React, { useState } from 'react';
import { 
    CreditCard, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    ShieldCheck, 
    AlertCircle,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Card {
    id: string;
    type: 'visa' | 'mastercard' | 'amex';
    last4: string;
    expMonth: string;
    expYear: string;
    isDefault: boolean;
    name: string;
}

const mockCards: Card[] = [
    {
        id: 'card_1',
        type: 'visa',
        last4: '4242',
        expMonth: '12',
        expYear: '25',
        isDefault: true,
        name: 'Clínica Principal'
    },
    {
        id: 'card_2',
        type: 'mastercard',
        last4: '5555',
        expMonth: '08',
        expYear: '26',
        isDefault: false,
        name: 'Clínica Principal'
    }
];

export default function ClinicPaymentMethods() {
    const [cards, setCards] = useState<Card[]>(mockCards);
    const [isAddingMode, setIsAddingMode] = useState(false);
    
    // Form State
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expDate, setExpDate] = useState('');
    const [cvc, setCvc] = useState('');

    const handleAddCard = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Very basic mock simulation logic
        const newCard: Card = {
            id: Date.now().toString(),
            type: cardNumber.startsWith('4') ? 'visa' : cardNumber.startsWith('5') ? 'mastercard' : 'visa',
            last4: cardNumber.slice(-4) || '0000',
            expMonth: expDate.split('/')[0] || '12',
            expYear: expDate.split('/')[1] || '25',
            isDefault: cards.length === 0,
            name: cardName || 'Titular de la Tarjeta'
        };

        setCards([...cards, newCard]);
        setIsAddingMode(false);
        setCardNumber('');
        setCardName('');
        setExpDate('');
        setCvc('');
    };

    const handleDelete = (id: string) => {
        setCards(cards.filter(card => card.id !== id));
    };

    const handleSetDefault = (id: string) => {
        setCards(cards.map(card => ({
            ...card,
            isDefault: card.id === id
        })));
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-50/50 rounded-[2.5rem] shadow-2xl overflow-hidden">
            
            <div className="flex-1 flex flex-col items-center justify-start p-8 md:p-12 overflow-y-auto w-full">
                
                <div className="max-w-4xl w-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Métodos de Pago</h2>
                            <p className="text-slate-500 font-medium mt-1">
                                Gestiona tus tarjetas para el pago de membresías o servicios en Alteha.
                            </p>
                        </div>
                        {!isAddingMode && (
                            <button 
                                onClick={() => setIsAddingMode(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
                            >
                                <Plus className="w-5 h-5" />
                                Agregar Tarjeta
                            </button>
                        )}
                    </div>

                    {!isAddingMode ? (
                        <div className="space-y-6">
                            <h3 className="text-lg font-black text-slate-800 mb-4">Tus tarjetas guardadas</h3>
                            
                            {cards.length === 0 ? (
                                <div className="text-center bg-white border border-slate-100 rounded-3xl p-12 shadow-sm">
                                    <CreditCard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <h4 className="text-xl font-black text-slate-800 mb-2">No hay métodos de pago</h4>
                                    <p className="text-slate-500 mb-6">Agrega una tarjeta de crédito o débito para realizar pagos.</p>
                                    <button 
                                        onClick={() => setIsAddingMode(true)}
                                        className="px-6 py-3 bg-white border-2 border-dashed border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:border-alteha-blue hover:text-alteha-blue transition-all"
                                    >
                                        + Agregar nueva tarjeta
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {cards.map(card => (
                                        <div key={card.id} className="group relative w-full h-56 rounded-[2rem] p-6 text-white overflow-hidden shadow-xl transition-transform hover:-translate-y-2 bg-gradient-to-br from-slate-800 to-slate-950 isolate">
                                            {/* Beautiful Abstract Background */}
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-alteha-blue/20 rounded-full blur-2xl -z-10 -translate-x-1/2 translate-y-1/2" />
                                            
                                            <div className="flex justify-between items-start mb-8">
                                                {card.type === 'visa' ? (
                                                    <svg className="h-8 w-auto mix-blend-screen opacity-90" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M37.3 1.1L30.7 20.3H26L23.4 3.7C23.1 2.3 22.8 1.9 21.7 1.4C19 0.4 14.1 0 14.1 0L14 1.1C16.9 1.7 20.5 2.9 22.3 4.2C23.2 4.9 23.4 5.6 23.9 7.4L28.1 20.3H33L40 1.1H37.3ZM64.9 1.1H60.2V20.3H64.9V1.1ZM80.6 20.3H85.4L81.7 1.1H77.5C76.1 1.1 75 1.8 74.4 2.9L64.1 20.3H69.1L70.1 17.5H76.2L76.8 20.3H80.6ZM71.6 13.5L73.2 8.7C73.2 8.7 74.6 4.7 74.6 4.6C74.6 4.6 74.9 5.8 75.1 6.5L76 13.5H71.6ZM56.3 7.8C54.8 7.3 52.8 6.9 50.8 7C47 7.1 44.4 8.7 44.3 11C44.3 14 47.9 15 50.6 16.2C52.7 17.1 53.4 17.7 53.4 18.7C53.4 20.2 51.5 20.9 49.3 20.9C46.8 20.9 45.4 20.2 43.1 19.3L42.2 23.4C44 24.2 46.5 24.7 49.3 24.7C53.6 24.7 56.4 22.8 56.4 20C56.4 16.7 52.2 16.3 49.8 15.1C48.2 14.3 47.3 13.8 47.3 12.6C47.3 11.4 48.6 10.6 51 10.6C53 10.6 54.4 11 55.7 11.6L56.3 7.8Z" fill="white"/>
                                                    </svg>
                                                ) : (
                                                    <svg className="h-10 w-auto opacity-90" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="20" cy="20" r="18" fill="#EB001B"/>
                                                        <circle cx="40" cy="20" r="18" fill="#F79E1B"/>
                                                        <path d="M30 34.6A17.9 17.9 0 0 0 38 20a17.9 17.9 0 0 0-8-14.6A17.9 17.9 0 0 0 22 20a17.9 17.9 0 0 0 8 14.6z" fill="#FF5F00"/>
                                                    </svg>
                                                )}
                                                
                                                <div className="flex gap-2">
                                                    {card.isDefault && (
                                                        <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/90">
                                                            Principal
                                                        </span>
                                                    )}
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!card.isDefault && (
                                                            <button 
                                                                onClick={() => handleSetDefault(card.id)}
                                                                title="Hacer principal" 
                                                                className="w-7 h-7 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDelete(card.id)}
                                                            title="Eliminar tarjeta" 
                                                            className="w-7 h-7 bg-rose-500/20 hover:bg-rose-500/80 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-100" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6 font-mono font-medium tracking-[0.15em] text-lg text-white/90">
                                                **** **** **** {card.last4}
                                            </div>

                                            <div className="flex justify-between items-end text-sm">
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-widest text-white/50 mb-1 font-bold">Titular</div>
                                                    <div className="font-medium tracking-wide truncate max-w-[120px]">{card.name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[9px] uppercase tracking-widest text-white/50 mb-1 font-bold">Vence</div>
                                                    <div className="font-medium tracking-wide font-mono">{card.expMonth}/{card.expYear}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {cards.length > 0 && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4 mt-8">
                                    <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-emerald-800 mb-1">Pagos Seguros y Encriptados</h4>
                                        <p className="text-emerald-600/80 text-sm font-medium">Todos los datos de tus tarjetas son procesados a través de proveedores certificados Level 1 PCI-DSS. Alteha nunca almacena tu información completa.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                            
                            <div className="border-b border-slate-100 p-6 md:p-8 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                        <CreditCard className="w-5 h-5 text-alteha-blue" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">Agregar Nueva Tarjeta</h3>
                                </div>
                                <button 
                                    onClick={() => setIsAddingMode(false)}
                                    className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddCard} className="p-6 md:p-8 space-y-6">
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Número de Tarjeta</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input 
                                                required 
                                                type="text" 
                                                inputMode="numeric"
                                                maxLength={19}
                                                placeholder="0000 0000 0000 0000" 
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-mono font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all placeholder:font-sans" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Expiración (MM/AA)</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="MM/AA" 
                                                maxLength={5}
                                                value={expDate}
                                                onChange={(e) => setExpDate(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-mono font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all placeholder:font-sans" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">CVC</label>
                                            <input 
                                                required 
                                                type="text" 
                                                inputMode="numeric"
                                                maxLength={4}
                                                placeholder="123" 
                                                value={cvc}
                                                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-mono font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all placeholder:font-sans" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Titular</label>
                                        <input 
                                            required 
                                            type="text" 
                                            placeholder="Como aparece en la tarjeta" 
                                            value={cardName}
                                            onChange={(e) => setCardName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-alteha-blue/20 outline-none transition-all" 
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                        <ShieldCheck className="w-4 h-4" />
                                        Transacción Segura de 256-bits.
                                    </div>
                                    <button type="submit" className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-1 hover:shadow-xl hover:bg-black">
                                        Guardar Tarjeta
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
