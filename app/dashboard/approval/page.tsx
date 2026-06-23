"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    CheckCircle2, Clock, AlertCircle, Banknote,
    UserCheck, Stethoscope, ArrowRight, Activity,
    FileCheck, TrendingUp, Users
} from 'lucide-react';
import { getAllAuctions, getDoctors } from '@/lib/api';

export default function ApprovalDashboardPage() {
    const [paymentStats, setPaymentStats] = useState({ pending: 0, paid: 0, total: 0 });
    const [settlementStats, setSettlementStats] = useState({ completed: 0, pendingSettlement: 0, total: 0 });
    const [doctorStats, setDoctorStats] = useState({ pending: 0, active: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const [paymentsRes, settlementsRes, doctorsRes] = await Promise.allSettled([
                    getAllAuctions('PAYMENT_VALIDATION,PAID', 0, 200, 'updatedAt,desc'),
                    getAllAuctions('COMPLETED,PENDING_SETTLEMENT', 0, 200, 'updatedAt,desc'),
                    getDoctors(0, 200)
                ]);

                if (paymentsRes.status === 'fulfilled' && paymentsRes.value.code === '00') {
                    const content: any[] = (paymentsRes.value.data as any)?.content ?? paymentsRes.value.data ?? [];
                    const list = Array.isArray(content) ? content : [];
                    setPaymentStats({
                        pending: list.filter((a: any) => a.status === 'PAYMENT_VALIDATION').length,
                        paid: list.filter((a: any) => a.status === 'PAID').length,
                        total: list.length
                    });
                }

                if (settlementsRes.status === 'fulfilled' && settlementsRes.value.code === '00') {
                    const content: any[] = (settlementsRes.value.data as any)?.content ?? settlementsRes.value.data ?? [];
                    const list = Array.isArray(content) ? content : [];
                    setSettlementStats({
                        completed: list.filter((a: any) => a.status === 'COMPLETED').length,
                        pendingSettlement: list.filter((a: any) => a.status === 'PENDING_SETTLEMENT').length,
                        total: list.length
                    });
                }

                if (doctorsRes.status === 'fulfilled') {
                    const raw: any = doctorsRes.value;
                    const list: any[] = Array.isArray(raw) ? raw : (raw?.content ?? []);
                    setDoctorStats({
                        pending: list.filter((d: any) => ['PENDING', 'INVERIFICATION', 'INCOMPLETE'].includes((d.status || '').toUpperCase())).length,
                        active: list.filter((d: any) => (d.status || '').toUpperCase() === 'ACTIVE').length,
                        total: list.length
                    });
                }
            } catch (e) {
                console.error('Error loading KPI data', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, []);

    const kpiCards = [
        {
            title: 'Validación de Pagos',
            description: 'Revisa y aprueba comprobantes de pago de subastas.',
            href: '/dashboard/approval/payments',
            icon: CheckCircle2,
            accent: 'amber',
            metrics: [
                { label: 'Pendientes', value: paymentStats.pending, color: 'text-amber-600' },
                { label: 'Aprobados', value: paymentStats.paid, color: 'text-emerald-600' },
                { label: 'Total', value: paymentStats.total, color: 'text-slate-600' }
            ]
        },
        {
            title: 'Liquidaciones',
            description: 'Gestiona los pagos a médicos y actores por subastas completadas.',
            href: '/dashboard/approval/settlements',
            icon: Banknote,
            accent: 'emerald',
            metrics: [
                { label: 'Por Liquidar', value: settlementStats.completed, color: 'text-emerald-600' },
                { label: 'En Proceso', value: settlementStats.pendingSettlement, color: 'text-amber-600' },
                { label: 'Total', value: settlementStats.total, color: 'text-slate-600' }
            ]
        },
        {
            title: 'Validación de Médicos',
            description: 'Aprueba o rechaza médicos en proceso de verificación.',
            href: '/dashboard/approval/doctors',
            icon: UserCheck,
            accent: 'violet',
            metrics: [
                { label: 'Pendientes', value: doctorStats.pending, color: 'text-amber-600' },
                { label: 'Activos', value: doctorStats.active, color: 'text-emerald-600' },
                { label: 'Total', value: doctorStats.total, color: 'text-slate-600' }
            ]
        }
    ];

    const accentMap: Record<string, { bg: string; ring: string; iconBg: string; iconColor: string; badge: string }> = {
        amber: { bg: 'from-amber-50 to-orange-50', ring: 'hover:ring-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
        emerald: { bg: 'from-emerald-50 to-teal-50', ring: 'hover:ring-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
        violet: { bg: 'from-violet-50 to-purple-50', ring: 'hover:ring-violet-200', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' }
    };

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2">Portal de Aprobación</h1>
                <p className="text-slate-400 font-medium text-lg">Centro de gestión y validación de operaciones.</p>
            </div>

            {/* Top-level KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Pagos Pendientes</p>
                            <p className="text-2xl font-black text-slate-900">{isLoading ? '…' : paymentStats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Por Liquidar</p>
                            <p className="text-2xl font-black text-slate-900">{isLoading ? '…' : settlementStats.completed}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Médicos Pendientes</p>
                            <p className="text-2xl font-black text-slate-900">{isLoading ? '…' : doctorStats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Médicos Activos</p>
                            <p className="text-2xl font-black text-slate-900">{isLoading ? '…' : doctorStats.active}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {kpiCards.map(card => {
                    const a = accentMap[card.accent];
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className={`group block bg-gradient-to-br ${a.bg} border border-white rounded-3xl p-6 shadow-xl shadow-slate-100/50 ring-2 ring-transparent ${a.ring} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                        >
                            <div className={`w-12 h-12 rounded-2xl ${a.iconBg} flex items-center justify-center mb-5`}>
                                <Icon className={`w-6 h-6 ${a.iconColor}`} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">{card.title}</h3>
                            <p className="text-slate-400 text-sm font-medium mb-5 leading-relaxed">{card.description}</p>
                            <div className="flex gap-4 mb-5">
                                {card.metrics.map(m => (
                                    <div key={m.label}>
                                        <p className={`text-2xl font-black ${m.color}`}>{isLoading ? '…' : m.value}</p>
                                        <p className="text-xs font-bold text-slate-400">{m.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                                Ir al módulo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Activity hint */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 flex items-center gap-5 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white/80" />
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-base mb-0.5">Módulo Activo</h4>
                    <p className="text-white/60 text-sm font-medium">Todas las acciones de validación quedan registradas en auditoría. Usa el menú lateral para navegar entre secciones.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="text-sm font-bold text-white/80">En Línea</span>
                </div>
            </div>
        </div>
    );
}
