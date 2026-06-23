"use client";

import React, { useState, useEffect } from 'react';
import {
    Stethoscope, UserCheck, XCircle, Loader2, Mail, Phone,
    FileCheck, MapPin, MessageCircle, Clock, CheckCircle2,
    AlertCircle, ExternalLink, Video, Image as ImageIcon,
    FileText, ChevronLeft, RefreshCw
} from 'lucide-react';
import { getDoctors, searchIdentityCompliance, reviewIdentityCompliance, updateDoctorStatus, getStoredToken } from '@/lib/api';
import { Button } from '@/components/ui/Button';

function inferLocation(phone: string): string {
    if (!phone) return 'Desconocida';
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('58')) return 'Venezuela 🇻🇪';
    if (clean.startsWith('57')) return 'Colombia 🇨🇴';
    if (clean.startsWith('51')) return 'Perú 🇵🇪';
    if (clean.startsWith('52')) return 'México 🇲🇽';
    if (clean.startsWith('54')) return 'Argentina 🇦🇷';
    if (clean.startsWith('56')) return 'Chile 🇨🇱';
    if (clean.startsWith('55')) return 'Brasil 🇧🇷';
    return 'Internacional';
}

function whatsappUrl(phone: string): string {
    const clean = phone?.replace(/\D/g, '') || '';
    return `https://wa.me/${clean}`;
}

