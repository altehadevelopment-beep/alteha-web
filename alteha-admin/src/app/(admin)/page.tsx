"use client";

import React, { useState, useEffect } from 'react';
import { Users, Building2, Stethoscope, ShieldPlus, Package, CreditCard, Gavel, Pill, Activity, Loader2, ArrowRight, RefreshCw, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/lib/api';

// ─── BCV Exchange Rates Widget ────────────────────────────────
const CURRENCIES = [
    { code: 'USD', flag: '🇺🇸', label: 'Dólar' },
    { code: 'EUR', flag: '🇪🇺', label: 'Euro' },
    { code: 'CNY', flag: '🇨🇳', label: 'Yuan' },
    { code: 'TRY', flag: '🇹🇷', label: 'Lira' },
    { code: 'RUB', flag: '🇷🇺', label: 'Rublo' },
];

function BcvRatesWidget() {
    const [rates, setRates] = useState<Record<string, { value: string }>>({});
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [fallback, setFallback] = useState(false);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bcv-rates');
            const data = await res.json();
            setRates(data.rates || {});
            setDate(data.date || '');
            setFallback(!!data.fallback);
        } catch {
            setFallback(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRates(); }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{ background: '#0C0E1A', border: '1.5px solid rgba(46,207,191,0.12)' }}
        >
            {/* Glow blobs */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[50px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(46,207,191,0.12), transparent)' }} />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[50px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(123,91,255,0.12), transparent)' }} />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" style={{ color: '#2ECFBF' }} />
                        <h2 className="text-base font-black text-white font-outfit">Tasas BCV Oficiales</h2>
                        {fallback && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Caché</span>}
                    </div>
                    {date && <p className="text-xs mt-0.5 font-semibold" style={{ color: '#5A6A8A' }}>Valor: {date}</p>}
                </div>
                <button onClick={fetchRates} disabled={loading}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'rgba(46,207,191,0.1)', border: '1px solid rgba(46,207,191,0.15)' }}>
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: '#2ECFBF' }} />
                </button>
            </div>

            {/* Rates grid */}
            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#2ECFBF' }} />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
                    {CURRENCIES.map(({ code, flag, label }) => {
                        const rate = rates[code]?.value;
                        const formatted = rate
                            ? parseFloat(rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
                            : '—';
                        return (
                            <div key={code} className="rounded-2xl p-3.5"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="text-xl mb-1.5">{flag}</div>
                                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: '#5A6A8A' }}>{label} ({code})</p>
                                <p className="text-base font-black leading-tight" style={{ color: '#2ECFBF' }}>
                                    Bs. {formatted}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}


// ─── Live count hook ──────────────────────────────────────────
function useLiveCount(path: string) {
    const [count, setCount] = useState<number | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get(`/${path}`, { params: { page: 0, size: 1 } })
            .then(res => {
                const h = res.headers['x-total-count'];
                if (h !== undefined && h !== null) {
                    setCount(parseInt(String(h), 10));
                } else if (Array.isArray(res.data)) {
                    setCount(res.data.length);
                } else {
                    setCount(0);
                }
            })
            .catch(() => setError(true));
    }, [path]);

    return { count, error };
}

