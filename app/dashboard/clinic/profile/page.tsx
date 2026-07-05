"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Upload,
    Building2,
    Globe,
    Mail,
    Phone,
    FileText,
    MapPin,
    Stethoscope,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { updateClinicProfile } from '@/lib/api';
import dynamic from 'next/dynamic';
const LocationPicker = dynamic(() => import('@/components/maps/LocationPicker'), { ssr: false });
import { toast } from 'sonner';

export default function ClinicProfilePage() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Solo los campos que acepta el backend (ClinicUpdateDTO)
    const updatableFields = () => ({
        name: formData.name,
        legalName: formData.legalName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
    });

    const handleLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('El logo debe ser una imagen (PNG, JPG…)');
            return;
        }
        setUploadingLogo(true);
        try {
            const res = await updateClinicProfile(updatableFields(), file);
            if (res?.code === '00') {
                setLogoPreview(URL.createObjectURL(file));
                toast.success('Logo actualizado correctamente');
            } else {
                toast.error(res?.message || 'No se pudo subir el logo');
            }
        } catch {
            toast.error('Error de conexión al subir el logo');
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };
    const [formData, setFormData] = useState({
        name: '',
        legalName: '',
        identificationType: 'RIF',
        identificationNumber: '',
        healthLicenseNumber: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        latitude: 0,
        longitude: 0,
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || userProfile.commercialName || '',
                legalName: userProfile.legalName || '',
                identificationType: userProfile.identificationType || 'RIF',
                identificationNumber: userProfile.identificationNumber || '',
                healthLicenseNumber: userProfile.healthLicenseNumber || '',
                email: userProfile.email || '',
                phone: userProfile.phone || '',
                website: userProfile.website || '',
                address: userProfile.address || '',
                latitude: userProfile.latitude || 0,
                longitude: userProfile.longitude || 0,
            });
        }
    }, [userProfile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await updateClinicProfile(updatableFields());
            if (res?.code === '00') {
                toast.success('Perfil de la clínica actualizado correctamente');
            } else {
                toast.error(res?.message || 'No se pudo actualizar el perfil');
            }
        } catch {
            toast.error('Error de conexión al actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const displayProfile = userProfile || {};
    const specialtyNames = displayProfile.specialties?.map((s: any) => s.name).filter(Boolean).join(', ') || '';

    return (
        <div className="space-y-10 font-outfit max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link href="/dashboard/clinic" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4 font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Perfil de Clínica</h1>
                    <p className="text-slate-500 font-medium">Gestiona la información de tu centro hospitalario</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/clinic" className="hover:scale-110 transition-transform">
                        <Logo className="w-12 h-12" />
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Logo & Identity */}
                <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-50 flex items-center justify-center p-6">
                                {logoPreview || displayProfile.logoUrl ? (
                                    <img src={logoPreview || displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="w-16 h-16 text-emerald-600 opacity-20" />
                                )}
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoSelected}
                            />
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={uploadingLogo}
                                title="Subir logo de la clínica"
                                className="absolute -bottom-2 -right-2 p-3 bg-emerald-500 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform disabled:opacity-60"
                            >
                                {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <Input
                                label="Nombre de la Clínica"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                icon={Building2}
                            />
                            <Input
                                label="Razón Social"
                                value={formData.legalName}
                                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                            />
                            <Input
                                label="Nº Licencia Sanitaria"
                                value={formData.healthLicenseNumber}
                                onChange={(e) => setFormData({ ...formData, healthLicenseNumber: e.target.value })}
                                icon={FileText}
                            />
                            {specialtyNames && (
                                <Input
                                    label="Especialidades"
                                    value={specialtyNames}
                                    disabled
                                    icon={Stethoscope}
                                />
                            )}
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
                                label="Correo Electrónico"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                icon={Mail}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Teléfono Celular"
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

                {/* Location */}
                <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                            <MapPin className="w-5 h-5" />
                        </div>
                        Ubicación
                    </h3>
                    <Input
                        label="Dirección"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        icon={MapPin}
                    />
                    {/* Ubicación en el mapa: clic o arrastre para fijar las coordenadas */}
                    <LocationPicker
                        latitude={formData.latitude || null}
                        longitude={formData.longitude || null}
                        onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                    />
                </section>

                {/* Action Bar */}
                <div className="flex items-center justify-end gap-4 bg-slate-900/5 p-6 rounded-[2.5rem] border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium mr-auto pl-4 hidden md:block">
                        Última actualización: <span className="font-bold text-slate-700">{displayProfile.createdAt ? new Date(displayProfile.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </p>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-10 py-6 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
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
