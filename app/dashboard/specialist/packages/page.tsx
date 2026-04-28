"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    ImagePlus,
    Calendar,
    AlertCircle,
    Loader2,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createMedicalPackage, getMyMedicalPackages, type MedicalPackage, type MedicalPackageItem } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function PublishPackagePage() {
    const { userProfile } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [packages, setPackages] = useState<MedicalPackage[]>([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        packageName: '',
        packageCode: '',
        description: '',
        basePrice: 0,
        discountedPrice: 0,
        discountPercentage: 10,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months later
    });

    const [items, setItems] = useState<MedicalPackageItem[]>([
        { itemName: 'Consulta Especialista', description: 'Evaluación médica inicial', quantity: 1, unitPrice: 50 },
    ]);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            setIsLoadingPackages(true);
            const response = await getMyMedicalPackages();
            if (response.code === '00' && Array.isArray(response.data)) {
                setPackages(response.data);
            } else if (Array.isArray(response)) {
                setPackages(response as any);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setIsLoadingPackages(false);
        }
    };

    const handleCreatePackage = async () => {
        try {
            setIsLoading(true);
            const payload = {
                ...formData,
                basePrice: totalAmount,
                 discountedPrice: discountedAmount,
                packageItems: items
            };
            const response = await createMedicalPackage(payload);
            // Handle both wrapped and unwrapped responses
            const success = (response as any).id || (response as any).code === '00';
            if (success) {
                setIsCreating(false);
                setStep(1);
                fetchPackages();
            }
        } catch (error) {
            console.error('Error creating package:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateItem = (index: number, field: keyof MedicalPackageItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setItems([...items, { itemName: 'Nuevo Ítem', description: '', quantity: 1, unitPrice: 0 }]);
    };

    const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const discountedAmount = formData.discountedPrice || totalAmount * (1 - formData.discountPercentage / 100);

    if (!isCreating) {
        return (
            <div className="space-y-10 font-outfit max-w-6xl mx-auto pb-20">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/dashboard/specialist" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                            <ArrowLeft className="w-5 h-5" />
                            <span>Dashboard</span>
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Paquetes de Salud</h1>
                        <p className="text-slate-500 font-medium">Gestiona tus ofertas y servicios destacados</p>
                    </div>
                    <Button 
                        onClick={() => setIsCreating(true)}
                        className="bg-alteha-turquoise text-slate-900 px-8 py-4 rounded-2xl font-black shadow-lg shadow-alteha-turquoise/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Nuevo Paquete
                    </Button>
                </header>

                {isLoadingPackages ? (
                    <div className="py-20 flex flex-col items-center gap-4 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <Loader2 className="w-10 h-10 text-alteha-turquoise animate-spin" />
                        <p className="text-slate-400 font-bold">Cargando tus paquetes...</p>
                    </div>
                ) : packages.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 px-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Package className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No tienes paquetes publicados</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                            Publica paquetes de servicios para atraer a más aseguradoras y pacientes con ofertas integrales.
                        </p>
                        <Button 
                            onClick={() => setIsCreating(true)}
                            className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-slate-800 transition-all"
                        >
                            Comenzar ahora
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map((pkg) => (
                            <motion.div 
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group p-8 flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-alteha-turquoise/10 text-alteha-turquoise rounded-2xl">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Activo
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-alteha-turquoise transition-colors">{pkg.packageName}</h3>
                                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 flex-1 italic">
                                    &ldquo;{pkg.description}&rdquo;
                                </p>
                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Especial</p>
                                            <p className="text-2xl font-black text-slate-900">${pkg.discountedPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Base</p>
                                            <p className="text-sm font-bold text-slate-300 line-through">${pkg.basePrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Válido hasta: {pkg.validUntil ? new Date(pkg.validUntil).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-10 font-outfit max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div>
                <button onClick={() => setIsCreating(false)} className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Regresar a la lista</span>
                </button>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configurar Nuevo Paquete</h1>
                <p className="text-slate-500 font-medium">Diseña una oferta personalizada para tu comunidad</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Stepper */}
                    <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <StepIndicator num={1} label="Información" active={step === 1} completed={step > 1} />
                        <div className="flex-1 h-px bg-slate-100" />
                        <StepIndicator num={2} label="Configurador" active={step === 2} completed={step > 2} />
                        <div className="flex-1 h-px bg-slate-100" />
                        <StepIndicator num={3} label="Publicar" active={step === 3} completed={step > 3} />
                    </div>

                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10">
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-alteha-turquoise/10 rounded-xl flex items-center justify-center text-alteha-turquoise">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        Detalles Generales
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <Input 
                                            label="Nombre del Paquete" 
                                            placeholder="Ej: Chequeo Cardiovascular Integral" 
                                            value={formData.packageName}
                                            onChange={(e) => setFormData({...formData, packageName: e.target.value})}
                                        />
                                        <div className="grid grid-cols-2 gap-6">
                                            <Input 
                                                label="Código Interno" 
                                                placeholder="Ej: CARD-2026" 
                                                value={formData.packageCode}
                                                onChange={(e) => setFormData({...formData, packageCode: e.target.value})}
                                            />
                                            <Input label="Especialidad" defaultValue={userProfile?.specialties?.[0]?.name || "Especialista"} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descripción de la Oferta</label>
                                            <textarea
                                                className="w-full h-32 bg-slate-50 rounded-2xl p-5 border border-slate-100 outline-none focus:border-alteha-turquoise transition-all font-medium text-slate-600 resize-none"
                                                placeholder="Detalla qué incluye el paquete y sus beneficios principales..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6 pt-6 border-t border-slate-50">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <Calendar className="w-6 h-6 text-alteha-violet" />
                                        Vigencia de la Oferta
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input 
                                            type="date" 
                                            label="Válido Desde" 
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                                        />
                                        <Input 
                                            type="date" 
                                            label="Válido Hasta" 
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                                        />
                                    </div>
                                </section>
                                <section className="space-y-6 pt-6 border-t border-slate-50">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <DollarSign className="w-6 h-6 text-emerald-500" />
                                        Estrategia de Precio
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Descuento (%)</p>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-700 outline-none focus:border-alteha-turquoise transition-all"
                                                    value={formData.discountPercentage}
                                                    onChange={(e) => {
                                                        const pct = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                        setFormData({
                                                            ...formData, 
                                                            discountPercentage: pct,
                                                            discountedPrice: totalAmount * (1 - pct / 100)
                                                        });
                                                    }}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Precio Final de Oferta ($)</p>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-alteha-turquoise/5 border border-alteha-turquoise/10 rounded-2xl p-4 pl-8 font-black text-alteha-turquoise outline-none focus:border-alteha-turquoise transition-all"
                                                    value={Math.round(discountedAmount)}
                                                    onChange={(e) => {
                                                        const price = parseFloat(e.target.value) || 0;
                                                        setFormData({
                                                            ...formData, 
                                                            discountedPrice: price,
                                                            discountPercentage: totalAmount > 0 ? Math.round((1 - price / totalAmount) * 100) : 0
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                                        * El precio base se calcula automáticamente sumando los ítems en el siguiente paso.
                                    </p>
                                </section>
                            </div>
                            <div className="flex justify-end">
                                <Button 
                                    onClick={() => setStep(2)} 
                                    disabled={!formData.packageName || !formData.description}
                                    className="bg-slate-900 px-10 py-6 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2 group"
                                >
                                    Continuar al Configurador
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <Settings className="w-6 h-6 text-alteha-violet" />
                                        Composición del Paquete
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
                                    {items.map((item, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 relative group">
                                            <button 
                                                onClick={() => removeItem(idx)}
                                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Nombre del ítem</label>
                                                    <input
                                                        type="text"
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-alteha-violet transition-all w-full"
                                                        value={item.itemName}
                                                        onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Cant.</label>
                                                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2">
                                                            <button onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="p-2 text-slate-400 hover:text-alteha-turquoise"><Minus className="w-3.5 h-3.5" /></button>
                                                            <span className="font-black flex-1 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateItem(idx, 'quantity', item.quantity + 1)} className="p-2 text-alteha-turquoise"><Plus className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">P. Unitario ($)</label>
                                                        <input
                                                            type="number"
                                                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-alteha-violet transition-all w-full text-right"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Descripción breve (ej. Insumos descartables, habitación...)"
                                                className="bg-white/50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-medium text-slate-500 w-full outline-none italic"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={() => setStep(1)} className="px-10 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Atrás
                                </button>
                                <Button 
                                    onClick={() => {
                                        setFormData({...formData, basePrice: totalAmount, discountedPrice: discountedAmount});
                                        setStep(3);
                                    }} 
                                    className="bg-slate-900 px-10 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all"
                                >
                                    Revisar Oferta Final
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-alteha-turquoise to-alteha-violet" />
                                
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-slate-900">¿Todo listo para publicar?</h3>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                        Una vez publicado, el paquete estará disponible para que aseguradoras y clínicas lo incluyan en sus presupuestos de subastas.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Total</p>
                                        <p className="text-2xl font-black text-slate-400 line-through">${totalAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 bg-alteha-turquoise/10 rounded-[2rem] border border-alteha-turquoise/20">
                                        <p className="text-[10px] text-alteha-turquoise font-black uppercase tracking-widest mb-1">Oferta Alteha</p>
                                        <p className="text-2xl font-black text-alteha-turquoise">${discountedAmount.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <Button 
                                        onClick={handleCreatePackage}
                                        disabled={isLoading}
                                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Confirmar y Publicar</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </Button>
                                    <button 
                                        onClick={() => setStep(2)}
                                        className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                                    >
                                        Hacer un último ajuste
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Summary Sidebar Selection */}
                <div className="hidden lg:block">
                    <div className="sticky top-10 space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
                            <h4 className="font-black text-lg mb-6 flex items-center gap-2 text-alteha-turquoise">
                                <Layers className="w-5 h-5" />
                                Composición
                            </h4>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-alteha-turquoise/20 flex items-center justify-center text-[11px] font-black text-alteha-turquoise">{item.quantity}x</span>
                                            <span className="text-sm font-bold truncate max-w-[120px]">{item.itemName}</span>
                                        </div>
                                        <span className="text-sm font-black text-white/50">${(item.quantity * item.unitPrice).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 mt-6 border-t border-white/10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Base</span>
                                    <span className="text-lg font-bold text-white/60 line-through">${totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-alteha-turquoise uppercase tracking-widest">Oferta</span>
                                    <span className="text-3xl font-black text-alteha-turquoise">${discountedAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                <span className="font-black text-slate-900 block mb-0.5">Tip de Pro:</span>
                                Los paquetes con descuentos del <span className="font-bold text-alteha-violet">10-15%</span> tienen mayor prioridad de selección por aseguradoras.
                            </p>
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
            <div className={`w-10 h-10 rounded-[1.2rem] flex items-center justify-center font-bold text-sm transition-all duration-300 ${active ? 'bg-alteha-violet text-white shadow-xl shadow-alteha-violet/20 scale-110' :
                    completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                {completed ? <CheckCircle className="w-5 h-5" /> : num}
            </div>
            <span className={`text-sm font-black tracking-tight hidden xl:block ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}
