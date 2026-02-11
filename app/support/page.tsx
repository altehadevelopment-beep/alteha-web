"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, Globe, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-outfit text-slate-800 p-8 md:p-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-alteha-turquoise/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-12 flex justify-between items-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al inicio</span>
                    </Link>
                    <Logo className="w-12 h-12 opacity-80" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-4">
                                Centro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-alteha-turquoise to-alteha-violet">Soporte Técnico</span>
                            </h1>
                            <p className="text-xl text-slate-500 leading-relaxed">
                                Estamos aquí para ayudarte. Si tienes problemas con el acceso, la gestión de subastas o dudas técnicas,
                                nuestro equipo especializado está disponible para ti.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-alteha-violet" />
                                Horario de Atención
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Lunes a Viernes</p>
                                    <p className="text-lg font-bold text-slate-700 text-center">8:00 AM - 8:00 PM</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Sábados</p>
                                    <p className="text-lg font-bold text-slate-700 text-center">9:00 AM - 2:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-1 gap-6"
                    >
                        {/* Contact Cards */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-alteha-turquoise/50 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-alteha-turquoise/10 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Phone className="w-8 h-8 text-alteha-turquoise" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Línea Telefónica</p>
                                    <p className="text-2xl font-black text-slate-800">+58 (212) 555-0199</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-alteha-violet/50 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-alteha-violet/10 rounded-2xl group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-8 h-8 text-alteha-violet" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp Soporte</p>
                                    <p className="text-2xl font-black text-slate-800">+58 (424) 123-4567</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-blue-500/50 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Mail className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                                    <p className="text-2xl font-black text-slate-800">soporte@alteha.com</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
                            <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
                            <h3 className="text-xl font-bold mb-2">Asistencia VIP</h3>
                            <p className="text-slate-400 text-sm mb-6">Para aseguradoras y clínicas con planes corporativos, el soporte es 24/7 a través de su gestor asignado.</p>
                            <Button className="w-full bg-alteha-turquoise text-slate-900 hover:bg-white font-bold transition-colors">
                                Acceder a Portal SOS
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
