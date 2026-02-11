"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function TermsPage() {
    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white font-outfit text-slate-800 p-8 md:p-24 print:p-0">
            {/* Header - Hidden on Print */}
            <div className="max-w-4xl mx-auto mb-12 flex justify-between items-center print:hidden">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-violet transition-colors">
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
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Términos y Condiciones</h1>
                        <p className="text-slate-400 font-medium uppercase tracking-widest text-xs mt-1">Última actualización: 9 de febrero, 2026</p>
                    </div>
                </div>

                <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-alteha-turquoise rounded-full" />
                            1. Aceptación de los Términos
                        </h2>
                        <p>
                            Al acceder y utilizar el ecosistema ALTEHA, usted acepta estar sujeto a los siguientes términos y condiciones
                            de uso. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
                            ALTEHA conecta a médicos especialistas, clínicas, aseguradoras y proveedores en una plataforma de subastas médicas invertidas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-alteha-violet rounded-full" />
                            2. Descripción del Servicio
                        </h2>
                        <p>
                            ALTEHA es una plataforma tecnológica que facilita la gestión del gasto médico a través de mecanismos de
                            transparencia y eficiencia operacional. Proporcionamos herramientas para la inscripción de especialistas,
                            la afiliación a redes clínicas y la participación en procesos de licitación de servicios e insumos médicos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            3. Privacidad y Datos Personales
                        </h2>
                        <p>
                            Su privacidad es fundamental para nosotros. El tratamiento de sus datos personales se rige por nuestra
                            Política de Privacidad Integral. Nos comprometemos a cumplir con los estándares internacionales de
                            protección de datos de salud (HIPAA / GDPR) para garantizar la confidencialidad de la información médica.
                        </p>
                    </section> section

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            4. Responsabilidad Profesional
                        </h2>
                        <p>
                            Los especialistas registrados en ALTEHA son responsables exclusivos de la veracidad de la documentación
                            presentada y del ejercicio profesional de la medicina. La plataforma actúa como facilitador tecnológico
                            y no reemplaza el criterio médico ni la relación médico-paciente.
                        </p>
                    </section>

                    <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400 text-center max-w-sm italic">
                            Este documento es una representación digital de los términos legales vigentes de ALTEHA Ecosistema de Salud.
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
