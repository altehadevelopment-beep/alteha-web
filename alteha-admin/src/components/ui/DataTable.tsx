"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Shield, MoreHorizontal, ExternalLink } from 'lucide-react';

interface DataTableProps {
    data: any[];
    keys: string[];
    onEdit: (item: any) => void;
    onDelete: (id: string | number) => void;
}

export default function DataTable({ data, keys, onEdit, onDelete }: DataTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm mt-6">
                <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-800 mb-2 font-outfit">No hay registros</h3>
                <p className="text-slate-500">Aún no hay datos disponibles para esta entidad.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mt-6">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            {keys.map((key) => (
                                <th key={key} className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                            <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                        {data.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-all duration-200 group">
                                {keys.map((key) => (
                                    <td key={key} className="py-5 px-6 text-sm text-slate-600 font-medium max-w-[250px] truncate group-hover:text-slate-900 transition-colors">
                                        {(() => {
                                            const val = item[key];
                                            if (typeof val === 'boolean') {
                                                return val 
                                                    ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100 shadow-sm">Sí</span> 
                                                    : <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100">No</span>;
                                            }
                                            if (typeof val === 'string' && (
                                                val.startsWith('http') || 
                                                val.startsWith('/api/files') || 
                                                /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(val) ||
                                                val.includes('cloudfront.net')
                                            )) {
                                                const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(val) || 
                                                              key.toLowerCase().includes('image') || 
                                                              key.toLowerCase().includes('foto') || 
                                                              key.toLowerCase().includes('photo') ||
                                                              key.toLowerCase().includes('logo') ||
                                                              key.toLowerCase().includes('profile') ||
                                                              key.toLowerCase().includes('avatar') ||
                                                              key.toLowerCase().includes('pic') ||
                                                              key.toLowerCase().includes('img');

                                                const displayUrl = (val.startsWith('http') || val.startsWith('/')) ? val : `https://${val}`;

                                                if (isImg) {
                                                    return (
                                                        <a href={displayUrl} target="_blank" rel="noreferrer" className="block w-11 h-11 rounded-xl overflow-hidden border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:scale-110 transition-transform active:scale-95">
                                                            <img src={displayUrl} alt={key} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=File&background=E2E8F0&color=94A3B8')} />
                                                        </a>
                                                    );
                                                }
                                                return (
                                                    <a href={displayUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-alteha-blue hover:border-alteha-blue/20 transition-all">
                                                        <ExternalLink className="w-3.5 h-3.5" /> Ver Archivo
                                                    </a>
                                                );
                                            }
                                            if (typeof val === 'object' && val !== null) {
                                                const label = val.name || val.nombre || val.title || val.titulo || val.label || val.id;
                                                if (label) return <span className="px-2 py-0.5 bg-alteha-blue/5 text-alteha-blue rounded text-[10px] font-bold">{label}</span>;
                                                return JSON.stringify(val);
                                            }
                                            return String(val ?? '-');
                                        })()}
                                    </td>
                                ))}
                                <td className="py-5 px-6 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2 pr-2">
                                        <button 
                                            onClick={() => onEdit(item)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-alteha-teal transition-all duration-300 hover:shadow-[0_4px_12px_rgba(46,207,191,0.3)] group/btn"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(item.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-300 hover:shadow-[0_4px_12px_rgba(240,68,68,0.3)] group/btn"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination Placeholder */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <span className="text-xs font-bold text-slate-400">Mostrando {data.length} registros</span>
                <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
}
