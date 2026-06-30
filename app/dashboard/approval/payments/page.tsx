"use client";

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Activity, Clock, CheckCircle2, AlertCircle,
    ChevronRight, Search, Loader2, X, User, Building2, ShieldCheck, CreditCard
} from 'lucide-react';
import { getAllAuctions, validateAuctionPayment, getAuctionAttachments, type Auction, type AuctionAttachment } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

// One auction row in the payment-validation list, enriched with the awarded doctor + clinic.
function PaymentAuctionRow({ auction, onSelect }: { auction: any; onSelect: () => void }) {
    const [winner, setWinner] = useState<any>(auction.awardedBid || auction.winningBid || null);
    const isPaid = auction.status === 'PAID';

    useEffect(() => {
        const hasName = winner?.doctor?.fullName || winner?.doctor?.firstName || winner?.doctorName;
        if (hasName) return;
        let active = true;
        (async () => {
            try {
                const { getAuctionDetails } = await import('@/lib/api');
                const res: any = await getAuctionDetails(auction.auctionNumber, 'ADMIN');
                const data = res?.code === '00' ? res.data : (res?.id ? res : null);
                const wb = data?.winningBid || data?.awardedBid;
                if (active && wb) setWinner(wb);
            } catch { /* ignore */ }
        })();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auction.auctionNumber]);

    const doc = winner?.doctor;
    const docName = doc ? (doc.fullName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || null) : (winner?.doctorName || null);
    const docPhoto = doc?.profileImageUrl || winner?.doctorProfileImageUrl;
    const clinicName = winner?.clinic?.name || winner?.clinicName || null;
    const clinicLogo = winner?.clinic?.logoUrl || winner?.clinicLogoUrl;

    return (
        <div className="bg-slate-50 hover:bg-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-100 transition-colors">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {isPaid ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Activity className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{auction.auctionNumber}</p>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{auction.title}</p>
                    {(docName || clinicName) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            {docName && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                        {docPhoto ? <img src={docPhoto} alt="" className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                                    </span>
                                    {docName}
                                </span>
                            )}
                            {clinicName && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-0.5">
                                        {clinicLogo ? <img src={clinicLogo} alt="" className="max-w-full max-h-full object-contain" /> : <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                                    </span>
                                    {clinicName}
                                </span>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Seguro: <span className="text-slate-600 font-semibold">{auction.insuranceCompany?.name || auction.insuranceCompany?.commercialName || 'N/A'}</span></p>
                </div>
            </div>
            {isPaid ? (
                <button onClick={onSelect} className="w-full sm:w-auto px-5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Ver Aprobado
                </button>
            ) : (
                <button onClick={onSelect} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-600 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                    Validar Pago <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export default function PaymentValidationPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
    const [attachments, setAttachments] = useState<AuctionAttachment[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [diagnosticError, setDiagnosticError] = useState<{
        title: string; detail: string; status?: number; path?: string; isBackendCrash?: boolean;
    } | null>(null);

    useEffect(() => {
        if (!selectedAuction) { setAttachments([]); return; }
        const fetchDetails = async () => {
            setIsLoadingAttachments(true);
            try {
                try {
                    const attachResult = await getAuctionAttachments(selectedAuction.auctionNumber, 'ADMIN');
                    if (attachResult.code === '00' && attachResult.data) {
                        setAttachments(Array.isArray(attachResult.data) ? attachResult.data : []);
                    }
                } catch { /* access denied for attachments */ }

                const currentBid = selectedAuction.awardedBid || selectedAuction.winningBid;
                let hasWinnerDetails = !!(currentBid && currentBid.bidAmount != null && currentBid.doctor);

                const { getAuctionDetails, getAuctionBids } = await import('@/lib/api');
                try {
                    const detailsResult = await getAuctionDetails(selectedAuction.auctionNumber, 'ADMIN');
                    if (detailsResult.code === '00' && detailsResult.data) {
                        const fullData = detailsResult.data as any;
                        const newBid = fullData.winningBid || fullData.awardedBid;
                        if (newBid?.bidAmount != null && newBid?.doctor) hasWinnerDetails = true;
                        setSelectedAuction(prev => prev ? { ...prev, ...fullData, insuranceCompany: fullData.insuranceCompany || fullData.owner || prev.insuranceCompany } : prev);
                    }
                } catch { /* fallback */ }

                if (!hasWinnerDetails && selectedAuction.id) {
                    try {
                        const bidsResult = await getAuctionBids(selectedAuction.id);
                        let bids: any[] = Array.isArray(bidsResult) ? bidsResult : (bidsResult as any)?.content ?? [];
                        const winner = bids.find((b: any) => b.isWinning || b.status === 'WINNING' || b.status === 'AWARDED' || b.status === 'ACCEPTED');
                        if (winner) setSelectedAuction(prev => prev ? { ...prev, awardedBid: winner } : prev);
                    } catch { /* no winner found */ }
                }

                const currentIns = selectedAuction.insuranceCompany || (selectedAuction as any).owner;
                if (currentIns?.id && !currentIns.name && !currentIns.commercialName) {
                    try {
                        const { getInsuranceCompanyById } = await import('@/lib/api');
                        const r = await getInsuranceCompanyById(currentIns.id);
                        if (r) setSelectedAuction(prev => prev ? { ...prev, insuranceCompany: (r.data || r) as any } : prev);
                    } catch { /* ignore */ }
                }
            } catch (err) {
                console.error('Error fetching details:', err);
            } finally {
                setIsLoadingAttachments(false);
            }
        };
        fetchDetails();
    }, [selectedAuction?.id, selectedAuction?.auctionNumber]);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const result = await getAllAuctions('PAYMENT_VALIDATION,PAID', 0, 50, 'updatedAt,desc');
                if (result.code === '00' && result.data) {
                    const content = (result.data as any).content || result.data;
                    const loaded: Auction[] = Array.isArray(content) ? content : [];
                    setAuctions(loaded);
                    setStats({
                        pending: loaded.filter((a: any) => a.status === 'PAYMENT_VALIDATION').length,
                        approved: loaded.filter((a: any) => a.status === 'PAID').length,
                        rejected: 0
                    });
                } else {
                    setError('Error al cargar validaciones pendientes');
                }
            } catch (err) {
                setError('Error de conexión');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    const handleValidation = async (isValid: boolean) => {
        if (!selectedAuction?.auctionNumber) return;
        setIsSubmitting(true);
        try {
            const result = await validateAuctionPayment({ auctionNumber: selectedAuction.auctionNumber, isValid, notes });
            if (result.code === '00') {
                setAuctions(prev => prev.filter(a => a.id !== selectedAuction.id));
                setStats(prev => ({
                    ...prev,
                    pending: Math.max(0, prev.pending - 1),
                    approved: isValid ? prev.approved + 1 : prev.approved,
                    rejected: !isValid ? prev.rejected + 1 : prev.rejected
                }));
                setSelectedAuction(null);
                setNotes('');
            } else {
                const detailText = result.detail || result.message || 'Error desconocido';
                setDiagnosticError({
                    title: result.title || 'Error Interno del Servidor',
                    detail: detailText,
                    status: result.status || 500,
                    path: result.path || '/api/auctions/validate-payment',
                    isBackendCrash: detailText.includes('NullPointerException') || result.status === 500
                });
            }
        } catch (err: any) {
            setDiagnosticError({ title: 'Error de Red / Conexión', detail: err.message || 'No se pudo conectar con el servidor.', isBackendCrash: false });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Validación de Pagos</h1>
                <p className="text-slate-400 font-medium">Revisa y aprueba los comprobantes de pago de las subastas.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold">Pendientes</p>
                            <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold">Aprobadas</p>
                            <p className="text-2xl font-black text-slate-900">{stats.approved}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold">Rechazadas</p>
                            <p className="text-2xl font-black text-slate-900">{stats.rejected}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl p-6">
                <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-slate-400" /> Subastas Pendientes
                </h2>
                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-9 h-9 text-amber-400 animate-spin mb-3" />
                            <p className="text-slate-400 text-sm font-bold">Cargando validaciones...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <AlertCircle className="w-9 h-9 text-red-400 mb-3" />
                            <p className="text-red-500 font-bold">{error}</p>
                        </div>
                    ) : auctions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <CheckCircle2 className="w-14 h-14 text-emerald-200 mb-3" />
                            <p className="font-black text-slate-700">Todo al día</p>
                            <p className="text-slate-400 text-sm mt-1">No hay subastas pendientes de validación de pago.</p>
                        </div>
                    ) : auctions.map(auction => (
                        <PaymentAuctionRow key={auction.id} auction={auction} onSelect={() => setSelectedAuction(auction)} />
                    ))}
                </div>
            </div>

            {/* Auction detail modal */}
            <Modal isOpen={!!selectedAuction} onClose={() => !isSubmitting && setSelectedAuction(null)} title="Validar Comprobante de Pago" maxWidth="max-w-2xl">
                {selectedAuction && (() => {
                    const wb: any = selectedAuction.awardedBid || selectedAuction.winningBid;
                    const doc: any = wb?.doctor;
                    const docName = doc ? (doc.fullName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'N/A') : 'N/A';
                    const docPhoto = doc?.profileImageUrl || wb?.doctorProfileImageUrl;
                    const docSpecialty = (doc?.specialties?.map((s: any) => s.name || s.code).filter(Boolean).join(', ')) || (selectedAuction as any).specialty?.name || null;
                    const docLicense = doc?.licenseNumber || doc?.medicalLicenseNumber;
                    const clinic: any = wb?.clinic;
                    const clinicName = clinic?.name || wb?.clinicName || null;
                    const clinicLogo = clinic?.logoUrl || wb?.clinicLogoUrl;
                    const amount = wb?.bidAmount ?? 0;
                    const company: any = selectedAuction.insuranceCompany || (selectedAuction as any).owner;
                    const companyName = company?.name || company?.commercialName || 'N/A';
                    const companyLogo = company?.logoUrl;
                    const methodNames: Record<string, string> = { BS_BANK_TRANSFER: 'Transferencia Bs.', BS_PAGO_MOVIL: 'Pago Móvil', USD_WIRE_SWIFT: 'Wire / SWIFT (USD)', USD_ACH: 'ACH (USD)', USD_IBAN: 'IBAN (USD)', BINANCE_PAY: 'Binance Pay', CRYPTO_WALLET: 'Cripto' };
                    const method = (selectedAuction as any).methodType;
                    const methodLabel = method ? (methodNames[method] || method) : 'No especificado';
                    const modality = wb?.modality;
                    const surgeryRaw = (selectedAuction as any).estimatedSurgeryDate;
                    const surgeryDate = surgeryRaw ? (() => { const p = String(surgeryRaw).split('T')[0].split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(surgeryRaw); })() : null;

                    return (
                        <div className="space-y-5">
                            {/* Adjudicado a — médico + clínica */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise mb-3">Adjudicado a</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                            {docPhoto ? <img src={docPhoto} alt="" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-white/40" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Médico</p>
                                            <p className="font-black truncate">{docName}</p>
                                            {docSpecialty && <p className="text-[11px] text-alteha-turquoise font-bold truncate">{docSpecialty}</p>}
                                            {docLicense && <p className="text-[10px] text-slate-400">MPPS: {docLicense}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden flex items-center justify-center shrink-0 p-1.5">
                                            {clinicLogo ? <img src={clinicLogo} alt="" className="max-w-full max-h-full object-contain" /> : <Building2 className="w-7 h-7 text-slate-300" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clínica que interviene</p>
                                            <p className="font-black truncate">{clinicName || 'No especificada'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subasta + Aseguradora | Pago declarado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2.5">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-slate-400" /> Subasta</h4>
                                    <div className="space-y-1.5 text-sm">
                                        <p className="text-slate-600"><span className="font-semibold text-slate-900">N°:</span> {selectedAuction.auctionNumber}</p>
                                        <p className="text-slate-600"><span className="font-semibold text-slate-900">Título:</span> {selectedAuction.title}</p>
                                        {docSpecialty && <p className="text-slate-600"><span className="font-semibold text-slate-900">Especialidad:</span> {docSpecialty}</p>}
                                        {surgeryDate && <p className="text-slate-600"><span className="font-semibold text-slate-900">Fecha procedimiento:</span> {surgeryDate}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200">
                                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                                            {companyLogo ? <img src={companyLogo} alt="" className="max-w-full max-h-full object-contain" /> : <ShieldCheck className="w-4 h-4 text-slate-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Aseguradora / Fondo</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">{companyName}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 space-y-2.5">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4 text-amber-500" /> Pago declarado</h4>
                                    <div className="space-y-1.5 text-sm">
                                        <p className="text-slate-600"><span className="font-semibold text-slate-900">Método:</span> {methodLabel}</p>
                                        {modality && <p className="text-slate-600"><span className="font-semibold text-slate-900">Modalidad:</span> {modality === 'SOLO_MEDICO' ? 'Solo médico' : 'Paquete completo'}</p>}
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto declarado</p>
                                        <p className="font-black text-slate-900 text-3xl">${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 mb-3 text-sm">Comprobante Adjunto</h4>
                                {isLoadingAttachments ? (
                                    <div className="p-4 bg-slate-50 rounded-xl border flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                        <span className="text-sm text-slate-500 font-medium">Buscando comprobantes...</span>
                                    </div>
                                ) : attachments.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {attachments.map(att => (
                                            <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0"><Search className="w-4 h-4 text-alteha-violet" /></div>
                                                    <div><p className="text-sm font-bold text-slate-900 truncate">{att.fileName}</p><p className="text-xs text-slate-400">{new Date(att.uploadedAt).toLocaleString()}</p></div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-alteha-violet transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <p className="text-sm text-slate-400 font-medium">No se encontró archivo adjunto.</p>
                                    </div>
                                )}
                            </div>

                            {selectedAuction.status === 'PAID' ? (
                                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                                    <h4 className="font-black text-emerald-800 mb-2 flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4" /> Pago Aprobado</h4>
                                    <p className="text-sm font-medium text-emerald-700 leading-relaxed">La intervención puede llevarse a cabo en la fecha pautada. Una vez realizada, el médico debe adjuntar el finiquito para liquidar los fondos.</p>
                                    <div className="mt-4 flex justify-end"><Button className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl" onClick={() => setSelectedAuction(null)}>Entendido</Button></div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Notas (Opcional)</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Transferencia recibida correctamente..." className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-amber-400 rounded-xl px-4 py-3 outline-none transition-all resize-none h-20 text-sm" />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" className="w-1/2 py-4 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleValidation(false)} disabled={isSubmitting}>
                                            <X className="w-4 h-4 mr-2" /> Rechazar
                                        </Button>
                                        <Button className="w-1/2 py-4 bg-emerald-500 hover:bg-emerald-600 border-none" onClick={() => handleValidation(true)} disabled={isSubmitting}>
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar Pago
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            {/* Diagnostic error modal */}
            <Modal isOpen={!!diagnosticError} onClose={() => setDiagnosticError(null)} title="Diagnóstico de Error" maxWidth="max-w-2xl">
                {diagnosticError && (
                    <div className="space-y-5">
                        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
                            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-900 mb-1">{diagnosticError.title}</p>
                                <p className="text-xs text-red-700 font-medium">El backend arrojó una excepción durante la transacción.</p>
                            </div>
                        </div>
                        <pre className="bg-slate-950 text-red-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                            <span className="text-white font-bold block">HTTP STATUS: {diagnosticError.status || 500}</span>
                            <span className="text-white font-bold block mb-2">PATH: {diagnosticError.path || 'N/A'}</span>
                            {diagnosticError.detail}
                        </pre>
                        <Button className="w-full bg-slate-900 text-white border-none" onClick={() => setDiagnosticError(null)}>Cerrar</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
