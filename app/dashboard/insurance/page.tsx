"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Bell,
    ChevronRight,
    Users,
    Calendar,
    TrendingDown,
    Gavel,
    FileText,
    ShieldCheck,
    Star,
    DollarSign,
    Clock,
    ArrowRight,
    Package,
    MapPin,
    Phone,
    Mail
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAuctions, getAllMedicalPackages, getStoredToken, type Auction, type MedicalPackage } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AuctionCard } from '@/components/auctions/AuctionCard';

export default function InsuranceDashboard() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [recentAuctions, setRecentAuctions] = useState<Auction[]>([]);
    const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);
    const [auctionBidCounts, setAuctionBidCounts] = useState<Record<number, number>>({});
    const [medicalPackages, setMedicalPackages] = useState<MedicalPackage[]>([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<MedicalPackage | null>(null);
    const [showProviderProfile, setShowProviderProfile] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Helper to get the most accurate author name
    const getAuthorName = (pkg: any) => {
        if (!pkg) return 'Proveedor Verificado';
        
        // Try Doctor object (Camel & Snake)
        const d = pkg.doctor || {};
        const doctorName = d.fullName || d.full_name || 
            (d.firstName ? `${d.firstName} ${d.lastName || ''}` : null) ||
            (d.first_name ? `${d.first_name} ${d.last_name || ''}` : null);
        if (doctorName && doctorName.trim()) return doctorName;

        // Try Clinic object
        const c = pkg.clinic || {};
        const clinicName = c.commercialName || c.commercial_name || c.name || c.legalName || c.legal_name;
        if (clinicName && clinicName.trim()) return clinicName;

        // Try root level doctor/clinic name fields (BUT NOT package name)
        const rootName = pkg.doctorName || pkg.doctor_name || pkg.clinicName || pkg.clinic_name;
        if (rootName && rootName.trim()) return rootName;
        
        // Try account/user objects
        const a = pkg.account || pkg.user || pkg.author || {};
        const accountName = a.fullName || a.full_name || a.name || 
            (a.firstName ? `${a.firstName} ${a.lastName || ''}` : null);
        if (accountName && accountName.trim()) return accountName;

        return 'Especialista Alteha';
    };

    const displayProfile = userProfile || {
        commercialName: 'Cargando...',
        legalName: 'Cargando...',
        logoUrl: null,
        status: 'PENDING'
    };
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingAuctions(true);
            setIsLoadingPackages(true);
            try {
                // Fetch 5 auctions
                const res = await getMyAuctions(undefined, 0, 5);
                
                // Robust data handling
                let auctions: Auction[] = [];
                if (Array.isArray(res)) auctions = res;
                else if (res.code === '00' && res.data) auctions = Array.isArray(res.data) ? res.data : [res.data];
                else if ((res as any).content) auctions = (res as any).content;

                setRecentAuctions(auctions);
                console.log('[Dashboard] Raw Auctions:', auctions);

                // Fetch real-time bid counts for each auction
                auctions.forEach(async (auction) => {
                    try {
                        const token = localStorage.getItem('id_token');
                        const countRes = await fetch(`/api/bids/count?auctionId=${auction.id}`, {
                            headers: { 'X-Alteha-Token': token || '' }
                        });
                        const countData = await countRes.json();
                        if (typeof countData.count === 'number') {
                            setAuctionBidCounts(prev => ({ ...prev, [auction.id]: countData.count }));
                        }
                    } catch (err) {
                        console.error(`Error fetching count for auction ${auction.id}:`, err);
                    }
                });
                
                // Fetch Medical Packages
                const pkgRes = await getAllMedicalPackages(0, 5);
                console.log('[Dashboard] Raw Packages Response:', pkgRes);
                let pkgs: MedicalPackage[] = [];
                if (Array.isArray(pkgRes)) pkgs = pkgRes;
                else if (pkgRes.code === '00' && pkgRes.data) pkgs = Array.isArray(pkgRes.data) ? pkgRes.data : [pkgRes.data];
                else if ((pkgRes as any).content) pkgs = (pkgRes as any).content;
                
                // Hydrate missing names for packages
                const hydratedPkgs = await Promise.all(pkgs.map(async (pkg) => {
                    const hasDoctorName = pkg.doctor?.fullName || pkg.doctor?.full_name || pkg.doctor?.firstName || pkg.doctorName;
                    const hasClinicName = pkg.clinic?.name || pkg.clinic?.commercialName || pkg.clinicName;
                    
                    // If we have an ID but no name, fetch it
                    if ((pkg.doctor?.id && !hasDoctorName) || (pkg.clinic?.id && !hasClinicName)) {
                        try {
                            const actorType = pkg.doctor?.id ? 'doctors' : 'clinics';
                            const actorId = pkg.doctor?.id || pkg.clinic?.id;
                            const token = localStorage.getItem('id_token');
                            
                            const actorRes = await fetch(`/api/${actorType}/${actorId}`, {
                                headers: { 'X-Alteha-Token': token || '' }
                            });
                            
                            if (actorRes.ok) {
                                let actorData = await actorRes.json();
                                if (actorData.data) actorData = actorData.data;
                                
                                console.log(`[Dashboard] Hydrated ${actorType} ${actorId}:`, actorData);
                                if (pkg.doctor) {
                                    const name = actorData.fullName || actorData.full_name || `${actorData.firstName || actorData.first_name || ''} ${actorData.lastName || actorData.last_name || ''}`.trim();
                                    pkg.doctor.fullName = name;
                                    pkg.doctor.firstName = actorData.firstName || actorData.first_name;
                                    pkg.doctor.lastName = actorData.lastName || actorData.last_name;
                                    pkg.doctor.profileImageUrl = actorData.profileImageUrl || actorData.profile_image_url;
                                    pkg.doctor.rating = actorData.rating;
                                    pkg.doctor.yearsOfExperience = actorData.yearsOfExperience || actorData.years_of_experience;
                                    pkg.doctor.email = actorData.email;
                                    pkg.doctor.mobilePhone = actorData.mobilePhone || actorData.mobile_phone || actorData.phone;
                                } else if (pkg.clinic) {
                                    const name = actorData.commercialName || actorData.commercial_name || actorData.name || actorData.legalName || actorData.legal_name;
                                    pkg.clinic.name = name;
                                    pkg.clinic.commercialName = name;
                                    pkg.clinic.logoUrl = actorData.logoUrl || actorData.logo_url;
                                    pkg.clinic.rating = actorData.rating;
                                    pkg.clinic.cityName = actorData.cityName || actorData.city_name;
                                    pkg.clinic.email = actorData.email;
                                    pkg.clinic.phone = actorData.phone || actorData.emergencyPhone;
                                }
                            } else {
                                const errorText = await actorRes.text();
                                console.warn(`[Dashboard] Hydration failed for ${actorType} ${actorId}:`, actorRes.status, errorText);
                            }
                        } catch (err) {
                            console.error(`[Dashboard] Critical error hydrating ${pkg.doctor?.id || pkg.clinic?.id}:`, err);
                        }
                    }
                    return { ...pkg }; // Return a copy to ensure React detects the change
                }));
                
                setMedicalPackages(hydratedPkgs);
                console.log('[Dashboard] Processed Packages:', hydratedPkgs);
            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setIsLoadingAuctions(false);
                setIsLoadingPackages(false);
            }
        };
        loadData();
    }, []);

    const rating = 5.0; // Default or from profile if available

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLogoPreview(URL.createObjectURL(file));
        setIsUploadingLogo(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No token');

            const insuranceData = {
                commercialName: (userProfile as any)?.commercialName || '',
                legalName: (userProfile as any)?.legalName || '',
                email: (userProfile as any)?.email || '',
                phone: (userProfile as any)?.phone || '',
            };

            const formData = new FormData();
            formData.append('insurance', JSON.stringify(insuranceData));
            formData.append('logo', file);

            const res = await fetch('/api/insurance-companies/profile', {
                method: 'PUT',
                headers: { 'X-Alteha-Token': token },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `HTTP ${res.status}`);
            }
            toast.success('Imagen de perfil actualizada');
        } catch (err: any) {
            toast.error(err.message || 'Error al subir imagen');
            setLogoPreview(null);
        } finally {
            setIsUploadingLogo(false);
        }
    };

    return (
        <div className="space-y-10 font-outfit pb-20">
            {/* Header section with company summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-violet-50/50 p-10 rounded-[3rem] border border-violet-100/50">
                <div className="flex items-center gap-6">
                    <div
                        className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white p-3 flex items-center justify-center cursor-pointer group"
                        onClick={() => logoInputRef.current?.click()}
                        title="Cambiar imagen de perfil"
                    >
                        {logoPreview || displayProfile.logoUrl ? (
                            <img src={logoPreview || displayProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <ShieldCheck className="w-full h-full text-alteha-violet opacity-20" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                            {isUploadingLogo ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <span className="text-white text-xs font-bold text-center px-1">Cambiar foto</span>
                            )}
                        </div>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isLoadingProfile && !userProfile ? 'Cargando...' : (displayProfile.commercialName || displayProfile.legalName)}
                            </h2>
                            <div className="px-3 py-1 bg-alteha-violet text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                {displayProfile.status}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 font-medium">
                            <span className="text-alteha-violet">Aseguradora de Salud</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
                                <span className="text-xs font-medium text-slate-400">(Socio Verificado)</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-alteha-violet transition-all">
                        <Bell className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard/insurance/profile">
                        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-slate-200">
                            Editar Perfil
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Subastas Abiertas" 
                    value={isLoadingAuctions ? '...' : recentAuctions.filter(a => a.status === 'ACTIVE').length.toString()} 
                    icon={Gavel} trend="Activas" color="text-alteha-violet" 
                />
                <StatCard label="Ahorro en Siniestros" value="$128k" icon={TrendingDown} trend="22% vs mes anterior" color="text-emerald-600" />
                <StatCard label="Subastas Draft" value="..." icon={FileText} trend="Pendientes" color="text-blue-600" />
                <StatCard label="Médicos Conectados" value="156" icon={Users} trend="+12 este mes" color="text-amber-600" />
            </div>

            {/* Patients Link */}
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <Users className="w-8 h-8 text-alteha-turquoise" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">Gestión de Pacientes</h3>
                    </div>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Registra nuevos beneficiarios, busca por su documento de identidad y mantén sus perfiles médicos actualizados.
                    </p>
                </div>
                <Link href="/dashboard/insurance/patients">
                    <button className="px-10 py-5 bg-alteha-turquoise text-slate-900 rounded-[1.5rem] font-black hover:scale-105 transition-all shadow-xl shadow-alteha-turquoise/20 flex items-center gap-3 w-full md:w-auto justify-center">
                        Administrar Pacientes
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </Link>
            </motion.div>

            <div className="space-y-12">
                {/* Active Auctions List - Full Width Top */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-slate-900">Subastas en Curso</h3>
                        <Link href="/dashboard/insurance/auctions" className="text-sm font-bold text-alteha-violet hover:underline">Ver todas</Link>
                    </div>

                    <div className="space-y-4">
                        {isLoadingAuctions ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-8 h-8 text-alteha-violet animate-spin" />
                            </div>
                        ) : recentAuctions.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 font-bold">No hay subastas recientes</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-4">
                                    {recentAuctions.map(auction => (
                                        <AuctionItem
                                            key={auction.id}
                                            id={auction.auctionNumber}
                                            title={auction.title}
                                            status={auction.status}
                                            bids={auctionBidCounts[auction.id] !== undefined ? auctionBidCounts[auction.id] : ((auction as any).totalBids || (auction as any).bidCount || 0)}
                                            bestBid={auction.currentLowestBid ? `$${auction.currentLowestBid.toLocaleString()}` : 'N/A'}
                                            timeLeft={new Date(auction.endDate).toLocaleDateString()}
                                            savings="-"
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-center pt-2">
                                    <Link href="/dashboard/insurance/auctions">
                                        <button className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest transition-all">
                                            Ver más subastas
                                        </button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Medical Packages List - Full Width Bottom */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-slate-900">Paquetes Médicos</h3>
                        <Link href="/dashboard/insurance/directory" className="text-sm font-bold text-alteha-turquoise hover:underline">Ver más</Link>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        {isLoadingPackages ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-alteha-violet animate-spin" />
                            </div>
                        ) : medicalPackages.length === 0 ? (
                            <p className="text-center py-10 text-slate-400 font-medium">No hay paquetes disponibles</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {medicalPackages.map((pkg) => (
                                    <PackageMiniItem 
                                        key={pkg.id}
                                        title={pkg.packageName || (pkg as any).name}
                                        price={pkg.discountedPrice || pkg.basePrice || (pkg as any).totalPrice || 0}
                                        doctor={getAuthorName(pkg)}
                                        specialty={pkg.specialty?.name || (pkg as any).specialtyName || 'Medicina'}
                                        description={pkg.description}
                                        image={pkg.doctor?.profileImageUrl || pkg.clinic?.logoUrl}
                                        type={pkg.clinic?.id ? 'CLINIC' : 'DOCTOR'}
                                        onClick={() => setSelectedPackage(pkg)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Savings Summary */}
                <div className="bg-alteha-violet/5 p-8 rounded-[3rem] border border-alteha-violet/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white rounded-2xl text-alteha-violet shadow-sm">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="font-black text-alteha-violet text-lg">Ahorro del Mes</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Vs. precios tradicionales del mercado</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-5xl font-black text-slate-900">$128,450</p>
                        <p className="text-xs text-emerald-500 font-black uppercase tracking-widest mt-1">↑ 22% incremento este mes</p>
                    </div>
                </div>
            </div>

            {/* Medical Package Detail Modal */}
            <Modal
                isOpen={!!selectedPackage}
                onClose={() => setSelectedPackage(null)}
                title="Expediente de Paquete Médico"
                maxWidth="max-w-3xl"
            >
                {selectedPackage && (
                    <div className="space-y-8">
                        {/* Header with Title and Price */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-8">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-slate-900 text-[9px] font-black text-white rounded-md uppercase tracking-widest">
                                            Publicado por: {getAuthorName(selectedPackage)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl font-black text-slate-900 leading-tight">{selectedPackage.packageName || (selectedPackage as any).name}</h3>
                                        <div className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-tighter">
                                            {selectedPackage.packageCode || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-1.5 bg-alteha-turquoise/10 text-alteha-turquoise rounded-full flex items-center gap-2">
                                        <Star className="w-3.5 h-3.5 fill-alteha-turquoise" />
                                        <span className="text-xs font-black uppercase tracking-widest">
                                            {selectedPackage.specialty?.name || (selectedPackage as any).specialtyName || 'Medicina General'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-bold">Válido hasta: {selectedPackage.validUntil ? new Date(selectedPackage.validUntil).toLocaleDateString() : 'Indefinido'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-violet-50 p-6 rounded-3xl border border-violet-100 text-center md:text-right min-w-[200px]">
                                <p className="text-4xl font-black text-alteha-violet">
                                    ${(selectedPackage.discountedPrice || selectedPackage.basePrice || (selectedPackage as any).totalPrice || 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] font-black text-alteha-violet/60 uppercase tracking-widest mt-1">Costo Total del Paquete</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4 text-alteha-violet" />
                                Descripción del Servicio
                            </h4>
                            <p className="text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50">
                                {selectedPackage.description || 'No hay una descripción detallada disponible para este paquete médico.'}
                            </p>
                        </div>

                        {/* Items List */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-4 h-4 text-alteha-violet" />
                                Desglose de Insumos y Honorarios
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedPackage.packageItems && selectedPackage.packageItems.length > 0 ? (
                                    selectedPackage.packageItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-alteha-violet/10 group-hover:text-alteha-violet transition-colors">
                                                    <span className="text-xs font-black">{idx + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{item.itemName || (item as any).name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Cant: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 text-sm">${(item.unitPrice || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <p className="text-slate-400 font-medium italic">No se especificaron ítems detallados</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Extended Provider Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-alteha-violet" />
                                Información del Prestador
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Doctor / Clinic Profile Card */}
                                <div 
                                    onClick={() => setShowProviderProfile(true)}
                                    className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group cursor-pointer hover:ring-4 hover:ring-alteha-turquoise/30 transition-all"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Users className="w-24 h-24 rotate-12" />
                                    </div>
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                {selectedPackage.doctor?.profileImageUrl || selectedPackage.clinic?.logoUrl ? (
                                                    <img 
                                                        src={selectedPackage.doctor?.profileImageUrl || selectedPackage.clinic?.logoUrl} 
                                                        className="w-full h-full object-cover rounded-2xl"
                                                    />
                                                ) : (
                                                    <Users className="w-8 h-8 text-alteha-turquoise" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-alteha-turquoise uppercase tracking-widest">
                                                    {selectedPackage.doctor ? 'Especialista' : 'Centro Clínico'}
                                                </p>
                                                <p className="text-xl font-black leading-tight">
                                                    {getAuthorName(selectedPackage)}
                                                </p>
                                                <p className="text-[10px] font-bold text-alteha-turquoise/60 mt-1 uppercase">Hacer clic para ver perfil completo</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-bold text-white">
                                                    {(selectedPackage.doctor?.rating || selectedPackage.clinic?.rating || 5.0).toFixed(1)}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500">(Verificado)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <FileText className="w-4 h-4" />
                                                <span className="text-xs font-medium">
                                                    {selectedPackage.doctor?.medicalLicenseNumber || selectedPackage.clinic?.identificationNumber || 'ID: Alt-Verificado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Contact Info */}
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm text-alteha-violet">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación de Atención</p>
                                                <p className="text-sm font-bold text-slate-700 mt-0.5">
                                                    {selectedPackage.clinic?.address || selectedPackage.doctor?.address || 'Disponible en Centros Afiliados Alteha'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm text-alteha-violet">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono de Enlace</p>
                                                <p className="text-sm font-bold text-slate-700 mt-0.5">
                                                    {selectedPackage.doctor?.phone || selectedPackage.clinic?.phone || '+58 212-000-0000'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Disponible Ahora</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button className="flex-1 bg-alteha-violet text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                Solicitar este Paquete
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                            <Button 
                                onClick={() => setSelectedPackage(null)}
                                className="px-10 bg-white text-slate-400 border border-slate-200 py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Volver
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* Provider Detailed Profile Modal */}
            <Modal
                isOpen={showProviderProfile}
                onClose={() => setShowProviderProfile(false)}
                title={selectedPackage?.doctor ? 'Perfil del Especialista' : 'Perfil de la Institución'}
                maxWidth="2xl"
            >
                {selectedPackage && (
                    <div className="space-y-8 p-2">
                        {/* Header Profile Section */}
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                            <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                                {selectedPackage.doctor?.profileImageUrl || selectedPackage.clinic?.logoUrl ? (
                                    <img 
                                        src={selectedPackage.doctor?.profileImageUrl || selectedPackage.clinic?.logoUrl} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Users className="w-16 h-16 text-slate-300" />
                                )}
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                        <Badge className="bg-alteha-turquoise/10 text-alteha-turquoise border-alteha-turquoise/20">
                                            {selectedPackage.doctor ? 'Médico Verificado' : 'Centro Afiliado'}
                                        </Badge>
                                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            <span className="text-[10px] font-black text-amber-700">
                                                {(selectedPackage.doctor?.rating || selectedPackage.clinic?.rating || 5.0).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 leading-tight">
                                        {getAuthorName(selectedPackage)}
                                    </h2>
                                    <p className="text-alteha-violet font-black uppercase tracking-widest text-xs mt-1">
                                        {selectedPackage.specialty?.name || (selectedPackage as any).specialtyName || 'Medicina General'}
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin className="w-4 h-4 text-alteha-turquoise" />
                                        <span className="text-xs font-bold">
                                            {selectedPackage.clinic?.cityName || selectedPackage.clinic?.stateProvinceName || 'Caracas, Venezuela'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <ShieldCheck className="w-4 h-4 text-alteha-turquoise" />
                                        <span className="text-xs font-bold">
                                            {selectedPackage.doctor?.medicalLicenseNumber || selectedPackage.clinic?.identificationNumber || 'ID: Verificado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experiencia</p>
                                <p className="text-lg font-black text-slate-900">{selectedPackage.doctor?.yearsOfExperience || 8}+ Años</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reputación</p>
                                <p className="text-lg font-black text-slate-900">{(selectedPackage.doctor?.rating || 5.0).toFixed(1)}/5.0</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center col-span-2 md:col-span-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Telemedicina</p>
                                <p className="text-lg font-black text-slate-900">{selectedPackage.doctor?.availableForTelemedicine ? 'Disponible' : 'Presencial'}</p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-4 h-4 text-alteha-turquoise" />
                                Canales de Contacto
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-alteha-turquoise/30 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-alteha-turquoise/10 flex items-center justify-center text-alteha-turquoise">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{selectedPackage.doctor?.email || selectedPackage.clinic?.email || 'contacto@alteha.com'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-alteha-turquoise/30 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-alteha-turquoise/10 flex items-center justify-center text-alteha-turquoise">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono de Enlace</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{selectedPackage.doctor?.mobilePhone || selectedPackage.doctor?.phone || selectedPackage.clinic?.phone || '+58 212-000-0000'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowProviderProfile(false)}
                                className="rounded-2xl px-8 font-black uppercase text-xs tracking-widest"
                            >
                                Cerrar Perfil
                            </Button>
                            <Button 
                                className="bg-alteha-turquoise hover:bg-alteha-turquoise/90 text-white rounded-2xl px-8 font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-500/20"
                            >
                                Contactar Ahora
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-alteha-violet bg-violet-50 px-2 py-1 rounded-lg uppercase">
                    {trend}
                </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <h4 className="text-3xl font-black text-slate-900 mt-1">{value}</h4>
        </motion.div>
    );
}

function AuctionItem({ id, title, status, bids, bestBid, timeLeft, savings }: any) {
    const isAwarded = status === 'AWARDED';
    return (
        <div className={`group flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-300 ${isAwarded 
            ? 'bg-violet-50/50 border-alteha-violet shadow-lg shadow-violet-500/5' 
            : 'bg-white border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/5'
        }`}>
            <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isAwarded ? 'bg-alteha-violet text-white' : 'bg-violet-50/50 text-alteha-violet'}`}>
                    <Gavel className="w-8 h-8" />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h4 className={`font-bold transition-colors ${isAwarded ? 'text-alteha-violet' : 'text-slate-900 group-hover:text-alteha-violet'}`}>{title}</h4>
                        {isAwarded && (
                            <span className="px-2 py-0.5 bg-alteha-violet text-white text-[8px] font-black uppercase tracking-widest rounded-md">
                                Adjudicada
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isAwarded ? 'text-alteha-violet' : 'text-slate-400'}`}>{status}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-xs font-medium text-slate-400">{bids} ofertas</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-10">
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mejor Puja</p>
                    <p className="text-xl font-black text-slate-900">{bestBid}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Límite</p>
                    <p className="text-sm font-bold text-slate-600">{timeLeft}</p>
                </div>
                <Link href={`/dashboard/insurance/auctions/${id}`}>
                    <ChevronRight className={`w-6 h-6 transition-all ${isAwarded ? 'text-alteha-violet translate-x-1' : 'text-slate-200 group-hover:text-alteha-violet group-hover:translate-x-1'}`} />
                </Link>
            </div>
        </div>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className={className}>
        <Clock className="w-full h-full" />
    </motion.div>
);

function PackageMiniItem({ title, price, doctor, specialty, description, image, type, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className="flex flex-col gap-4 p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-alteha-violet/30 hover:shadow-xl hover:shadow-violet-500/5 transition-all group cursor-pointer h-full"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-alteha-violet/5 flex items-center justify-center text-alteha-violet flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden border border-slate-50">
                    {image ? (
                        <img src={image} className="w-full h-full object-cover" alt={doctor} />
                    ) : (
                        <Package className="w-7 h-7" />
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xl font-black text-slate-900">${price.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${type === 'CLINIC' ? 'bg-alteha-turquoise' : 'bg-alteha-violet'}`} />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {type === 'CLINIC' ? 'Clínica' : 'Médico'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
                <p className="text-lg font-black text-slate-900 leading-tight group-hover:text-alteha-violet transition-colors line-clamp-2 min-h-[3.5rem]">{title}</p>
                <p className="text-xs text-slate-400 line-clamp-2 font-medium italic h-8">
                    {description || 'Consulta los detalles para ver la descripción completa de este servicio médico.'}
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-600 truncate">{doctor}</p>
                        <p className="text-[9px] font-black text-alteha-turquoise uppercase tracking-widest truncate">{specialty}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-alteha-violet transition-colors" />
                </div>
            </div>
        </div>
    );
}
