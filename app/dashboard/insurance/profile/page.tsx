"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Upload,
    Building2,
    Shield,
    Globe,
    Mail,
    Phone,
    User,
    FileText,
    CheckCircle2,
    Loader2,
    Lock,
    Pencil,
    Plus,
    Trash2,
    Users,
    UserPlus,
    KeyRound,
    Power,
    X
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { PhoneField } from '@/components/ui/PhoneField';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { toast } from 'sonner';
import { getStoredToken } from '@/lib/api';

const ReadOnlyField = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
    <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Lock className="w-3 h-3" />
            <span>{label}</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 cursor-not-allowed">
            {Icon && <Icon className="w-4 h-4 text-slate-300 flex-shrink-0" />}
            <span className="text-slate-400 font-medium text-sm truncate">{value || '—'}</span>
        </div>
    </div>
);

const EditableFieldWrapper = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-alteha-violet">
            <Pencil className="w-3 h-3" />
            <span>{label}</span>
        </div>
        <div className="border-l-2 border-alteha-violet/30 pl-0.5 rounded-r-2xl">
            {children}
        </div>
    </div>
);

export default function InsuranceProfilePage() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        commercialName: '',
        legalName: '',
        identificationType: 'RIF',
        identificationNumber: '',
        insuranceLicenseNumber: '',
        email: '',
        phone: '',
        website: '',
        contactPersonName: '',
        contactPersonEmail: '',
        contactPersonPhone: ''
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                commercialName: userProfile.commercialName || '',
                legalName: userProfile.legalName || '',
                identificationType: userProfile.identificationType || 'RIF',
                identificationNumber: userProfile.identificationNumber || '',
                insuranceLicenseNumber: userProfile.insuranceLicenseNumber || '',
                email: userProfile.email || '',
                phone: userProfile.phone || '',
                website: userProfile.website || '',
                contactPersonName: userProfile.contactPersonName || '',
                contactPersonEmail: userProfile.contactPersonEmail || '',
                contactPersonPhone: userProfile.contactPersonPhone || ''
            });
        }
    }, [userProfile]);

    const buildInsurancePayload = () => ({
        commercialName: formData.commercialName,
        legalName: formData.legalName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        insuranceLicenseNumber: formData.insuranceLicenseNumber,
        contactPersonName: formData.contactPersonName,
        contactPersonEmail: formData.contactPersonEmail,
        contactPersonPhone: formData.contactPersonPhone,
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoPreview(URL.createObjectURL(file));
        setIsUploadingLogo(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No token');
            const fd = new FormData();
            fd.append('insurance', JSON.stringify(buildInsurancePayload()));
            fd.append('logo', file);
            const res = await fetch('/api/insurance-companies/profile', {
                method: 'PUT',
                headers: { 'X-Alteha-Token': token },
                body: fd,
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `HTTP ${res.status}`);
            }
            toast.success('Imagen de perfil actualizada');
        } catch (err: any) {
            toast.error(err.message || 'Error al subir imagen');
            setLogoPreview(null);
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No token');
            const fd = new FormData();
            fd.append('insurance', JSON.stringify(buildInsurancePayload()));
            const res = await fetch('/api/insurance-companies/profile', {
                method: 'PUT',
                headers: { 'X-Alteha-Token': token },
                body: fd,
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `HTTP ${res.status}`);
            }
            toast.success('Perfil actualizado correctamente');
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const displayProfile = userProfile || {};

    return (
        <div className="space-y-10 font-outfit max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link href="/dashboard/insurance" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-violet transition-colors mb-4 font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Perfil de Empresa</h1>
                    <p className="text-slate-500 font-medium">Gestiona la información legal y de contacto de tu aseguradora</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/insurance" className="hover:scale-110 transition-transform">
                        <Logo className="w-12 h-12" />
                    </Link>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-6 px-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-alteha-violet">
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Campo editable</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Solo lectura</span>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Logo & Basic Identity */}
                <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-50 flex items-center justify-center p-6">
                                {logoPreview || displayProfile.logoUrl ? (
                                    <img src={logoPreview || displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Shield className="w-16 h-16 text-alteha-violet opacity-20" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={isUploadingLogo}
                                className="absolute -bottom-2 -right-2 p-3 bg-alteha-violet text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform disabled:opacity-70"
                            >
                                {isUploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            </button>
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div className="md:col-span-2">
                                <EditableFieldWrapper label="Nombre Comercial">
                                    <Input
                                        value={formData.commercialName}
                                        onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                                        icon={Building2}
                                    />
                                </EditableFieldWrapper>
                            </div>
                            <EditableFieldWrapper label="Razón Social">
                                <Input
                                    value={formData.legalName}
                                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                                />
                            </EditableFieldWrapper>
                            <EditableFieldWrapper label="Nº de Licencia de Seguros">
                                <Input
                                    value={formData.insuranceLicenseNumber}
                                    onChange={(e) => setFormData({ ...formData, insuranceLicenseNumber: e.target.value })}
                                    icon={FileText}
                                />
                            </EditableFieldWrapper>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Legal Information */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-xl">
                                <FileText className="w-5 h-5 text-slate-500" />
                            </div>
                            Información Legal
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ReadOnlyField label="Tipo de ID" value={formData.identificationType} />
                            <ReadOnlyField label="Número de ID" value={formData.identificationNumber} />
                        </div>
                    </div>

                    {/* Contact Channels */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-xl">
                                <Globe className="w-5 h-5 text-slate-500" />
                            </div>
                            Canales de Contacto
                        </h3>
                        <div className="space-y-4">
                            <EditableFieldWrapper label="Correo Electrónico Corporativo">
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    icon={Mail}
                                />
                            </EditableFieldWrapper>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PhoneField
                                    value={formData.phone}
                                    onChange={(v) => setFormData({ ...formData, phone: v })}
                                />
                                <EditableFieldWrapper label="Sitio Web">
                                    <Input
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </EditableFieldWrapper>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personas de Contacto / Administradores (varias) */}
                <ContactManager />

                {/* Usuarios adicionales con acceso */}
                <InsuranceUsersManager />

                {/* Action Bar */}
                <div className="flex items-center justify-end gap-4 bg-slate-900/5 p-6 rounded-[2.5rem] border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium mr-auto pl-4 hidden md:block">
                        Última actualización: <span className="font-bold text-slate-700">{displayProfile.createdAt ? new Date(displayProfile.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </p>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-10 py-6 bg-alteha-violet text-white rounded-2xl font-black shadow-xl shadow-alteha-violet/20 hover:scale-105 transition-all"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>Guardar Cambios</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}

// ─────────────────────────── Personas de contacto (varias) ───────────────────────────
type Contact = { id?: number; name: string; email: string; phone: string };

async function contactsApi(path: string, opts: RequestInit = {}) {
    const token = getStoredToken();
    const res = await fetch(`/api/insurance-contacts${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token || '', ...(opts.headers || {}) },
    });
    return res.json().catch(() => ({}));
}

function ContactManager() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState<Contact | null>(null);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        setLoading(true);
        const data = await contactsApi('');
        setContacts(Array.isArray(data) ? data : []);
        setLoading(false);
    };
    useEffect(() => { void load(); }, []);

    const saveContact = async (c: Contact) => {
        if (!c.name?.trim()) { toast.error('El nombre del contacto es obligatorio'); return; }
        setBusy(true);
        const body = JSON.stringify({ name: c.name, email: c.email, phone: c.phone });
        const r = c.id
            ? await contactsApi(`/${c.id}`, { method: 'PUT', body })
            : await contactsApi('', { method: 'POST', body });
        setBusy(false);
        if (r?.code === '00') {
            toast.success(c.id ? 'Contacto actualizado' : 'Contacto agregado');
            setDraft(null);
            void load();
        } else {
            toast.error(r?.message || 'No se pudo guardar');
        }
    };

    const removeContact = async (id?: number) => {
        if (!id) { setDraft(null); return; }
        setBusy(true);
        const r = await contactsApi(`/${id}`, { method: 'DELETE' });
        setBusy(false);
        if (r?.code === '00') { toast.success('Contacto eliminado'); void load(); }
    };

    return (
        <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Users className="w-5 h-5" /></div>
                    Personas de Contacto / Administradores
                </h3>
                {!draft && (
                    <button
                        type="button"
                        onClick={() => setDraft({ name: '', email: '', phone: '' })}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white font-black text-xs uppercase tracking-widest">
                        <Plus className="w-4 h-4" /> Agregar contacto
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-alteha-violet animate-spin" /></div>
            ) : (
                <div className="space-y-4">
                    {contacts.length === 0 && !draft && (
                        <p className="text-slate-400 font-medium text-sm text-center py-6">Aún no hay personas de contacto. Usa “Agregar contacto”.</p>
                    )}

                    {contacts.map((c) => (
                        <ContactRow key={c.id} contact={c} busy={busy} onSave={saveContact} onRemove={removeContact} />
                    ))}

                    {draft && (
                        <ContactRow contact={draft} isNew busy={busy} onSave={saveContact} onRemove={() => setDraft(null)} />
                    )}
                </div>
            )}
        </section>
    );
}

function ContactRow({ contact, isNew, busy, onSave, onRemove }: { contact: Contact; isNew?: boolean; busy: boolean; onSave: (c: Contact) => void; onRemove: (id?: number) => void; }) {
    const [c, setC] = useState<Contact>(contact);
    useEffect(() => { setC(contact); }, [contact.id]); // eslint-disable-line
    const dirty = c.name !== contact.name || c.email !== contact.email || c.phone !== contact.phone;

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_1fr_auto] gap-3 items-end bg-slate-50/60 rounded-2xl p-4">
            <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre completo</label>
                <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="Nombre del responsable"
                    className="w-full p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
            </div>
            <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de contacto</label>
                <input value={c.email || ''} onChange={(e) => setC({ ...c, email: e.target.value })} placeholder="email@ejemplo.com"
                    className="w-full p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
            </div>
            <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono de contacto</label>
                <input value={c.phone || ''} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="0424..."
                    className="w-full p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
            </div>
            <div className="flex gap-2">
                {(isNew || dirty) && (
                    <button type="button" disabled={busy} onClick={() => onSave(c)}
                        className="p-3 rounded-xl bg-alteha-violet text-white disabled:opacity-50" title="Guardar">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                )}
                <button type="button" disabled={busy} onClick={() => onRemove(c.id)}
                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50" title={isNew ? 'Cancelar' : 'Eliminar'}>
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────── Usuarios adicionales con acceso ───────────────────────────
type InsUser = { id: number; name: string; email: string; phone?: string; type: string; status: string; isSelf: boolean };

async function usersApi(path: string, opts: RequestInit = {}) {
    const token = getStoredToken();
    const res = await fetch(`/api/insurance-users${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': token || '', ...(opts.headers || {}) },
    });
    return res.json().catch(() => ({}));
}

function InsuranceUsersManager() {
    const [users, setUsers] = useState<InsUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', lastName: '', email: '', phone: '', password: '' });
    const [busy, setBusy] = useState(false);
    const [pwFor, setPwFor] = useState<number | null>(null);
    const [pw, setPw] = useState('');

    const load = async () => {
        setLoading(true);
        const data = await usersApi('');
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
    };
    useEffect(() => { void load(); }, []);

    const create = async () => {
        if (!form.email.includes('@')) { toast.error('Ingresa un correo válido'); return; }
        if (form.password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
        setBusy(true);
        const r = await usersApi('', { method: 'POST', body: JSON.stringify(form) });
        setBusy(false);
        if (r?.code === '00') {
            toast.success('Usuario adicional creado. Ya puede iniciar sesión como seguro.');
            setForm({ name: '', lastName: '', email: '', phone: '', password: '' });
            setAdding(false);
            void load();
        } else {
            toast.error(r?.message || 'No se pudo crear el usuario');
        }
    };

    const toggleStatus = async (u: InsUser) => {
        const value = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const r = await usersApi(`/${u.id}/status`, { method: 'PUT', body: JSON.stringify({ value }) });
        if (r?.code === '00') { toast.success(value === 'ACTIVE' ? 'Usuario reactivado' : 'Usuario suspendido'); void load(); }
        else toast.error(r?.message || 'No se pudo cambiar el estado');
    };

    const remove = async (u: InsUser) => {
        const r = await usersApi(`/${u.id}`, { method: 'DELETE' });
        if (r?.code === '00') { toast.success('Usuario eliminado'); void load(); }
        else toast.error(r?.message || 'No se pudo eliminar');
    };

    const resetPassword = async (id: number) => {
        if (pw.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
        const r = await usersApi(`/${id}/password`, { method: 'PUT', body: JSON.stringify({ password: pw }) });
        if (r?.code === '00') { toast.success('Contraseña actualizada'); setPwFor(null); setPw(''); }
        else toast.error(r?.message || 'No se pudo actualizar');
    };

    return (
        <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-violet-50 text-alteha-violet rounded-xl"><UserPlus className="w-5 h-5" /></div>
                        Usuarios con Acceso
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-2 ml-1">
                        Cuentas adicionales que inician sesión como tu aseguradora con los mismos permisos que la cuenta principal.
                    </p>
                </div>
                {!adding && (
                    <button type="button" onClick={() => setAdding(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-alteha-turquoise to-alteha-violet text-white font-black text-xs uppercase tracking-widest shrink-0">
                        <Plus className="w-4 h-4" /> Nuevo usuario
                    </button>
                )}
            </div>

            {/* Alta de usuario */}
            {adding && (
                <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre"
                            className="p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
                        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellido"
                            className="p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo (usuario para entrar)" type="email"
                            className="p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono (opcional)"
                            className="p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
                        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña (mín. 8)" type="password"
                            className="md:col-span-2 p-3 bg-white border-2 border-transparent focus:border-alteha-violet rounded-xl font-bold text-sm text-slate-900 outline-none" />
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

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-alteha-violet animate-spin" /></div>
            ) : (
                <div className="space-y-3">
                    {users.map((u) => (
                        <div key={u.id} className="flex flex-wrap items-center gap-3 bg-slate-50/60 rounded-2xl p-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-alteha-turquoise/20 to-alteha-violet/20 flex items-center justify-center font-black text-alteha-violet">
                                {(u.name || u.email).trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-[180px]">
                                <p className="font-black text-slate-800">{u.name || '—'} {u.isSelf && <span className="text-[10px] text-slate-400">(tú)</span>}</p>
                                <p className="text-xs text-slate-400 font-semibold">{u.email}</p>
                            </div>
                            {u.type === 'ADMIN' ? (
                                <span className="text-[10px] font-black text-alteha-violet bg-violet-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Principal</span>
                            ) : (
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${u.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                    {u.status === 'ACTIVE' ? 'Activo' : u.status === 'SUSPENDED' ? 'Suspendido' : u.status}
                                </span>
                            )}

                            {/* Acciones solo para usuarios adicionales que no sean uno mismo */}
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

                            {/* Cambiar contraseña inline */}
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
