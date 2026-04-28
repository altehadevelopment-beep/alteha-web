"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileEdit, PlusCircle, Loader2 } from 'lucide-react';
import RelationshipSelect from './RelationshipSelect';

interface DynamicFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any | null;
    title: string;
    allowedKeys?: string[];
    enumOptions?: Record<string, string[]>;
}

export default function DynamicFormModal({ isOpen, onClose, onSubmit, initialData, title, allowedKeys, enumOptions }: DynamicFormModalProps) {
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);

    // Global Alteha Enums (Hardcoded for common JHipster models)
    const DEFAULT_ENUMS: Record<string, string[]> = {
        'role': ['PHARMACY', 'PATIENT', 'CLINIC', 'ADMIN', 'INSURANCE_COMPANY', 'DOCTOR'],
        'actorRole': ['PHARMACY', 'PATIENT', 'CLINIC', 'ADMIN', 'INSURANCE_COMPANY', 'DOCTOR'],
        'status': ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED', 'BLOCKED'],
        'gender': ['MASCULINO', 'FEMENINO', 'OTRO'],
        'documentType': ['V', 'E', 'J', 'G', 'P'],
    };

    const combinedEnums = { ...DEFAULT_ENUMS, ...enumOptions };

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
        } else {
            setFormData({});
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    // Discover keys: use allowedKeys if provided, otherwise extract from formData
    const rawKeys = allowedKeys && allowedKeys.length > 0
        ? allowedKeys
        : (formData ? Object.keys(formData) : []);

    const keys = rawKeys.filter(k => 
        k !== 'id' && 
        (typeof formData[k] !== 'object' || k.endsWith('Id') || !formData[k])
    );

    const handleChange = (key: string, value: any) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // JHipster/Spring Boot often expects relationships as objects { entity: { id: X } }
            // or as plain IDs. We'll send the ID AND the object to be safe.
            const submissionData = { ...formData };
            
            Object.keys(submissionData).forEach(key => {
                if (key.endsWith('Id') && submissionData[key]) {
                    const entityName = key.replace(/Id$/, '');
                    // Attach the object version
                    submissionData[entityName] = { id: submissionData[key] };
                    // Remove the redundant flat ID to avoid 'Unrecognized Property' errors on backend
                    delete submissionData[key];
                }
            });

            console.log('Final Payload:', submissionData);
            await onSubmit(submissionData);
            onClose();
        } catch (err: any) {
            console.error('Submit error:', err);
            const detail = err.response?.data?.detail || err.response?.data?.message || 'Error de validación en el servidor.';
            alert(`Error al guardar: ${detail}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col font-sans max-h-[90vh]"
                    >
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${initialData ? 'bg-alteha-blue' : 'bg-emerald-500'}`}>
                                    {initialData ? <FileEdit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 font-outfit leading-tight">
                                        {initialData ? 'Editar Registro' : 'Nuevo Registro'}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 tracking-wide">{title}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200/50 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="dynamic-form" onSubmit={handleSubmit} className="space-y-6">
                                {keys.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {keys.map(key => (
                                            <div key={key} className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/Id$/, '').trim()}
                                                </label>
                                                {key.endsWith('Id') ? (
                                                    <RelationshipSelect 
                                                        fieldName={key}
                                                        value={formData[key]}
                                                        onChange={(val) => handleChange(key, val)}
                                                    />
                                                ) : combinedEnums[key] || combinedEnums[key.toLowerCase()] ? (
                                                    <select
                                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:border-alteha-turquoise focus:ring-4 focus:ring-alteha-turquoise/10 outline-none transition-all cursor-pointer shadow-sm"
                                                        value={formData[key] || ''}
                                                        onChange={(e) => handleChange(key, e.target.value)}
                                                    >
                                                        <option value="">Seleccione {key.replace(/([A-Z])/g, ' $1').trim()}...</option>
                                                        {(combinedEnums[key] || combinedEnums[key.toLowerCase()]).map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : typeof formData[key] === 'boolean' ? (
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:border-alteha-turquoise focus:ring-4 focus:ring-alteha-turquoise/10 outline-none transition-all"
                                                        value={formData[key] ? 'true' : 'false'}
                                                        onChange={(e) => handleChange(key, e.target.value === 'true')}
                                                    >
                                                        <option value="true">Sí</option>
                                                        <option value="false">No</option>
                                                    </select>
                                                ) : typeof formData[key] === 'number' ? (
                                                    <input 
                                                        type="number" 
                                                        value={formData[key] || ''}
                                                        onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:border-alteha-turquoise focus:ring-4 focus:ring-alteha-turquoise/10 outline-none transition-all"
                                                    />
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        value={formData[key] || ''}
                                                        onChange={(e) => handleChange(key, e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:border-alteha-turquoise focus:ring-4 focus:ring-alteha-turquoise/10 outline-none transition-all"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 font-medium">Esquema dinámico no disponible para creación directa. Seleccione un elemento para editar.</p>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200/50 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                form="dynamic-form"
                                disabled={isLoading || keys.length === 0}
                                className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Guardar Datos
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