// ─── Single stat card ─────────────────────────────────────────
function StatCard({ label, icon: Icon, path, index }: { label: string; icon: any; path: string; index: number }) {
    const { count, error } = useLiveCount(path);
    const colors = ['#2ECFBF', '#7B5BFF', '#2ECFBF', '#7B5BFF', '#2ECFBF', '#7B5BFF', '#2ECFBF', '#7B5BFF', '#2ECFBF'];
    const bgs   = ['rgba(46,207,191,0.1)', 'rgba(123,91,255,0.1)', 'rgba(46,207,191,0.1)', 'rgba(123,91,255,0.1)',
                   'rgba(46,207,191,0.1)', 'rgba(123,91,255,0.1)', 'rgba(46,207,191,0.1)', 'rgba(123,91,255,0.1)', 'rgba(46,207,191,0.1)'];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
            <Link href={`/${path}`}
                className="block bg-white rounded-3xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
                style={{ border: '1.5px solid rgba(123,91,255,0.08)', boxShadow: '0 2px 12px rgba(123,91,255,0.04)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: bgs[index % bgs.length] }}>
                    <Icon className="w-5 h-5" style={{ color: colors[index % colors.length] }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#9CA3AF' }}>{label}</p>
                <div className="flex items-end justify-between">
                    <span className="text-3xl font-black font-outfit" style={{ color: '#0F1128' }}>
                        {error ? <span className="text-base text-slate-400">—</span>
                            : count === null ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#2ECFBF' }} />
                            : count.toLocaleString('es')}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                        style={{ color: '#7B5BFF' }} />
                </div>
            </Link>
        </motion.div>
    );
}

const statItems = [
    { label: 'Usuarios',         icon: Users,       path: 'users' },
    { label: 'Médicos',          icon: Stethoscope, path: 'doctors' },
    { label: 'Clínicas',         icon: Building2,   path: 'clinics' },
    { label: 'Pacientes',        icon: Activity,    path: 'patients' },
    { label: 'Aseguradoras',     icon: ShieldPlus,  path: 'insurance-companies' },
    { label: 'Paquetes Médicos', icon: Package,     path: 'medical-packages' },
    { label: 'Transacciones',    icon: CreditCard,  path: 'payment-transactions' },
    { label: 'Subastas',         icon: Gavel,       path: 'auctions' },
    { label: 'Farmacias',        icon: Pill,        path: 'pharmacies' },
];

// ─── Comparative charts ───────────────────────────────────────
const CHART_ACTORS = [
    { name: 'Médicos',      path: 'doctors',            color: '#2ECFBF' },
    { name: 'Clínicas',     path: 'clinics',            color: '#7B5BFF' },
    { name: 'Pacientes',    path: 'patients',           color: '#2ECFBF' },
    { name: 'Aseguradoras', path: 'insurance-companies',color: '#7B5BFF' },
    { name: 'Farmacias',    path: 'pharmacies',         color: '#2ECFBF' },
    { name: 'Usuarios',     path: 'users',              color: '#7B5BFF' },
];

const gradientColors = ['#2ECFBF', '#7B5BFF', '#48DDD0', '#9D7FFF', '#1AB5A5', '#5A3EDF'];

function ActorChartsSection() {
    const [chartData, setChartData] = useState<{ name: string; total: number; color: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all(
            CHART_ACTORS.map(actor =>
                api.get(`/${actor.path}`, { params: { page: 0, size: 1 } })
                    .then(res => {
                        const h = res.headers['x-total-count'];
                        const total = h !== undefined ? parseInt(String(h), 10) : (Array.isArray(res.data) ? res.data.length : 0);
                        return { name: actor.name, total, color: actor.color };
                    })
                    .catch(() => ({ name: actor.name, total: 0, color: actor.color }))
            )
        ).then(data => {
            setChartData(data);
            setLoading(false);
        });
    }, []);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload?.length) {
            return (
                <div className="bg-white rounded-2xl shadow-xl px-4 py-3 text-sm font-bold"
                    style={{ border: '1.5px solid rgba(123,91,255,0.12)', color: '#0F1128' }}>
                    <p>{payload[0].name}: <span style={{ color: '#2ECFBF' }}>{payload[0].value.toLocaleString('es')}</span></p>
                </div>
            );
        }
        return null;
    };

    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload?.length) {
            return (
                <div className="bg-white rounded-2xl shadow-xl px-4 py-3 text-sm font-bold"
                    style={{ border: '1.5px solid rgba(123,91,255,0.12)', color: '#0F1128' }}>
                    <p>{payload[0].name}: <span style={{ color: payload[0].payload.color }}>{payload[0].value.toLocaleString('es')}</span></p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-8 col-span-2 flex items-center justify-center h-64"
                style={{ border: '1.5px solid rgba(123,91,255,0.08)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2ECFBF' }} />
            </div>
        );
    }

    const total = chartData.reduce((s, d) => s + d.total, 0);

    return (
        <>
            {/* Bar chart — actor comparison */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8"
                style={{ border: '1.5px solid rgba(123,91,255,0.08)', boxShadow: '0 2px 12px rgba(123,91,255,0.04)' }}>
                <h2 className="text-lg font-black font-outfit mb-6" style={{ color: '#0F1128' }}>
                    Comparativo de Actores Registrados
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
                        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#C0CADB' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(123,91,255,0.04)', radius: 8 }} />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]} name="Total">
                            {chartData.map((d, i) => (
                                <Cell key={d.name} fill={gradientColors[i % gradientColors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Donut chart  */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8"
                style={{ border: '1.5px solid rgba(123,91,255,0.08)', boxShadow: '0 2px 12px rgba(123,91,255,0.04)' }}>
                <h2 className="text-lg font-black font-outfit mb-2" style={{ color: '#0F1128' }}>
                    Distribución del Ecosistema
                </h2>
                <p className="text-xs font-bold mb-4" style={{ color: '#9CA3AF' }}>
                    Total registros: <span style={{ color: '#2ECFBF' }}>{total.toLocaleString('es')}</span>
                </p>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="total"
                            nameKey="name"
                        >
                            {chartData.map((d, i) => (
                                <Cell key={d.name} fill={gradientColors[i % gradientColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </motion.div>
        </>
    );
}

// ─── Main page ────────────────────────────────────────────────
export default function DashboardHome() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-black tracking-tight font-outfit" style={{ color: '#0F1128' }}>Panel de Control</h1>
                <p className="mt-1 font-medium" style={{ color: '#9CA3AF' }}>Estadísticas en tiempo real del ecosistema Alteha</p>
            </header>

            {/* Live stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {statItems.map((item, i) => <StatCard key={item.path} {...item} index={i} />)}
            </div>

            {/* BCV Rates widget */}
            <BcvRatesWidget />

            {/* Comparative charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActorChartsSection />
            </div>

            {/* System status  */}
            <div className="rounded-3xl p-8 relative overflow-hidden"
                style={{ background: '#0C0E1A', border: '1.5px solid rgba(46,207,191,0.1)' }}>
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px]"
                    style={{ background: 'radial-gradient(circle, rgba(46,207,191,0.15), transparent)' }} />
                <h2 className="text-lg font-black font-outfit text-white mb-6 relative z-10">Estado del Sistema</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                    {[
                        { label: 'API', value: '99.9%', color: '#2ECFBF' },
                        { label: 'Base de Datos', value: 'Estable', color: '#7B5BFF' },
                        { label: 'Pagos', value: 'Operativo', color: '#2ECFBF' },
                        { label: 'Notificaciones', value: 'Activo', color: '#7B5BFF' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs font-bold mb-1" style={{ color: '#5A6A8A' }}>{label}</p>
                            <p className="text-lg font-black" style={{ color }}>{value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
