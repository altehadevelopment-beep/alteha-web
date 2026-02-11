"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Star,
    MessageSquare,
    ThumbsUp,
    Calendar,
    Filter
} from 'lucide-react';
import Link from 'next/link';

const REVIEWS = [
    {
        id: 1,
        user: "María G.",
        rating: 5,
        date: "Hace 2 días",
        comment: "Excelente profesional. El Dr. Alejandro me operó de la rodilla y la recuperación ha sido increíble. Muy atento en todo momento.",
        procedure: "Artroplastia de Rodilla"
    },
    {
        id: 2,
        user: "Juan Carlos P.",
        rating: 4,
        date: "Hace 1 semana",
        comment: "Muy buena atención, aclara todas las dudas. El proceso de subasta fue rápido y eficiente.",
        procedure: "Consulta Especializada"
    },
    {
        id: 3,
        user: "Elena R.",
        rating: 5,
        date: "Hace 2 semanas",
        comment: "Puntual y muy profesional. Recomiendo ampliamente su trabajo.",
        procedure: "Cirugía de Meniscos"
    }
];

export default function ReviewsPage() {
    return (
        <div className="space-y-10 font-outfit max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/specialist" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Opiniones y Reseñas</h1>
                    <p className="text-slate-500 font-medium">Lo que tus pacientes dicen de tu trabajo</p>
                </div>
                <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Valoración Total</p>
                        <p className="text-2xl font-black text-slate-900">4.9 / 5.0</p>
                    </div>
                    <Star className="w-10 h-10 text-amber-400 fill-amber-400" />
                </div>
            </div>

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReviewStatCard label="Total Reseñas" value="128" icon={MessageSquare} color="text-blue-500" />
                <ReviewStatCard label="Pacientes Satisfechos" value="98%" icon={ThumbsUp} color="text-emerald-500" />
                <ReviewStatCard label="Última Actividad" value="Hoy" icon={Calendar} color="text-alteha-violet" />
            </section>

            {/* Reviews List */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black text-slate-900">Reseñas Recientes</h2>
                    <button className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filtrar
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {REVIEWS.map((review) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                        {review.user[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{review.user}</h4>
                                        <p className="text-xs font-bold text-alteha-turquoise uppercase tracking-widest">{review.procedure}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed font-medium italic">"{review.comment}"</p>
                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                <span>Verificado por ALTEHA</span>
                                <span>{review.date}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function ReviewStatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}
