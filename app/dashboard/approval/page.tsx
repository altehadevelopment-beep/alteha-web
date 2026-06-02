"use client";

import React from 'react';
import { 
    LayoutDashboard, 
    Activity,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Search,
    Loader2,
    X,
    Banknote,
    Upload,
    DollarSign,
    FileCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAllAuctions, validateAuctionPayment, getAuctionAttachments, getStoredToken, registerSettlement, type Auction, type AuctionAttachment, type SettlementPayload } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function ApprovalDashboardPage() {
    const [activeTab, setActiveTab] = useState<'validation' | 'settlement'>('validation');
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [completedAuctions, setCompletedAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
    const [settlementAuction, setSettlementAuction] = useState<Auction | null>(null);
    const [attachments, setAttachments] = useState<AuctionAttachment[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, completed: 0 });
    // Settlement form state
    const [settlementForm, setSettlementForm] = useState<Partial<SettlementPayload>>({
        recipientRole: 'DOCTOR',
        paymentMethodType: 'BS_BANK_TRANSFER',
        amount: 0,
        referenceNumber: '',
        notes: ''
    });
    const [settlementProof, setSettlementProof] = useState<File | null>(null);
    const [isRegisteringSettlement, setIsRegisteringSettlement] = useState(false);
    const [settlementSuccess, setSettlementSuccess] = useState(false);
    const [settlementError, setSettlementError] = useState<string | null>(null);
    const [diagnosticError, setDiagnosticError] = useState<{
        title: string;
        detail: string;
        status?: number;
        path?: string;
        isBackendCrash?: boolean;
        debugCurl?: string;
    } | null>(null);

    useEffect(() => {
        if (!selectedAuction) {
            setAttachments([]);
            return;
        }

        const fetchDetails = async () => {
            setIsLoadingAttachments(true);
            try {
                // 1. Intentar obtener adjuntos (puede fallar si el backend bloquea al ADMIN)
                try {
                    const attachResult = await getAuctionAttachments(selectedAuction.auctionNumber, 'ADMIN');
                    if (attachResult.code === '00' && attachResult.data) {
                        setAttachments(Array.isArray(attachResult.data) ? attachResult.data : []);
                    }
                } catch (e) {
                    console.warn('Backend access denied for attachments (ADMIN role).', e);
                }

                // 2. Revisar si ya tenemos datos completos del médico/monto
                const currentBid = selectedAuction.awardedBid || selectedAuction.winningBid;
                let hasWinnerDetails = !!(currentBid && currentBid.bidAmount != null && currentBid.doctor);

                // 3. Intentar obtener detalles completos de la subasta
                const { getAuctionDetails, getAuctionBids } = await import('@/lib/api');
                try {
                    const detailsResult = await getAuctionDetails(selectedAuction.auctionNumber, 'ADMIN');
                    if (detailsResult.code === '00' && detailsResult.data) {
                        const fullData = detailsResult.data as any;
                        const newBid = fullData.winningBid || fullData.awardedBid;
                        if (newBid && newBid.bidAmount != null && newBid.doctor) {
                            hasWinnerDetails = true;
                        }
                        setSelectedAuction(prev => {
                            if (!prev) return prev;
                            return { 
                                ...prev, 
                                ...fullData,
                                insuranceCompany: fullData.insuranceCompany || fullData.owner || prev.insuranceCompany
                            };
                        });
                    }
                } catch (e) {
                    console.warn('Backend access denied for auction details (ADMIN role). Falling back to generic endpoints.', e);
                }

                // 4. Si falló el paso 3 o los datos siguen incompletos, usar endpoints genéricos
                if (!hasWinnerDetails && selectedAuction.id) {
                    try {
                        const bidsResult = await getAuctionBids(selectedAuction.id);
                        let bids: any[] = [];
                        if (Array.isArray(bidsResult)) bids = bidsResult;
                        else if (bidsResult.code === '00' && bidsResult.data) bids = bidsResult.data;
                        else if ((bidsResult as any).content) bids = (bidsResult as any).content;

                        const winner = bids.find(b => b.isWinning || b.status === 'WINNING' || b.status === 'AWARDED' || b.status === 'ACCEPTED');
                        if (winner) {
                            setSelectedAuction(prev => {
                                if (!prev) return prev;
                                return { ...prev, awardedBid: winner }; // Usamos awardedBid como propiedad unificada
                            });
                        }
                    } catch (e) {
                        console.error('Error fetching bids fallback', e);
                    }
                }

                // 5. Intentar obtener el nombre de la aseguradora si falta
                const currentIns = selectedAuction.insuranceCompany || (selectedAuction as any).owner;
                if (currentIns?.id && (!currentIns.name && !currentIns.commercialName)) {
                    try {
                        const { getInsuranceCompanyById } = await import('@/lib/api');
                        const insuranceResult = await getInsuranceCompanyById(currentIns.id);
                        if (insuranceResult && (insuranceResult as any).id) {
                            // If it returns the actor profile directly or wrapped in data
                            const insData = insuranceResult.data || insuranceResult;
                            setSelectedAuction(prev => {
                                if (!prev) return prev;
                                return { ...prev, insuranceCompany: insData as any };
                            });
                        }
                    } catch (e) {
                        console.error('Error fetching insurance company fallback', e);
                    }
                }

            } catch (err) {
                console.error('Error general fetching details:', err);
            } finally {
                setIsLoadingAttachments(false);
            }
        };

        fetchDetails();
    }, [selectedAuction?.id, selectedAuction?.auctionNumber]);

    useEffect(() => {
        const fetchAuctions = async () => {
            setIsLoading(true);
            try {
                const result = await getAllAuctions('PAYMENT_VALIDATION,PAID', 0, 50, 'updatedAt,desc');
                if (result.code === '00' && result.data) {
                    const content = (result.data as any).content || result.data;
                    const loadedAuctions = Array.isArray(content) ? content : [];
                    setAuctions(loadedAuctions);
                    setStats(prev => ({
                        ...prev,
                        pending: loadedAuctions.filter((a: any) => a.status === 'PAYMENT_VALIDATION').length,
                        approved: loadedAuctions.filter((a: any) => a.status === 'PAID').length
                    }));
                } else {
                    setError('Error al cargar validaciones pendientes');
                }
            } catch (err) {
                console.error(err);
                setError('Error de conexión');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    // Load COMPLETED auctions for settlement tab
    useEffect(() => {
        if (activeTab !== 'settlement') return;
        const fetchCompleted = async () => {
            setIsLoadingCompleted(true);
            try {
                const result = await getAllAuctions('COMPLETED,PENDING_SETTLEMENT', 0, 50, 'updatedAt,desc');
                if (result.code === '00' && result.data) {
                    const content = (result.data as any).content || result.data;
                    const list = Array.isArray(content) ? content : [];
                    setCompletedAuctions(list);
                    setStats(prev => ({ ...prev, completed: list.length }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingCompleted(false);
            }
        };
        fetchCompleted();
    }, [activeTab]);

    const handleRegisterSettlement = async () => {
        if (!settlementAuction || !settlementProof) return;
        if (!settlementForm.amount || !settlementForm.referenceNumber) {
            setSettlementError('El monto y la referencia son obligatorios.');
            return;
        }
        setIsRegisteringSettlement(true);
        setSettlementError(null);
        try {
            const payload: SettlementPayload = {
                auctionNumber: settlementAuction.auctionNumber,
                recipientRole: settlementForm.recipientRole as any,
                amount: Number(settlementForm.amount),
                paymentMethodType: settlementForm.paymentMethodType!,
                referenceNumber: settlementForm.referenceNumber!,
                notes: settlementForm.notes
            };
            const res = await registerSettlement(payload, settlementProof);
            if (res.code === '00') {
                setSettlementSuccess(true);
                // Update list status locally
                setCompletedAuctions(prev => prev.map(a =>
                    a.auctionNumber === settlementAuction.auctionNumber
                        ? { ...a, status: 'PENDING_SETTLEMENT' }
                        : a
                ));
            } else {
                setSettlementError(res.message || 'Error al registrar la liquidación');
            }
        } catch (err: any) {
            setSettlementError(err.message || 'Error de conexión');
        } finally {
            setIsRegisteringSettlement(false);
        }
    };

    const handleValidation = async (isValid: boolean) => {
        if (!selectedAuction?.auctionNumber) return;
        
        setIsSubmitting(true);
        try {
            const result = await validateAuctionPayment({
                auctionNumber: selectedAuction.auctionNumber,
                isValid,
                notes
            });
            if (result.code === '00') {
                // Eliminar de la lista actual
                setAuctions(prev => prev.filter(a => a.id !== selectedAuction.id));
                // Actualizar contadores
                setStats(prev => ({
                    ...prev,
                    pending: Math.max(0, prev.pending - 1),
                    approved: isValid ? prev.approved + 1 : prev.approved,
                    rejected: !isValid ? prev.rejected + 1 : prev.rejected
                }));
                // Limpiar estado
                setSelectedAuction(null);
                setNotes('');
            } else {
                const detailText = result.detail || result.message || 'Error desconocido';
                const isNpe = detailText.includes('NullPointerException') || detailText.includes('getAuction() is null');
                setDiagnosticError({
                    title: result.title || 'Error Interno del Servidor',
                    detail: detailText,
                    status: result.status || 500,
                    path: result.path || '/api/auctions/validate-payment',
                    isBackendCrash: isNpe || result.status === 500,
                    debugCurl: result.debugCurl
                });
            }
        } catch (err: any) {
            console.error('Error validation:', err);
            setDiagnosticError({
                title: 'Error de Red / Conexión',
                detail: err.message || 'No se pudo establecer conexión con el servidor proxy de Alteha.',
                isBackendCrash: false
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2">
                    Portal de Aprobación
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                    Centro de gestión y validación de operaciones.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('validation')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'validation'
                            ? 'bg-white text-slate-900 shadow-md'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Validación de Pagos
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('settlement')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'settlement'
                            ? 'bg-white text-slate-900 shadow-md'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" /> Liquidaciones
                        {stats.completed > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">{stats.completed}</span>
                        )}
                    </span>
                </button>
            </div>


            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="p-6 bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <Clock className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm">Pendientes</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats.pending}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm">Aprobadas</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats.approved}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                            <AlertCircle className="w-7 h-7 text-red-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm">Rechazadas</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats.rejected}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <Activity className="w-7 h-7 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm">Operaciones Hoy</p>
                            <h3 className="text-3xl font-black text-slate-900">0</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- VALIDATION TAB --- */}
            {activeTab === 'validation' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="p-8 bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[2.5rem]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <LayoutDashboard className="w-6 h-6 text-slate-400" />
                                Tareas Recientes
                            </h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                                    <p className="text-slate-500 font-bold text-sm">Cargando validaciones pendientes...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
                                    <p className="text-red-500 font-bold">{error}</p>
                                </div>
                            ) : auctions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">Todo al día</h3>
                                    <p className="text-slate-500 text-sm max-w-sm">No hay subastas pendientes de validación de pago por el momento.</p>
                                </div>
                            ) : (
                                auctions.map(auction => (
                                    <div key={auction.id} className="bg-slate-50 hover:bg-slate-100 rounded-3xl p-5 md:p-6 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${auction.status === 'PAID' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                                {auction.status === 'PAID' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Activity className="w-6 h-6 text-amber-600" />}
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {auction.auctionNumber}
                                                </span>
                                                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                                    {auction.title}
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-500 mt-1">
                                                    Seguro: <span className="text-slate-700">{auction.insuranceCompany?.name || 'Compañía de Seguros'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {auction.status === 'PAID' ? (
                                            <button 
                                                onClick={() => setSelectedAuction(auction)}
                                                className="w-full md:w-auto px-6 py-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Ver Pago Aprobado
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedAuction(auction)}
                                                className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-600 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                            >
                                                Validar Pago
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Panel */}
                <div className="space-y-6">
                    <div className="p-8 bg-gradient-to-br from-amber-500 to-orange-600 border border-transparent shadow-2xl shadow-amber-500/20 rounded-[2.5rem] text-white">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-white/80" />
                            Turno Actual
                        </h3>
                        <p className="text-white/80 text-sm font-medium leading-relaxed mb-6">
                            Estás visualizando el módulo de aprobación. Todas las acciones realizadas aquí quedarán registradas en tu auditoría.
                        </p>
                        <div className="pt-6 border-t border-white/20">
                            <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">Estado</p>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                <span className="font-bold">Módulo Activo</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            )}

            {/* --- SETTLEMENT TAB --- */}
            {activeTab === 'settlement' && (
                <div className="p-8 bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Banknote className="w-6 h-6 text-emerald-500" />
                            Subastas Completadas — Liquidaciones Pendientes
                        </h2>
                    </div>

                    {isLoadingCompleted ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-bold text-sm">Cargando subastas completadas...</p>
                        </div>
                    ) : completedAuctions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <FileCheck className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Sin liquidaciones pendientes</h3>
                            <p className="text-slate-500 text-sm max-w-sm">No hay subastas en estado COMPLETED o PENDING_SETTLEMENT por el momento.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {completedAuctions.map(auction => {
                                const isPendingSettlement = auction.status === 'PENDING_SETTLEMENT';
                                return (
                                    <div key={auction.id} className="bg-slate-50 rounded-3xl p-5 md:p-6 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                                isPendingSettlement ? 'bg-amber-100' : 'bg-emerald-100'
                                            }`}>
                                                {isPendingSettlement
                                                    ? <Clock className="w-6 h-6 text-amber-600" />
                                                    : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{auction.auctionNumber}</span>
                                                <h3 className="text-base font-bold text-slate-900 leading-tight">{auction.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                        isPendingSettlement
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {isPendingSettlement ? 'PENDIENTE ACEPTACIÓN DEL MÉDICO' : 'COMPLETADA'}
                                                    </span>
                                                    {auction.awardedBid?.bidAmount && (
                                                        <span className="text-xs font-bold text-slate-500">
                                                            ${Number(auction.awardedBid.bidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {isPendingSettlement ? (
                                            <div className="w-full md:w-auto px-6 py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                                                <Clock className="w-4 h-4" />
                                                Esperando Confirmación
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSettlementAuction(auction);
                                                    setSettlementSuccess(false);
                                                    setSettlementError(null);
                                                    setSettlementProof(null);
                                                    setSettlementForm({
                                                        recipientRole: 'DOCTOR',
                                                        paymentMethodType: 'BS_BANK_TRANSFER',
                                                        amount: auction.awardedBid?.bidAmount || 0,
                                                        referenceNumber: '',
                                                        notes: ''
                                                    });
                                                }}
                                                className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                Registrar Liquidación
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}


            <Modal
                isOpen={!!selectedAuction}
                onClose={() => !isSubmitting && setSelectedAuction(null)}
                title="Validar Comprobante de Pago"
                maxWidth="max-w-2xl"
            >
                {selectedAuction && (() => {
                    const doc = selectedAuction.awardedBid?.doctor || selectedAuction.winningBid?.doctor;
                    const docName = doc ? (doc.fullName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'N/A') : 'N/A';
                    const amount = selectedAuction.awardedBid?.bidAmount ?? selectedAuction.winningBid?.bidAmount ?? 0;
                    const company = selectedAuction.insuranceCompany || (selectedAuction as any).owner;
                    const companyName = company?.name || company?.commercialName || 'N/A';
                    
                    return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* General Details */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-400" />
                                    Detalles de la Subasta
                                </h4>
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Subasta:</span> {selectedAuction.auctionNumber}</p>
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Aseguradora:</span> {companyName}</p>
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Médico:</span> {docName}</p>
                                    <p className="text-sm text-slate-600 truncate" title={selectedAuction.title}><span className="font-semibold text-slate-900">Título:</span> {selectedAuction.title}</p>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    Datos del Pago
                                </h4>
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Método:</span> {selectedAuction.methodType || 'No especificado'}</p>
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Monto:</span> <span className="font-black text-slate-900 text-lg">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                                Archivo de Referencia (Comprobante)
                            </h4>
                            {isLoadingAttachments ? (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    <span className="text-sm text-slate-500 font-medium">Buscando comprobantes...</span>
                                </div>
                            ) : attachments.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {attachments.map(att => (
                                        <a 
                                            key={att.id}
                                            href={att.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                                                    <Search className="w-5 h-5 text-alteha-violet" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{att.fileName}</p>
                                                    <p className="text-xs text-slate-500">{new Date(att.uploadedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-alteha-violet group-hover:translate-x-1 transition-all" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <p className="text-sm text-slate-500 font-medium">No se encontró archivo adjunto.</p>
                                </div>
                            )}
                        </div>



                        {selectedAuction.status === 'PAID' ? (
                            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-sm">
                                <h4 className="font-black text-emerald-800 mb-3 flex items-center gap-2 text-base">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Próximos Pasos de la Intervención
                                </h4>
                                <p className="text-sm font-medium text-emerald-700 leading-relaxed">
                                    Ya el pago fue procesado. La intervención se puede llevar a cabo en la fecha pautada. Una vez realizada la intervención, el médico debe adjuntar el finiquito de la misma para poder liquidar los fondos a la clínica y a los especialistas involucrados.
                                </p>
                                <div className="mt-5 flex justify-end">
                                    <Button 
                                        className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                                        onClick={() => setSelectedAuction(null)}
                                    >
                                        Entendido
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Notas (Opcional para aprobar, recomendado para rechazar)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Ej: Transferencia recibida correctamente..."
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-amber-400 rounded-xl px-4 py-3 outline-none transition-all resize-none h-24 text-sm text-slate-900"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full sm:w-1/2 py-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 group"
                                        onClick={() => handleValidation(false)}
                                        disabled={isSubmitting}
                                    >
                                        <>
                                            <X className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                            Rechazar Pago
                                        </>
                                    </Button>
                                    <Button 
                                        className="w-full sm:w-1/2 py-4 bg-emerald-500 hover:bg-emerald-600 border-none group"
                                        onClick={() => handleValidation(true)}
                                        disabled={isSubmitting}
                                    >
                                        <>
                                            <CheckCircle2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                            Aprobar Pago
                                        </>
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                    );
                })()}
            </Modal>

            {/* Settlement Registration Modal */}
            <Modal
                isOpen={!!settlementAuction}
                onClose={() => !isRegisteringSettlement && (setSettlementAuction(null), setSettlementSuccess(false))}
                title="Registrar Pago de Liquidación"
                maxWidth="max-w-2xl"
            >
                {settlementAuction && (
                    <div className="space-y-6">
                        {settlementSuccess ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Liquidación Registrada</h3>
                                <p className="text-slate-500 text-sm">El pago fue registrado exitosamente. El actor recibirá una notificación por correo.</p>
                                <Button onClick={() => { setSettlementAuction(null); setSettlementSuccess(false); }} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                                    Cerrar
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Auction summary */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{settlementAuction.auctionNumber}</p>
                                        <p className="text-sm font-bold text-slate-900">{settlementAuction.title}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Recipient Role */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Destinatario</label>
                                        <select
                                            value={settlementForm.recipientRole}
                                            onChange={e => setSettlementForm(prev => ({ ...prev, recipientRole: e.target.value as any }))}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all"
                                        >
                                            <option value="DOCTOR">Médico (Doctor)</option>
                                            <option value="CLINIC">Clínica</option>
                                            <option value="PHARMACY">Farmacia</option>
                                        </select>
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Método de Pago</label>
                                        <select
                                            value={settlementForm.paymentMethodType}
                                            onChange={e => setSettlementForm(prev => ({ ...prev, paymentMethodType: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all"
                                        >
                                            <option value="BS_PAGO_MOVIL">Pago Móvil (BS)</option>
                                            <option value="BS_BANK_TRANSFER">Transferencia BS</option>
                                            <option value="USD_ACH">ACH / Zelle (USD)</option>
                                            <option value="USD_WIRE_SWIFT">SWIFT (USD)</option>
                                            <option value="USD_IBAN">IBAN (EUR/USD)</option>
                                            <option value="BINANCE_PAY">Binance Pay</option>
                                            <option value="CRYPTO_WALLET">Crypto Wallet</option>
                                        </select>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Monto</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={settlementForm.amount}
                                                onChange={e => setSettlementForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Reference */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Número de Referencia</label>
                                        <input
                                            type="text"
                                            value={settlementForm.referenceNumber}
                                            onChange={e => setSettlementForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all"
                                            placeholder="Ej: REF-998877"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Notas Administrativas (Opcional)</label>
                                    <textarea
                                        value={settlementForm.notes}
                                        onChange={e => setSettlementForm(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all resize-none"
                                        placeholder="Ej: Honorarios médicos liquidados..."
                                    />
                                </div>

                                {/* Proof upload */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Comprobante de Pago</label>
                                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors group">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            onChange={e => setSettlementProof(e.target.files?.[0] || null)}
                                        />
                                        {settlementProof ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{settlementProof.name}</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-emerald-400 transition-colors" />
                                                <p className="text-sm font-bold text-slate-400">Seleccionar comprobante (PDF/IMG)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {settlementError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        {settlementError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="w-1/2" onClick={() => setSettlementAuction(null)} disabled={isRegisteringSettlement}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                                        onClick={handleRegisterSettlement}
                                        disabled={isRegisteringSettlement || !settlementProof}
                                    >
                                        {isRegisteringSettlement ? (
                                            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Registrar Liquidación</span>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>


            <Modal
                isOpen={!!diagnosticError}
                onClose={() => setDiagnosticError(null)}
                title="⚙ Diagnóstico de Error del Backend"
                maxWidth="max-w-2xl"
            >
                {diagnosticError && (
                    <div className="space-y-6">
                        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-red-950 mb-1">
                                    {diagnosticError.title}
                                </h4>
                                <p className="text-xs text-red-700 leading-relaxed font-semibold">
                                    El backend del sistema en QA arrojó una excepción inesperada durante la transacción.
                                </p>
                            </div>
                        </div>

                        {diagnosticError.isBackendCrash && (
                            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                                <h5 className="text-xs font-black uppercase tracking-widest text-amber-800 mb-2">
                                    Causa e Impacto Encontrado
                                </h5>
                                <div className="text-xs text-amber-950 leading-relaxed font-medium">
                                    {diagnosticError.detail.includes('getAuction() is null') || diagnosticError.detail.includes('Auction.getId()') ? (
                                        <p>
                                            <strong>Relación Nula Detectada (NullPointerException):</strong> El backend intentó invocar <code>Auction.getId()</code> en una <code>PaymentOrder</code> que no está vinculada a ninguna subasta activa en la base de datos de QA. Esto suele suceder si el registro de pago es para un paquete directo de clínica/médico o si hay inconsistencias de datos de prueba en Hibernate.
                                        </p>
                                    ) : (
                                        <p>
                                            <strong>Crash del Microservicio (500):</strong> Ocurrió una falla crítica interna en la ejecución del método de Spring Boot. Se recomienda revisar los logs del servidor para depurar el estado de JPA.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Detalles Técnicos del Servidor
                            </h5>
                            <pre className="bg-slate-950 text-red-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                                <span className="text-white font-bold block mb-1">HTTP STATUS: {diagnosticError.status || 500}</span>
                                <span className="text-white font-bold block mb-2">API PATH: {diagnosticError.path || 'N/A'}</span>
                                <span className="block border-t border-slate-800 my-2" />
                                {diagnosticError.detail}
                            </pre>
                        </div>



                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button 
                                variant="outline" 
                                className="w-full sm:w-1/2 py-3.5 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => {
                                    const report = `### 🚨 REPORTE DE DIAGNÓSTICO DE ERROR DE VALIDACIÓN

**Servicio**: alteha-web -> qaback.alteha.com
**Acción**: Validar Pago de Subasta
**Subasta**: ${selectedAuction?.auctionNumber || 'N/A'}
**Endpoint**: ${diagnosticError.path || '/api/auctions/validate-payment'}
**HTTP Status**: ${diagnosticError.status || 500}

**Excepción del Backend**:
\`\`\`
${diagnosticError.detail}
\`\`\`

\`\`\``;
                                    navigator.clipboard.writeText(report);
                                    alert('¡Reporte copiado al portapapeles en formato Markdown!');
                                }}
                            >
                                Copiar Reporte para Desarrollador
                            </Button>
                            <Button 
                                className="w-full sm:w-1/2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white border-none transition-colors"
                                onClick={() => setDiagnosticError(null)}
                            >
                                Entendido / Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
