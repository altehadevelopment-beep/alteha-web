"use client";

import React, { useEffect, useState } from 'react';
import {
    Crown, CheckCircle2, X, Loader2, CreditCard, Smartphone, Landmark,
    ShieldCheck, Sparkles, AlertCircle, Receipt, TrendingUp, Package, Send
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    getSubscriptionPlans, getMySubscription, getSubscriptionPayments,
    getSubscriptionPaymentMethods, saveSubscriptionPaymentMethod,
    getBcvRate, requestC2pToken, subscribeToPlan, getBanks,
    type SubscriptionPlanInfo, type MySubscription
} from '@/lib/api';

const PLAN_EMOJI: Record<string, string> = { EXPLORA: '🆓', IMPULSO: '🌱', EXPANSION: '🚀', ELITE: '👑' };
const METHOD_LABEL: Record<string, string> = { STRIPE_CARD: 'Tarjeta (Stripe · USD)', BS_C2P: 'Débito inmediato Bs (C2P)', BINANCE: 'Binance Pay' };

export default function PlanPage() {
    const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
    const [mine, setMine] = useState<MySubscription | null>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [bcv, setBcv] = useState<{ rate?: number; rateDate?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'plan' | 'pagos'>('plan');
    const [paying, setPaying] = useState<SubscriptionPlanInfo | null>(null);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [p, m, pay, rate] = await Promise.all([
                getSubscriptionPlans().catch(() => []),
                getMySubscription().catch(() => null),
                getSubscriptionPayments().catch(() => []),
                getBcvRate().catch(() => null),
            ]);
            setPlans(p); setMine(m); setPayments(pay); setBcv(rate);
        } finally { setLoading(false); }
    };
    useEffect(() => { loadAll(); }, []);

    const effective = mine?.effectivePlan;
    const contracted = mine?.contractedPlan;

    if (loading) return <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin mx-auto" /></div>;

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 max-w-6xl mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                        <Crown className="w-9 h-9 text-amber-500" /> Mi Plan
                    </h1>
                    <p className="text-slate-400 font-medium">Tu suscripción define cuántas subastas puedes adjudicar y cuántos paquetes publicar cada mes.</p>
                </div>
                {bcv?.rate && (
                    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tasa BCV ({bcv.rateDate})</p>
                        <p className="font-black text-slate-800">Bs {Number(bcv.rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USD</p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl w-fit border border-slate-100 shadow-sm">
                <button onClick={() => setTab('plan')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${tab === 'plan' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Plan y beneficios</button>
                <button onClick={() => setTab('pagos')} className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${tab === 'pagos' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                    <Receipt className="w-4 h-4" /> Pagos realizados {payments.length > 0 && <span className="px-2 py-0.5 bg-alteha-turquoise/20 text-alteha-turquoise rounded-full text-[10px]">{payments.length}</span>}
                </button>
            </div>

            {tab === 'plan' ? (
                <>
                    {/* Plan actual + uso */}
                    {mine && effective && (
                        <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden ${mine.expired ? 'bg-red-950' : 'bg-slate-900'}`}>
                            <div className="absolute top-0 right-0 w-72 h-72 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise">Plan actual</p>
                                    <h2 className="text-3xl font-black tracking-tight">{PLAN_EMOJI[effective.code] || ''} {effective.name}</h2>
                                    {mine.expired && contracted ? (
                                        <p className="text-red-300 text-sm font-bold mt-1 flex items-center gap-1.5">
                                            <AlertCircle className="w-4 h-4" /> Tu plan {contracted.name} venció — estás operando con límites de Explora. Renueva abajo.
                                        </p>
                                    ) : mine.currentPeriodEnd ? (
                                        <p className="text-slate-400 text-sm font-medium mt-1">Activo hasta el {new Date(mine.currentPeriodEnd).toLocaleDateString('es-ES')}</p>
                                    ) : (
                                        <p className="text-slate-400 text-sm font-medium mt-1">Plan gratuito · sin vencimiento</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 min-w-[300px]">
                                    <UsageBar icon={TrendingUp} label="Adjudicaciones" used={mine.usage.awardsThisMonth} max={effective.maxAwardsMonth} freeNote={effective.code === 'EXPLORA' ? (mine.usage.awardsLifetime === 0 ? '1 de bienvenida disponible' : 'bienvenida usada') : null} />
                                    <UsageBar icon={Package} label="Paquetes" used={mine.usage.packagesThisMonth} max={effective.maxPackagesMonth} freeNote={null} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comparador de planes (desde BD) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        {plans.map(plan => {
                            const isCurrent = contracted?.code === plan.code && !mine?.expired;
                            const isContractedExpired = contracted?.code === plan.code && mine?.expired;
                            return (
                                <div key={plan.code} className={`bg-white rounded-[2.5rem] border-2 p-7 flex flex-col shadow-sm transition-all ${isCurrent ? 'border-alteha-turquoise shadow-xl' : 'border-slate-100 hover:shadow-lg'}`}>
                                    <div className="text-3xl mb-2">{PLAN_EMOJI[plan.code] || '📦'}</div>
                                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                                    <p className="text-3xl font-black text-slate-900 mt-1">
                                        ${Number(plan.priceUsd).toFixed(2)} <span className="text-xs font-bold text-slate-400">/mes</span>
                                    </p>
                                    {bcv?.rate && plan.priceUsd > 0 && (
                                        <p className="text-[11px] font-bold text-slate-400">≈ Bs {(plan.priceUsd * (bcv.rate || 0)).toLocaleString('es-VE', { maximumFractionDigits: 2 })} (tasa BCV)</p>
                                    )}
                                    <p className="text-xs text-slate-500 font-medium mt-3 flex-1">{plan.description}</p>
                                    <ul className="text-xs font-bold text-slate-600 space-y-1.5 my-4">
                                        <li>• {plan.maxAwardsMonth > 0 ? `${plan.maxAwardsMonth} adjudicaciones/mes` : plan.welcomeAward ? '1 adjudicación de bienvenida' : 'Sin adjudicaciones'}</li>
                                        <li>• {plan.maxPackagesMonth > 0 ? `${plan.maxPackagesMonth} paquete(s)/mes` : 'Paquetes solo en borrador'}</li>
                                        {plan.maxContentPostsMonth > 0 && <li>• {plan.maxContentPostsMonth} publicaciones de contenido</li>}
                                        {plan.maxPromoPostsMonth > 0 && <li>• {plan.maxPromoPostsMonth} promocional(es)/mes</li>}
                                        {plan.insurerVisibility && <li>• Visibilidad ante aseguradoras</li>}
                                        {plan.currencyConversion && <li>• Conversión Bs → divisas</li>}
                                        {plan.creditAccess && <li>• Líneas de crédito equipos</li>}
                                        {plan.malpracticePolicy && <li>• Póliza de resp. médica</li>}
                                    </ul>
                                    {isCurrent ? (
                                        <div className="text-center py-3 bg-alteha-turquoise/10 text-alteha-turquoise rounded-2xl font-black text-sm">✓ Tu plan actual</div>
                                    ) : (
                                        <Button
                                            onClick={() => plan.priceUsd > 0 ? setPaying(plan) : subscribeToPlan({ planCode: plan.code }).then(loadAll)}
                                            className={`w-full rounded-2xl font-black py-3 ${isContractedExpired ? 'bg-red-500 text-white' : 'bg-slate-900 text-white hover:bg-alteha-turquoise hover:text-slate-900'}`}
                                        >
                                            {isContractedExpired ? 'Renovar pago' : plan.priceUsd > 0 ? 'Contratar' : 'Bajar a gratis'}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                /* Pagos realizados */
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8">
                    {payments.length === 0 ? (
                        <p className="text-slate-400 font-bold text-sm py-10 text-center">Aún no has realizado pagos de suscripción.</p>
                    ) : (
                        <div className="space-y-3">
                            {payments.map(p => (
                                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 rounded-2xl px-5 py-4">
                                    <div>
                                        <p className="font-black text-slate-800">{p.planName} — ${Number(p.amountUsd).toFixed(2)}</p>
                                        <p className="text-xs text-slate-500 font-bold">
                                            {p.paymentNumber} · {METHOD_LABEL[p.method] || p.method} · {new Date(p.createdAt).toLocaleDateString('es-ES')}
                                        </p>
                                        {p.exchangeNote && <p className="text-[11px] text-slate-400">{p.exchangeNote}</p>}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {p.status === 'PAID' ? 'Pagado' : p.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {paying && <PaymentModal plan={paying} bcvRate={bcv?.rate} onClose={() => setPaying(null)} onPaid={() => { setPaying(null); loadAll(); }} />}
        </div>
    );
}

function UsageBar({ icon: Icon, label, used, max, freeNote }: any) {
    const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {label}</p>
            <p className="text-xl font-black mt-1">{used}<span className="text-slate-500 text-sm">/{max > 0 ? max : freeNote ? '🎁' : 0} este mes</span></p>
            {max > 0 ? (
                <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-400' : 'bg-alteha-turquoise'}`} style={{ width: `${pct}%` }} />
                </div>
            ) : (
                <p className="text-[10px] text-slate-400 mt-1.5">{freeNote || 'No incluido en tu plan'}</p>
            )}
        </div>
    );
}

// ─── Modal de pago: Stripe (PCI) / Débito Bs C2P con token / Binance ──────────
function PaymentModal({ plan, bcvRate, onClose, onPaid }: {
    plan: SubscriptionPlanInfo; bcvRate?: number; onClose: () => void; onPaid: () => void;
}) {
    const [method, setMethod] = useState<'BS_C2P' | 'BINANCE'>('BS_C2P');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    // C2P
    const [savedMethods, setSavedMethods] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);
    const [c2pForm, setC2pForm] = useState({ cedula: '', bankCode: '', bankName: '', phone: '' });
    const [c2pToken, setC2pToken] = useState('');
    const [tokenRequested, setTokenRequested] = useState(false);
    // Binance
    const [binanceRef, setBinanceRef] = useState('');

    const bsAmount = bcvRate ? plan.priceUsd * bcvRate : null;
    const hasBsMethod = savedMethods.some(m => m.type === 'BS_C2P');

    useEffect(() => {
        getSubscriptionPaymentMethods().then(setSavedMethods).catch(() => {});
        getBanks(1).then(setBanks).catch(() => {});
    }, []);

    const saveBs = async () => {
        if (!c2pForm.cedula || !c2pForm.bankCode || !c2pForm.phone) { setError('Cédula, banco y teléfono son obligatorios.'); return; }
        setBusy(true); setError(null);
        try {
            const res = await saveSubscriptionPaymentMethod({ type: 'BS_C2P', ...c2pForm });
            if (res?.id) setSavedMethods(await getSubscriptionPaymentMethods());
            else setError(res?.message || 'No se pudo guardar el método.');
        } finally { setBusy(false); }
    };

    const askToken = async () => {
        setBusy(true); setError(null);
        try {
            const res = await requestC2pToken();
            if (res?.message) { setInfo(res.message); setTokenRequested(true); }
            else setError(res?.message || 'No se pudo solicitar el token.');
        } finally { setBusy(false); }
    };

    const pay = async () => {
        setBusy(true); setError(null);
        try {
            const body: any = { planCode: plan.code, method };
            if (method === 'BS_C2P') body.c2pToken = c2pToken;
            if (method === 'BINANCE') body.reference = binanceRef;
            const res = await subscribeToPlan(body);
            if (res?.planCode) onPaid();
            else setError(res?.message || 'No se pudo procesar el pago.');
        } catch { setError('Error de conexión.'); }
        finally { setBusy(false); }
    };

    const canPay = method === 'BS_C2P'
        ? hasBsMethod && c2pToken.trim().length >= 4
        : binanceRef.trim().length >= 4;

    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm overflow-y-auto" onClick={() => !busy && onClose()}>
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 space-y-5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Contratar {plan.name}</h3>
                            <p className="text-sm font-bold text-slate-500">
                                ${plan.priceUsd.toFixed(2)}/mes {bsAmount ? <span className="text-slate-400">· ≈ Bs {bsAmount.toLocaleString('es-VE', { maximumFractionDigits: 2 })} (tasa BCV)</span> : null}
                            </p>
                        </div>
                        <button onClick={() => !busy && onClose()} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Selector de método */}
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            { id: 'BS_C2P', label: 'Débito Bs', Icon: Smartphone },
                            { id: 'BINANCE', label: 'Binance', Icon: Landmark },
                        ] as const).map(m => (
                            <button key={m.id} onClick={() => { setMethod(m.id); setError(null); setInfo(null); }}
                                className={`p-3 rounded-2xl border-2 text-center transition-all ${method === m.id ? 'border-alteha-turquoise bg-alteha-turquoise/5' : 'border-slate-100'}`}>
                                <m.Icon className={`w-5 h-5 mx-auto mb-1 ${method === m.id ? 'text-alteha-turquoise' : 'text-slate-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-wide text-slate-600">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Contenido por método */}
                    {method === 'BS_C2P' && (
                        <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                            <p className="text-xs text-slate-600 font-medium">
                                <strong>Débito inmediato en bolívares (C2P).</strong> Monto: <strong>Bs {bsAmount ? bsAmount.toLocaleString('es-VE', { maximumFractionDigits: 2 }) : '—'}</strong> a tasa BCV del día.
                                Con tu cédula, banco y teléfono, <strong>Alteha solicita a tu banco la emisión del token</strong>; te llega por SMS y lo introduces aquí.
                                <span className="text-slate-400"> El token es de un solo uso: deberás introducir uno nuevo cada mes al renovar.</span>
                            </p>
                            {!hasBsMethod ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registra tus datos de débito</p>
                                    <input placeholder="Cédula (V-12345678)" value={c2pForm.cedula} onChange={e => setC2pForm(f => ({ ...f, cedula: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                                    <select value={c2pForm.bankCode}
                                        onChange={e => { const b = banks.find((x: any) => x.code === e.target.value); setC2pForm(f => ({ ...f, bankCode: e.target.value, bankName: b?.name || '' })); }}
                                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none">
                                        <option value="">Selecciona tu banco...</option>
                                        {banks.map((b: any) => <option key={b.id} value={b.code}>{b.code} - {b.name}</option>)}
                                    </select>
                                    <input placeholder="Teléfono (04121234567)" value={c2pForm.phone} onChange={e => setC2pForm(f => ({ ...f, phone: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                                    <Button onClick={saveBs} disabled={busy} className="w-full bg-slate-900 text-white rounded-xl font-bold py-2.5">Guardar método</Button>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Datos de débito registrados</div>
                                    <Button onClick={askToken} disabled={busy} className="w-full bg-alteha-violet text-white rounded-xl font-bold py-2.5">
                                        <span className="flex items-center gap-2 justify-center"><Send className="w-4 h-4" /> Solicitar token a mi banco</span>
                                    </Button>
                                    {info && <p className="text-[11px] font-bold text-alteha-violet bg-alteha-violet/5 rounded-xl px-3 py-2">{info}</p>}
                                    <input placeholder="Token C2P recibido por SMS" value={c2pToken} onChange={e => setC2pToken(e.target.value)}
                                        disabled={!tokenRequested && !c2pToken}
                                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-black tracking-widest outline-none" />
                                </div>
                            )}
                        </div>
                    )}

                    {method === 'BINANCE' && (
                        <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                            <p className="text-xs text-slate-600 font-medium">
                                Paga <strong>${plan.priceUsd.toFixed(2)}</strong> vía <strong>Binance Pay</strong> al comercio Alteha y pega aquí el ID/referencia de la orden.
                            </p>
                            <input placeholder="Referencia / Order ID de Binance" value={binanceRef} onChange={e => setBinanceRef(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                        </div>
                    )}

                    {error && <p className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</p>}

                    <Button onClick={pay} disabled={busy || !canPay} className="w-full bg-alteha-turquoise text-slate-900 rounded-2xl font-black py-3.5 disabled:opacity-40">
                        {busy ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</span>
                            : <span className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4" /> Pagar y activar plan</span>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
