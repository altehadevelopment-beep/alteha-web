"use client";

// Listas de exclusión de la aseguradora: por defecto todas las subastas son visibles
// para todos; aquí el seguro define a quién NO quiere mostrarle sus subastas.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldBan, Search, Plus, X, Loader2, Stethoscope, Building2, Cross, Info } from 'lucide-react';
import { getStoredToken } from '@/lib/api';

type Actor = { id: number; name: string; extra?: string; photo?: string | null; status?: string; exclusionId?: number };

const TABS = [
    { key: 'DOCTOR', label: 'Médicos', icon: Stethoscope },
    { key: 'CLINIC', label: 'Clínicas', icon: Building2 },
    { key: 'PHARMACY', label: 'Casas de Salud', icon: Cross },
] as const;

async function api(path: string, opts: RequestInit = {}) {
    const token = getStoredToken();
    const res = await fetch(`/api/exclusion-lists${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token || '', ...(opts.headers || {}) },
    });
    return res.json().catch(() => ({}));
}

function Avatar({ uri, name }: { uri?: string | null; name?: string }) {
    if (uri) return <img src={uri} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100" />;
    return (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-alteha-turquoise/20 to-alteha-violet/20 flex items-center justify-center font-black text-alteha-violet">
            {(name || '?').trim().charAt(0).toUpperCase()}
        </div>
    );
}

export default function ExclusionsPage() {
    const [tab, setTab] = useState<'DOCTOR' | 'CLINIC' | 'PHARMACY'>('DOCTOR');
    const [lists, setLists] = useState<Record<string, Actor[]>>({ DOCTOR: [], CLINIC: [], PHARMACY: [] });
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [available, setAvailable] = useState<Actor[]>([]);
    const [q, setQ] = useState('');
    const [searching, setSearching] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const loadLists = useCallback(async () => {
        setLoading(true);
        const d = await api('');
        setLists({ DOCTOR: d.DOCTOR || [], CLINIC: d.CLINIC || [], PHARMACY: d.PHARMACY || [] });
        setLoading(false);
    }, []);

    useEffect(() => { void loadLists(); }, [loadLists]);

    const loadAvailable = useCallback(async (search: string) => {
        setSearching(true);
        const data = await api(`/available?role=${tab}${search ? `&q=${encodeURIComponent(search)}` : ''}`);
        setAvailable(Array.isArray(data) ? data : []);
        setSearching(false);
    }, [tab]);

    useEffect(() => { if (adding) void loadAvailable(q); }, [adding, tab]); // eslint-disable-line

    const add = async (a: Actor) => {
        setBusyId(a.id);
        const r = await api('', { method: 'POST', body: JSON.stringify({ role: tab, actorId: a.id }) });
        setBusyId(null);
        if (r?.code === '00') {
            setMsg(`${a.name} agregado a la lista de exclusión`);
            setAvailable((prev) => prev.filter((x) => x.id !== a.id));
            void loadLists();
        }
    };

    const remove = async (a: Actor) => {
        setBusyId(a.id);
        const r = await api(`/${tab}/${a.id}`, { method: 'DELETE' });
        setBusyId(null);
        if (r?.code === '00') {
            setMsg(`${a.name} readmitido: volverá a ver tus subastas`);
            void loadLists();
        }
    };

    const current = lists[tab] || [];
    const TabIcon = TABS.find((t) => t.key === tab)!.icon;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <ShieldBan className="w-8 h-8 text-alteha-violet" /> Listas de Exclusión
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Tus subastas son visibles para <b>todos</b> los médicos, clínicas y casas de salud —
                    incluso los recién registrados. Aquí eliges a quién <b>no</b> quieres mostrarle tus subastas.
                </p>
            </header>

            <div className="flex items-start gap-3 bg-alteha-violet/5 border border-alteha-violet/15 rounded-2xl p-4">
                <Info className="w-5 h-5 text-alteha-violet shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 font-medium">
                    Quien esté en esta lista no verá tus subastas y, si alguien intenta invitarlo a participar,
                    el sistema indicará que <b>no está autorizado por tu aseguradora</b>.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key); setAdding(false); setQ(''); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all ${
                            tab === t.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-200'
                        }`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                        {(lists[t.key]?.length ?? 0) > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-red-50 text-red-500'}`}>
                                {lists[t.key].length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {msg && <p className="text-sm font-bold text-alteha-violet">{msg}</p>}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                        <TabIcon className="w-5 h-5 text-slate-400" /> Excluidos ({current.length})
                    </h3>
                    <button
                        onClick={() => { setAdding((v) => !v); setQ(''); }}
                        className="px-4 py-2.5 rounded-xl font-black text-white text-xs uppercase tracking-widest bg-gradient-to-r from-alteha-turquoise to-alteha-violet flex items-center gap-1.5">
                        {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {adding ? 'Cerrar' : 'Agregar'}
                    </button>
                </div>

                {/* Buscador para agregar */}
                {adding && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 bg-slate-50 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 bg-white rounded-xl px-3 h-11 border border-slate-100">
                            <Search className="w-4 h-4 text-slate-300" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadAvailable(q)}
                                placeholder={`Buscar ${TABS.find((t) => t.key === tab)!.label.toLowerCase()} por nombre o correo…`}
                                className="flex-1 outline-none font-semibold text-sm text-slate-800 bg-transparent"
                            />
                            <button onClick={() => loadAvailable(q)} className="text-alteha-violet font-black text-xs uppercase">Buscar</button>
                        </div>
                        <div className="max-h-72 overflow-y-auto space-y-2">
                            {searching ? (
                                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-alteha-violet animate-spin" /></div>
                            ) : available.length === 0 ? (
                                <p className="text-center py-6 text-slate-400 font-semibold text-sm">Sin resultados.</p>
                            ) : available.map((a) => (
                                <div key={a.id} className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-slate-100">
                                    <Avatar uri={a.photo} name={a.name} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm text-slate-800 truncate">{a.name}</p>
                                        <p className="text-xs text-slate-400 font-semibold truncate">{a.extra}</p>
                                    </div>
                                    <button
                                        onClick={() => add(a)}
                                        disabled={busyId === a.id}
                                        className="px-3 py-2 rounded-lg bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-100 disabled:opacity-50 flex items-center gap-1">
                                        {busyId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldBan className="w-3.5 h-3.5" />} Excluir
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Lista actual */}
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-alteha-violet animate-spin" /></div>
                ) : current.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                        <TabIcon className="w-10 h-10 text-slate-200 mx-auto" />
                        <p className="font-black text-slate-500">Nadie excluido en esta lista</p>
                        <p className="text-sm text-slate-400 font-medium">Todas tus subastas les son visibles. Usa “Agregar” para excluir a alguien.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {current.map((a) => (
                            <div key={a.id} className="flex items-center gap-3 bg-slate-50/60 rounded-2xl p-3">
                                <Avatar uri={a.photo} name={a.name} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 truncate">{a.name}</p>
                                    <p className="text-xs text-slate-400 font-semibold truncate">{a.extra}</p>
                                </div>
                                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Excluido</span>
                                <button
                                    onClick={() => remove(a)}
                                    disabled={busyId === a.id}
                                    className="px-3 py-2 rounded-lg text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 flex items-center gap-1">
                                    {busyId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Readmitir
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
