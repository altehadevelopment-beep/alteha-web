"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function PrivacyPage() {
    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white font-outfit text-slate-800 p-8 md:p-24 print:p-0">
            {/* Header - Hidden on Print */}
            <div className="max-w-4xl mx-auto mb-12 flex justify-between items-center print:hidden">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver al inicio</span>
                </Link>
                <div className="flex gap-4">
                    <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50">
                        <Printer className="w-4 h-4" />
                        <span>Imprimir / PDF</span>
                    </Button>
                </div>
            </div>

            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto bg-white border border-slate-100 shadow-2xl p-12 md:p-16 rounded-[2rem] print:shadow-none print:border-none print:p-0"
            >
                <div className="flex items-center gap-6 mb-10">
                    <Logo className="w-16 h-16 drop-shadow-md" />
                    <div className="h-12 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Política de Privacidad</h1>
                        <p className="text-slate-400 font-medium uppercase tracking-widest text-xs mt-1">Última actualización: 9 de febrero, 2026</p>
                    </div>
                </div>

                <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
                    <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                        <p>
                            En ALTEHA, la privacidad y seguridad de su información médica y personal es nuestra prioridad absoluta.
                            Este documento detalla cómo recopilamos, protegemos y utilizamos sus datos dentro de nuestro ecosistema.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-alteha-turquoise rounded-full" />
                            1. Información que Recopilamos
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Datos de Identificación:</strong> Nombre, especialidad médica, número de licencia profesional y documentos de identidad.</li>
                            <li><strong>Información de Contacto:</strong> Correo electrónico, número de teléfono y dirección profesional.</li>
                            <li><strong>Datos Operativos:</strong> Historial de subastas, transacciones y comunicaciones dentro de la plataforma.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-alteha-violet rounded-full" />
                            2. Uso de la Información
                        </h2>
                        <p>
                            Utilizamos sus datos exclusivamente para facilitar la conexión entre los actores del sistema de salud,
                            garantizar la seguridad de las transacciones médicas y mejorar la eficiencia de los procesos de subasta.
                            <strong>Nunca vendemos ni comercializamos sus datos personales a terceros.</strong>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            3. Seguridad de los Datos
                        </h2>
                        <p>
                            Implementamos medidas de seguridad de grado bancario, incluyendo cifrado AES-256 para datos en reposo
                            y TLS 1.3 para datos en tránsito. Todo el manejo de información cumple con los estándares internacionales
                            de salud más estrictos.
                        </p>
                    </section>

                    <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col items-center">
                        <div className="w-12 h-12 bg-alteha-turquoise/10 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-alteha-turquoise" />
                        </div>
                        <p className="text-sm text-slate-400 text-center max-w-sm italic">
                            Protegiendo el futuro de la gestión médica digital.
                        </p>
                    </div>
                </div>
            </motion.article>

            {/* Print specific styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body { background: white !important; }
                    .print-hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
