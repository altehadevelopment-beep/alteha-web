"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Package,
    Settings,
    DollarSign,
    Info,
    CheckCircle,
    ChevronRight,
    Search,
    Stethoscope,
    Minus,
    Trash2,
    Layers,
    ImagePlus,
    Calendar,
    AlertCircle,
    Loader2,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
    createMedicalPackage, getMyMedicalPackages, getProcedureTypes, uploadPackageImage,
    getProviderRedemptions, acceptRedemption, rejectRedemption, uploadRedemptionFiniquito,
    updateMyMedicalPackage, toggleMyMedicalPackage, deleteMyMedicalPackage,
    type MedicalPackage, type MedicalPackageItem, type PackageRedemptionItem
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { PACKAGE_CATEGORIES, getPackageCategory } from '@/components/packages/categories';
import { UpgradeModal } from '@/components/plan/UpgradeModal';

export default function PublishPackagePage() {
    const { userProfile } = useAuth();
    const pathname = usePathname();
    // La página se comparte con clínicas: enlaces de regreso según el rol
    const dashboardBase = pathname?.includes('/clinic') ? '/dashboard/clinic' : '/dashboard/specialist';
    const [isCreating, setIsCreating] = useState(false);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [packages, setPackages] = useState<MedicalPackage[]>([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        packageName: '',
        packageCode: '',
        description: '',
        basePrice: 0,
        discountedPrice: 0,
        discountPercentage: 10,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months later
    });

    // Tipo de paquete (clasificación comercial); INTERVENCION exige especialidad → intervención
    const [packageCategory, setPackageCategory] = useState<string | null>(null);
    const selectedCategory = getPackageCategory(packageCategory);
    // Especialidad → tipo de intervención (igual que al crear una subasta)
    const [specialtyId, setSpecialtyId] = useState<number | null>(null);
    const [procedureTypeId, setProcedureTypeId] = useState<number | null>(null);
    const [procedureTypes, setProcedureTypes] = useState<any[]>([]);
    const [loadingProcedures, setLoadingProcedures] = useState(false);
    // Imagen comercial del paquete
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
    // Edición de un paquete ya publicado
    const [editingId, setEditingId] = useState<number | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    // Solicitudes de uso (redenciones) dirigidas a este proveedor
    const [redemptions, setRedemptions] = useState<PackageRedemptionItem[]>([]);
    const [redemptionsLoading, setRedemptionsLoading] = useState(true);
    const [actingId, setActingId] = useState<number | null>(null);

    // Al elegir especialidad, cargar sus tipos de intervención
    useEffect(() => {
        if (!specialtyId) { setProcedureTypes([]); setProcedureTypeId(null); return; }
        let active = true;
        setLoadingProcedures(true);
        getProcedureTypes(0, 2000, specialtyId)
            .then(list => { if (active) setProcedureTypes(list || []); })
            .catch(() => { if (active) setProcedureTypes([]); })
            .finally(() => { if (active) setLoadingProcedures(false); });
        return () => { active = false; };
    }, [specialtyId]);

    // Preseleccionar la primera especialidad del médico
    useEffect(() => {
        const first = userProfile?.specialties?.[0]?.id;
        if (first && !specialtyId) setSpecialtyId(Number(first));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.specialties]);

    const loadRedemptions = async () => {
        try {
            setRedemptionsLoading(true);
            setRedemptions(await getProviderRedemptions());
        } catch { setRedemptions([]); }
        finally { setRedemptionsLoading(false); }
    };
    useEffect(() => { loadRedemptions(); }, []);

    const handleAccept = async (id: number) => {
        setActingId(id);
        try { await acceptRedemption(id); await loadRedemptions(); } finally { setActingId(null); }
    };
    const handleReject = async (id: number) => {
        const reason = prompt('Motivo del rechazo (se le mostrará al seguro):') || '';
        setActingId(id);
        try { await rejectRedemption(id, reason); await loadRedemptions(); } finally { setActingId(null); }
    };
    const handleFiniquito = async (id: number, file: File) => {
        setActingId(id);
        try {
            const res = await uploadRedemptionFiniquito(id, file);
            if (res?.code === 'ERROR') alert(res.message || 'No se pudo subir el finiquito');
            await loadRedemptions();
        } finally { setActingId(null); }
    };

    const [items, setItems] = useState<MedicalPackageItem[]>([
        { itemName: 'Consulta Especialista', description: 'Evaluación médica inicial', quantity: 1, unitPrice: 50 },
    ]);

    // Cargar un paquete publicado en el asistente para editarlo
    const startEdit = (pkg: MedicalPackage) => {
        setEditingId(pkg.id!);
        setFormData({
            packageName: pkg.packageName || '',
            packageCode: pkg.packageCode || '',
            description: pkg.description || '',
            basePrice: pkg.basePrice || 0,
            discountedPrice: pkg.discountedPrice || 0,
            discountPercentage: pkg.basePrice ? Math.round((1 - (pkg.discountedPrice || pkg.basePrice) / pkg.basePrice) * 100) : 0,
            validFrom: pkg.validFrom || new Date().toISOString().split('T')[0],
            validUntil: pkg.validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setItems(pkg.packageItems?.length ? pkg.packageItems.map(i => ({ itemName: i.itemName, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })) : [{ itemName: '', description: '', quantity: 1, unitPrice: 0 }]);
        setPackageCategory((pkg as any).packageCategory || null);
        setSpecialtyId(pkg.specialty?.id ? Number(pkg.specialty.id) : null);
        setProcedureTypeId(pkg.procedureType?.id ? Number(pkg.procedureType.id) : null);
        setImageFile(null);
        setImagePreview(pkg.imageUrl || null);
        setExistingImageUrl(pkg.imageUrl || null);
        setCreateError(null);
        setStep(1);
        setIsCreating(true);
    };

    const handleToggle = async (pkg: MedicalPackage) => {
        setTogglingId(pkg.id!);
        try {
            const res = await toggleMyMedicalPackage(pkg.id!);
            if (res?.message && !('isActive' in res)) alert(res.message);
            await fetchPackages();
        } finally { setTogglingId(null); }
    };

    const handleDelete = async (pkg: MedicalPackage) => {
        if (!confirm(`¿Eliminar el paquete "${pkg.packageName}"? Esta acción no se puede deshacer.`)) return;
        setTogglingId(pkg.id!);
        try {
            const res = await deleteMyMedicalPackage(pkg.id!);
            if (res?.deleted) await fetchPackages();
            else alert(res?.message || 'No se pudo eliminar el paquete.');
        } finally { setTogglingId(null); }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            setIsLoadingPackages(true);
            const response = await getMyMedicalPackages();
            if (response.code === '00' && Array.isArray(response.data)) {
                setPackages(response.data);
            } else if (Array.isArray(response)) {
                setPackages(response as any);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setIsLoadingPackages(false);
        }
    };

    const handleCreatePackage = async () => {
        if (!packageCategory) {
            setCreateError('Selecciona el tipo de paquete que vas a comercializar.');
            setStep(1);
            return;
        }
        if (selectedCategory?.requiresProcedure && !procedureTypeId) {
            setCreateError('Los paquetes de intervención deben asociarse a un tipo de intervención (como en las subastas).');
            setStep(1);
            return;
        }
        try {
            setIsLoading(true);
            setCreateError(null);
            // Subir la imagen comercial (si el médico eligió una) antes de crear el paquete
            let imageUrl: string | null = null;
            if (imageFile) {
                try {
                    const up = await uploadPackageImage(imageFile);
                    imageUrl = up?.imageUrl || null;
                } catch { /* el paquete se crea igual sin imagen */ }
            }
            const payload = {
                ...formData,
                basePrice: totalAmount,
                 discountedPrice: discountedAmount,
                specialty: specialtyId ? { id: specialtyId } : undefined,
                procedureType: procedureTypeId ? { id: procedureTypeId } : undefined,
                packageCategory,
                imageUrl,
                packageItems: items
            };
            if (!imageUrl && existingImageUrl) imageUrl = existingImageUrl; // conservar imagen previa al editar
            (payload as any).imageUrl = imageUrl;
            const response = editingId
                ? await updateMyMedicalPackage(editingId, payload as any)
                : await createMedicalPackage(payload as any);
            // Handle both wrapped and unwrapped responses
            const success = (response as any).id || (response as any).code === '00';
            if (success) {
                setIsCreating(false);
                setEditingId(null);
                setExistingImageUrl(null);
                setStep(1);
                fetchPackages();
            } else {
                const msg = (response as any)?.message || 'No se pudo crear el paquete.';
                if (msg.includes('PLAN_LIMIT')) setUpgradeMsg(msg);
                else setCreateError(msg);
            }
        } catch (error) {
            console.error('Error creating package:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateItem = (index: number, field: keyof MedicalPackageItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setItems([...items, { itemName: 'Nuevo Ítem', description: '', quantity: 1, unitPrice: 0 }]);
    };

    const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const discountedAmount = formData.discountedPrice || totalAmount * (1 - formData.discountPercentage / 100);

    if (!isCreating) {
        return (
            <div className="space-y-10 font-outfit max-w-6xl mx-auto pb-20">
                {upgradeMsg && <UpgradeModal message={upgradeMsg} onClose={() => setUpgradeMsg(null)} />}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href={dashboardBase} className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                            <ArrowLeft className="w-5 h-5" />
                            <span>Dashboard</span>
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Paquetes de Salud</h1>
                        <p className="text-slate-500 font-medium">Gestiona tus ofertas y servicios destacados</p>
                    </div>
                    <Button 
                        onClick={() => setIsCreating(true)}
                        className="bg-alteha-turquoise text-slate-900 px-8 py-4 rounded-2xl font-black shadow-lg shadow-alteha-turquoise/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Nuevo Paquete
                    </Button>
                </header>

                {isLoadingPackages ? (
                    <div className="py-20 flex flex-col items-center gap-4 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <Loader2 className="w-10 h-10 text-alteha-turquoise animate-spin" />
                        <p className="text-slate-400 font-bold">Cargando tus paquetes...</p>
                    </div>
                ) : packages.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 px-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Package className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No tienes paquetes publicados</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                            Publica paquetes de servicios para atraer a más aseguradoras y pacientes con ofertas integrales.
                        </p>
                        <Button 
                            onClick={() => setIsCreating(true)}
                            className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-slate-800 transition-all"
                        >
                            Comenzar ahora
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map((pkg) => (
                            <motion.div 
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col h-full"
                            >
                                {pkg.imageUrl && (
                                    <img src={pkg.imageUrl} alt={pkg.packageName} className="w-full h-36 object-cover" />
                                )}
                                <div className="p-8 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-alteha-turquoise/10 text-alteha-turquoise rounded-2xl">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${pkg.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {pkg.isActive !== false ? 'Activo' : 'Deshabilitado'}
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-alteha-turquoise transition-colors">{pkg.packageName}</h3>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {getPackageCategory((pkg as any).packageCategory) && (
                                        <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {getPackageCategory((pkg as any).packageCategory)!.emoji} {getPackageCategory((pkg as any).packageCategory)!.label}
                                        </span>
                                    )}
                                    {pkg.procedureType?.name && (
                                        <span className="px-3 py-1 bg-alteha-violet/10 text-alteha-violet rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {pkg.procedureType.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 flex-1 italic">
                                    &ldquo;{pkg.description}&rdquo;
                                </p>
                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Especial</p>
                                            <p className="text-2xl font-black text-slate-900">${pkg.discountedPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Referencial</p>
                                            <p className="text-sm font-bold text-slate-300 line-through">${pkg.basePrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Válido hasta: {pkg.validUntil ? new Date(pkg.validUntil).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    {/* Acciones del paquete */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            onClick={() => startEdit(pkg)}
                                            className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-alteha-turquoise hover:text-slate-900 transition-all"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => handleToggle(pkg)}
                                            disabled={togglingId === pkg.id}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${pkg.isActive !== false
                                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                        >
                                            {togglingId === pkg.id ? '…' : pkg.isActive !== false ? '⏸ Deshabilitar' : '▶ Habilitar'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pkg)}
                                            disabled={togglingId === pkg.id}
                                            title="Eliminar paquete"
                                            className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 transition-all disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ── Solicitudes de uso: el seguro pide redimir intervenciones de tus paquetes ── */}
                <section className="space-y-5">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Solicitudes de Uso</h2>
                        <p className="text-slate-400 font-medium text-sm">
                            Intervenciones que las aseguradoras quieren redimir de tus paquetes vendidos. Acepta, ejecuta y sube el finiquito para que Alteha te liquide cada una.
                        </p>
                    </div>
                    {redemptionsLoading ? (
                        <div className="py-10 text-center"><Loader2 className="w-6 h-6 text-alteha-turquoise animate-spin mx-auto" /></div>
                    ) : redemptions.length === 0 ? (
                        <div className="py-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
                            <p className="text-slate-400 font-bold text-sm">Sin solicitudes por ahora. Cuando un seguro compre tu paquete y pida usar una intervención, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {redemptions.map(r => {
                                const badge = r.status === 'REQUESTED' ? { t: 'Por aceptar', c: 'bg-amber-50 text-amber-600' }
                                    : r.status === 'ACCEPTED' ? { t: 'Aceptada — sube el finiquito al ejecutar', c: 'bg-blue-50 text-blue-600' }
                                    : r.status === 'COMPLETED' ? { t: 'Finiquito enviado — Alteha liquidará', c: 'bg-violet-50 text-violet-600' }
                                    : r.status === 'SETTLED' ? { t: 'Liquidada ✓', c: 'bg-emerald-50 text-emerald-600' }
                                    : { t: 'Rechazada', c: 'bg-red-50 text-red-500' };
                                return (
                                    <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="min-w-0 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.c}`}>{badge.t}</span>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{r.redemptionNumber}</span>
                                            </div>
                                            <p className="font-black text-slate-800">{r.packageName} {r.procedureTypeName ? `· ${r.procedureTypeName}` : ''}</p>
                                            <p className="text-xs text-slate-500 font-bold">
                                                Paciente: <span className="text-slate-800">{r.patientName || '—'}</span>
                                                {r.insuranceCompanyName ? <> · Seguro: <span className="text-slate-800">{r.insuranceCompanyName}</span></> : null}
                                                {' '}· {new Date(r.createdAt).toLocaleDateString('es-ES')}
                                            </p>
                                            {r.notes && <p className="text-xs text-slate-400 italic">&ldquo;{r.notes}&rdquo;</p>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {r.status === 'REQUESTED' && (
                                                <>
                                                    <Button onClick={() => handleAccept(r.id)} disabled={actingId === r.id}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold px-5 py-2.5 text-sm">
                                                        {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aceptar'}
                                                    </Button>
                                                    <Button onClick={() => handleReject(r.id)} disabled={actingId === r.id}
                                                        className="bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold px-5 py-2.5 text-sm">
                                                        Rechazar
                                                    </Button>
                                                </>
                                            )}
                                            {r.status === 'ACCEPTED' && (
                                                <label className="relative cursor-pointer">
                                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFiniquito(r.id, f); }} />
                                                    <span className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-xl font-bold px-5 py-2.5 text-sm hover:bg-alteha-turquoise hover:text-slate-900 transition-all">
                                                        {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : '📄 Subir finiquito'}
                                                    </span>
                                                </label>
                                            )}
                                            {r.finiquitoUrl && r.status !== 'ACCEPTED' && (
                                                <a href={r.finiquitoUrl} target="_blank" rel="noopener noreferrer"
                                                   className="text-xs font-black text-alteha-violet hover:underline">Ver finiquito</a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-10 font-outfit max-w-6xl mx-auto pb-20">
                {upgradeMsg && <UpgradeModal message={upgradeMsg} onClose={() => setUpgradeMsg(null)} />}
            {/* Header */}
            <div>
                <button onClick={() => { setIsCreating(false); setEditingId(null); setExistingImageUrl(null); }} className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Regresar a la lista</span>
                </button>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{editingId ? 'Editar Paquete' : 'Configurar Nuevo Paquete'}</h1>
                <p className="text-slate-500 font-medium">Diseña una oferta personalizada para tu comunidad</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Stepper */}
                    <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <StepIndicator num={1} label="Información" active={step === 1} completed={step > 1} />
                        <div className="flex-1 h-px bg-slate-100" />
                        <StepIndicator num={2} label="Configurador" active={step === 2} completed={step > 2} />
                        <div className="flex-1 h-px bg-slate-100" />
                        <StepIndicator num={3} label="Publicar" active={step === 3} completed={step > 3} />
                    </div>

                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10">
                                {/* ── 1º: ¿Qué tipo de paquete vas a comercializar? ── */}
                                <section className="space-y-5">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-alteha-violet/10 rounded-xl flex items-center justify-center text-alteha-violet">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        Tipo de Paquete *
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {PACKAGE_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                    setPackageCategory(cat.id);
                                                    if (!cat.requiresProcedure) setProcedureTypeId(null);
                                                    setCreateError(null);
                                                }}
                                                className={`p-4 rounded-2xl border-2 text-center transition-all hover:shadow-md ${packageCategory === cat.id
                                                    ? 'border-alteha-violet bg-alteha-violet/5 shadow-md'
                                                    : 'border-slate-100 bg-white'}`}
                                            >
                                                <div className="text-2xl mb-1">{cat.emoji}</div>
                                                <div className={`text-[11px] font-black uppercase tracking-wide leading-tight ${packageCategory === cat.id ? 'text-alteha-violet' : 'text-slate-500'}`}>
                                                    {cat.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedCategory && (
                                        <div className="bg-alteha-violet/5 border border-alteha-violet/15 rounded-2xl px-5 py-4 flex gap-3">
                                            <Info className="w-5 h-5 text-alteha-violet shrink-0 mt-0.5" />
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                <strong className="text-slate-900">{selectedCategory.emoji} {selectedCategory.label}:</strong> {selectedCategory.description}
                                            </p>
                                        </div>
                                    )}
                                </section>

                                <section className="space-y-6 pt-6 border-t border-slate-50">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-alteha-turquoise/10 rounded-xl flex items-center justify-center text-alteha-turquoise">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        Detalles Generales
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <Input 
                                            label="Nombre del Paquete" 
                                            placeholder="Ej: Chequeo Cardiovascular Integral" 
                                            value={formData.packageName}
                                            onChange={(e) => setFormData({...formData, packageName: e.target.value})}
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <Input
                                                label="Código Interno"
                                                placeholder="Ej: CARD-2026"
                                                value={formData.packageCode}
                                                onChange={(e) => setFormData({...formData, packageCode: e.target.value})}
                                            />
                                            <div className="relative">
                                                {/* Etiqueta interna para alinear con el Input de Código (min-h 60px, label flotante) */}
                                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10 pointer-events-none">Especialidad</label>
                                                <select
                                                    value={specialtyId ?? ''}
                                                    onChange={e => setSpecialtyId(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full min-h-[60px] pt-5 pb-1.5 px-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-alteha-turquoise transition-colors appearance-none"
                                                >
                                                    <option value="">Selecciona...</option>
                                                    {(userProfile?.specialties || []).map((s: any) => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                        {/* Tipo de intervención: solo para paquetes de INTERVENCION (como en las subastas) */}
                                        {selectedCategory?.requiresProcedure && (
                                        <div>
                                            <div className="relative">
                                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10 pointer-events-none">Tipo de Intervención *</label>
                                                <select
                                                    value={procedureTypeId ?? ''}
                                                    onChange={e => setProcedureTypeId(e.target.value ? Number(e.target.value) : null)}
                                                    disabled={loadingProcedures || !specialtyId}
                                                    className="w-full min-h-[60px] pt-5 pb-1.5 px-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-alteha-turquoise transition-colors appearance-none disabled:opacity-50"
                                                >
                                                    <option value="">{loadingProcedures ? 'Cargando intervenciones...' : !specialtyId ? 'Elige primero la especialidad' : 'Selecciona la intervención...'}</option>
                                                    {procedureTypes.map((p: any) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1.5">El paquete queda asociado a esta intervención: el seguro la redime por paciente.</p>
                                        </div>
                                        )}
                                        {/* Imagen comercial del paquete */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Imagen del paquete (se muestra en el marketplace)</label>
                                            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 hover:border-alteha-turquoise transition-colors">
                                                <input
                                                    type="file" accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0] || null;
                                                        setImageFile(f);
                                                        setImagePreview(f ? URL.createObjectURL(f) : null);
                                                    }}
                                                />
                                                {imagePreview ? (
                                                    <div className="flex items-center gap-4">
                                                        <img src={imagePreview} alt="preview" className="w-24 h-16 object-cover rounded-xl" />
                                                        <span className="text-sm font-bold text-slate-600 truncate">{imageFile?.name}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-slate-400 text-center py-2">📷 Haz clic para subir una imagen atractiva del paquete</p>
                                                )}
                                            </div>
                                        </div>
                                        {createError && (
                                            <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{createError}</p>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descripción de la Oferta</label>
                                            <textarea
                                                className="w-full h-32 bg-slate-50 rounded-2xl p-5 border border-slate-100 outline-none focus:border-alteha-turquoise transition-all font-medium text-slate-600 resize-none"
                                                placeholder="Detalla qué incluye el paquete y sus beneficios principales..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6 pt-6 border-t border-slate-50">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <Calendar className="w-6 h-6 text-alteha-violet" />
                                        Vigencia de la Oferta
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input 
                                            type="date" 
                                            label="Válido Desde" 
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                                        />
                                        <Input 
                                            type="date" 
                                            label="Válido Hasta" 
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                                        />
                                    </div>
                                </section>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!packageCategory || !formData.packageName || !formData.description || (selectedCategory?.requiresProcedure && !procedureTypeId)}
                                    className="bg-slate-900 px-10 py-6 rounded-2xl font-black text-white hover:bg-slate-800 transition-all flex items-center gap-2 group"
                                >
                                    Continuar al Configurador
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <Settings className="w-6 h-6 text-alteha-violet" />
                                        Composición del Paquete
                                    </h3>
                                    <button
                                        onClick={addItem}
                                        className="flex items-center gap-2 px-4 py-2 bg-alteha-violet/10 text-alteha-violet rounded-xl font-bold text-sm hover:scale-105 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Item
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 relative group">
                                            <button 
                                                onClick={() => removeItem(idx)}
                                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Nombre del ítem</label>
                                                    <input
                                                        type="text"
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-alteha-violet transition-all w-full"
                                                        value={item.itemName}
                                                        onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Cant.</label>
                                                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2">
                                                            <button onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="p-2 text-slate-400 hover:text-alteha-turquoise"><Minus className="w-3.5 h-3.5" /></button>
                                                            <span className="font-black flex-1 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateItem(idx, 'quantity', item.quantity + 1)} className="p-2 text-alteha-turquoise"><Plus className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">P. Unitario ($)</label>
                                                        <input
                                                            type="number"
                                                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-alteha-violet transition-all w-full text-right"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Descripción breve (ej. Insumos descartables, habitación...)"
                                                className="bg-white/50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-medium text-slate-500 w-full outline-none italic"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* ── Precio: una sola vez, junto a los ítems que lo calculan ── */}
                                <section className="space-y-5 pt-6 border-t border-slate-50">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <DollarSign className="w-5 h-5 text-emerald-500" />
                                        Precio del Paquete
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Precio Referencial (suma de ítems)</p>
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-500">
                                                ${totalAmount.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Descuento (%)</p>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-700 outline-none focus:border-alteha-turquoise transition-all"
                                                    value={formData.discountPercentage}
                                                    onChange={(e) => {
                                                        const pct = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                        setFormData({
                                                            ...formData,
                                                            discountPercentage: pct,
                                                            discountedPrice: totalAmount * (1 - pct / 100)
                                                        });
                                                    }}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Precio Final de Oferta ($)</p>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-alteha-turquoise/5 border border-alteha-turquoise/10 rounded-2xl p-4 pl-8 font-black text-alteha-turquoise outline-none focus:border-alteha-turquoise transition-all"
                                                    value={Math.round(discountedAmount)}
                                                    onChange={(e) => {
                                                        const price = parseFloat(e.target.value) || 0;
                                                        setFormData({
                                                            ...formData,
                                                            discountedPrice: price,
                                                            discountPercentage: totalAmount > 0 ? Math.round((1 - price / totalAmount) * 100) : 0
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={() => setStep(1)} className="px-10 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                    Atrás
                                </button>
                                <Button 
                                    onClick={() => {
                                        setFormData({...formData, basePrice: totalAmount, discountedPrice: discountedAmount});
                                        setStep(3);
                                    }} 
                                    className="bg-slate-900 px-10 py-4 rounded-2xl font-black text-white hover:bg-slate-800 transition-all"
                                >
                                    Revisar Oferta Final
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-alteha-turquoise to-alteha-violet" />
                                
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-slate-900">¿Todo listo para publicar?</h3>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                        Una vez publicado, el paquete estará disponible para que aseguradoras y clínicas lo incluyan en sus presupuestos de subastas.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Total</p>
                                        <p className="text-2xl font-black text-slate-400 line-through">${totalAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 bg-alteha-turquoise/10 rounded-[2rem] border border-alteha-turquoise/20">
                                        <p className="text-[10px] text-alteha-turquoise font-black uppercase tracking-widest mb-1">Oferta Alteha</p>
                                        <p className="text-2xl font-black text-alteha-turquoise">${discountedAmount.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <Button 
                                        onClick={handleCreatePackage}
                                        disabled={isLoading}
                                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Confirmar y Publicar</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </Button>
                                    <button 
                                        onClick={() => setStep(2)}
                                        className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                                    >
                                        Hacer un último ajuste
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Summary Sidebar Selection */}
                <div className="hidden lg:block">
                    <div className="sticky top-10 space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
                            <h4 className="font-black text-lg mb-6 flex items-center gap-2 text-alteha-turquoise">
                                <Layers className="w-5 h-5" />
                                Composición
                            </h4>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-alteha-turquoise/20 flex items-center justify-center text-[11px] font-black text-alteha-turquoise">{item.quantity}x</span>
                                            <span className="text-sm font-bold truncate max-w-[120px]">{item.itemName}</span>
                                        </div>
                                        <span className="text-sm font-black text-white/50">${(item.quantity * item.unitPrice).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 mt-6 border-t border-white/10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Base</span>
                                    <span className="text-lg font-bold text-white/60 line-through">${totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-alteha-turquoise uppercase tracking-widest">Oferta</span>
                                    <span className="text-3xl font-black text-alteha-turquoise">${discountedAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                <span className="font-black text-slate-900 block mb-0.5">Tip de Pro:</span>
                                Los paquetes con descuentos del <span className="font-bold text-alteha-violet">10-15%</span> tienen mayor prioridad de selección por aseguradoras.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ num, label, active, completed }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[1.2rem] flex items-center justify-center font-bold text-sm transition-all duration-300 ${active ? 'bg-alteha-violet text-white shadow-xl shadow-alteha-violet/20 scale-110' :
                    completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                {completed ? <CheckCircle className="w-5 h-5" /> : num}
            </div>
            <span className={`text-sm font-black tracking-tight hidden xl:block ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}
