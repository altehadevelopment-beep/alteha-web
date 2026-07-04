"use client";

import React, { useState, useEffect } from 'react';
import { 
    FileCheck, 
    Upload, 
    ShieldCheck, 
    CreditCard, 
    Building2, 
    Loader2, 
    AlertCircle, 
    CheckCircle2,
    Clock,
    DollarSign,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    completeAuction,
    getWinnerPaymentMethods,
    getStoredToken,
    getAuctionAttachments,
    validateSettlementReceipt,
    rateAuctionActor,
    type PaymentMethod
} from '@/lib/api';
import { Star, FileText, ExternalLink } from 'lucide-react';

interface WinnerSettlementSectionProps {
    auction: any;
    role: 'DOCTOR' | 'CLINIC';
}

export const WinnerSettlementSection: React.FC<WinnerSettlementSectionProps> = ({ auction, role }) => {
    const METHOD_NAMES: Record<string, string> = {
        'BS_PAGO_MOVIL': 'Pago Móvil (BS)',
        'BS_BANK_TRANSFER': 'Transferencia BS',
        'USD_ACH': 'ACH / Zelle (USD)',
        'USD_WIRE_SWIFT': 'SWIFT (USD)',
        'USD_IBAN': 'IBAN (EUR/USD)',
        'BINANCE_PAY': 'Binance Pay',
        'CRYPTO_WALLET': 'Crypto Wallet'
    };

    const [settlementFile, setSettlementFile] = useState<File | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoadingMethods, setIsLoadingMethods] = useState(false);
    const [methodsError, setMethodsError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [winningBid, setWinningBid] = useState<any>(null);
    const [dupla, setDupla] = useState<any>(null);

    // Load the winning bid (modality + amount) and, for SOLO_MEDICO, the clinic's separate fee (dupla).
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                let wb: any = (auction as any).awardedBid || (auction as any).winningBid || null;
                if ((!wb || wb.modality == null || wb.bidAmount == null) && auction.id) {
                    const { getAuctionBids } = await import('@/lib/api');
                    const res = await getAuctionBids(auction.id);
                    const bids: any[] = Array.isArray(res) ? res : ((res as any)?.content ?? (res as any)?.data ?? []);
                    const awardedId = (auction as any).awardedBid?.id ?? null;
                    wb = bids.find((b: any) => awardedId ? b.id === awardedId : (b.isWinning || b.status === 'WINNING' || b.status === 'AWARDED' || b.status === 'ACCEPTED')) || wb || bids[0] || null;
                }
                if (!active) return;
                setWinningBid(wb || null);
                if (wb && wb.modality === 'SOLO_MEDICO' && auction.id) {
                    try {
                        const { getAuctionDuplas } = await import('@/lib/api');
                        const duplas = await getAuctionDuplas(auction.id);
                        const d = (duplas || []).find((x: any) => String(x.bidId) === String(wb.id)) || (duplas || [])[0] || null;
                        if (active) setDupla(d);
                    } catch { /* ignore */ }
                }
            } catch { /* ignore */ }
        })();
        return () => { active = false; };
    }, [auction.id, auction.auctionNumber]);

    useEffect(() => {
        const loadMethods = async () => {
            if (auction.status === 'PAID' || auction.status === 'COMPLETED' || auction.status === 'AWARDED') {
                setIsLoadingMethods(true);
                setMethodsError(null);
                try {
                    const methods = await getWinnerPaymentMethods(auction.auctionNumber, role);
                    setPaymentMethods(methods);
                } catch (err: any) {
                    console.error('Error loading winner methods:', err);
                    setMethodsError(err.message || 'Error al cargar métodos de pago');
                    setPaymentMethods([]);
                } finally {
                    setIsLoadingMethods(false);
                }
            }
        };
        loadMethods();
    }, [auction.auctionNumber, auction.status, role]);

    const handleComplete = async () => {
        if (!settlementFile) return;
        
        setIsCompleting(true);
        setError(null);
        try {
            const res = await completeAuction(auction.auctionNumber, settlementFile);
            if (res.code === '00' || (res as any).id) {
                setIsSuccess(true);
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setError(res.message || 'Error al completar la subasta');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsCompleting(false);
        }
    };

    // Finiquito subido por el médico: en espera de que Alteha registre la liquidación.
    if (auction.status === 'COMPLETED') {
        return (
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                        <Clock className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black">Finiquito registrado</h3>
                        <p className="text-slate-300 text-sm font-medium mt-2">
                            Tu acta de finiquito fue registrada correctamente. Ahora está <strong className="text-white">en espera de que Alteha liquide los fondos</strong> a tu método de cobro. Te notificaremos cuando el pago sea liberado.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Alteha ya registró la liquidación (PENDING_SETTLEMENT) o el proceso terminó (SETTLED):
    // el ganador ve el comprobante, confirma la recepción y valora a los actores.
    if (auction.status === 'PENDING_SETTLEMENT' || auction.status === 'SETTLED') {
        return (
            <SettlementFundsPanel
                auction={auction}
                role={role}
                clinicName={dupla?.clinicName || winningBid?.clinic?.name || null}
                hasClinic={!!(winningBid?.clinic || dupla)}
                settled={auction.status === 'SETTLED'}
            />
        );
    }

    const wbAmount = Number(winningBid?.bidAmount ?? 0);
    const wbModality = winningBid?.modality;
    const clinicSep = dupla?.clinicFee != null ? Number(dupla.clinicFee) : null;
    const clinicNm = dupla?.clinicName || winningBid?.clinic?.name || 'la clínica';
    const fmtMoney = (n: number) => `$${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8">
            {/* Cuánto te corresponde cobrar — transparencia por modalidad */}
            {winningBid && (
                <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-alteha-turquoise/10 text-alteha-turquoise rounded-full text-[10px] font-black uppercase tracking-widest">
                            <DollarSign className="w-3 h-3" /> Cuánto te corresponde cobrar
                        </div>
                        {role === 'DOCTOR' ? (
                            <>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                                        {wbModality === 'PAQUETE_COMPLETO' ? 'Cobrás el monto total de la subasta' : 'Cobrás tus honorarios médicos'}
                                    </p>
                                    <p className="text-5xl font-black tracking-tight">{fmtMoney(wbAmount)}</p>
                                </div>
                                {wbModality === 'SOLO_MEDICO' ? (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                                        <p className="text-sm font-bold text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-alteha-turquoise" /> Modalidad: Solo médico (dupla con clínica)</p>
                                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                            Este monto corresponde <strong className="text-white">solo a tus honorarios médicos</strong>. {clinicNm}{clinicSep != null ? <> cobra su parte (<strong className="text-white">{fmtMoney(clinicSep)}</strong>)</> : ' cobra su parte'} <strong className="text-white">por separado</strong>, directamente del seguro.
                                        </p>
                                        {clinicSep != null && (
                                            <p className="text-[11px] text-slate-400 pt-2 border-t border-white/10">
                                                Monto total de la subasta {fmtMoney(wbAmount + clinicSep)} = tus honorarios {fmtMoney(wbAmount)} + clínica {fmtMoney(clinicSep)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                        <p className="text-sm font-bold text-white flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4 text-alteha-turquoise" /> Modalidad: Paquete completo</p>
                                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                            Cobrás el <strong className="text-white">monto total</strong> de la subasta. Vos te encargás de <strong className="text-white">pagarle a la clínica</strong> su parte por la intervención.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                                        {wbModality === 'SOLO_MEDICO' ? 'Cobrás los honorarios de la clínica' : 'Cobro de la clínica'}
                                    </p>
                                    <p className="text-5xl font-black tracking-tight">{clinicSep != null ? fmtMoney(clinicSep) : '—'}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                        {wbModality === 'SOLO_MEDICO'
                                            ? <>El médico cobra sus honorarios (<strong className="text-white">{fmtMoney(wbAmount)}</strong>) por separado. Tu clínica cobra su parte directamente del seguro.</>
                                            : <>Modalidad <strong className="text-white">paquete completo</strong>: el médico cobra el total y te paga tu parte directamente.</>}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Methods Section */}
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 space-y-8">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-alteha-turquoise/10 text-alteha-turquoise rounded-full text-[10px] font-black uppercase tracking-widest">
                        <CreditCard className="w-3 h-3" /> Liquidación
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Mis Métodos de Pago</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Cuentas configuradas para recibir el desembolso de esta subasta.</p>
                </div>

                <div className="space-y-4">
                    {isLoadingMethods ? (
                        <div className="flex items-center gap-3 py-8">
                            <Loader2 className="w-5 h-5 text-alteha-turquoise animate-spin" />
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Cargando cuentas...</span>
                        </div>
                    ) : paymentMethods.length > 0 ? (
                        paymentMethods.map((method) => (
                            <div key={method.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-alteha-turquoise/30 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-alteha-turquoise transition-colors">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-alteha-turquoise uppercase tracking-widest mb-1">{method.displayName}</p>
                                        <p className="text-sm font-black text-slate-900">{method.bankAccount?.bankName}</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 truncate">{method.bankAccount?.accountNumber}</p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-2 italic">{method.bankAccount?.holderFullName}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 text-center space-y-3">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                            <p className="text-sm font-bold text-amber-700 leading-tight">
                                {methodsError || 'No tienes cuentas de pago activas para este rol.'}
                            </p>
                            {auction?.allowedPaymentMethods && auction.allowedPaymentMethods.length > 0 && (
                                <p className="text-xs font-medium text-amber-600 mt-2 bg-amber-100/50 p-3 rounded-xl">
                                    Esta subasta requiere configurar al menos uno de los siguientes métodos de pago: <br/>
                                    <strong className="text-amber-800 tracking-wider">
                                        {auction.allowedPaymentMethods.map((m: string) => METHOD_NAMES[m] || m).join(', ')}
                                    </strong>.
                                </p>
                            )}
                            
                            {methodsError && (
                                <div className="mt-4 p-4 bg-slate-900 rounded-xl text-left overflow-x-auto border border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Info de depuración para backend:
                                    </p>
                                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
{`curl -X GET "https://qaback.alteha.com:3232/api/auctions/${auction.auctionNumber}/winner-payment-methods?role=${role}" \\
  -H "Accept: application/json" \\
  -H "X-Alteha-Token: ${getStoredToken() || '<TU_TOKEN_AQUI>'}"`}
                                    </pre>
                                </div>
                            )}

                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    const baseUrl = `/dashboard/${role.toLowerCase() === 'doctor' ? 'specialist' : 'clinic'}/payments`;
                                    const allowed: string[] = auction?.allowedPaymentMethods || [];
                                    const redirectUrl = allowed.length > 0
                                        ? `${baseUrl}?addMethod=${allowed[0]}&required=${allowed.join(',')}`
                                        : baseUrl;
                                    window.location.href = redirectUrl;
                                }}
                                className="text-[10px] h-8 rounded-full border-amber-200 text-amber-600 hover:bg-amber-100"
                            >
                                Configurar ahora
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Completion / Settlement Upload Section */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/70 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <FileCheck className="w-3 h-3" /> Cierre de Intervención
                    </div>
                    <h3 className="text-2xl font-black">Reportar Finiquito</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Una vez realizada la intervención, suba el acta de finiquito firmada para solicitar la liberación de los fondos.
                    </p>
                </div>

                {auction.status === 'PAID' ? (
                    <div className="space-y-6">
                        {paymentMethods.length === 0 || methodsError ? (
                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center space-y-3">
                                <AlertCircle className="w-8 h-8 text-amber-500/80 mx-auto" />
                                <p className="text-sm font-medium text-slate-300">
                                    Debes tener configurado al menos un método de pago válido para la subasta antes de poder subir el acta de finiquito.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 text-center transition-all hover:bg-white/[0.07] group relative">
                                <input 
                                    type="file" 
                                    onChange={(e) => setSettlementFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                {settlementFile ? (
                                    <div className="space-y-3">
                                        <div className="w-16 h-16 bg-alteha-turquoise/20 text-alteha-turquoise rounded-2xl flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white truncate">{settlementFile.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Listo para subir</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="w-16 h-16 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400">Seleccionar Acta de Finiquito (PDF/IMG)</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <Button 
                            disabled={!settlementFile || isCompleting}
                            onClick={handleComplete}
                            className={`w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                                isSuccess ? 'bg-emerald-500 text-white' : 'bg-alteha-turquoise text-slate-900 hover:bg-alteha-turquoise/90'
                            }`}
                        >
                            {isCompleting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isSuccess ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <ShieldCheck className="w-5 h-5" />
                            )}
                            {isSuccess ? '¡PROCESADO!' : isCompleting ? 'SUBIENDO...' : 'FINALIZAR INTERVENCIÓN'}
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center space-y-4">
                        <Clock className="w-12 h-12 text-slate-600 mx-auto" />
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Esperando Pago</p>
                            <p className="text-xs font-medium text-slate-500">
                                Podrá subir el finiquito una vez que la compañía de seguros confirme el pago de la subasta.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

// ===== Panel post-liquidación: comprobante + confirmación de recepción + valoraciones =====

// Clave local para recordar (por navegador) qué actores ya valoró el ganador en cada subasta
export const ratedStorageKey = (auctionNumber: string, targetRole: string) => `alteha_rated_${auctionNumber}_${targetRole}`;

export function StarPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(n)}
                    className={`transition-transform ${disabled ? 'cursor-default' : 'hover:scale-110'}`}
                >
                    <Star className={`w-7 h-7 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                </button>
            ))}
        </div>
    );
}

