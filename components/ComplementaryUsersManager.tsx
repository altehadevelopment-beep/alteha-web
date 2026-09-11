"use client";

// Gestión de Usuarios Complementarios (además de la cuenta principal). Reutilizable por
// aseguradoras, clínicas y casas de salud: solo cambia el `apiBase` del endpoint.
// Cada usuario complementario inicia sesión con los mismos permisos que la principal.
import React, { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus, Plus, Loader2, CheckCircle2, KeyRound, Power, Trash2, X } from 'lucide-react';

type CompUser = {
    id: number; name: string; email: string; phone?: string;
    cargo?: string; unidad?: string; type: string; status: string; isSelf: boolean;
};

export default function ComplementaryUsersManager({ apiBase, entidad = 'organización' }: { apiBase: string; entidad?: string }) {
    const [users, setUsers] = useState<CompUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', lastName: '', email: '', phone: '', cargo: '', unidad: '', password: '' });
    const [busy, setBusy] = useState(false);
    const [pwFor, setPwFor] = useState<number | null>(null);
    const [pw, setPw] = useState('');

    const api = async (path: string, opts: RequestInit = {}) => {
        const token = getStoredToken();
        const res = await fetch(`/api/${apiBase}${path}`, {
            ...opts,
            headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token || '', ...(opts.headers || {}) },
        });
        return res.json().catch(() => ({}));
    };

    const load = async () => {
        setLoading(true);
        const data = await api('');
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
    };
    useEffect(() => { void load(); /* eslint-disable-next-line */ }, [apiBase]);

    const create = async () => {
        if (!form.email.includes('@')) { toast.error('Ingresa un correo válido'); return; }
        if (form.password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
        setBusy(true);
        const r = await api('', { method: 'POST', body: JSON.stringify(form) });
        setBusy(false);
        if (r?.code === '00') {
            toast.success('Usuario complementario creado. Ya puede iniciar sesión.');
            setForm({ name: '', lastName: '', email: '', phone: '', cargo: '', unidad: '', password: '' });
            setAdding(false);
            void load();
        } else {
            toast.error(r?.message || 'No se pudo crear el usuario');
        }
    };

    const toggleStatus = async (u: CompUser) => {
        const value = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const r = await api(`/${u.id}/status`, { method: 'PUT', body: JSON.stringify({ value }) });
        if (r?.code === '00') { toast.success(value === 'ACTIVE' ? 'Usuario reactivado' : 'Usuario suspendido'); void load(); }
        else toast.error(r?.message || 'No se pudo cambiar el estado');
    };

    const remove = async (u: CompUser) => {
        const r = await api(`/${u.id}`, { method: 'DELETE' });
        if (r?.code === '00') { toast.success('Usuario eliminado'); void load(); }
        else toast.error(r?.message || 'No se pudo eliminar');
    };

    const resetPassword = async (id: number) => {
        if (pw.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
        const r = await api(`/${id}/password`, { method: 'PUT', body: JSON.stringify({ password: pw }) });
        if (r?.code === '00') { toast.success('Contraseña actualizada'); setPwFor(null); setPw(''); }
        else toast.error(r?.message || 'No se pudo actualizar');
    };

    const inputCls = 'p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none';

    return (
        <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-violet-50 text-alteha-violet rounded-xl"><UserPlus className="w-5 h-5" /></div>
                        Usuarios Complementarios
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-2 ml-1">
                        Agrega los usuarios complementarios que te apoyarán en tu gestión (opcional). Inician sesión como tu {entidad} con los mismos permisos que la cuenta principal.
                    </p>
                </div>
                {!adding && (
                    <button type="button" onClick={() => setAdding(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white font-black text-xs uppercase tracking-widest shrink-0">
                        <Plus className="w-4 h-4" /> Nuevo usuario
                    </button>
                )}
            </div>

            {adding && (
                <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombres" className={inputCls} />
                        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos" className={inputCls} />
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo (usuario para entrar)" type="email" className={inputCls} />
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono (opcional)" className={inputCls} />
                        <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Cargo desempeñado" className={inputCls} />
                        <input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} placeholder="Unidad de adscripción" className={inputCls} />
                        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña (mín. 8)" type="password" className={`md:col-span-2 ${inputCls}`} />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" disabled={busy} onClick={create}
                            className="px-6 py-3 rounded-xl bg-alteha-violet text-white font-black text-sm flex items-center gap-2 disabled:opacity-50">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Crear usuario
                        </button>
                        <button type="button" onClick={() => setAdding(false)} className="px-4 py-3 font-black text-sm text-slate-400">Cancelar</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-alteha-violet animate-spin" /></div>
            ) : (
                <div className="space-y-3">
                    {users.map((u) => (
                        <div key={u.id} className="flex flex-wrap items-center gap-3 bg-slate-50/60 rounded-2xl p-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-alteha-turquoise/20 to-alteha-violet/20 flex items-center justify-center font-black text-alteha-violet">
                                {(u.name || u.email).trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <p className="font-black text-slate-800">{u.name || '—'} {u.isSelf && <span className="text-[10px] text-slate-400">(tú)</span>}</p>
                                <p className="text-xs text-slate-400 font-semibold">{u.email}</p>
                                {(u.cargo || u.unidad) && (
                                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                        {[u.cargo, u.unidad].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>
                            {u.type === 'ADMIN' ? (
                                <span className="text-[10px] font-black text-alteha-violet bg-violet-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Principal</span>
                            ) : (
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${u.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                    {u.status === 'ACTIVE' ? 'Activo' : u.status === 'SUSPENDED' ? 'Suspendido' : u.status}
                                </span>
                            )}

                            {u.type !== 'ADMIN' && !u.isSelf && (
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setPwFor(pwFor === u.id ? null : u.id); setPw(''); }} title="Restablecer contraseña"
                                        className="p-2.5 rounded-xl bg-white text-slate-500 hover:text-alteha-violet"><KeyRound className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => toggleStatus(u)} title={u.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                                        className={`p-2.5 rounded-xl bg-white ${u.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'}`}><Power className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => remove(u)} title="Eliminar"
                                        className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            )}

                            {pwFor === u.id && (
                                <div className="w-full flex gap-2 mt-1">
                                    <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Nueva contraseña (mín. 8)"
                                        className="flex-1 p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
                                    <button type="button" onClick={() => resetPassword(u.id)} className="px-4 py-2 rounded-xl bg-alteha-violet text-white font-black text-xs">Guardar</button>
                                    <button type="button" onClick={() => { setPwFor(null); setPw(''); }} className="p-2.5 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
