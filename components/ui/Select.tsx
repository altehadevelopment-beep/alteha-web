"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
    id: string | number;
    label: string;
    image?: string;
}

interface MultiSelectProps {
    label: string;
    options: Option[];
    selected: (string | number)[];
    onChange: (selected: (string | number)[]) => void;
    placeholder?: string;
}

export const MultiSelect = ({ label, options, selected, onChange, placeholder = "Seleccionar..." }: MultiSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selectedOptions = options.filter(opt => selected.includes(opt.id));
    const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));

    const toggleOption = (id: string | number) => {
        if (selected.includes(id)) {
            onChange(selected.filter(i => i !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="relative mb-6 z-10">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

            {/* Selected Chips */}
            <div className="flex flex-wrap gap-2 mb-2">
                <AnimatePresence>
                    {selectedOptions.map(opt => (
                        <motion.div
                            key={opt.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="px-3 py-1 bg-gradient-to-r from-alteha-turquoise/10 to-alteha-violet/10 border border-alteha-violet/20 rounded-full flex items-center gap-2 text-sm text-alteha-violet font-medium"
                        >
                            {opt.image && <img src={opt.image} alt="" className="w-4 h-4 rounded-full" />}
                            {opt.label}
                            <button
                                onClick={() => toggleOption(opt.id)}
                                className="hover:bg-red-100 rounded-full p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                                type="button"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-4 py-3 bg-white border rounded-xl flex items-center justify-between transition-all duration-300
          ${isOpen ? 'border-alteha-violet ring-2 ring-alteha-violet/20' : 'border-slate-200 hover:border-alteha-violet/50'}
        `}
            >
                <span className={selected.length ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                    {selected.length > 0 ? `${selected.length} seleccionados` : placeholder}
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 max-h-[300px] flex flex-col"
                    >
                        <div className="p-2 border-b border-slate-50 sticky top-0 bg-white z-10">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 ring-alteha-violet/20 transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                                onClick={e => e.stopPropagation()}
                            />
                        </div>

                        <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => {
                                    const isSelected = selected.includes(opt.id);
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => toggleOption(opt.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-1 group
                        ${isSelected ? 'bg-alteha-violet/5 text-alteha-violet font-semibold' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                {opt.image ? (
                                                    <img src={opt.image} alt="" className="w-8 h-8 rounded-full border border-slate-100" />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${isSelected ? 'bg-alteha-violet text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                            `}>
                                                        {opt.label.charAt(0)}
                                                    </div>
                                                )}
                                                <span>{opt.label}</span>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-alteha-violet" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-slate-400 text-sm">No se encontraron resultados</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay to close */}
            {isOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
};

interface SelectProps {
    label: string;
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
}

export const Select = ({ label, options, value, onChange, placeholder = "Seleccionar..." }: SelectProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(opt => opt.id === value);

    const handleSelect = (id: string | number) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className="relative mb-6 z-20">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-4 py-3 bg-white border rounded-xl flex items-center justify-between transition-all duration-300
          ${isOpen ? 'border-alteha-violet ring-2 ring-alteha-violet/20' : 'border-slate-200 hover:border-alteha-violet/50'}
        `}
            >
                <div className="flex items-center gap-3">
                    {selectedOption?.image && (
                        <img src={selectedOption.image} alt="" className="w-6 h-6 rounded-full" />
                    )}
                    <span className={selectedOption ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 max-h-[300px] flex flex-col"
                    >
                        <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            {options.map(opt => {
                                const isSelected = opt.id === value;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSelect(opt.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-1 group
                        ${isSelected ? 'bg-alteha-violet/5 text-alteha-violet font-semibold' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {opt.image ? (
                                                <img src={opt.image} alt="" className="w-8 h-8 rounded-full border border-slate-100" />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${isSelected ? 'bg-alteha-violet text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                            `}>
                                                    {opt.label.charAt(0)}
                                                </div>
                                            )}
                                            <span>{opt.label}</span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-alteha-violet" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay to close */}
            {isOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
};
