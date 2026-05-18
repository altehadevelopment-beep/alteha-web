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
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAllAuctions, validateAuctionPayment, getAuctionAttachments, getStoredToken, type Auction, type AuctionAttachment } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

function DebugCurlPanel() {
    const [open, setOpen] = useState(true);
    const [copied, setCopied] = useState('');

    const sessionToken = getStoredToken() || 'SIN_TOKEN';

    const loginActorAdmin = `curl -X POST 'https://qaback.alteha.com:3232/api/actor-authenticate' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <PEGAR_TOKEN_SISTEMA>' \\
  -d '{"username":"yamealm@gmail.com","password":"Yame2101","role":"ADMIN","rememberMe":true}'`;

    const loginSistema = `curl -X POST 'https://qaback.alteha.com:3232/api/authenticate' \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"admin","password":"admin","rememberMe":true}'`;

    const validateTemplate = `curl -X POST 'https://qaback.alteha.com:3232/api/auctions/validate-payment' \\
  -H 'Authorization: Bearer <PEGAR_TOKEN_SISTEMA>' \\
  -H 'X-Alteha-Token: <PEGAR_TOKEN_ACTOR_ADMIN>' \\
  -H 'Content-Type: application/json' \\
  -d '{"auctionNumber":"AUC-XXXXX","isValid":true,"notes":"nota"}'`;

    const doCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    const blocks = [
        { id: 'sistema', label: '1️⃣  Login Sistema (admin/admin) → Token para Authorization: Bearer', color: 'blue', content: loginSistema },
        { id: 'actor', label: '2️⃣  Login Actor ADMIN → Token para X-Alteha-Token', color: 'emerald', content: loginActorAdmin },
        { id: 'validate', label: '3️⃣  Validate-Payment (reemplazar los 2 tokens)', color: 'violet', content: validateTemplate },
        { id: 'session', label: '4️⃣  Token actual guardado en la web (sesión del actor)', color: 'amber', content: sessionToken },
    ];

    return (
        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 bg-slate-800 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
            >
                <span>🔧 Debug: cURLs de prueba</span>
                <span>{open ? '▲ Ocultar' : '▼ Mostrar'}</span>
            </button>
            {open && (
                <div className="bg-slate-900 divide-y divide-slate-700">
                    {blocks.map(b => (
                        <div key={b.id} className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-${b.color}-400 text-[11px] font-black uppercase tracking-widest`}>{b.label}</span>
                                <button
                                    onClick={() => doCopy(b.content, b.id)}
                                    className={`px-3 py-1.5 bg-${b.color}-700 hover:bg-${b.color}-600 text-white text-[10px] font-bold rounded-lg transition-colors`}
                                >
                                    {copied === b.id ? '✔ Copiado' : 'Copiar'}
                                </button>
                            </div>
                            <pre className={`text-${b.color}-300 text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed bg-slate-800 p-4 rounded-xl`}>
{b.content}
                            </pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ApprovalDashboardPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
    const [attachments, setAttachments] = useState<AuctionAttachment[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [showCurl, setShowCurl] = useState(false);
    const [curlPreview, setCurlPreview] = useState<{ curl: string; isValid: boolean } | null>(null);
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

        const fetchAttachments = async () => {
            setIsLoadingAttachments(true);
            try {
                // Fetch attachments as ADMIN
                const result = await getAuctionAttachments(selectedAuction.auctionNumber, 'ADMIN');
                if (result.code === '00' && result.data) {
                    setAttachments(Array.isArray(result.data) ? result.data : []);
                }
            } catch (err) {
                console.error('Error fetching attachments:', err);
            } finally {
                setIsLoadingAttachments(false);
            }
        };

        fetchAttachments();
    }, [selectedAuction]);

    useEffect(() => {
        const fetchAuctions = async () => {
            setIsLoading(true);
            try {
                const result = await getAllAuctions('PAYMENT_VALIDATION', 0, 50, 'updatedAt,desc');
                if (result.code === '00' && result.data) {
                    const content = (result.data as any).content || result.data;
                    const loadedAuctions = Array.isArray(content) ? content : [];
                    setAuctions(loadedAuctions);
                    setStats(prev => ({ ...prev, pending: loadedAuctions.length }));
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

    const buildCurl = (isValid: boolean) => {
        const token = getStoredToken() || 'TOKEN_NO_DISPONIBLE';
        const payload = JSON.stringify({
            auctionNumber: selectedAuction?.auctionNumber,
            isValid,
            notes
        }, null, 2);
        return `curl -X POST 'https://qaback.alteha.com:3232/api/auctions/validate-payment' \\
  -H 'Authorization: Bearer <PEGAR_TOKEN_SISTEMA_ADMIN>' \\
  -H 'X-Alteha-Token: ${token}' \\
  -H 'Content-Type: application/json' \\
  -d '${payload}'`;
    };

    const handleClickValidation = (isValid: boolean) => {
        const curl = buildCurl(isValid);
        setCurlPreview({ curl, isValid });
    };

    const handleConfirmValidation = async () => {
        if (!curlPreview || !selectedAuction?.auctionNumber) return;
        await handleValidation(curlPreview.isValid);
        setCurlPreview(null);
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

            <DebugCurlPanel />

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

            {/* Main Content Area */}
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
                                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                <Activity className="w-6 h-6 text-amber-600" />
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
                                        
                                        <button 
                                            onClick={() => setSelectedAuction(auction)}
                                            className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-600 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                        >
                                            Validar Pago
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
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

            {/* Validation Modal */}
            <Modal
                isOpen={!!selectedAuction}
                onClose={() => !isSubmitting && setSelectedAuction(null)}
                title="Validar Comprobante de Pago"
                maxWidth="max-w-2xl"
            >
                {selectedAuction && (
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
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Aseguradora:</span> {selectedAuction.insuranceCompany?.name || selectedAuction.insuranceCompany?.commercialName || 'N/A'}</p>
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Médico:</span> {selectedAuction.awardedBid?.doctor ? `${selectedAuction.awardedBid.doctor.firstName} ${selectedAuction.awardedBid.doctor.lastName}` : 'N/A'}</p>
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
                                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Monto:</span> <span className="font-black text-slate-900 text-lg">${selectedAuction.awardedBid?.bidAmount ? selectedAuction.awardedBid.bidAmount.toLocaleString() : '0.00'}</span></p>
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

                        {/* cURL Debug Panel */}
                        <div>
                            <button
                                onClick={() => setShowCurl(v => !v)}
                                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors mb-2"
                            >
                                <span>{showCurl ? '▼' : '▶'}</span> Ver cURL de la petición
                            </button>
                            {showCurl && (() => {
                                const token = getStoredToken() || 'TOKEN_NO_DISPONIBLE';
                                const payload = JSON.stringify({
                                    auctionNumber: selectedAuction?.auctionNumber,
                                    isValid: true,
                                    notes: notes || '(sin notas)'
                                }, null, 2);
                                const curlApprove = `curl -X POST 'https://qaback.alteha.com:3232/api/auctions/validate-payment' \\
  -H 'Authorization: Bearer <PEGAR_TOKEN_SISTEMA_ADMIN>' \\
  -H 'X-Alteha-Token: ${token}' \\
  -H 'Content-Type: application/json' \\
  -d '${payload}'`;
                                return (
                                    <div className="relative">
                                        <pre className="bg-slate-900 text-emerald-400 text-[10px] font-mono p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-700">
                                            {curlApprove}
                                        </pre>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(curlApprove)}
                                            className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-md transition-colors"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>

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

                        {/* cURL Preview (shown after clicking approve/reject) */}
                        {curlPreview && (
                            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                                    <span className={`text-xs font-black uppercase tracking-widest ${curlPreview.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {curlPreview.isValid ? '✔ cURL – Aprobar Pago' : '✖ cURL – Rechazar Pago'}
                                    </span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(curlPreview.curl)}
                                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-md transition-colors"
                                    >
                                        Copiar
                                    </button>
                                </div>
                                <pre className="text-emerald-400 text-[10px] font-mono p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    {curlPreview.curl}
                                </pre>
                                <div className="flex gap-2 px-4 pb-4">
                                    <button
                                        onClick={() => setCurlPreview(null)}
                                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmValidation}
                                        disabled={isSubmitting}
                                        className={`flex-1 py-2 text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2 ${
                                            curlPreview.isValid
                                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                                : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button 
                                variant="outline" 
                                className="w-full sm:w-1/2 py-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 group"
                                onClick={() => handleClickValidation(false)}
                                disabled={isSubmitting}
                            >
                                <>
                                    <X className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    Rechazar Pago
                                </>
                            </Button>
                            <Button 
                                className="w-full sm:w-1/2 py-4 bg-emerald-500 hover:bg-emerald-600 border-none group"
                                onClick={() => handleClickValidation(true)}
                                disabled={isSubmitting}
                            >
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    Aprobar Pago
                                </>
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Diagnostic Error Modal */}
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

                        {diagnosticError.debugCurl && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                                        🚀 Comando cURL Utilizado (con Tokens Reales)
                                    </h5>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(diagnosticError.debugCurl || '');
                                            alert('¡cURL real copiado al portapapeles!');
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors"
                                    >
                                        Copiar cURL
                                    </button>
                                </div>
                                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                                    {diagnosticError.debugCurl}
                                </pre>
                            </div>
                        )}

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

**cURL Completo con Tokens Reales**:
\`\`\`bash
${diagnosticError.debugCurl || 'N/A'}
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
