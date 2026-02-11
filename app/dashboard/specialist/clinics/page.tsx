"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Hospital,
    Phone,
    Mail,
    Star,
    ExternalLink,
    ChevronRight,
    Calendar,
    Clock,
    Award,
    Bed,
    Zap,
    Pill,
    Microscope,
    Dna,
    Ambulance,
    ParkingCircle,
    Accessibility,
    User,
    ShieldCheck,
    Briefcase,
    Globe,
    Activity,
    Stethoscope,
    MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getClinics, type Clinic } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';

export default function SpecialistClinicsPage() {
    const router = useRouter();
    const { userProfile, isLoadingProfile } = useAuth();
    const [allClinics, setAllClinics] = useState<Clinic[]>([]);
    const [isLoadingClinics, setIsLoadingClinics] = useState(true);
    const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);

    useEffect(() => {
        const fetchAllClinics = async () => {
            try {
                const clinics = await getClinics(0, 100);
                setAllClinics(clinics || []);
            } catch (err) {
                console.error("Error fetching clinics:", err);
            } finally {
                setIsLoadingClinics(false);
            }
        };
        fetchAllClinics();
    }, []);

    const preferredClinicIds = userProfile?.preferredClinics?.map((c: any) => c.id) || [];
    const myClinics = allClinics.filter(c => preferredClinicIds.includes(c.id));

    const selectedClinic = myClinics.find(c => c.id === selectedClinicId) || myClinics[0];

    useEffect(() => {
        if (selectedClinic && !selectedClinicId) {
            setSelectedClinicId(selectedClinic.id);
        }
    }, [selectedClinic, selectedClinicId]);

    const FacilityIcon = ({ active, icon: Icon, label }: { active?: boolean, icon: any, label: string }) => (
        <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-transparent opacity-40'}`}>
            <Icon className={`w-4 h-4 ${active ? 'text-alteha-turquoise' : 'text-slate-400'}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
        </div>
    );

    return (
        <div className="space-y-10 font-outfit max-w-7xl mx-auto pb-20 px-4 md:px-0">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link href="/dashboard/specialist" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Directorio Médico Privado</h1>
                    <p className="text-slate-500 font-medium text-lg">Consulta detallada de facultades e infraestructura de tus centros asociados</p>
                </div>
                <Link href="/dashboard/specialist" className="hover:scale-110 transition-transform">
                    <Logo className="w-14 h-14" />
                </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Seleccionar Centro</h3>
                        <div className="space-y-3">
                            {isLoadingProfile || isLoadingClinics ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
                                ))
                            ) : myClinics.length === 0 ? (
                                <p className="text-slate-400 text-sm font-medium">No hay clínicas asociadas.</p>
                            ) : (
                                myClinics.map((clinic) => (
                                    <button
                                        key={clinic.id}
                                        onClick={() => setSelectedClinicId(clinic.id)}
                                        className={`w-full group p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedClinicId === clinic.id
                                                ? 'border-alteha-turquoise bg-alteha-turquoise/5 shadow-md shadow-alteha-turquoise/5'
                                                : 'border-transparent bg-slate-50 hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className={`shrink-0 w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden ${selectedClinicId === clinic.id ? 'ring-2 ring-alteha-turquoise/20' : ''}`}>
                                            {clinic.logoUrl ? (
                                                <img src={clinic.logoUrl} alt={clinic.name} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <Hospital className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black text-sm leading-tight line-clamp-1 ${selectedClinicId === clinic.id ? 'text-slate-900' : 'text-slate-600'}`}>{clinic.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{clinic.category || 'Hospital'}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-alteha-violet to-alteha-violet/80 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <ShieldCheck className="w-10 h-10 mb-4 opacity-80" />
                        <h4 className="font-black text-xl leading-tight mb-2">Seguridad Garantizada</h4>
                        <p className="text-white/70 text-sm font-medium leading-relaxed">Todos los centros en Alteha cumplen con normativas sanitarias vigentes.</p>
                    </div>
                </div>

                {/* Detailed Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {selectedClinic ? (
                            <motion.div
                                key={selectedClinic.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* Top Banner Info */}
                                <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <Hospital className="w-64 h-64" />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-50 border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
                                            {selectedClinic.logoUrl ? (
                                                <img src={selectedClinic.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                                            ) : (
                                                <Hospital className="w-12 h-12 text-slate-200" />
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="px-4 py-1.5 bg-alteha-turquoise/10 text-alteha-turquoise rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {selectedClinic.category || 'Hospital Privado'}
                                                </span>
                                                <span className="px-4 py-1.5 bg-alteha-violet/10 text-alteha-violet rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    Fundado en {selectedClinic.foundedYear || 2026}
                                                </span>
                                            </div>
                                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                                                {selectedClinic.name}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-6 text-slate-500 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-5 h-5 text-alteha-turquoise" />
                                                    <span>{selectedClinic.address || 'Caracas, Venezuela'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                                    <span className="font-black text-slate-900 leading-none">{selectedClinic.rating?.toFixed(1) || '5.0'}</span>
                                                    <span className="text-slate-400 text-sm">({selectedClinic.totalReviews || 0} reseñas)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Grids */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Column 1: Capacity & Infrastructure */}
                                    <div className="space-y-8">
                                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                                <Zap className="w-5 h-5 text-alteha-turquoise" />
                                                <h3 className="font-black text-lg text-slate-900 tracking-tight">Capacidad e Infraestructura</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quirófanos</p>
                                                    <div className="flex items-center gap-3">
                                                        <Activity className="w-5 h-5 text-alteha-turquoise" />
                                                        <p className="text-2xl font-black text-slate-900">{selectedClinic.totalOperatingRooms || 0}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Camas</p>
                                                    <div className="flex items-center gap-3">
                                                        <Bed className="w-5 h-5 text-alteha-violet" />
                                                        <p className="text-2xl font-black text-slate-900">{selectedClinic.bedsCount || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                <FacilityIcon icon={Activity} label="UCI" active={selectedClinic.hasIcu} />
                                                <FacilityIcon icon={Stethoscope} label="Emergencias" active={selectedClinic.hasEmergency} />
                                                <FacilityIcon icon={Pill} label="Farmacia" active={selectedClinic.hasPharmacy} />
                                                <FacilityIcon icon={Microscope} label="Laboratorio" active={selectedClinic.hasLaboratory} />
                                                <FacilityIcon icon={Dna} label="Imagenología" active={selectedClinic.hasImaging} />
                                                <FacilityIcon icon={Ambulance} label="Ambulancia" active={selectedClinic.hasAmbulance} />
                                                <FacilityIcon icon={ParkingCircle} label="Estacionamiento" active={selectedClinic.hasParkingAvailable} />
                                                <FacilityIcon icon={Accessibility} label="Accesible" active={selectedClinic.isWheelchairAccessible} />
                                            </div>
                                        </section>

                                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                                <ShieldCheck className="w-5 h-5 text-alteha-turquoise" />
                                                <h3 className="font-black text-lg text-slate-900 tracking-tight">Credenciales y Horarios</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-slate-100 rounded-xl text-slate-400">
                                                        <Award className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acreditaciones</p>
                                                        <p className="text-sm font-bold text-slate-700">{selectedClinic.accreditations || 'No registradas'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-slate-100 rounded-xl text-slate-400">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario Operativo</p>
                                                        <p className="text-sm font-bold text-slate-700">{selectedClinic.operatingHours || '24/7'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-slate-100 rounded-xl text-slate-400">
                                                        <Globe className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sitio Web</p>
                                                        <a href={selectedClinic.website} target="_blank" className="text-sm font-bold text-alteha-turquoise border-b border-alteha-turquoise/30 hover:border-alteha-turquoise transition-all">
                                                            {selectedClinic.website?.replace('https://', '') || 'N/A'}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Column 2: Legal & Contacts */}
                                    <div className="space-y-8">
                                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 h-fit">
                                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4 text-slate-900">
                                                <Hospital className="w-5 h-5 text-alteha-violet" />
                                                <h3 className="font-black text-lg tracking-tight">Información Legal</h3>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-50 space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Fiscal</p>
                                                        <p className="text-sm font-bold text-slate-700">{selectedClinic.legalName}</p>
                                                    </div>
                                                    <div className="flex gap-10">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedClinic.identificationType || 'RIF'}</p>
                                                            <p className="text-sm font-bold text-slate-700">{selectedClinic.identificationNumber}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Licencia Sanitaria</p>
                                                            <p className="text-sm font-bold text-slate-700">{selectedClinic.healthLicenseNumber || 'En trámite'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    <a href={`tel:${selectedClinic.phone}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-alteha-turquoise transition-all group">
                                                        <div className="flex items-center gap-3">
                                                            <Phone className="w-4 h-4 text-alteha-turquoise" />
                                                            <span className="font-bold text-slate-700 text-sm">Central: {selectedClinic.phone}</span>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-slate-300" />
                                                    </a>
                                                    {selectedClinic.emergencyPhone && (
                                                        <a href={`tel:${selectedClinic.emergencyPhone}`} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl hover:bg-red-50 transition-all group">
                                                            <div className="flex items-center gap-3">
                                                                <Phone className="w-4 h-4 text-red-500" />
                                                                <span className="font-bold text-red-600 text-sm">Emergencias: {selectedClinic.emergencyPhone}</span>
                                                            </div>
                                                            <ExternalLink className="w-4 h-4 text-red-200" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-8 text-white">
                                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                                <User className="w-5 h-5 text-alteha-turquoise" />
                                                <h3 className="font-black text-lg tracking-tight">Contacto Administrativo</h3>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                                        <Briefcase className="w-6 h-6 text-alteha-turquoise" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Enlace Institucional</p>
                                                        <p className="font-black text-lg">{selectedClinic.contactPersonName || 'Dirección Médica'}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <a href={`mailto:${selectedClinic.contactPersonEmail}`} className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors">
                                                        <Mail className="w-4 h-4" />
                                                        <span>{selectedClinic.contactPersonEmail || 'rrhh@clinica.com'}</span>
                                                    </a>
                                                    <a href={`tel:${selectedClinic.contactPersonPhone}`} className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{selectedClinic.contactPersonPhone || '0212-0000000'}</span>
                                                    </a>
                                                </div>
                                                <div className="pt-4">
                                                    <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-sm transition-all border border-white/10">
                                                        Solicitar Credenciales Actualizadas
                                                    </button>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="flex flex-wrap items-center gap-6 px-4 py-2 border-t border-slate-50 mt-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                            <span>Creado: {selectedClinic.createdAt ? new Date(selectedClinic.createdAt).toLocaleDateString() : 'N/A'}</span>
                                            <span>Verificado: {selectedClinic.verifiedAt ? new Date(selectedClinic.verifiedAt).toLocaleDateString() : 'N/A'}</span>
                                            <span>Estado: {selectedClinic.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 text-slate-300">
                                <Hospital className="w-20 h-20 mb-6 opacity-20" />
                                <h3 className="text-xl font-black text-slate-400">Selecciona un centro de la lista</h3>
                                <p className="font-medium text-slate-400/60 max-w-xs text-center mt-2">Para ver todos los detalles técnicos y administrativos de tu centro asociado.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
