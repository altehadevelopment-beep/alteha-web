"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MessageSquare, Loader2, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Puntuación de la clínica: reseñas reales recibidas de los actores de las
 * subastas (médicos, seguros) al cierre de cada proceso.
 */
export default function ClinicScorePage() {
    const { userProfile } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const accountId = (userProfile as any)?.account?.id;

    useEffect(() => {
        if (!accountId) return;
        (async () => {
            try {
                const resp = await fetch(`/api/reviews?revieweeId.equals=${accountId}&size=200&sort=id,desc`);
                const data = await resp.json();
                setReviews(Array.isArray(data) ? data : (data?.content ?? []));
            } catch {
                setReviews([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [accountId]);

    const stats = useMemo(() => {
        if (!reviews.length) return { avg: null as number | null, count: 0, dist: [0, 0, 0, 0, 0] };
        const dist = [0, 0, 0, 0, 0];
        let sum = 0;
        reviews.forEach((r) => {
            const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
            dist[rating - 1] += 1;
            sum += Number(r.rating) || 0;
        });
        return { avg: sum / reviews.length, count: reviews.length, dist };
    }, [reviews]);

    return (
        <div className="space-y-10 font-outfit max-w-4xl mx-auto pb-20">
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link href="/dashboard/clinic" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4 font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Puntuación</h1>
                    <p className="text-slate-500 font-medium">Lo que médicos y seguros dicen de tu centro al cerrar cada subasta</p>
                </div>
                <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Valoración Total</p>
                        <p className="text-2xl font-black text-slate-900">
                            {stats.avg != null ? `${stats.avg.toFixed(1)} / 5.0` : 'Sin reseñas'}
                        </p>
                    </div>
                    <Star className="w-10 h-10 text-amber-400 fill-amber-400" />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">Aún no tienes valoraciones</p>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                        Cuando participes en subastas y los demás actores (médicos y seguros) valoren tu servicio
                        al liquidarse los fondos, sus reseñas aparecerán aquí.
                    </p>
                </div>
            ) : (
                <>
                    {/* Distribución de estrellas */}
                    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="w-5 h-5 text-emerald-500" />
                            <h2 className="font-black text-slate-900">{stats.count} reseña{stats.count !== 1 ? 's' : ''} recibida{stats.count !== 1 ? 's' : ''}</h2>
                        </div>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats.dist[star - 1];
                            const pct = stats.count ? Math.round((count / stats.count) * 100) : 0;
                            return (
                                <div key={star} className="flex items-center gap-3">
                                    <span className="w-10 text-xs font-black text-slate-500 flex items-center gap-1">
                                        {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    </span>
                                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-10 text-right text-xs font-bold text-slate-400">{count}</span>
                                </div>
                            );
                        })}
                    </section>

                    {/* Lista de reseñas */}
                    <section className="grid grid-cols-1 gap-6">
                        {reviews.map((review) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4"
                            >
                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center font-black text-emerald-500">
                                            {(review.reviewer?.name || review.reviewer?.email || 'A')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">
                                                {review.reviewer?.name || review.reviewer?.email || 'Actor de la subasta'}
                                            </h4>
                                            {review.auction?.auctionNumber && (
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                                                    Subasta #{review.auction.auctionNumber}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(review.rating) || 0) ? 'fill-amber-400' : 'text-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>
                                {review.description && (
                                    <p className="text-slate-600 leading-relaxed font-medium italic">&quot;{review.description}&quot;</p>
                                )}
                                <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    <span>Verificado por ALTEHA</span>
                                    <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('es-VE') : ''}</span>
                                </div>
                            </motion.div>
                        ))}
                    </section>
                </>
            )}
        </div>
    );
}
