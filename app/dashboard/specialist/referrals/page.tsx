"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Share2,
    Link as LinkIcon,
    Mail,
    UserPlus,
    Gift,
    ShieldCheck,
    ChevronRight,
    Facebook,
    MessageCircle,
    Copy,
    Instagram as InstaIcon
} from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ReferralsPage() {
    return (
        <div className="space-y-10 font-outfit max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div>
                <Link href="/dashboard/specialist" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver al Dashboard</span>
                </Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Referir a un Colega</h1>
                <p className="text-slate-500 font-medium">Invita a otros profesionales a la red y fortalece el ecosistema ALTEHA</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Invitation Box */}
                    <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-alteha-turquoise/10 rounded-2xl text-alteha-turquoise">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Nueva Invitación</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nombre del Colega" placeholder="Ej: Dr. Juan Pérez" />
                                <Input label="Especialidad" placeholder="Ej: Cardiología" />
                            </div>
                            <Input label="Correo Electrónico" placeholder="colega@email.com" />

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Mensaje Personalizado (Opcional)</label>
                                <textarea
                                    className="w-full h-32 bg-slate-50 rounded-2xl p-5 border border-slate-100 outline-none focus:border-alteha-turquoise/50 transition-all font-medium text-slate-600 resize-none"
                                    placeholder="Hola, te invito a unirte a ALTEHA para gestionar tus subastas médicas..."
                                />
                            </div>

                            <Button className="w-full py-6 rounded-2xl bg-alteha-turquoise text-slate-900 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                <Share2 className="w-5 h-5" />
                                <span className="font-black">Enviar Invitación</span>
                            </Button>
                        </div>
                    </section>

                    {/* Share Link & QR Section */}
                    <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-alteha-turquoise/10 rounded-full blur-3xl -mr-48 -mt-48" />

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <LinkIcon className="w-6 h-6 text-alteha-turquoise" />
                                    <h3 className="text-2xl font-black italic tracking-tight">Tu Código Profesional</h3>
                                </div>
                                <p className="text-slate-400 font-medium">Comparte tu enlace de invitación o escanea el QR para referir colegas al instante.</p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <input
                                            readOnly
                                            value="https://alteha.com/join?ref=DRALEX88"
                                            className="flex-1 bg-transparent px-4 py-2 outline-none font-mono text-sm text-alteha-turquoise truncate"
                                        />
                                        <button className="p-3 bg-alteha-turquoise text-slate-900 rounded-xl hover:scale-105 transition-all">
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <SocialButton icon={MessageCircle} color="bg-emerald-500" label="WhatsApp" />
                                        <SocialButton icon={Facebook} color="bg-blue-600" label="Facebook" />
                                        <SocialButton icon={InstaIcon} color="bg-pink-600" label="Instagram" />
                                        <SocialButton icon={Share2} color="bg-alteha-violet" label="Más" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl">
                                    <QRCodeSVG value="https://alteha.com/join?ref=DRALEX88" size={160} level="H" />
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Escanea el QR</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Benefits Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                        <h4 className="font-black text-slate-900 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-alteha-violet" />
                            Beneficios por Referir
                        </h4>
                        <div className="space-y-4">
                            <BenefitItem text="Aumenta tu reputación en la red ALTEHA" />
                            <BenefitItem text="Prioridad en subastas de alta complejidad" />
                            <BenefitItem text="Acceso a webinars exclusivos para el equipo" />
                        </div>
                    </div>

                    <div className="bg-alteha-violet/5 p-8 rounded-[2.5rem] border border-alteha-violet/10 space-y-4">
                        <div className="flex items-center gap-3 text-alteha-violet">
                            <ShieldCheck className="w-5 h-5" />
                            <p className="text-sm font-bold">Seguridad Garantizada</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Toda invitación es verificada bajo estándares de ética profesional médica. ALTEHA protege tus datos y los de tus colegas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-alteha-turquoise flex-shrink-0" />
            <p className="text-sm font-medium text-slate-600 leading-snug">{text}</p>
        </div>
    );
}

function SocialButton({ icon: Icon, color, label }: any) {
    return (
        <button
            title={label}
            className={`p-4 rounded-2xl ${color} text-white hover:scale-110 transition-all shadow-lg active:scale-95`}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
