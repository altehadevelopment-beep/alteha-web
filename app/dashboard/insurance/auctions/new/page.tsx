"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Gavel,
    User,
    Stethoscope,
    Calendar,
    DollarSign,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Upload,
    MapPin,
    Users,
    Building2,
    Search,
    Filter,
    ArrowLeft,
    Bed,
    Target,
    Zap,
    Clock,
    HelpCircle,
    UserPlus,
    CreditCard,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    publishAuction,
    publishExistingAuction,
    changeAuctionStatus,
    getSpecialties,
    getClinics,
    getDoctors,
    searchPatient,
    type Specialty,
    type AuctionPayload,
    type Patient,
    type Clinic,
    type ActorProfile,
    getProfile,
    getProcedureTypes,
    getProcedureTemplates,
    type ProcedureTemplate,
    type ProcedureType
} from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function NewAuctionPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    // Búsqueda inteligente: sin acentos, por varios términos y sobre varios campos
    // (nombre, razón social, ciudad, estado, dirección; especialidades en médicos)
    const normalize = (v: any) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const smartMatch = (query: string, ...fields: any[]) => {
        const q = normalize(query).trim();
        if (!q) return true;
        const haystack = fields.map(normalize).join(' ');
        return q.split(/\s+/).every(term => haystack.includes(term));
    };
    const [clinicSearch, setClinicSearch] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [prefilledFields, setPrefilledFields] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | React.ReactNode | null>(null);

    // Form State
    const [formData, setFormData] = useState<AuctionPayload>({
        title: '',
        description: '',
        auctionType: 'REVERSE_AUCTION',
        status: 'DRAFT',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxBudget: 0,
        reservePrice: 0,
        urgencyLevel: 'MEDIUM',
        patientAge: 0,
        patientGender: 'FEMENINO',
        medicalHistory: '',
        preferredLocation: 'Caracas, Venezuela',
        requiresHospitalization: true,
        estimatedDurationDays: 1,
        estimatedDuration: 0,
        anesthesiologist: false,
        biopsyRequired: false,
        numberOfAssistants: 0,
        protocol: '',
        subSpecialty: '',
        equipment: '',
        specialRequirements: '',
        termsAndConditions: 'Términos estándar de Alteha...',
        termsAndConditionsAccepted: true,
        showPrice: true,
        durationHours: 240,
        autoExtendMinutes: 60, // fijo: la subasta se auto-extiende 60 min si faltan ofertas al cierre (campo oculto de la UI)
        minBidsRequired: 10,
        estimatedSurgeryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        patient: { id: 0 },
        specialty: { id: 1 },
        currency: { id: 1 },
        procedureType: { id: 1 },
        clinicBudget: 0,
        doctorBudget: 0,
        requiredSupplies: [],
        invitedDoctorIds: [],
        invitedClinicIds: [],
        methodType: 'BS_BANK_TRANSFER',
        allowedPaymentMethods: ['BS_BANK_TRANSFER']
    });

    const [medicalReport, setMedicalReport] = useState<File | null>(null);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [doctors, setDoctors] = useState<ActorProfile[]>([]);
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchDoc, setSearchDoc] = useState('');

    // Procedure Template States
    const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
    const [procedureTemplates, setProcedureTemplates] = useState<ProcedureTemplate[]>([]);
    const [selectedProcedureTypeId, setSelectedProcedureTypeId] = useState<number | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [searchProcedure, setSearchProcedure] = useState('');
    const [showProcedureResults, setShowProcedureResults] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [advSearchSpecialtyId, setAdvSearchSpecialtyId] = useState<number | null>(null);
    const [catalogSpecialties, setCatalogSpecialties] = useState<Specialty[]>([]);
    const [catalogProcedureTypes, setCatalogProcedureTypes] = useState<ProcedureType[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const specs = await getSpecialties();
                setSpecialties(Array.isArray(specs) ? specs : []);
                // La especialidad por defecto {id:1} puede no existir en BD (FK error al publicar):
                // normalizar al primer id real del catálogo si la actual no está en la lista.
                if (Array.isArray(specs) && specs.length > 0) {
                    setFormData(prev => {
                        const exists = specs.some((sp: any) => Number(sp.id) === Number(prev.specialty?.id));
                        return exists ? prev : { ...prev, specialty: { id: Number(specs[0].id) } };
                    });
                }

                const clinicsRes = await getClinics();
                setClinics(Array.isArray(clinicsRes) ? clinicsRes : []);

                const doctorsRes = await getDoctors();
                setDoctors(Array.isArray(doctorsRes) ? doctorsRes : []);

                const profileRes = await getProfile('INSURANCE_COMPANY');
                if (profileRes.code === '00' && profileRes.data) {
                    setFormData(prev => ({
                        ...prev,
                        insuranceCompany: { id: profileRes.data.id }
                    }));
                }

                // Initialize invited IDs if they match specified test actors
                setFormData(prev => ({
                    ...prev,
                    invitedDoctorIds: [1500, 1501],
                    invitedClinicIds: [1500, 1501, 1502]
                }));

                // Load Procedure Types
                const types = await getProcedureTypes();
                setProcedureTypes(Array.isArray(types) ? types : []);
            } catch (err) {
                console.error('Error loading initial data:', err);
            }
        };
        loadInitial();
    }, []);

    const markPrefilled = (fields: string[]) => {
        setPrefilledFields(new Set(fields));
    };

    const handleManualChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setPrefilledFields(prev => {
            const next = new Set(prev);
            next.delete(field);
            return next;
        });
    };

    // Load templates when procedure type changes
    useEffect(() => {
        if (selectedProcedureTypeId) {
            const loadTemplates = async () => {
                setIsLoadingTemplates(true);
                try {
                    const templates = await getProcedureTemplates(selectedProcedureTypeId);
                    setProcedureTemplates(Array.isArray(templates) ? templates : []);
                } catch (err) {
                    console.error('Error loading templates:', err);
                    setProcedureTemplates([]);
                } finally {
                    setIsLoadingTemplates(false);
                }
            };
            loadTemplates();
        } else {
            setProcedureTemplates([]);
        }
    }, [selectedProcedureTypeId]);

    const handleTemplateSelect = (templateId: number) => {
        const template = procedureTemplates.find(t => t.id === templateId);
        if (!template) return;

        setSelectedTemplateId(templateId);
        const prefilledKeys = [
            'procedureType', 'title', 'description', 'doctorBudget', 'clinicBudget', 
            'maxBudget', 'requiresHospitalization', 'estimatedDurationDays', 
            'estimatedDuration', 'anesthesiologist', 'biopsyRequired', 
            'numberOfAssistants', 'protocol', 'subSpecialty', 'equipment', 'specialty'
        ];
        markPrefilled(prefilledKeys);
        
        setFormData(prev => ({
            ...prev,
            procedureType: { id: template.procedureType.id },
            title: template.procedureName,
            description: template.description || '',
            doctorBudget: template.doctorBudget || 0,
            clinicBudget: template.clinicBudget || 0,
            maxBudget: (template.doctorBudget || 0) + (template.clinicBudget || 0),
            requiresHospitalization: template.requiresHospitalization ?? true,
            estimatedDurationDays: template.hospitalizationTime ? Math.ceil(template.hospitalizationTime / 24) : 1,
            estimatedDuration: template.estimatedDuration || 0,
            anesthesiologist: template.anesthesiologist ?? false,
            biopsyRequired: template.biopsyRequired ?? false,
            numberOfAssistants: template.numberOfAssistants || 0,
            protocol: template.protocol || '',
            subSpecialty: template.subSpecialty || '',
            equipment: template.equipment || '',
            specialty: template.specialty ? { id: template.specialty.id } : (template.procedureType?.specialty?.id ? { id: template.procedureType.specialty.id } : prev.specialty)
        }));
    };

    // Load catalog specialties (only those with procedures) when advanced search opens
    useEffect(() => {
        if (!showAdvancedSearch) return;
        if (catalogSpecialties.length > 0) return;
        const load = async () => {
            try {
                const specs = await getSpecialties(0, 50, true);
                setCatalogSpecialties(Array.isArray(specs) ? specs : []);
            } catch {
                setCatalogSpecialties(specialties);
            }
        };
        load();
    }, [showAdvancedSearch]);

    // Load catalog procedure types filtered by specialty (server-side)
    useEffect(() => {
        if (!advSearchSpecialtyId) {
            setCatalogProcedureTypes([]);
            return;
        }
        const load = async () => {
            setIsLoadingCatalog(true);
            try {
                const types = await getProcedureTypes(0, 2000, advSearchSpecialtyId);
                setCatalogProcedureTypes(Array.isArray(types) ? types : []);
            } catch {
                setCatalogProcedureTypes([]);
            } finally {
                setIsLoadingCatalog(false);
            }
        };
        load();
    }, [advSearchSpecialtyId]);

    // Search as you type with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchDoc && searchDoc.length >= 2) {
                handlePatientSearch();
            } else if (!searchDoc) {
                setSelectedPatient(null);
                setSearchResults([]);
                setError(null);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchDoc]);

    // Keep maxBudget updated whenever budgets or supplies change
    useEffect(() => {
        const suppliesSum = formData.requiredSupplies?.reduce((acc, s) => acc + (s.quantity * s.referenceAmount), 0) || 0;
        const total = (formData.doctorBudget || 0) + (formData.clinicBudget || 0) + suppliesSum;
        if (formData.maxBudget !== total) {
            setFormData(prev => ({ ...prev, maxBudget: total }));
        }
    }, [formData.doctorBudget, formData.clinicBudget, formData.requiredSupplies]);

    const handlePatientSearch = async () => {
        if (!searchDoc) return;
        setIsSearching(true);
        setError(null);
        try {
            const cleanDoc = searchDoc.replace(/\D/g, '');
            const result = await searchPatient('CEDULA', cleanDoc);
            
            if (result.code === '00' && result.data) {
                // If the API returns a single object, wrap it in an array
                const data = Array.isArray(result.data) ? result.data : [result.data];
                setSearchResults(data);
            } else {
                setSearchResults([]);
                // Only show error if the user has typed a complete-looking ID but no patient is found
                if (cleanDoc.length >= 8) {
                    setError(
                        <div className="flex flex-col gap-2">
                            <p>No existe un paciente registrado con la cédula <span className="text-slate-900 font-black">{cleanDoc}</span>.</p>
                            <p className="text-xs opacity-80">Sugerimos registrar al nuevo beneficiario para continuar con la subasta.</p>
                            <Link 
                                href="/dashboard/insurance/patients/register" 
                                className="mt-1 bg-alteha-violet text-white px-4 py-2 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all w-fit shadow-lg shadow-violet-100"
                            >
                                <Plus className="w-4 h-4" />
                                Registrar Paciente
                            </Link>
                        </div>
                    );
                }
            }
        } catch (err: any) {
            console.error('Search error:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setSearchResults([]);
        setSearchDoc(`${patient.identificationNumber}`);
        setFormData(prev => ({
            ...prev,
            patient: { id: patient.id },
            patientAge: calculateAge(patient.dateOfBirth),
            patientGender: patient.gender as any
        }));
        // Auto-scroll to history
        setTimeout(() => {
            document.getElementById('medical-history-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    };

    const calculateAge = (dob: string) => {
        if (!dob) return 0;
        const birth = new Date(dob);
        if (isNaN(birth.getTime())) return 0;
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleAction = async (finalStatus: 'DRAFT' | 'PUBLISHED' | 'ACTIVE') => {
        setIsLoading(true);
        setError(null);

        const finalPayload: AuctionPayload = { 
            ...formData, 
            status: finalStatus,
            allowedPaymentMethods: formData.allowedPaymentMethods && formData.allowedPaymentMethods.length > 0 
                ? formData.allowedPaymentMethods 
                : ['BS_BANK_TRANSFER']
        };

        try {
            const result = await publishAuction(finalPayload, medicalReport || undefined);
            const auctionObj = result.data || result;
            
            // The backend returns the raw Auction object on success, so we check for result.id
            if (result.code === '00' || result.code === 'SUCCESS' || auctionObj.id) {
                const auctionIdOrNumber = auctionObj.auctionNumber || auctionObj.id;
                
                if (finalStatus === 'PUBLISHED' || finalStatus === 'ACTIVE') {
                    // First publish it if it was created as DRAFT
                    await publishExistingAuction(auctionIdOrNumber);
                    
                    if (finalStatus === 'ACTIVE') {
                        // Then change status to ACTIVE
                        await changeAuctionStatus(auctionIdOrNumber, 'ACTIVE');
                    }
                }
                
                router.push('/dashboard/insurance/auctions?created=true');
            } else {
                const errorStr = result.message || JSON.stringify(result) || 'Error al procesar subasta';
                setError(`Error: ${errorStr}`);
            }
        } catch (err: any) {
            setError(`Error de conexión con el servidor: ${err.message || ''}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Default to published if somehow triggered by Enter key
        handleAction('PUBLISHED');
    };

    const steps = [
        { id: 1, title: 'Configuración', icon: Stethoscope },
        { id: 2, title: 'Invitados', icon: Users },
        { id: 3, title: 'Publicación', icon: Gavel }
    ];

    // Computed: Filter doctors based on selected clinics
    const filteredDoctors = doctors.filter(doctor => {
        if (!formData.invitedClinicIds || formData.invitedClinicIds.length === 0) return true;
        return doctor.preferredClinics?.some(pc => formData.invitedClinicIds?.includes(pc.id));
    });

    const allClinicsSelected = clinics.length > 0 && clinics.every(c => formData.invitedClinicIds?.includes(c.id));
    const allDoctorsSelected = doctors.length > 0 && doctors.every(d => formData.invitedDoctorIds?.includes(d.id));

    const handleSelectAllClinics = () => {
        if (allClinicsSelected) {
            setFormData({ ...formData, invitedClinicIds: [], invitedDoctorIds: [] });
        } else {
            setFormData({ ...formData, invitedClinicIds: clinics.map(c => c.id) });
        }
    };

    const handleSelectAllDoctors = () => {
        if (allDoctorsSelected) {
            setFormData({ ...formData, invitedDoctorIds: [] });
        } else {
            setFormData({ ...formData, invitedDoctorIds: doctors.map(d => d.id) });
        }
    };

    return (
        <div className="max-w-4xl mx-auto font-outfit pb-20">
            <Link href="/dashboard/insurance/auctions" className="flex items-center gap-2 text-slate-400 hover:text-alteha-violet transition-colors mb-6 font-bold group w-fit">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver a Subastas
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Nueva Subasta</h2>
                        <p className="text-slate-400 font-bold text-xs mt-1">Configura tu convocatoria paso a paso</p>
                    </div>
                    {/* Progress indicator */}
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl backdrop-blur-sm overflow-x-auto max-w-full">
                        {steps.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.id} className="flex items-center">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black transition-all ${step >= s.id ? 'bg-alteha-violet text-white' : 'bg-white/10 text-white/30'}`}>
                                        <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`w-3 md:w-6 h-1 rounded-full mx-1 md:mx-2 ${step > s.id ? 'bg-alteha-violet' : 'bg-white/10'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-5 bg-red-50 border-2 border-red-100 text-red-600 rounded-3xl flex items-start gap-4 font-bold text-sm shadow-sm"
                        >
                            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                            <div className="flex-1 leading-relaxed">
                                {error}
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-8">
                                <div className="space-y-6">
                                    {/* MENSAJE INSTRUCTIVO */}
                                    {!selectedPatient && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-alteha-violet/5 p-6 rounded-[2rem] border-2 border-dashed border-alteha-violet/20 flex items-start gap-4"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-alteha-violet/10 shrink-0">
                                                <AlertCircle className="w-6 h-6 text-alteha-violet" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                                El primer paso para crear la subasta es colocar la <span className="text-alteha-violet font-black underline">cédula del cliente</span>. 
                                                Si el cliente no existe, debe registrarlo previamente en la plataforma para continuar.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* SECCIÓN 1: PACIENTE */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black text-slate-900 border-b pb-3 uppercase tracking-wider italic">1. Información del Paciente</h3>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    {isSearching ? <Loader2 className="h-5 w-5 text-alteha-violet animate-spin" /> : <User className="h-5 w-5 text-slate-400" />}
                                                </div>
                                                <input
                                                    type="text"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-sm text-slate-900 transition-all outline-none shadow-sm"
                                                    placeholder="Escribe la cédula del paciente..."
                                                    value={searchDoc}
                                                    onChange={(e) => {
                                                        setSearchDoc(e.target.value);
                                                        if (selectedPatient) setSelectedPatient(null);
                                                    }}
                                                />

                                                {/* SUGGESTIONS DROPDOWN */}
                                                <AnimatePresence>
                                                    {searchResults.length > 0 && !selectedPatient && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                                                        >
                                                            <div className="p-2 max-h-[300px] overflow-y-auto">
                                                                {searchResults.map((patient) => (
                                                                    <button
                                                                        key={patient.id}
                                                                        type="button"
                                                                        onClick={() => handleSelectPatient(patient)}
                                                                        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-xl transition-all text-left group"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-full bg-alteha-violet/10 flex items-center justify-center text-alteha-violet font-black">
                                                                            {patient.firstName[0]}{patient.lastName[0]}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <h4 className="text-sm font-black text-slate-900">{patient.firstName} {patient.lastName}</h4>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{patient.identificationNumber}</p>
                                                                        </div>
                                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <Link 
                                                href="/dashboard/insurance/patients/register"
                                                className="px-6 py-4 bg-white border-2 border-slate-100 hover:border-alteha-violet hover:text-alteha-violet text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                Crear Paciente
                                            </Link>
                                        </div>

                                        <AnimatePresence>
                                            {selectedPatient && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] flex items-center gap-4 shadow-sm"
                                                >
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border-2 border-emerald-200 shadow-sm overflow-hidden shrink-0">
                                                        {selectedPatient.profileImageUrl ? (
                                                            <img src={selectedPatient.profileImageUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-8 h-8 text-emerald-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h4>
                                                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">{calculateAge(selectedPatient.dateOfBirth)} años • {selectedPatient.gender}</p>
                                                    </div>
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 ml-auto" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                </div>

                                <AnimatePresence>
                                    {selectedPatient ? (
                                        <motion.div
                                            key="technical-details"
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="space-y-12"
                                        >
                                            <div className="space-y-4 pt-8 border-t">
                                                <h3 className="text-lg font-black text-slate-900 border-b pb-3 uppercase tracking-wider italic">2. Antecedentes</h3>
                                                <textarea
                                                    className={`w-full p-4 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl font-bold text-slate-900 transition-all outline-none min-h-[100px] text-sm ${prefilledFields.has('medicalHistory') ? 'bg-violet-50/50 border-alteha-violet/10' : 'bg-slate-50'}`}
                                                    placeholder="Historia médica relevante..."
                                                    value={formData.medicalHistory}
                                                    onChange={(e) => handleManualChange('medicalHistory', e.target.value)}
                                                />
                                            </div>

                                            <div className="relative mt-8 pt-8 border-t">
                                                <h3 className="text-lg font-black text-slate-900 border-b pb-3 uppercase tracking-wider italic">3. ¿Qué intervención vamos a subastar?</h3>
                                                    <div className="flex gap-3">
                                                <div className="flex-1 relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                        <Stethoscope className="h-5 w-5 text-alteha-violet" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-sm text-slate-900 transition-all outline-none shadow-sm"
                                                        placeholder="Busca el tipo de intervención..."
                                                        value={searchProcedure}
                                                        onChange={(e) => {
                                                            setSearchProcedure(e.target.value);
                                                            setShowProcedureResults(true);
                                                        }}
                                                        onFocus={() => setShowProcedureResults(true)}
                                                    />
                                                    {searchProcedure && (
                                                        <button 
                                                            onClick={() => { setSearchProcedure(''); setShowProcedureResults(false); }}
                                                            className="absolute inset-y-0 right-6 flex items-center text-slate-300 hover:text-slate-600 transition-colors"
                                                        >
                                                            <ChevronLeft className="rotate-45 w-6 h-6" />
                                                        </button>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAdvancedSearch(true)}
                                                    className="px-8 bg-slate-900 text-white rounded-[2rem] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl hover:shadow-slate-200"
                                                >
                                                    <Search className="w-6 h-6" />
                                                    <span className="hidden md:block font-black uppercase text-xs tracking-widest">Búsqueda Avanzada</span>
                                                </button>
                                            </div>

                                        <AnimatePresence>
                                            {showProcedureResults && searchProcedure.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute z-50 w-full mt-4 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden max-h-[450px] overflow-y-auto"
                                                >
                                                    {procedureTypes
                                                        .filter(t => (t.name?.toLowerCase().includes(searchProcedure.toLowerCase()) || t.code?.toLowerCase().includes(searchProcedure.toLowerCase())))
                                                        .map(type => (
                                                            <div key={type.id} className="border-b last:border-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedProcedureTypeId(type.id)}
                                                                    className={`w-full text-left px-8 py-5 hover:bg-alteha-violet/5 flex items-center justify-between transition-colors ${selectedProcedureTypeId === type.id ? 'bg-alteha-violet/10' : ''}`}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center gap-3">
                                                                            <p className="font-black text-slate-900 text-lg">{type.name}</p>
                                                                            {type.code && (
                                                                                <span className="px-3 py-1 bg-alteha-violet/10 text-alteha-violet text-[10px] font-black rounded-lg uppercase tracking-widest">{type.code}</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-slate-500 font-bold tracking-tight uppercase mt-1">{type.description?.substring(0, 100)}...</p>
                                                                    </div>
                                                                    {selectedProcedureTypeId === type.id ? <CheckCircle2 className="w-6 h-6 text-alteha-violet" /> : <ChevronRight className="w-5 h-5 text-slate-300" />}
                                                                </button>
                                                                
                                                                {selectedProcedureTypeId === type.id && (
                                                                    <div className="bg-slate-50 px-10 py-4 space-y-2 border-t border-slate-100">
                                                                        {isLoadingTemplates ? (
                                                                            <div className="py-8 text-center">
                                                                                <Loader2 className="w-8 h-8 animate-spin text-alteha-violet mx-auto" />
                                                                                <p className="text-sm font-bold text-slate-400 mt-3 italic">Consultando catálogos Alteha...</p>
                                                                            </div>
                                                                        ) : procedureTemplates.length > 0 ? (
                                                                            procedureTemplates.map(template => (
                                                                                <button
                                                                                    key={template.id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        handleTemplateSelect(template.id);
                                                                                        setSearchProcedure(template.procedureName);
                                                                                        setShowProcedureResults(false);
                                                                                    }}
                                                                                    className="w-full text-left p-4 rounded-2xl bg-white border border-transparent hover:border-alteha-violet hover:shadow-md transition-all flex items-center justify-between group/item"
                                                                                >
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="w-3 h-3 rounded-full bg-alteha-violet shadow-[0_0_10px_rgba(124,58,237,0.4)]" />
                                                                                        <span className="text-base font-black text-slate-700 group-hover/item:text-alteha-violet transition-colors">{template.procedureName}</span>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Precarga Lista</p>
                                                                                        <p className="text-sm font-black text-slate-900">${(template.clinicBudget + template.doctorBudget).toLocaleString()}</p>
                                                                                    </div>
                                                                                </button>
                                                                            ))
                                                                        ) : (
                                                                            <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                                                                <p className="text-sm font-bold text-slate-400 italic">No se encontraron variantes para esta intervención</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>


                                    <AnimatePresence>
                                        {selectedProcedureTypeId && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-12"
                                            >
                                                {/* SECCIÓN 4: DETALLES Y LOGÍSTICA */}
                                                <div className="space-y-6 pt-8 border-t mt-8">
                                                    <h3 className="text-lg font-black text-slate-900 border-b pb-3 uppercase tracking-wider italic">4. Detalles y Logística</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <FormInput 
                                                                label="Título de la Subasta" 
                                                                value={formData.title} 
                                                                isPrefilled={prefilledFields.has('title')} 
                                                                onChange={(v: string) => handleManualChange('title', v)} 
                                                                placeholder="Ej: Cirugía de Vesícula..." 
                                                                icon={FileText}
                                                                description="Indica un nombre claro para la intervención. Esto ayudará a los médicos a identificar rápidamente el caso."
                                                            />
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between items-center px-1">
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidad</label>
                                                                    </div>
                                                                    <select
                                                                        value={formData.specialty?.id}
                                                                        onChange={(e) => handleManualChange('specialty', { id: parseInt(e.target.value) })}
                                                                        className={`w-full p-3 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl font-bold text-sm text-slate-900 transition-all outline-none ${prefilledFields.has('specialty') ? 'bg-violet-50/50 border-alteha-violet/10' : 'bg-slate-50'}`}
                                                                    >
                                                                        {(Array.isArray(specialties) ? specialties : []).map(s => (
                                                                            <option key={s.id} value={s.id}>{s.name || s.code}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <FormInput 
                                                                        label="Días Hospitalización" 
                                                                        type="number" 
                                                                        value={formData.estimatedDurationDays} 
                                                                        isPrefilled={prefilledFields.has('estimatedDurationDays')} 
                                                                        onChange={(v: string) => handleManualChange('estimatedDurationDays', parseInt(v))} 
                                                                        icon={Bed}
                                                                        description="Número estimado de días que el paciente permanecerá en la clínica tras la cirugía."
                                                                    />
                                                                </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <FormInput 
                                                                    label="Fecha Estimada" 
                                                                    type="date" 
                                                                    value={formData.estimatedSurgeryDate} 
                                                                    isPrefilled={prefilledFields.has('estimatedSurgeryDate')} 
                                                                    onChange={(v: string) => handleManualChange('estimatedSurgeryDate', v)} 
                                                                    icon={Calendar}
                                                                    description="La fecha en la que se tiene programado realizar la intervención quirúrgica."
                                                                />
                                                                <FormInput 
                                                                    label="Ubicación" 
                                                                    value={formData.preferredLocation} 
                                                                    isPrefilled={prefilledFields.has('preferredLocation')} 
                                                                    onChange={(v: string) => handleManualChange('preferredLocation', v)} 
                                                                    icon={MapPin}
                                                                    description="Ciudad o zona de preferencia para realizar la cirugía."
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parámetros Técnicos</h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div className={`p-3 rounded-xl border transition-all ${prefilledFields.has('biopsyRequired') ? 'bg-violet-50/50 border-alteha-violet/20 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                                                    <div className="flex justify-between items-center mb-1 px-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Stethoscope className="w-3 h-3 text-alteha-violet/60" />
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase">¿Biopsia?</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        {['SÍ', 'NO'].map(opt => (
                                                                            <button key={opt} type="button" onClick={() => handleManualChange('biopsyRequired', opt === 'SÍ')} className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all ${((opt === 'SÍ' && formData.biopsyRequired) || (opt === 'NO' && !formData.biopsyRequired)) ? 'bg-alteha-violet text-white shadow-sm' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{opt}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className={`p-3 rounded-xl border transition-all ${prefilledFields.has('anesthesiologist') ? 'bg-violet-50/50 border-alteha-violet/20 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                                                    <div className="flex justify-between items-center mb-1 px-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Users className="w-3 h-3 text-alteha-violet/60" />
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase">¿Anestesiólogo?</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        {['SÍ', 'NO'].map(opt => (
                                                                            <button key={opt} type="button" onClick={() => handleManualChange('anesthesiologist', opt === 'SÍ')} className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all ${((opt === 'SÍ' && formData.anesthesiologist) || (opt === 'NO' && !formData.anesthesiologist)) ? 'bg-alteha-violet text-white shadow-sm' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{opt}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <div className="flex justify-between items-center px-1 mb-1">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase">Min. Quirófano</p>
                                                                    </div>
                                                                    <input type="number" value={formData.estimatedDuration || 0} onChange={(e) => handleManualChange('estimatedDuration', parseInt(e.target.value))} className={`w-full p-2.5 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl font-bold text-sm text-slate-900 outline-none ${prefilledFields.has('estimatedDuration') ? 'bg-violet-50/50 border-alteha-violet/10' : 'bg-slate-50'}`} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between items-center px-1 mb-1">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase">Asistentes</p>
                                                                    </div>
                                                                    <input type="number" value={formData.numberOfAssistants || 0} onChange={(e) => handleManualChange('numberOfAssistants', parseInt(e.target.value))} className={`w-full p-2.5 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl font-bold text-sm text-slate-900 outline-none ${prefilledFields.has('numberOfAssistants') ? 'bg-violet-50/50 border-alteha-violet/10' : 'bg-slate-50'}`} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center px-1">
                                                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Equipamiento Médico</label>
                                                                    {prefilledFields.has('equipment') && <div className="w-1.5 h-1.5 rounded-full bg-alteha-violet" />}
                                                                </div>
                                                                <textarea 
                                                                    className={`w-full p-3 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl font-bold text-slate-900 transition-all outline-none min-h-[60px] text-sm ${prefilledFields.has('equipment') ? 'bg-violet-50/50 border-alteha-violet/10' : 'bg-slate-50'}`} 
                                                                    placeholder="Equipos específicos..." 
                                                                    value={formData.equipment} 
                                                                    onChange={(e) => handleManualChange('equipment', e.target.value)} 
                                                                />
                                                            </div>
                                                            <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:border-alteha-violet transition-all group">
                                                                <input type="file" id="medical-report-final" className="hidden" onChange={(e) => setMedicalReport(e.target.files?.[0] || null)} />
                                                                <label htmlFor="medical-report-final" className="flex flex-col items-center gap-2 cursor-pointer">
                                                                    <Upload className="w-5 h-5 text-slate-300" />
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{medicalReport ? medicalReport.name : 'Subir Informe Médico'}</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* SECCIÓN 5: INSUMOS */}
                                                <div className="space-y-4 pt-8 border-t mt-8">
                                                    <div className="flex justify-between items-center border-b pb-3">
                                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider italic">5. Insumos Especiales</h3>
                                                        <button type="button" onClick={() => setFormData({ ...formData, requiredSupplies: [...(formData.requiredSupplies || []), { itemName: '', description: '', quantity: 1, referenceAmount: 0 }] })} className="text-alteha-violet font-black text-[10px] uppercase tracking-widest hover:underline">+ Agregar</button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                                                        {(formData.requiredSupplies || []).map((supply, index) => (
                                                            <div key={index} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3 relative group shadow-md hover:shadow-lg transition-all">
                                                                <button type="button" onClick={() => { const n = [...formData.requiredSupplies]; n.splice(index, 1); setFormData({ ...formData, requiredSupplies: n }); }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><AlertCircle className="w-4 h-4" /></button>
                                                                 <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Insumo</p>
                                                                    <input type="text" placeholder="Ej: Malla de Polipropileno..." value={supply.itemName} onChange={(e) => { const n = [...formData.requiredSupplies]; n[index].itemName = e.target.value; setFormData({ ...formData, requiredSupplies: n }); }} className="w-full bg-slate-50 px-4 py-4 rounded-xl text-base font-bold text-slate-900 outline-none border-2 border-transparent focus:border-alteha-violet transition-all" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Observaciones</p>
                                                                    <textarea placeholder="Especificaciones técnicas, medidas, marcas preferidas..." value={supply.description} onChange={(e) => { const n = [...formData.requiredSupplies]; n[index].description = e.target.value; setFormData({ ...formData, requiredSupplies: n }); }} className="w-full bg-slate-50 px-4 py-4 rounded-xl text-sm font-medium text-slate-600 outline-none border-2 border-transparent focus:border-alteha-violet transition-all resize-none h-24" />
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Cant.</p><input type="number" value={supply.quantity === 0 ? '' : supply.quantity} placeholder="0" onFocus={(e) => e.target.select()} onChange={(e) => { const n = [...formData.requiredSupplies]; n[index].quantity = parseInt(e.target.value) || 0; setFormData({ ...formData, requiredSupplies: n }); }} className="w-full bg-slate-50 px-4 py-3 rounded-xl text-base font-black outline-none border border-transparent focus:border-alteha-violet" /></div>
                                                                    <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Ref ($)</p><input type="number" value={supply.referenceAmount === 0 ? '' : supply.referenceAmount} placeholder="0" onFocus={(e) => e.target.select()} onChange={(e) => { const n = [...formData.requiredSupplies]; n[index].referenceAmount = parseFloat(e.target.value) || 0; setFormData({ ...formData, requiredSupplies: n }); }} className="w-full bg-slate-50 px-4 py-3 rounded-xl text-base font-black outline-none border border-transparent focus:border-alteha-violet" /></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!formData.requiredSupplies || formData.requiredSupplies.length === 0) && (
                                                            <div className="py-8 text-center text-slate-300 italic text-xs font-medium border-2 border-dashed border-slate-100 rounded-2xl col-span-full">No se han añadido insumos</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* SECCIÓN 6: CONFIGURACIÓN FINANCIERA */}
                                                <div className="space-y-6 pt-8 border-t mt-8 bg-slate-900 p-8 rounded-[2.5rem] text-white">
                                                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                                        <h3 className="text-lg font-black uppercase tracking-wider italic">6. Configuración del Presupuesto</h3>
                                                        {formData.requiredSupplies && formData.requiredSupplies.length > 0 && (
                                                            <span className="bg-alteha-violet px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Incluye {formData.requiredSupplies.length} Insumos</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Honorarios Médicos ($)</label>
                                                            <input
                                                                type="number"
                                                                value={formData.doctorBudget === 0 ? '' : formData.doctorBudget}
                                                                placeholder="0"
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => setFormData({ ...formData, doctorBudget: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xl font-black text-white placeholder:text-white/25 focus:border-alteha-violet outline-none transition-all"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Gastos Clínica ($)</label>
                                                            <input
                                                                type="number"
                                                                value={formData.clinicBudget === 0 ? '' : formData.clinicBudget}
                                                                placeholder="0"
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => setFormData({ ...formData, clinicBudget: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xl font-black text-white placeholder:text-white/25 focus:border-alteha-violet outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* RESUMEN FINANCIERO INTEGRADO */}
                                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Sin Insumos (Base)</p>
                                                            <p className="text-lg font-black">${((formData.doctorBudget || 0) + (formData.clinicBudget || 0)).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Insumos</p>
                                                            <p className="text-lg font-black text-alteha-turquoise">${(formData.requiredSupplies?.reduce((acc, s) => acc + (s.quantity * s.referenceAmount), 0) || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-alteha-violet p-4 rounded-2xl flex flex-col justify-center shadow-xl shadow-alteha-violet/20 border border-white/10">
                                                            <p className="text-[8px] font-black text-white/70 uppercase tracking-widest mb-0.5">Total Presupuestado</p>
                                                            <p className="text-2xl font-black">${formData.maxBudget.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>
                )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b pb-4">
                                        <h3 className="text-2xl font-black text-slate-900">Invitados a la Subasta</h3>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-alteha-violet uppercase tracking-widest">{formData.invitedClinicIds?.length || 0} Clínicas</p>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formData.invitedDoctorIds?.length || 0} Médicos</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Building2 className="w-4 h-4" /> Clínicas
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllClinics}
                                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                                                        allClinicsSelected
                                                            ? 'bg-alteha-violet text-white'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-alteha-violet/10 hover:text-alteha-violet'
                                                    }`}
                                                >
                                                    {allClinicsSelected ? '✓ Todas Selec.' : 'Todas las Clínicas'}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Nombre, ciudad o estado…" 
                                                    value={clinicSearch}
                                                    onChange={(e) => setClinicSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl text-xs font-bold text-slate-900 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {(Array.isArray(clinics) ? clinics : [])
                                                    .filter(c => smartMatch(clinicSearch, c.name, (c as any).legalName, (c as any).cityName, (c as any).stateProvinceName, (c as any).address, (c as any).preferredLocation))
                                                    .map(clinic => (
                                                    <div
                                                        key={clinic.id}
                                                        onClick={() => {
                                                            const ids = formData.invitedClinicIds || [];
                                                            if (ids.includes(clinic.id)) {
                                                                const newIds = ids.filter(id => id !== clinic.id);
                                                                const remainingDocs = doctors.filter(d => d.preferredClinics?.some(pc => newIds.includes(pc.id))).map(d => d.id);
                                                                setFormData({ ...formData, invitedClinicIds: newIds, invitedDoctorIds: formData.invitedDoctorIds?.filter(id => remainingDocs.includes(id)) || [] });
                                                            } else {
                                                                setFormData({ ...formData, invitedClinicIds: [...ids, clinic.id] });
                                                            }
                                                        }}
                                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${formData.invitedClinicIds?.includes(clinic.id) ? 'border-alteha-violet bg-violet-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center p-1 shadow-sm">
                                                            {clinic.logoUrl ? <img src={clinic.logoUrl} className="w-full h-full object-contain" /> : <Building2 className="w-6 h-6 text-slate-200" />}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 truncate">{clinic.name}</span>
                                                        {formData.invitedClinicIds?.includes(clinic.id) && <CheckCircle2 className="w-5 h-5 text-alteha-violet ml-auto" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Users className="w-4 h-4" /> Médicos
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllDoctors}
                                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                                                        allDoctorsSelected
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                                                    }`}
                                                >
                                                    {allDoctorsSelected ? '✓ Todos Selec.' : 'Todos los Médicos'}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Nombre, especialidad o ciudad…" 
                                                    value={doctorSearch}
                                                    onChange={(e) => setDoctorSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-xl text-xs font-bold text-slate-900 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {filteredDoctors
                                                    .filter(d => smartMatch(doctorSearch, d.firstName, d.lastName, (d as any).fullName, (d as any).cityName, (d as any).stateProvinceName, (d as any).address, ((d as any).specialties || []).map((sp: any) => sp.name).join(' ')))
                                                    .map(doctor => (
                                                    <div
                                                        key={doctor.id}
                                                        onClick={() => {
                                                            const ids = formData.invitedDoctorIds || [];
                                                            setFormData({ ...formData, invitedDoctorIds: ids.includes(doctor.id) ? ids.filter(id => id !== doctor.id) : [...ids, doctor.id] });
                                                        }}
                                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${formData.invitedDoctorIds?.includes(doctor.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <div className="w-10 h-10 bg-white rounded-full border overflow-hidden shadow-sm">
                                                            {doctor.profileImageUrl ? <img src={doctor.profileImageUrl} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-200" />}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 truncate">{doctor.firstName} {doctor.lastName}</span>
                                                        {formData.invitedDoctorIds?.includes(doctor.id) && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 border-b pb-4">Configuración Final</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-8">
                                            {/* Reglas de Cierre */}
                                            <div className="space-y-6">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock className="w-4 h-4" /> Reglas de Cierre
                                                </h4>
                                                <FormInput
                                                    label="Fecha Límite de Recepción"
                                                    type="datetime-local"
                                                    value={formData.endDate.slice(0, 16)}
                                                    onChange={(v: string) => { const date = new Date(v); if (!isNaN(date.getTime())) setFormData({ ...formData, endDate: date.toISOString() }); }}
                                                    icon={Clock}
                                                    description="Fecha y hora en la que se dejarán de recibir ofertas para esta subasta."
                                                />
                                                <div className="grid grid-cols-1 gap-4">
                                                    {/* 
                                                    <FormInput 
                                                        label="Ofertas Mínimas" 
                                                        type="number" 
                                                        value={formData.minBidsRequired} 
                                                        onChange={(v: string) => setFormData({ ...formData, minBidsRequired: parseInt(v) })} 
                                                        icon={Target}
                                                        description="Cantidad mínima de propuestas necesarias para que la subasta sea válida."
                                                    />
                                                    */}
                                                </div>
                                            </div>

                                            {/* Métodos de Pago */}
                                            <div className="space-y-6 pt-6 border-t">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4" /> Métodos de Pago Permitidos
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {[
                                                            { id: 'BS_BANK_TRANSFER', label: 'BS_BANK_TRANSFER', desc: 'Transferencia bancaria nacional (Bolívares).' },
                                                            { id: 'BS_PAGO_MOVIL', label: 'BS_PAGO_MOVIL', desc: 'Pago Móvil inmediato (Bolívares).' },
                                                            { id: 'USD_WIRE_SWIFT', label: 'USD_WIRE_SWIFT', desc: 'Transferencia internacional SWIFT (Dólares).' },
                                                            { id: 'USD_ACH', label: 'USD_ACH', desc: 'Transferencia ACH / Zelle (Dólares).' },
                                                            { id: 'USD_IBAN', label: 'USD_IBAN', desc: 'Transferencia bancaria europea/internacional (IBAN).' },
                                                            { id: 'BINANCE_PAY', label: 'BINANCE_PAY', desc: 'Pago vía Binance Pay (Cripto/Dólares).' },
                                                            { id: 'CRYPTO_WALLET', label: 'CRYPTO_WALLET', desc: 'Pago directo a Wallet (USDT, BTC, etc.).' }
                                                        ].map((method) => {
                                                            const isSelected = formData.allowedPaymentMethods?.includes(method.id);
                                                            return (
                                                                <button
                                                                    key={method.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = formData.allowedPaymentMethods || [];
                                                                        const updated = isSelected
                                                                            ? current.filter(m => m !== method.id)
                                                                            : [...current, method.id];
                                                                        setFormData({ ...formData, allowedPaymentMethods: updated });
                                                                    }}
                                                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-start gap-3 ${isSelected ? 'border-alteha-violet bg-violet-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                                >
                                                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-alteha-violet bg-alteha-violet' : 'border-slate-200'}`}>
                                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-slate-900">{method.label}</p>
                                                                        <p className="text-[10px] font-medium text-slate-500 leading-tight mt-1">{method.desc}</p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-8 flex flex-col">
                                            <h4 className="text-xl font-black italic">Resumen de Publicación</h4>
                                            <div className="space-y-4 flex-1">
                                                <div className="flex justify-between text-xs border-b border-white/10 pb-3"><span className="text-white/40 font-black">PACIENTE:</span><span className="font-black">{selectedPatient?.firstName} {selectedPatient?.lastName}</span></div>
                                                <div className="flex justify-between text-xs border-b border-white/10 pb-3">
                                                    <span className="text-white/40 font-black">INTERVENCIÓN:</span>
                                                    <div className="text-right">
                                                        <span className="font-black block truncate max-w-[180px]">{formData.title}</span>
                                                        {procedureTypes.find(t => t.id === selectedProcedureTypeId)?.code && (
                                                            <span className="text-[10px] text-alteha-violet font-black uppercase tracking-widest">{procedureTypes.find(t => t.id === selectedProcedureTypeId)?.code}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs border-b border-white/10 pb-3"><span className="text-white/40 font-black">PRESUPUESTO:</span><span className="font-black text-emerald-400 text-lg">${formData.maxBudget.toLocaleString()}</span></div>
                                                <div className="flex justify-between text-xs border-b border-white/10 pb-3"><span className="text-white/40 font-black">INVITADOS:</span><span className="font-black">{(formData.invitedClinicIds?.length || 0) + (formData.invitedDoctorIds?.length || 0)} actores</span></div>
                                                <div className="flex justify-between text-xs border-b border-white/10 pb-3">
                                                    <span className="text-white/40 font-black">MÉTODOS PAGO:</span>
                                                    <div className="text-right flex flex-col gap-1">
                                                        {(formData.allowedPaymentMethods && formData.allowedPaymentMethods.length > 0) ? (
                                                            formData.allowedPaymentMethods.map(m => (
                                                                <span key={m} className="font-black text-alteha-turquoise block text-[10px]">{m}</span>
                                                            ))
                                                        ) : (
                                                            <span className="font-black text-alteha-turquoise">BS_BANK_TRANSFER</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mt-auto">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-lg bg-alteha-turquoise/20 flex items-center justify-center">
                                                        <CheckCircle2 className="w-5 h-5 text-alteha-turquoise" />
                                                    </div>
                                                    <p className="text-xs font-black text-white uppercase tracking-widest">Listo para publicar</p>
                                                </div>
                                                <p className="text-[10px] text-white/40 font-medium leading-relaxed italic">
                                                    Al confirmar, la subasta será enviada a los especialistas seleccionados bajo las condiciones de pago establecidas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}


                    <div className="mt-12 flex justify-between items-center pt-8 border-t">
                        {step > 1 ? (
                            <Button
                                type="button"
                                onClick={handleBack}
                                className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Anterior
                            </Button>
                        ) : <div />}

                        {step < 3 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={(step === 1 && (!selectedPatient || !medicalReport)) || (step === 2 && (!formData.invitedClinicIds || formData.invitedClinicIds.length === 0))}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-2 border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleAction('DRAFT')}
                                    className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2 text-sm"
                                >
                                    Guardar Borrador
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleAction('PUBLISHED')}
                                    className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-900 transition-all flex items-center gap-2 text-sm shadow-md"
                                >
                                    Solo Publicar
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleAction('ACTIVE')}
                                    className="bg-alteha-violet text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-violet-200 hover:scale-105 transition-all flex items-center gap-3 text-sm"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar y Activar'}
                                </Button>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            <AnimatePresence>
                {showAdvancedSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-alteha-violet rounded-2xl flex items-center justify-center text-white">
                                        <Filter className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 italic">Explorar Catálogo Alteha</h3>
                                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Busca por especialidad y tipo de intervención</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowAdvancedSearch(false); setAdvSearchSpecialtyId(null); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center border hover:bg-slate-100 transition-colors">
                                    <ChevronLeft className="rotate-45 w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Specialties Sidebar */}
                                <div className="w-1/3 border-r bg-slate-50/50 p-6 overflow-y-auto space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Especialidades</h4>
                                    {(catalogSpecialties.length > 0 ? catalogSpecialties : specialties).map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setAdvSearchSpecialtyId(s.id)}
                                            className={`w-full text-left p-4 rounded-2xl font-black transition-all flex items-center justify-between group ${advSearchSpecialtyId === s.id ? 'bg-alteha-violet text-white shadow-lg shadow-alteha-violet/20' : 'bg-white border hover:border-alteha-violet/50 hover:shadow-md'}`}
                                        >
                                            <span className="truncate">{s.name || s.code}</span>
                                            {advSearchSpecialtyId === s.id && <ChevronRight className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>

                                {/* Results Area */}
                                <div className="flex-1 p-8 overflow-y-auto bg-white">
                                    {!advSearchSpecialtyId ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                            <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center">
                                                <Stethoscope className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 mb-2">Selecciona una Especialidad</h4>
                                                <p className="text-slate-400 font-medium max-w-[300px]">Navega por nuestro catálogo estructurado para encontrar el procedimiento exacto.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setAdvSearchSpecialtyId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-alteha-violet" /></button>
                                                <h4 className="text-lg font-black text-slate-900 italic">Intervenciones en {specialties.find(s => s.id === advSearchSpecialtyId)?.name}</h4>
                                            </div>
                                            
                                            {isLoadingCatalog ? (
                                                <div className="py-20 text-center">
                                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-200 mb-4" />
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Consultando catálogo de Alteha...</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {catalogProcedureTypes.length === 0 ? (
                                                            <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed">
                                                                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                                                                <p className="text-slate-500 font-bold">No hay procedimientos registrados para esta especialidad.</p>
                                                            </div>
                                                        ) : (
                                                            catalogProcedureTypes
                                                                .map(type => (
                                                                    <button
                                                                        key={type.id}
                                                                        onClick={() => {
                                                                            setSelectedProcedureTypeId(type.id);
                                                                            setSearchProcedure(type.name || type.code || '');
                                                                            setShowAdvancedSearch(false);
                                                                            setAdvSearchSpecialtyId(null);
                                                                            setShowProcedureResults(true);
                                                                        }}
                                                                        className="text-left p-6 rounded-3xl border-2 border-slate-100 hover:border-alteha-violet hover:bg-violet-50/30 transition-all group"
                                                                    >
                                                                        <div className="flex justify-between items-center">
                                                                            <div>
                                                                                <p className="font-black text-slate-900 group-hover:text-alteha-violet transition-colors">{type.name || type.code}</p>
                                                                                <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-1">{type.description}</p>
                                                                            </div>
                                                                            <CheckCircle2 className="w-6 h-6 text-alteha-violet opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    </button>
                                                                ))
                                                        )
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FormInput({ label, type = "text", value, onChange, disabled = false, placeholder, description, icon: IconComponent, isPrefilled }: any) {
    const [showHelp, setShowHelp] = React.useState(false);

    return (
        <div className="space-y-1.5 group">
            <div className="flex justify-between items-center mb-1 px-1">
                <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="w-3.5 h-3.5 text-alteha-violet/60" />}
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
                </div>
                {description && (
                    <button 
                        type="button"
                        onClick={() => setShowHelp(!showHelp)}
                        className={`p-1 rounded-md transition-all ${showHelp ? 'bg-alteha-violet text-white' : 'text-slate-300 hover:text-alteha-violet hover:bg-alteha-violet/5'}`}
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            
            <AnimatePresence>
                {showHelp && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-800 text-[10px] text-white p-3 rounded-xl mb-2 font-bold leading-relaxed border-l-4 border-alteha-violet shadow-lg">
                            {description}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <input
                type={type}
                value={value}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-4 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-bold text-sm text-slate-900 transition-all outline-none ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''} ${isPrefilled ? 'bg-violet-50/50 border-alteha-violet/10' : 'bg-slate-50'}`}
            />
        </div>
    );
}
