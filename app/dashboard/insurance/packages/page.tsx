"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
    Package, ShoppingCart, Loader2, CheckCircle2, X, Search,
    Stethoscope, Building2, DollarSign, AlertCircle, Send, User, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    getAllMedicalPackages, purchaseMedicalPackage, getMyPackagePurchases,
    getInsuranceRedemptions, createPackageRedemption, searchPatient,
    type MedicalPackage, type PackagePurchaseSummary, type PackageRedemptionItem
} from '@/lib/api';
import { getPackageCategory } from '@/components/packages/categories';

const REDEMPTION_BADGE: Record<string, { label: string; color: string }> = {
    REQUESTED: { label: 'Esperando al proveedor', color: 'bg-amber-50 text-amber-600' },
    ACCEPTED: { label: 'Aceptada — por ejecutar', color: 'bg-blue-50 text-blue-600' },
    REJECTED: { label: 'Rechazada', color: 'bg-red-50 text-red-500' },
    COMPLETED: { label: 'Ejecutada — finiquito recibido', color: 'bg-violet-50 text-violet-600' },
    SETTLED: { label: 'Liquidada por Alteha ✓', color: 'bg-emerald-50 text-emerald-600' },
};

export default function InsurancePackagesPage() {
    const [tab, setTab] = useState<'market' | 'mine'>('market');
    const [market, setMarket] = useState<MedicalPackage[]>([]);
    const [purchases, setPurchases] = useState<PackagePurchaseSummary[]>([]);
    const [redemptions, setRedemptions] = useState<PackageRedemptionItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Compra
    const [buying, setBuying] = useState<MedicalPackage | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [buyError, setBuyError] = useState<string | null>(null);

    // Solicitud de intervención (redención)
    const [redeeming, setRedeeming] = useState<PackagePurchaseSummary | null>(null);
    const [docType, setDocType] = useState('CEDULA');
    const [docNumber, setDocNumber] = useState('');
    const [patient, setPatient] = useState<any>(null);
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [redeemNotes, setRedeemNotes] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemError, setRedeemError] = useState<string | null>(null);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [mkt, mine, reds] = await Promise.all([
                getAllMedicalPackages(0, 50).then((r: any) => (r?.data ?? (Array.isArray(r) ? r : r?.content ?? []))).catch(() => []),
                getMyPackagePurchases().catch(() => []),
                getInsuranceRedemptions().catch(() => []),
            ]);
            setMarket(Array.isArray(mkt) ? mkt.filter((p: any) => p.isActive !== false) : []);
            setPurchases(mine);
            setRedemptions(reds);
        } finally { setLoading(false); }
    };
    useEffect(() => { loadAll(); }, []);

    const confirmBuy = async () => {
        if (!buying?.id) return;
        setIsBuying(true);
        setBuyError(null);
        try {
            const res: any = await purchaseMedicalPackage(buying.id);
            if (res?.id || res?.code === '00' || res?.purchaseNumber) {
                setBuying(null);
                setTab('mine');
                await loadAll();
            } else {
                setBuyError(res?.message || 'No se pudo completar la compra.');
            }
        } catch { setBuyError('Error de conexión.'); }
        finally { setIsBuying(false); }
    };

    const findPatient = async () => {
        if (!docNumber.trim()) return;
        setSearchingPatient(true);
        setPatient(null);
        setRedeemError(null);
        try {
            const res: any = await searchPatient(docType, docNumber.trim());
            const p = res?.data ?? (res?.id ? res : null);
            if (p?.id) setPatient(p);
            else setRedeemError('Paciente no encontrado. Regístralo primero en la sección Pacientes.');
        } catch { setRedeemError('Error buscando el paciente.'); }
        finally { setSearchingPatient(false); }
    };

    const submitRedemption = async () => {
        if (!redeeming || !patient?.id) { setRedeemError('Debes asociar un paciente a la intervención.'); return; }
        setIsRedeeming(true);
        setRedeemError(null);
        try {
            const res: any = await createPackageRedemption({ purchaseId: redeeming.id, patientId: patient.id, notes: redeemNotes || undefined });
            if (res?.id || res?.redemptionNumber) {
                setRedeeming(null);
                setPatient(null); setDocNumber(''); setRedeemNotes('');
                await loadAll();
            } else {
                setRedeemError(res?.message || 'No se pudo crear la solicitud.');
            }
        } catch { setRedeemError('Error de conexión.'); }
        finally { setIsRedeeming(false); }
    };

    const redemptionsByPurchase = useMemo(() => {
        const m: Record<number, PackageRedemptionItem[]> = {};
        redemptions.forEach(r => { (m[r.purchaseId] = m[r.purchaseId] || []).push(r); });
        return m;
    }, [redemptions]);

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Cabecera */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                    <Package className="w-9 h-9 text-alteha-violet" /> Paquetes Médicos
                </h1>
                <p className="text-slate-400 font-medium max-w-2xl">
                    Compra paquetes de intervenciones publicados por médicos y clínicas. El pago va a Alteha, y tú redimes cada intervención asignándola a un paciente.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl w-fit border border-slate-100 shadow-sm">
                <button onClick={() => setTab('market')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${tab === 'market' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ShoppingCart className="w-4 h-4" /> Marketplace
                </button>
                <button onClick={() => setTab('mine')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${tab === 'mine' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Paquetes Adquiridos {purchases.length > 0 && <span className="px-2 py-0.5 bg-alteha-violet/10 text-alteha-violet rounded-full text-[10px]">{purchases.length}</span>}
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-alteha-violet animate-spin mx-auto" /></div>
            ) : tab === 'market' ? (
                /* ── Marketplace ── */
                market.length === 0 ? (
                    <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                        <p className="text-slate-400 font-bold text-sm">No hay paquetes publicados por ahora.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {market.map((pkg: any) => (
                            <div key={pkg.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col">
                                {pkg.imageUrl ? (
                                    <img src={pkg.imageUrl} alt={pkg.packageName} className="w-full h-40 object-cover" />
                                ) : (
                                    <div className="w-full h-40 bg-gradient-to-br from-alteha-violet/10 to-alteha-turquoise/10 flex items-center justify-center">
                                        <Package className="w-12 h-12 text-slate-200" />
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-1 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {getPackageCategory(pkg.packageCategory) && (
                                            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                                {getPackageCategory(pkg.packageCategory)!.emoji} {getPackageCategory(pkg.packageCategory)!.label}
                                            </span>
                                        )}
                                        {pkg.procedureType?.name && (
                                            <span className="px-3 py-1 bg-alteha-violet/10 text-alteha-violet rounded-full text-[10px] font-black uppercase tracking-widest">{pkg.procedureType.name}</span>
                                        )}
                                        {pkg.specialty?.name && (
                                            <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{pkg.specialty.name}</span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{pkg.packageName}</h3>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-2 flex-1">{pkg.description}</p>
                                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                        {pkg.doctor ? <><Stethoscope className="w-3.5 h-3.5" /> Dr. {pkg.doctor.firstName} {pkg.doctor.lastName}</>
                                            : pkg.clinic ? <><Building2 className="w-3.5 h-3.5" /> {pkg.clinic.name}</> : null}
                                    </p>
                                    <div className="flex items-end justify-between pt-3 border-t border-slate-50">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Precio</p>
                                            <p className="text-2xl font-black text-slate-900">${Number(pkg.discountedPrice || pkg.basePrice || 0).toLocaleString()}</p>
                                            {pkg.basePrice && pkg.discountedPrice && pkg.discountedPrice < pkg.basePrice && (
                                                <p className="text-[11px] text-slate-300 font-bold">Referencial: <span className="line-through">${Number(pkg.basePrice).toLocaleString()}</span></p>
                                            )}
                                        </div>
                                        <Button onClick={() => { setBuying(pkg); setBuyError(null); }}
                                            className="bg-alteha-violet text-white rounded-xl font-black px-5 py-2.5 text-sm hover:scale-105 transition-all">
                                            <span className="flex items-center gap-1.5"><ShoppingCart className="w-4 h-4" /> Comprar</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* ── Paquetes Adquiridos ── */
                purchases.length === 0 ? (
                    <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center space-y-2">
                        <Package className="w-10 h-10 text-slate-200 mx-auto" />
                        <p className="text-slate-400 font-bold text-sm">Aún no has comprado paquetes. Explora el Marketplace.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {purchases.map(p => {
                            const reds = redemptionsByPurchase[p.id] || [];
                            const pct = p.totalInterventions > 0 ? Math.round((p.usedInterventions / p.totalInterventions) * 100) : 0;
                            return (
                                <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {p.packageImageUrl ? (
                                                <img src={p.packageImageUrl} alt="" className="w-20 h-14 object-cover rounded-2xl shrink-0" />
                                            ) : (
                                                <div className="w-20 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0"><Package className="w-6 h-6 text-slate-300" /></div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{p.purchaseNumber} · ${Number(p.amountPaid || 0).toLocaleString()}</p>
                                                <h3 className="text-xl font-black text-slate-900 truncate">{p.packageName}</h3>
                                                <p className="text-xs text-slate-400 font-bold truncate">
                                                    {p.procedureTypeName || ''} {p.providerDoctorName ? `· Dr. ${p.providerDoctorName}` : p.providerClinicName ? `· ${p.providerClinicName}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => { setRedeeming(p); setPatient(null); setDocNumber(''); setRedeemNotes(''); setRedeemError(null); }}
                                            disabled={p.remainingInterventions <= 0}
                                            className="bg-alteha-violet text-white rounded-2xl font-black px-6 py-3 disabled:opacity-40 shrink-0"
                                        >
                                            <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Solicitar intervención</span>
                                        </Button>
                                    </div>

                                    {/* Progreso de uso */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Intervenciones usadas</span>
                                            <span>{p.usedInterventions}/{p.totalInterventions} · quedan {p.remainingInterventions}</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-alteha-violet to-alteha-turquoise rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>

                                    {/* Solicitudes de este paquete */}
                                    {reds.length > 0 && (
                                        <div className="space-y-2">
                                            {reds.map(r => {
                                                const b = REDEMPTION_BADGE[r.status] || REDEMPTION_BADGE.REQUESTED;
                                                return (
                                                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 rounded-2xl px-4 py-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <User className="w-4 h-4 text-slate-300 shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-slate-800 truncate">{r.patientName || 'Paciente'}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{r.redemptionNumber} · {new Date(r.createdAt).toLocaleDateString('es-ES')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${b.color}`}>{b.label}</span>
                                                            {r.rejectReason && <span className="text-[10px] text-red-400 italic max-w-[180px] truncate" title={r.rejectReason}>“{r.rejectReason}”</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* ── Modal Comprar ── */}
            {buying && (
                <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm overflow-y-auto" onClick={() => !isBuying && setBuying(null)}>
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 space-y-5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900">Confirmar compra</h3>
                                <button onClick={() => !isBuying && setBuying(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            {buying.imageUrl && <img src={buying.imageUrl} alt="" className="w-full h-36 object-cover rounded-2xl" />}
                            <div>
                                <p className="font-black text-slate-900">{buying.packageName}</p>
                                <p className="text-xs text-slate-500">{(buying as any).procedureType?.name}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl px-5 py-4 flex items-center justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total a pagar a Alteha</span>
                                <span className="text-2xl font-black text-slate-900">${Number(buying.discountedPrice || buying.basePrice || 0).toLocaleString()}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                El pago se realiza a <strong>Alteha</strong>, quien liquidará al proveedor cada intervención ejecutada (contra finiquito).
                            </p>
                            {buyError && <p className="text-sm font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3">{buyError}</p>}
                            <Button onClick={confirmBuy} disabled={isBuying} className="w-full bg-alteha-violet text-white rounded-2xl font-black py-3.5">
                                {isBuying ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</span>
                                    : <span className="flex items-center gap-2 justify-center"><DollarSign className="w-4 h-4" /> Confirmar compra</span>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Solicitar intervención ── */}
            {redeeming && (
                <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm overflow-y-auto" onClick={() => !isRedeeming && setRedeeming(null)}>
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 space-y-5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Solicitar intervención</h3>
                                    <p className="text-xs text-slate-400 font-bold">{redeeming.packageName} · quedan {redeeming.remainingInterventions}</p>
                                </div>
                                <button onClick={() => !isRedeeming && setRedeeming(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Paciente: obligatorio */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Paciente que recibirá la intervención *</label>
                                <div className="flex gap-2">
                                    <select value={docType} onChange={e => setDocType(e.target.value)}
                                        className="h-12 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none">
                                        <option value="CEDULA">Cédula</option>
                                        <option value="PASSPORT">Pasaporte</option>
                                    </select>
                                    <input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Nº de documento"
                                        className="flex-1 h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 outline-none" />
                                    <Button onClick={findPatient} disabled={searchingPatient || !docNumber.trim()}
                                        className="bg-slate-900 text-white rounded-xl px-4 font-bold">
                                        {searchingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {patient && (
                                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <p className="text-sm font-black text-slate-800">{patient.firstName} {patient.lastName}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notas para el proveedor (opcional)</label>
                                <textarea value={redeemNotes} onChange={e => setRedeemNotes(e.target.value)} rows={2}
                                    placeholder="Ej: paciente disponible en las mañanas, urgencia media..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none resize-none" />
                            </div>

                            {redeemError && (
                                <p className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {redeemError}
                                </p>
                            )}

                            <Button onClick={submitRedemption} disabled={isRedeeming || !patient} className="w-full bg-alteha-violet text-white rounded-2xl font-black py-3.5 disabled:opacity-40">
                                {isRedeeming ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</span>
                                    : <span className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4" /> Enviar solicitud al proveedor</span>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
