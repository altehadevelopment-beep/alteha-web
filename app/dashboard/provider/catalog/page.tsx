"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Package,
    DollarSign,
    Info,
    CheckCircle,
    ChevronRight,
    Image,
    Tag,
    Layers,
    Trash2,
    Upload,
    Star
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ProductCatalogPage() {
    const [products, setProducts] = useState([
        { id: 1, name: 'Prótesis de Rodilla Titanio', category: 'Ortopédicos', price: 3500, stock: 12, featured: true },
        { id: 2, name: 'Kit de Sutura Quirúrgica x50', category: 'Consumibles', price: 450, stock: 200, featured: false },
        { id: 3, name: 'Equipo de Monitoreo Cardíaco', category: 'Equipos', price: 8900, stock: 5, featured: true },
    ]);

    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div className="space-y-10 font-outfit max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/provider" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4 font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Catálogo de Productos</h1>
                    <p className="text-slate-500 font-medium">Gestiona tu inventario y productos disponibles para subastas</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Agregar Producto
                </button>
            </div>

            {/* Add Product Form */}
            {showAddForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8"
                >
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Package className="w-6 h-6 text-indigo-600" />
                        Nuevo Producto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Nombre del Producto" placeholder="Ej: Prótesis de Cadera Titanio" />
                        <Input label="Categoría" placeholder="Ej: Ortopédicos" icon={Tag} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input label="Precio Base" placeholder="$0.00" icon={DollarSign} />
                        <Input label="Stock Disponible" placeholder="Ej: 50" icon={Layers} />
                        <Input label="SKU / Código" placeholder="Ej: ORT-001" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descripción</label>
                        <textarea
                            className="w-full h-32 bg-slate-50 rounded-2xl p-5 border border-slate-100 outline-none focus:border-indigo-500/50 transition-all font-medium text-slate-600 resize-none"
                            placeholder="Describe las características del producto..."
                        />
                    </div>
                    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Upload className="w-8 h-8 text-slate-400" />
                        <div>
                            <p className="font-bold text-slate-600">Arrastra imágenes aquí o haz clic para subir</p>
                            <p className="text-sm text-slate-400">PNG, JPG hasta 5MB</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button onClick={() => setShowAddForm(false)} className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                            Cancelar
                        </button>
                        <Button className="bg-indigo-600 px-10 py-4 rounded-2xl font-black text-white hover:bg-indigo-700 transition-all">
                            Guardar Producto
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Productos</p>
                        <p className="text-2xl font-black text-slate-900">{products.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                        <Star className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Destacados</p>
                        <p className="text-2xl font-black text-slate-900">{products.filter(p => p.featured).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">En Stock</p>
                        <p className="text-2xl font-black text-slate-900">{products.reduce((a, p) => a + p.stock, 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor Total</p>
                        <p className="text-2xl font-black text-slate-900">${products.reduce((a, p) => a + (p.price * p.stock), 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900 px-2">Todos los Productos</h3>
                {products.map((product) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Image className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-slate-900 text-lg">{product.name}</h4>
                                    {product.featured && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded-full">
                                            <Star className="w-3 h-3 fill-amber-500" />
                                            Destacado
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{product.category}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-xs font-medium text-slate-400">Stock: {product.stock} unidades</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio</p>
                                <p className="text-2xl font-black text-slate-900">${product.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                    <Info className="w-5 h-5" />
                                </button>
                                <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