export default function DoctorValidationPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [compliance, setCompliance] = useState<any | null>(null);
    const [additionalFiles, setAdditionalFiles] = useState<any[]>([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [notes, setNotes] = useState('');
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');
    const [error, setError] = useState<string | null>(null);

    const fetchDoctors = async () => {
        setIsLoading(true);
        try {
            const result = await getDoctors(0, 200);
            const list: any[] = Array.isArray(result) ? result : (result as any)?.content ?? [];
            // Sort by id descending (newest first)
            const sorted = [...list].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
            setDoctors(sorted);
        } catch (e) {
            console.error('Error fetching doctors', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchDoctors(); }, []);

    useEffect(() => {
        setError(null);
        if (!selected) { setCompliance(null); setAdditionalFiles([]); return; }
        const fetchDetail = async () => {
            setIsLoadingDetail(true);
            try {
                // Fetch compliance record. IMPORTANT: identity_compliance is linked to the
                // ActorAccount (doctor.account.id), NOT the Doctor entity id (selected.id).
                const accountId = selected.account?.id ?? selected.accountId ?? selected.id;
                const cr = await searchIdentityCompliance(`accountId.equals=${accountId}&actorRole.equals=DOCTOR&sort=id,desc`);
                const items: any[] = Array.isArray(cr.data) ? cr.data : (cr.data as any)?.content ?? [];
                setCompliance(items[0] ?? null);

                // Fetch additional files (admin endpoint attempt)
                const token = getStoredToken();
                if (token) {
                    try {
                        const fr = await fetch(`/api/doctor-additional-files?doctorId.equals=${selected.id}`, {
                            headers: { 'X-Alteha-Token': token }
                        });
                        if (fr.ok) {
                            const files = await fr.json();
                            setAdditionalFiles(Array.isArray(files) ? files : (files as any)?.content ?? []);
                        }
                    } catch { /* additional files not available via admin */ }
                }
            } catch (e) {
                console.error('Error fetching doctor detail', e);
            } finally {
                setIsLoadingDetail(false);
            }
        };
        fetchDetail();
    }, [selected]);

    const handleReview = async (approved: boolean) => {
        if (!selected) return;
        setIsReviewing(true);
        setError(null);
        try {
            if (compliance?.id) {
                const reviewRes: any = await reviewIdentityCompliance(compliance.id, approved, notes);
                if (reviewRes?.code && reviewRes.code !== '00') {
                    throw new Error(reviewRes.message || 'No se pudo registrar la revisión de identidad.');
                }
            }
            const statusRes: any = await updateDoctorStatus(selected.id, approved ? 'ACTIVE' : 'SUSPENDED');
            if (statusRes?.code && statusRes.code !== '00') {
                throw new Error(statusRes.message || 'No se pudo actualizar el estado del médico.');
            }
            setDoctors(prev => prev.map(d => d.id === selected.id ? { ...d, status: approved ? 'ACTIVE' : 'SUSPENDED' } : d));
            setSelected(null);
            setNotes('');
        } catch (e: any) {
            console.error('Error reviewing doctor', e);
            setError(e?.message || 'Ocurrió un error al procesar la solicitud. Revisa tu conexión e intenta de nuevo.');
        } finally {
            setIsReviewing(false);
        }
    };

    const pendingDoctors = doctors.filter(d => ['PENDING', 'INVERIFICATION', 'INCOMPLETE'].includes((d.status || '').toUpperCase()));
    const displayList = filter === 'pending' ? pendingDoctors : doctors;

    const statusBadge = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'ACTIVE') return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">ACTIVO</span>;
        if (s === 'SUSPENDED') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black">SUSPENDIDO</span>;
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">{s || 'PENDIENTE'}</span>;
    };

    return (
        <div className="font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">

            {/* Split panel */}
            <div className={`flex gap-6 ${selected ? 'h-[calc(100vh-8rem)]' : ''}`}>

        <div className={`flex flex-col ${selected ? 'hidden lg:flex lg:w-80 xl:w-96 flex-shrink-0' : 'w-full'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Validación de Médicos</h1>
                        <p className="text-slate-400 text-sm font-medium">{pendingDoctors.length} pendiente{pendingDoctors.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={fetchDoctors} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Actualizar">
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Filter */}
                <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
                    <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'pending' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>
                        Pendientes ({pendingDoctors.length})
                    </button>
                    <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>
                        Todos ({doctors.length})
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-alteha-violet animate-spin mb-3" />
                            <p className="text-slate-400 text-sm font-medium">Cargando médicos...</p>
                        </div>
                    ) : displayList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <CheckCircle2 className="w-14 h-14 text-emerald-300 mb-3" />
                            <p className="text-slate-700 font-black">Todo al día</p>
                            <p className="text-slate-400 text-sm mt-1">No hay médicos en esta categoría.</p>
                        </div>
                    ) : displayList.map(doctor => (
                        <button
                            key={doctor.id}
                            onClick={() => setSelected(doctor)}
                            className={`w-full text-left bg-white border rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all duration-200 ${selected?.id === doctor.id ? 'border-alteha-violet shadow-md shadow-alteha-violet/10' : 'border-slate-100'}`}
                        >
                            <div className="relative flex-shrink-0">
                                {doctor.profileImageUrl ? (
                                    <img src={doctor.profileImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-alteha-violet/10 flex items-center justify-center">
                                        <Stethoscope className="w-6 h-6 text-alteha-violet" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm truncate">
                                    {doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Sin nombre'}
                                </p>
                                <p className="text-slate-400 text-xs truncate">{doctor.email || 'Sin email'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {statusBadge(doctor.status)}
                                    <span className="text-slate-300 text-[10px]">ID #{doctor.id}</span>
                                </div>
                            </div>
                            <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Detail panel */}
            {selected && (
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    {/* Back button (mobile) */}
                    <button onClick={() => setSelected(null)} className="lg:hidden flex items-center gap-2 text-slate-500 text-sm font-bold mb-4 hover:text-slate-700">
                        <ChevronLeft className="w-4 h-4" /> Volver al listado
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-5">
                        {/* Header card */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-100/50">
                            <div className="flex flex-col sm:flex-row items-start gap-5">
                                {selected.profileImageUrl ? (
                                    <img src={selected.profileImageUrl} alt="Foto de perfil" className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 shadow-lg" />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-alteha-violet/10 flex items-center justify-center flex-shrink-0">
                                        <Stethoscope className="w-10 h-10 text-alteha-violet" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900">
                                                {selected.fullName || `${selected.firstName || ''} ${selected.lastName || ''}`.trim() || 'Sin nombre'}
                                            </h2>
                                            <p className="text-slate-400 font-medium text-sm">ID #{selected.id}</p>
                                        </div>
                                        {statusBadge(selected.status)}
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail className="w-4 h-4 text-slate-400" /> {selected.email || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Phone className="w-4 h-4 text-slate-400" /> {selected.phone || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            Registro desde: <span className="font-semibold">{inferLocation(selected.phone || '')}</span>
                                        </div>
                                    </div>
                                    {/* WhatsApp button */}
                                    {selected.phone && (
                                        <a
                                            href={whatsappUrl(selected.phone)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-md shadow-[#25D366]/30"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isLoadingDetail ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-7 h-7 text-alteha-violet animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Compliance / Verification */}
                                {compliance ? (
                                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-100/50 space-y-5">
                                        <h3 className="font-black text-slate-900 flex items-center gap-2">
                                            <FileCheck className="w-5 h-5 text-alteha-turquoise" /> Verificación de Identidad
                                        </h3>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                            <div className="bg-slate-50 rounded-2xl p-3">
                                                <p className="text-slate-400 text-xs font-bold mb-0.5">Estado</p>
                                                <p className="font-black text-slate-900">{compliance.complianceStatus || 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-3">
                                                <p className="text-slate-400 text-xs font-bold mb-0.5">Documento</p>
                                                <p className="font-black text-slate-900">{compliance.documentType || 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-3">
                                                <p className="text-slate-400 text-xs font-bold mb-0.5">Coincidencia</p>
                                                <p className="font-black text-slate-900">{compliance.matchPercentage != null ? `${compliance.matchPercentage}%` : 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-3 col-span-2 sm:col-span-3">
                                                <p className="text-slate-400 text-xs font-bold mb-0.5">Fecha de registro</p>
                                                <p className="font-black text-slate-900">
                                                    {compliance.createdAt ? new Date(compliance.createdAt).toLocaleString('es-VE') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Document image */}
                                        {compliance.identityDocumentUrl && (
                                            <div>
                                                <p className="text-slate-500 text-xs font-bold mb-2 flex items-center gap-1.5">
                                                    <ImageIcon className="w-3.5 h-3.5" /> Documento de Identidad
                                                </p>
                                                <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video max-h-64">
                                                    <img
                                                        src={compliance.identityDocumentUrl}
                                                        alt="Documento de identidad"
                                                        className="w-full h-full object-contain"
                                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                    <a
                                                        href={compliance.identityDocumentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow text-slate-600 hover:text-alteha-violet transition-colors"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Liveness video */}
                                        {compliance.verificationVideoUrl && (
                                            <div>
                                                <p className="text-slate-500 text-xs font-bold mb-2 flex items-center gap-1.5">
                                                    <Video className="w-3.5 h-3.5" /> Video de Verificación (Prueba de Vida)
                                                </p>
                                                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-72">
                                                    <video
                                                        src={compliance.verificationVideoUrl}
                                                        controls
                                                        playsInline
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-amber-700 text-sm font-medium flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        Este médico aún no ha completado la verificación de identidad.
                                    </div>
                                )}

                                {/* Additional files */}
                                {additionalFiles.length > 0 && (
                                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-100/50">
                                        <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4">
                                            <FileText className="w-5 h-5 text-alteha-turquoise" /> Documentos Adjuntos ({additionalFiles.length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {additionalFiles.map((file: any) => (
                                                <a
                                                    key={file.id}
                                                    href={file.fileUrl || file.url || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-alteha-violet/30 hover:shadow-sm transition-all"
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-alteha-violet/10 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-4 h-4 text-alteha-violet" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{file.fileName || file.name || 'Archivo'}</p>
                                                        <p className="text-xs text-slate-400">{file.fileType || file.type || ''}</p>
                                                    </div>
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 ml-auto flex-shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Review actions */}
                                {['PENDING', 'INVERIFICATION', 'INCOMPLETE'].includes((selected.status || '').toUpperCase()) && (
                                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-100/50">
                                        <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                                            <UserCheck className="w-5 h-5 text-alteha-violet" /> Decisión de Validación
                                        </h3>
                                        {error && (
                                            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 text-sm font-medium">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                <span>{error}</span>
                                            </div>
                                        )}
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Notas u observaciones (opcional)..."
                                            rows={3}
                                            className="w-full border border-slate-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-alteha-violet/30 mb-4"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleReview(false)}
                                                disabled={isReviewing}
                                                className="flex-1 py-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                Rechazar
                                            </button>
                                            <button
                                                onClick={() => handleReview(true)}
                                                disabled={isReviewing}
                                                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                                Aprobar Médico
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
            </div>{/* end split panel */}
        </div>
    );
}
