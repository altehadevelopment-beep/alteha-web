"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Package,
    Settings,
    DollarSign,
    Info,
    CheckCircle,
    ChevronRight,
    Search,
    Stethoscope,
    Minus,
    Trash2,
    Layers,
    ImagePlus
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function PublishPackagePage() {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState([
        { id: 1, name: 'Consulta Especialista', icon: Stethoscope, image: '', count: 5, price: 50 },
        { id: 2, name: 'Derecho de Quirófano', icon: Layers, image: '', count: 1, price: 1500 }
    ]);

    const updateCount = (id: number, delta: number) => {
        setConfig(prev => prev.map(item =>
            item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item
        ));
    };

    const updateName = (id: number, name: string) => {
        setConfig(prev => prev.map(item => item.id === id ? { ...item, name } : item));
    };

    const handleImageUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setConfig(prev => prev.map(item => item.id === id ? { ...item, image: url } : item));
        }
    };

    const addItem = () => {
        const newItem = { id: Date.now(), name: 'Nuevo Ítem', icon: Package, image: '', count: 1, price: 0 };
        setConfig(prev => [...prev, newItem]);
    };

    const totalAmount = config.reduce((acc, item) => acc + (item.count * item.price), 0);

    return (
        <div className="space-y-10 font-outfit max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div>
                <Link href="/dashboard/specialist" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver al Dashboard</span>
                </Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Crear Paquete de Intervención</h1>
                <p className="text-slate-500 font-medium">Configura tus servicios y honorarios de forma personalizada</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <StepIndicator num={1} label="Información General" active={step === 1} completed={step > 1} />
                <div className="flex-1 h-px bg-slate-100" />
                <StepIndicator num={2} label="Configurador" active={step === 2} completed={step > 2} />
                <div className="flex-1 h-px bg-slate-100" />
                <StepIndicator num={3} label="Publicación" active={step === 3} completed={step > 3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <Info className="w-6 h-6 text-alteha-turquoise" />
                                    Detalle del Paquete
                                </h3>
                                <div className="space-y-6">
                                    <Input label="Nombre del Paquete" placeholder="Ej: Control de Traumatología Avanzado" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Especialidad" defaultValue="Traumatología" disabled />
                                        <Input label="Categoría" placeholder="Ej: Cirugía Mayor" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descripción</label>
                                        <textarea
                                            className="w-full h-40 bg-slate-50 rounded-2xl p-5 border border-slate-100 outline-none focus:border-alteha-turquoise/50 transition-all font-medium text-slate-600 resize-none"
                                            placeholder="Detalla qué incluye el paquete..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => setStep(2)} className="bg-slate-900 px-10 py-6 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2">
                                    Ir al Configurador
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <Settings className="w-6 h-6 text-alteha-violet" />
                                        Configurador de Producto
                                    </h3>
                                    <button
                                        onClick={addItem}
                                        className="flex items-center gap-2 px-4 py-2 bg-alteha-violet/10 text-alteha-violet rounded-xl font-bold text-sm hover:scale-105 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Item
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {config.map((item) => (
                                        <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                                            
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="relative group/img cursor-pointer w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center hover:border-alteha-turquoise transition-colors shadow-sm">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImagePlus className="w-6 h-6 text-slate-300 group-hover/img:text-alteha-turquoise transition-colors" />
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleImageUpload(item.id, e)} 
                                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                                        title="Sube una foto del ítem"
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 space-y-1.5">
                                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1 flex items-center gap-1">
                                                        ✎ Nombre / Tipo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre del ítem (Ej. Consulta, Insumo...)"
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-alteha-violet focus:ring-4 focus:ring-alteha-violet/10 transition-all w-full placeholder:text-slate-300 placeholder:font-medium shadow-sm"
                                                        value={item.name}
                                                        onChange={(e) => updateName(item.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                                                    <button onClick={() => updateCount(item.id, -1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="font-black text-xl w-8 text-center">{item.count}</span>
                                                    <button onClick={() => updateCount(item.id, 1)} className="p-2 hover:bg-slate-50 rounded-lg text-alteha-turquoise transition-colors">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="text-right min-w-[100px]">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1">
                                                        ✎ Costo Unit.
                                                    </p>
                                                    <div className="flex items-center justify-end text-slate-900 font-black relative">
                                                        <span className="absolute left-3 text-slate-400 z-10">$</span>
                                                        <input
                                                            type="number"
                                                            className="bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 w-28 text-right outline-none focus:border-alteha-violet focus:ring-4 focus:ring-alteha-violet/10 transition-all shadow-sm"
                                                            value={item.price}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                setConfig(prev => prev.map(i => i.id === item.id ? { ...i, price: val } : i));
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setConfig(config.filter(i => i.id !== item.id))}
                                                    className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total del Paquete</p>
                                        <h4 className="text-4xl font-black text-slate-900 mt-1">${totalAmount.toLocaleString()}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-emerald-500 font-bold bg-emerald-50 px-6 py-3 rounded-2xl">
                                        <CheckCircle className="w-5 h-5" />
                                        Precio Optimizado
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <button onClick={() => setStep(1)} className="px-10 py-6 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button onClick={() => setStep(3)} className="bg-slate-900 px-10 py-6 rounded-2xl font-black text-white hover:bg-slate-800 transition-all">
                                    Revisar y Publicar
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Preview */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
                        <h4 className="font-black text-lg mb-6 flex items-center gap-2 text-alteha-turquoise">
                            <Layers className="w-5 h-5" />
                            Composición
                        </h4>
                        <div className="space-y-4">
                            {config.filter(item => item.count > 0).map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10 group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-alteha-turquoise/20 flex items-center justify-center text-[11px] font-black shrink-0">{item.count}x</span>
                                        {item.image && (
                                            <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                        )}
                                        <span className="text-sm font-bold text-white/90 truncate max-w-[140px] leading-tight" title={item.name}>{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-alteha-turquoise shrink-0">${(item.count * item.price).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex justify-between items-center font-black">
                                    <span className="text-white/60">SUBTOTAL</span>
                                    <span className="text-xl text-white">${totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ num, label, active, completed }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${active ? 'bg-alteha-violet text-white shadow-lg shadow-alteha-violet/30' :
                    completed ? 'bg-alteha-turquoise text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                {completed ? <CheckCircle className="w-5 h-5" /> : num}
            </div>
            <span className={`text-sm font-bold hidden md:block ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}