export function ActorRatingCard({ auctionNumber, targetRole, label, sublabel, onSaved }: {
    auctionNumber: string;
    targetRole: 'INSURANCE' | 'ALTEHA' | 'CLINIC';
    label: string;
    sublabel?: string | null;
    onSaved?: () => void;
}) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem(ratedStorageKey(auctionNumber, targetRole)));
    const [error, setError] = useState<string | null>(null);

    const save = async () => {
        if (rating === 0) return;
        setSaving(true);
        setError(null);
        try {
            const res = await rateAuctionActor(auctionNumber, { targetRole, rating, comment });
            if (res.code === '00') {
                setSaved(true);
                try { localStorage.setItem(ratedStorageKey(auctionNumber, targetRole), String(Date.now())); } catch { /* ignore */ }
                onSaved?.();
            } else setError(res.message || 'Error al guardar la valoración');
        } catch {
            setError('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-black text-white">{label}</p>
                    {sublabel && <p className="text-[11px] text-slate-400 font-medium">{sublabel}</p>}
                </div>
                {saved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Guardada
                    </span>
                )}
            </div>
            <StarPicker value={rating} onChange={v => { setRating(v); setSaved(false); }} disabled={saving} />
            <textarea
                value={comment}
                onChange={e => { setComment(e.target.value); setSaved(false); }}
                rows={2}
                disabled={saving}
                placeholder="Comentario (opcional)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-alteha-turquoise/50 resize-none"
            />
            {error && <p className="text-xs font-bold text-red-400">{error}</p>}
            <Button
                onClick={save}
                disabled={saving || rating === 0 || saved}
                className="bg-alteha-turquoise text-slate-900 border-none px-6 py-2 text-sm disabled:opacity-40"
            >
                {saving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</span> : saved ? 'Valoración guardada' : 'Guardar valoración'}
            </Button>
        </div>
    );
}

