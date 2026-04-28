"use client";

import React from 'react';
import { Search, UserCircle } from 'lucide-react';
import { useSearchStore } from '@/lib/store';

export default function Header() {
    const { searchQuery, setSearchQuery } = useSearchStore();

    return (
        <header className="h-20 bg-white flex items-center justify-between px-8 shrink-0 relative z-10 font-sans"
            style={{
                borderBottom: '1px solid rgba(123,91,255,0.08)',
                boxShadow: '0 2px 20px rgba(123,91,255,0.05)',
            }}>

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A0AABB' }} />
                <input
                    type="text"
                    placeholder="Buscar registros, clínicas, usuarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all"
                    style={{ background: '#F4F5FF', border: '1.5px solid rgba(123,91,255,0.1)', color: '#0F1128' }}
                    onFocus={e => { e.target.style.border = '1.5px solid #2ECFBF'; e.target.style.boxShadow = '0 0 0 3px rgba(46,207,191,0.1)'; }}
                    onBlur={e => { e.target.style.border = '1.5px solid rgba(123,91,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
            </div>

            {/* Profile only */}
            <div className="flex items-center gap-3 ml-4">
                <button className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl transition-all hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg, #2ECFBF, #7B5BFF)', boxShadow: '0 4px 12px rgba(123,91,255,0.3)' }}>
                        <UserCircle className="w-7 h-7 opacity-90" />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-bold leading-tight" style={{ color: '#0F1128' }}>Administrador</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2ECFBF' }}>Alteha Root</p>
                    </div>
                </button>
            </div>
        </header>
    );
}
