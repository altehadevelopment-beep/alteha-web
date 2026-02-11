"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Upload,
    Plus,
    Trash2,
    GraduationCap,
    Award,
    BookOpen,
    FileCheck,
    Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function EditProfilePage() {
    const [activeTab, setActiveTab] = useState('academic');

    return (
        <div className="space-y-10 font-outfit max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/specialist" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Editar Perfil Profesional</h1>
                    <p className="text-slate-500 font-medium">Gestiona tus credenciales y aumenta tu valoración en la red</p>
                </div>
                <Button className="hidden md:flex items-center gap-2 px-8 py-6 rounded-2xl bg-alteha-turquoise text-slate-900 hover:scale-105 transition-all">
                    <Save className="w-5 h-5" />
                    <span className="font-black">Guardar Cambios</span>
                </Button>
            </div>

            {/* Profile Picture & Basic Info */}
            <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner">
                            <img src="/doctor-avatar.png" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-3 bg-alteha-violet text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                            <Upload className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <Input label="Nombre Completo" defaultValue="Dr. Alejandro Rodríguez" />
                        <Input label="Especialidad Principal" defaultValue="Cirujano Traumatólogo" />
                        <Input label="Correo Electrónico" defaultValue="a.rodriguez@hospital.com" />
                        <Input label="Teléfono de Contacto" defaultValue="+58 412 1234567" />
                    </div>
                </div>
            </section>

            {/* Tabs for Credentials */}
            <div className="flex gap-2 p-2 bg-slate-100 rounded-3xl w-fit">
                <TabButton
                    active={activeTab === 'academic'}
                    onClick={() => setActiveTab('academic')}
                    icon={GraduationCap}
                    label="Académico"
                />
                <TabButton
                    active={activeTab === 'certifications'}
                    onClick={() => setActiveTab('certifications')}
                    icon={Award}
                    label="Certificaciones"
                />
                <TabButton
                    active={activeTab === 'experience'}
                    onClick={() => setActiveTab('experience')}
                    icon={Briefcase}
                    label="Experiencia"
                />
            </div>

            {/* Dynamic Section Content */}
            <section className="space-y-8">
                {activeTab === 'academic' && (
                    <div className="space-y-6">
                        <CredentialGroup
                            title="Pregrado"
                            subtitle="Títulos de medicina general"
                            items={[{ title: 'Médico Cirujano', institution: 'Universidad Central de Venezuela', date: '2010' }]}
                        />
                        <CredentialGroup
                            title="Postgrado / Especialidad"
                            subtitle="Estudios de especialización"
                            items={[{ title: 'Especialista en Traumatología y Ortopedia', institution: 'Hospital Universitario de Caracas', date: '2015' }]}
                        />
                        <CredentialGroup
                            title="Otros Estudios"
                            subtitle="Diplomados y cursos de formación"
                            items={[]}
                        />
                    </div>
                )}

                {activeTab === 'certifications' && (
                    <div className="space-y-6">
                        <CredentialGroup
                            title="Certificaciones Médicas"
                            subtitle="Colegios y asociaciones"
                            items={[{ title: 'Miembro de la Sociedad Venezolana de Traumatología', institution: 'SVCOT', date: '2018' }]}
                        />
                    </div>
                )}

                {activeTab === 'experience' && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] flex flex-col items-center text-center">
                            <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                            <h4 className="font-bold text-slate-500">¿Tienes experiencia internacional o investigaciones?</h4>
                            <p className="text-slate-400 text-sm max-w-xs mt-2">Agrega tus logros más destacados para que las aseguradoras te elijan.</p>
                            <Button variant="outline" className="mt-6 border-slate-200 text-slate-600 rounded-xl">
                                Agregar Experiencia
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${active ? 'bg-white text-alteha-violet shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}

function CredentialGroup({ title, subtitle, items }: any) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <p className="text-slate-400 text-sm font-medium">{subtitle}</p>
                </div>
                <button className="flex items-center gap-2 text-alteha-turquoise font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" />
                    Agregar
                </button>
            </div>

            <div className="space-y-4">
                {items.length > 0 ? items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-alteha-violet">
                                <FileCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{item.title}</h4>
                                <p className="text-sm text-slate-500">{item.institution} • <span className="text-slate-400">{item.date}</span></p>
                            </div>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )) : (
                    <div className="text-center py-6">
                        <p className="text-slate-400 text-sm italic">Sin registros agregados aún.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