function SettlementFundsPanel({ auction, role, clinicName, hasClinic, settled }: {
    auction: any;
    role: 'DOCTOR' | 'CLINIC';
    clinicName: string | null;
    hasClinic: boolean;
    settled: boolean;
}) {
    const [proofs, setProofs] = useState<any[]>([]);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    // Comprobante(s) de liquidación subidos por Alteha al registrar el pago
    useEffect(() => {
        let active = true;
        getAuctionAttachments(auction.auctionNumber, role)
            .then((res: any) => {
                if (!active) return;
                const list: any[] = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
                setProofs(list.filter(a => (a.description || '').startsWith('Comprobante de Liquidación')));
            })
            .catch(() => { /* sin comprobantes visibles */ });
        return () => { active = false; };
    }, [auction.auctionNumber, role]);

    const confirmReceipt = async () => {
        setIsConfirming(true);
        setConfirmError(null);
        try {
            const res = await validateSettlementReceipt({ auctionNumber: auction.auctionNumber, isReceived: true, notes: '' });
            if (res.code === '00') window.location.reload();
            else setConfirmError(res.message || 'Error al confirmar la recepción');
        } catch {
            setConfirmError('Error de conexión');
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            {/* Estado */}
            <div className="text-center space-y-4 relative z-10">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                    <h3 className="text-2xl font-black">{settled ? 'Liquidación completada' : '¡Tus fondos fueron liquidados!'}</h3>
                    <p className="text-slate-300 text-sm font-medium mt-2 max-w-lg mx-auto">
                        {settled
                            ? 'Confirmaste la recepción de los fondos. El proceso de esta subasta está finalizado.'
                            : 'Alteha registró el pago de tu liquidación a tu método de cobro. Revisa el comprobante y confirma la recepción de los fondos.'}
                    </p>
                </div>
            </div>

            {/* Comprobante(s) */}
            {proofs.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comprobante de pago</p>
                    {proofs.map(p => (
                        <a
                            key={p.id}
                            href={p.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors group"
                        >
                            <span className="flex items-center gap-3 text-sm font-bold text-white truncate">
                                <FileText className="w-4 h-4 text-alteha-turquoise shrink-0" />
                                <span className="truncate">{p.fileName || 'Comprobante'}</span>
                            </span>
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                        </a>
                    ))}
                </div>
            )}

            {/* Confirmar recepción */}
            {!settled && (
                <div className="text-center space-y-2 relative z-10">
                    <Button
                        onClick={confirmReceipt}
                        disabled={isConfirming}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-10 py-4 mx-auto"
                    >
                        {isConfirming
                            ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</span>
                            : <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Confirmar recepción de fondos</span>}
                    </Button>
                    {confirmError && <p className="text-xs font-bold text-red-400">{confirmError}</p>}
                    <p className="text-[11px] text-slate-500">Al confirmar, la subasta quedará cerrada como liquidada.</p>
                </div>
            )}

            {/* Valoraciones de los actores */}
            <div className="space-y-4 relative z-10">
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise">Valora tu experiencia</p>
                    <p className="text-slate-400 text-xs font-medium mt-1">Tu valoración ayuda a mejorar la calidad de la red. Puedes valorar a cada actor de esta subasta.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActorRatingCard
                        auctionNumber={auction.auctionNumber}
                        targetRole="INSURANCE"
                        label="Compañía de Seguros"
                        sublabel={auction.insuranceCompany?.name || null}
                    />
                    <ActorRatingCard
                        auctionNumber={auction.auctionNumber}
                        targetRole="ALTEHA"
                        label="Alteha"
                        sublabel="Plataforma y gestión de pagos"
                    />
                    {role === 'DOCTOR' && hasClinic && (
                        <ActorRatingCard
                            auctionNumber={auction.auctionNumber}
                            targetRole="CLINIC"
                            label="Clínica"
                            sublabel={clinicName}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
