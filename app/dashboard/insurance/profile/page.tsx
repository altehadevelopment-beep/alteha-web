"use client";

import React, { useState, useEffect } from 'react';
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
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { toast } from 'sonner';

export default function InsuranceProfilePage() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [loading, setLoading] = useState(false);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call for now as user only requested UI/Integration
        setTimeout(() => {
            setLoading(false);
            toast.success('Perfil actualizado correctamente');
        }, 1500);
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

            <form onSubmit={handleSave} className="space-y-8">
                {/* Logo & Basic Identity */}
                <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-50 flex items-center justify-center p-6">
                                {displayProfile.logoUrl ? (
                                    <img src={displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Shield className="w-16 h-16 text-alteha-violet opacity-20" />
                                )}
                            </div>
                            <button type="button" className="absolute -bottom-2 -right-2 p-3 bg-alteha-violet text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div className="md:col-span-2">
                                <Input
                                    label="Nombre Comercial"
                                    value={formData.commercialName}
                                    onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                                    icon={Building2}
                                />
                            </div>
                            <Input
                                label="Razón Social"
                                value={formData.legalName}
                                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                            />
                            <Input
                                label="Nº de Licencia de Seguros"
                                value={formData.insuranceLicenseNumber}
                                onChange={(e) => setFormData({ ...formData, insuranceLicenseNumber: e.target.value })}
                                icon={FileText}
                            />
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
                            <Input
                                label="Tipo de ID"
                                value={formData.identificationType}
                                disabled
                            />
                            <Input
                                label="Número de ID"
                                value={formData.identificationNumber}
                                disabled
                            />
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
                            <Input
                                label="Correo Electrónico Corporativo"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                icon={Mail}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Teléfono"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    icon={Phone}
                                />
                                <Input
                                    label="Sitio Web"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Person Details */}
                <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                                <User className="w-5 h-5" />
                            </div>
                            Persona de Contacto / Administrador
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Nombre Completo"
                            value={formData.contactPersonName}
                            onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                            placeholder="Nombre del responsable"
                        />
                        <Input
                            label="Email de Contacto"
                            value={formData.contactPersonEmail}
                            onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                            placeholder="email@ejemplo.com"
                        />
                        <Input
                            label="Teléfono de Contacto"
                            value={formData.contactPersonPhone}
                            onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                            placeholder="+58 ..."
                        />
                    </div>
                </section>

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
