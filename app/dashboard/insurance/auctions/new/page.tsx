"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Gavel,
    Settings,
    DollarSign,
    Info,
    CheckCircle,
    ChevronRight,
    Calendar,
    Clock,
    MapPin,
    FileText,
    Trash2,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function CreateAuctionPage() {
    const [step, setStep] = useState(1);
    const [items, setItems] = useState([
        { id: 1, name: 'Consulta Preoperatoria', qty: 1, est: 150 },
        { id: 2, name: 'Cirugía Principal', qty: 1, est: 5000 },
        { id: 3, name: 'Hospitalización (días)', qty: 2, est: 800 }
    ]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), name: 'Nuevo Servicio', qty: 1, est: 0 }]);
    };

    const removeItem = (id: number) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: number, field: string, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const totalEstimate = items.reduce((acc, item) => acc + (item.qty * item.est), 0);

    return (
        <div className="space-y-10 font-outfit max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div>
                <Link href="/dashboard/insurance" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-violet transition-colors mb-4 font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver al Dashboard</span>
                </Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Crear Nueva Subasta</h1>
                <p className="text-slate-500 font-medium">Configura los detalles del caso y lanza la subasta a los especialistas</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <StepIndicator num={1} label="Datos del Caso" active={step === 1} completed={step > 1} />
                <div className="flex-1 h-px bg-slate-100" />
                <StepIndicator num={2} label="Servicios Requeridos" active={step === 2} completed={step > 2} />
                <div className="flex-1 h-px bg-slate-100" />
                <StepIndicator num={3} label="Configurar Subasta" active={step === 3} completed={step > 3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <Info className="w-6 h-6 text-alteha-violet" />
                                    Información del Caso
                                </h3>
                                <div className="space-y-6">
                                    <Input label="Número de Caso / Siniestro" placeholder="Ej: SIN-2026-04521" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Tipo de Procedimiento" placeholder="Ej: Cirugía Ortopédica" />
                                        <Input label="Especialidad Requerida" placeholder="Ej: Traumatología" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Región / Ciudad" placeholder="Ej: Ciudad de México" icon={MapPin} />
                                        <Input label="Fecha Límite" placeholder="Ej: 15/03/2026" icon={Calendar} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descripción del Caso</label>
                                        <textarea
                                            className="w-full h-32 bg-slate-50 rounded-2xl p-5 border border-slate-100 outline-none focus:border-alteha-violet/50 transition-all font-medium text-slate-600 resize-none"
                                            placeholder="Detalla los antecedentes médicos y requerimientos específicos..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => setStep(2)} className="bg-alteha-violet px-10 py-6 rounded-2xl font-black text-white hover:bg-violet-700 transition-all flex items-center gap-2">
                                    Siguiente
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
                                        <FileText className="w-6 h-6 text-alteha-violet" />
                                        Servicios Requeridos
                                    </h3>
                                    <button
                                        onClick={addItem}
                                        className="flex items-center gap-2 px-4 py-2 bg-alteha-violet/10 text-alteha-violet rounded-xl font-bold text-sm hover:scale-105 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Servicio
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                                            <div className="flex-1">
                                                <input
                                                    className="bg-transparent font-bold text-slate-800 outline-none focus:text-alteha-violet transition-colors w-full text-lg"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                />
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Servicio Médico</p>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cantidad</p>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-16 bg-white rounded-xl p-3 text-center font-black text-lg border border-slate-100 outline-none focus:border-alteha-violet/50"
                                                        value={item.qty}
                                                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                                                    />
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Unitario</p>
                                                    <div className="flex items-center bg-white rounded-xl p-3 border border-slate-100">
                                                        <span className="text-slate-400 font-bold">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-transparent text-right outline-none font-black text-lg"
                                                            value={item.est}
                                                            onChange={(e) => updateItem(item.id, 'est', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(item.id)}
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
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Estimado Total</p>
                                        <h4 className="text-4xl font-black text-slate-900 mt-1">${totalEstimate.toLocaleString()}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-amber-600 font-bold bg-amber-50 px-6 py-3 rounded-2xl">
                                        <AlertCircle className="w-5 h-5" />
                                        Precio de Referencia
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <button onClick={() => setStep(1)} className="px-10 py-6 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button onClick={() => setStep(3)} className="bg-alteha-violet px-10 py-6 rounded-2xl font-black text-white hover:bg-violet-700 transition-all">
                                    Configurar Subasta
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <Settings className="w-6 h-6 text-alteha-violet" />
                                    Parámetros de la Subasta
                                </h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Duración de la Subasta" placeholder="Ej: 48 horas" icon={Clock} />
                                        <Input label="Puja Mínima" placeholder="Ej: $500" icon={DollarSign} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Precio Máximo Aceptable" placeholder="Ej: $6,500" icon={DollarSign} />
                                        <Input label="Extensión Automática" placeholder="Ej: 15 minutos" icon={Clock} />
                                    </div>

                                    <div className="p-6 bg-violet-50/50 rounded-2xl border border-violet-100">
                                        <label className="flex items-center gap-4 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 accent-alteha-violet" defaultChecked />
                                            <div>
                                                <p className="font-bold text-slate-900">Subasta Inversa</p>
                                                <p className="text-sm text-slate-500">Los especialistas compiten ofreciendo el precio más bajo</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                        <label className="flex items-center gap-4 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 accent-emerald-500" />
                                            <div>
                                                <p className="font-bold text-slate-900">Requiere Aprobación Manual</p>
                                                <p className="text-sm text-slate-500">Deberás aprobar al ganador antes de confirmar la orden</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <button onClick={() => setStep(2)} className="px-10 py-6 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Volver
                                </button>
                                <Button className="bg-alteha-violet px-10 py-6 rounded-2xl font-black text-white hover:bg-violet-700 transition-all flex items-center gap-2">
                                    <Gavel className="w-5 h-5" />
                                    Lanzar Subasta
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Preview */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
                        <h4 className="font-black text-lg mb-6 flex items-center gap-2 text-alteha-violet">
                            <Gavel className="w-5 h-5" />
                            Resumen de Subasta
                        </h4>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-alteha-violet/20 flex items-center justify-center text-[10px] font-black">{item.qty}x</span>
                                        <span className="text-sm font-bold text-white/80 truncate max-w-[120px]">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-alteha-violet">${(item.qty * item.est).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex justify-between items-center font-black">
                                    <span className="text-white/60">ESTIMADO</span>
                                    <span className="text-xl text-white">${totalEstimate.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-alteha-violet to-violet-700 p-6 rounded-[2rem] text-white text-center">
                        <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-80" />
                        <p className="font-black text-2xl">Ahorro Esperado</p>
                        <p className="text-4xl font-black mt-2">15-30%</p>
                        <p className="text-xs uppercase tracking-widest mt-2 opacity-70">vs. precio tradicional</p>
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
                    completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                {completed ? <CheckCircle className="w-5 h-5" /> : num}
            </div>
            <span className={`text-sm font-bold hidden md:block ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}
