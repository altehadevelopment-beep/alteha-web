"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Upload,
    Plus,
    Trash2,
    GraduationCap,
    Award,
    BookOpen,
    FileCheck,
    Briefcase,
    CreditCard,
    Wallet,
    Loader2,
    Stethoscope,
    CheckCircle,
    Mail,
    Phone,
    ShieldCheck,
    AlertCircle,
    Pencil,
    ChevronDown,
    ChevronUp,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { 
    getSpecialties, 
    updateDoctorProfile, 
    sendEmailToken, 
    verifyEmailToken, 
    sendSmsToken, 
    verifySmsToken,
    getDoctorFiles,
    uploadDoctorFile,
    updateDoctorFile,
    deleteDoctorFile
} from '@/lib/api';
import { toast } from 'sonner';

interface DoctorFile {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    description: string;
    uploadedAt: string;
}

export default function EditProfilePage() {
    const { userProfile, isLoadingProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('academic');
    const [specialtiesList, setSpecialtiesList] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialtyIds: [] as number[]
    });

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [isSavingBasic, setIsSavingBasic] = useState(false);

    // Doctor Files States
    const [doctorFiles, setDoctorFiles] = useState<DoctorFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    
    // File Modal States
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const [currentFileType, setCurrentFileType] = useState('');
    const [fileToEdit, setFileToEdit] = useState<DoctorFile | null>(null);
    const [isFileSaving, setIsFileSaving] = useState(false);

    // Verification States
    const [originalEmail, setOriginalEmail] = useState('');
    const [originalPhone, setOriginalPhone] = useState('');
    
    const [emailVerified, setEmailVerified] = useState(true);
    const [phoneVerified, setPhoneVerified] = useState(true);
    
    const [emailToken, setEmailToken] = useState('');
    const [phoneToken, setPhoneToken] = useState('');
    
    const [emailSent, setEmailSent] = useState(false);
    const [phoneSent, setPhoneSent] = useState(false);
    
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingSms, setLoadingSms] = useState(false);
    
    const [emailCountdown, setEmailCountdown] = useState(0);
    const [smsCountdown, setSmsCountdown] = useState(0);
    const COUNTDOWN_SECONDS = 60;

    // Load specialties and populate form data
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getSpecialties();
                const list = Array.isArray(data) ? data : (data as any).content || [];
                const sortedList = list
                    .filter((s: any) => s.isActive)
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));
                setSpecialtiesList(sortedList);
            } catch (err) {
                console.error('Error loading specialties:', err);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (userProfile) {
            console.log('[Profile Edit] User Profile Data:', userProfile);
            
            const rawSpecialties = userProfile.specialties || [];
            const specialtyIds = rawSpecialties.map((s: any) => s.id).filter(Boolean);
            
            // If the backend has a single specialty object but no array, handle it
            if (userProfile.specialty && specialtyIds.length === 0) {
                specialtyIds.push(userProfile.specialty.id);
            }

            const loadedEmail = userProfile.email || '';
            const loadedPhone = userProfile.phone || userProfile.mobilePhone || '';

            setFormData({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                email: loadedEmail,
                phone: loadedPhone,
                specialtyIds: specialtyIds
            });
            
            setOriginalEmail(loadedEmail);
            setOriginalPhone(loadedPhone);
        }
    }, [userProfile]);

    // Countdowns
    useEffect(() => {
        if (emailCountdown > 0) {
            const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [emailCountdown]);

    // Load Doctor Files
    const loadDoctorFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const res = await getDoctorFiles();
            let files: DoctorFile[] = [];
            if (Array.isArray(res)) {
                files = res;
            } else if (res && typeof res === 'object' && Array.isArray((res as any).content)) {
                files = (res as any).content;
            } else if ((res as any)?.data && Array.isArray((res as any).data)) {
                files = (res as any).data;
            }
            setDoctorFiles(files);
        } catch (err) {
            console.error("Error loading doctor files", err);
            setDoctorFiles([]);
        }
        setIsLoadingFiles(false);
    };

    useEffect(() => {
        if (userProfile) {
            loadDoctorFiles();
        }
    }, [userProfile]);

    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Watch for email/phone changes
    useEffect(() => {
        if (formData.email.trim() !== originalEmail.trim()) {
            setEmailVerified(false);
            setEmailSent(false);
            setEmailToken('');
        } else {
            setEmailVerified(true);
            setEmailSent(false);
            setEmailToken('');
        }
    }, [formData.email, originalEmail]);

    useEffect(() => {
        if (formData.phone.trim() !== originalPhone.trim()) {
            setPhoneVerified(false);
            setPhoneSent(false);
            setPhoneToken('');
        } else {
            setPhoneVerified(true);
            setPhoneSent(false);
            setPhoneToken('');
        }
    }, [formData.phone, originalPhone]);

    // Verification Handlers
    const handleSendEmailToken = async () => {
        if (!formData.email) return;
        setLoadingEmail(true);
        try {
            const result = await sendEmailToken(formData.email);
            if (result.code === '00') {
                setEmailSent(true);
                setEmailCountdown(COUNTDOWN_SECONDS);
                toast.success('Código enviado al nuevo correo');
            } else {
                toast.error(result.message || 'Error al enviar el código');
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
        }
        setLoadingEmail(false);
    };

    const handleVerifyEmail = async (tokenToVerify?: string) => {
        const token = tokenToVerify || emailToken;
        if (!token || token.length < 6) return;
        setLoadingEmail(true);
        try {
            const result = await verifyEmailToken(formData.email, token);
            if (result.code === '00' && result.data === true) {
                setEmailVerified(true);
                toast.success('Correo verificado correctamente');
            } else {
                toast.error('Código incorrecto o expirado');
                setEmailToken(''); // clear token on error
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
        }
        setLoadingEmail(false);
    };

    const handleSendSmsToken = async () => {
        if (!formData.phone) return;
        setLoadingSms(true);
        try {
            const result = await sendSmsToken(formData.phone);
            if (result.code === '00') {
                setPhoneSent(true);
                setSmsCountdown(COUNTDOWN_SECONDS);
                toast.success('Código enviado al nuevo teléfono');
            } else {
                toast.error(result.message || 'Error al enviar el SMS');
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
        }
        setLoadingSms(false);
    };

    const handleVerifyPhone = async (tokenToVerify?: string) => {
        const token = tokenToVerify || phoneToken;
        if (!token || token.length < 6) return;
        setLoadingSms(true);
        try {
            const result = await verifySmsToken(formData.phone, token);
            if (result.code === '00' && result.data === true) {
                setPhoneVerified(true);
                toast.success('Teléfono verificado correctamente');
            } else {
                toast.error('Código incorrecto o expirado');
                setPhoneToken(''); // clear token on error
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
        }
        setLoadingSms(false);
    };

    const toggleSpecialty = (id: number) => {
        setFormData(prev => ({
            ...prev,
            specialtyIds: prev.specialtyIds.includes(id)
                ? prev.specialtyIds.filter(sId => sId !== id)
                : [...prev.specialtyIds, id]
        }));
    };

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveBasicInfo = async () => {
        if (!emailVerified) {
            toast.error("Debes verificar tu nuevo correo electrónico.");
            return;
        }
        if (!phoneVerified) {
            toast.error("Debes verificar tu nuevo número de teléfono.");
            return;
        }
        if (formData.specialtyIds.length === 0) {
            toast.error("Debes seleccionar al menos una especialidad.");
            return;
        }

        setIsSavingBasic(true);
        try {
            // Construct the updated doctor object based on current profile + form edits
            const updatedDoctor = {
                ...userProfile, // preserve non-edited fields like gender, location, etc.
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                email: formData.email,
                specialtyIds: formData.specialtyIds
            };

            const submitFormData = new FormData();
            submitFormData.append('doctor', JSON.stringify(updatedDoctor));
            
            if (profileImage) {
                submitFormData.append('profileImage', profileImage);
            }

            await updateDoctorProfile(submitFormData);
            
            toast.success("Información básica actualizada correctamente.");
            
            // In a real scenario, we might want to refresh the user profile in context here
            // reloadAuth() or similar depending on the context implementation.
            // For now, the user can refresh to see changes or we assume success.

        } catch (error: any) {
            toast.error(error.message || "Error al actualizar la información.");
        } finally {
            setIsSavingBasic(false);
        }
    };

    // --- File Management Handlers ---
    const openFileModal = (fileType: string, fileItem?: DoctorFile) => {
        setCurrentFileType(fileType);
        if (fileItem) {
            setFileToEdit(fileItem);
        } else {
            setFileToEdit(null);
        }
        setIsFileModalOpen(true);
    };

    const handleSaveFile = async (data: { fileName: string, description: string, file: File | null, fileType: string }) => {
        setIsFileSaving(true);
        try {
            const formData = new FormData();
            formData.append('fileName', data.fileName);
            formData.append('fileType', data.fileType);
            formData.append('description', data.description);
            if (data.file) {
                formData.append('file', data.file);
            }

            if (fileToEdit) {
                await updateDoctorFile(fileToEdit.id, formData);
                toast.success('Documento actualizado exitosamente');
            } else {
                if (!data.file) {
                    toast.error('Debe seleccionar un archivo para subir');
                    setIsFileSaving(false);
                    return;
                }
                await uploadDoctorFile(formData);
                toast.success('Documento agregado exitosamente');
            }
            
            setIsFileModalOpen(false);
            loadDoctorFiles(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar el documento');
        } finally {
            setIsFileSaving(false);
        }
    };

    const handleDeleteFile = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
        try {
            await deleteDoctorFile(id);
            toast.success('Documento eliminado');
            loadDoctorFiles();
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar el documento');
        }
    };

    // Filter files by type
    const pregradoFiles = doctorFiles.filter(f => f.fileType === 'PREGRADO');
    const postgradoFiles = doctorFiles.filter(f => f.fileType === 'POSTGRADO');
    const otrosEstudiosFiles = doctorFiles.filter(f => f.fileType === 'OTROS_ESTUDIOS');
    const certificacionFiles = doctorFiles.filter(f => f.fileType === 'CERTIFICACION');
    const experienciaFiles = doctorFiles.filter(f => f.fileType === 'EXPERIENCIA');

    const displayProfile = userProfile || {};

    return (
        <div className="space-y-10 font-outfit max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/specialist" className="inline-flex items-center gap-2 text-slate-500 hover:text-alteha-turquoise transition-colors mb-4 font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Editar Perfil Profesional</h1>
                    <p className="text-slate-500 font-medium">Gestiona tus credenciales y aumenta tu valoración en la red</p>
                </div>
                <div className="flex items-center gap-6">
                    <Link 
                        href={`/doctor/${displayProfile.id || 'preview'}`} 
                        target="_blank"
                        className="flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-alteha-turquoise hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                        <Eye className="w-5 h-5" />
                        Ver perfil completo Alteha
                    </Link>
                    <Link href="/dashboard/specialist" className="hidden md:block hover:scale-110 transition-transform">
                        <Logo className="w-12 h-12" />
                    </Link>
                </div>
            </div>

            {/* Profile Picture & Basic Info */}
            <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col md:flex-row items-start gap-10">
                        <div className="relative group shrink-0">
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                                {profileImagePreview || displayProfile.profileImageUrl ? (
                                    <img src={profileImagePreview || displayProfile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <img src="/doctor-avatar.png" alt="Profile" className="w-full h-full object-cover opacity-50" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-3 bg-alteha-violet text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                                <Upload className="w-4 h-4" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                            </label>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <Input
                                label="Nombres"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder={isLoadingProfile ? "Cargando..." : "Nombres"}
                            />
                            <Input
                                label="Apellidos"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder={isLoadingProfile ? "Cargando..." : "Apellidos"}
                            />
                            <div>
                                <Input
                                    label="Correo Electrónico"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder={isLoadingProfile ? "Cargando..." : "Email"}
                                    className="mb-2"
                                />
                                {!emailVerified && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-amber-700 text-sm font-bold">
                                            <AlertCircle className="w-4 h-4" />
                                            Requiere Verificación
                                        </div>
                                        {!emailSent ? (
                                            <Button 
                                                onClick={handleSendEmailToken} 
                                                disabled={loadingEmail}
                                                className="w-full bg-slate-900 text-white rounded-xl py-2 font-bold"
                                            >
                                                {loadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Código al Correo"}
                                            </Button>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={emailToken}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                        setEmailToken(val);
                                                        if (val.length === 6) {
                                                            handleVerifyEmail(val);
                                                        }
                                                    }}
                                                    placeholder="Código de 6 dígitos"
                                                    className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-center font-black tracking-[0.5em] text-lg outline-none focus:border-amber-400 transition-colors placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400"
                                                    disabled={loadingEmail}
                                                />
                                                {loadingEmail && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {emailSent && emailCountdown === 0 && (
                                            <button onClick={handleSendEmailToken} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                                                Reenviar Código
                                            </button>
                                        )}
                                        {emailCountdown > 0 && (
                                            <p className="text-xs text-amber-600 font-medium text-center">
                                                Podrás solicitar otro código en {formatCountdown(emailCountdown)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <Input
                                    label="Teléfono de Contacto"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder={isLoadingProfile ? "Cargando..." : "Teléfono"}
                                    className="mb-2"
                                />
                                {!phoneVerified && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-amber-700 text-sm font-bold">
                                            <AlertCircle className="w-4 h-4" />
                                            Requiere Verificación
                                        </div>
                                        {!phoneSent ? (
                                            <Button 
                                                onClick={handleSendSmsToken} 
                                                disabled={loadingSms}
                                                className="w-full bg-slate-900 text-white rounded-xl py-2 font-bold"
                                            >
                                                {loadingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar SMS con Código"}
                                            </Button>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={phoneToken}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                        setPhoneToken(val);
                                                        if (val.length === 6) {
                                                            handleVerifyPhone(val);
                                                        }
                                                    }}
                                                    placeholder="Código de 6 dígitos"
                                                    className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-center font-black tracking-[0.5em] text-lg outline-none focus:border-amber-400 transition-colors placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400"
                                                    disabled={loadingSms}
                                                />
                                                {loadingSms && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {phoneSent && smsCountdown === 0 && (
                                            <button onClick={handleSendSmsToken} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                                                Reenviar SMS
                                            </button>
                                        )}
                                        {smsCountdown > 0 && (
                                            <p className="text-xs text-amber-600 font-medium text-center">
                                                Podrás solicitar otro SMS en {formatCountdown(smsCountdown)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Specialties Section */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-alteha-turquoise" />
                            Especialidades Médicas
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Selecciona las especialidades en las que ofreces servicios. Esto determinará qué subastas podrás ver y participar.
                        </p>
                        
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                            {specialtiesList.map((spec) => (
                                <button
                                    key={spec.id}
                                    type="button"
                                    onClick={() => toggleSpecialty(spec.id)}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${formData.specialtyIds.includes(spec.id)
                                        ? 'bg-alteha-turquoise text-white shadow-lg shadow-alteha-turquoise/20'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    {spec.name}
                                    {formData.specialtyIds.includes(spec.id) && <CheckCircle className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button 
                            onClick={handleSaveBasicInfo}
                            disabled={isSavingBasic}
                            className="bg-alteha-turquoise text-white font-black px-8 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg"
                        >
                            {isSavingBasic ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
                            ) : (
                                <><Save className="w-5 h-5 mr-2" /> Guardar Información</>
                            )}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Tabs for Credentials */}
            <div className="flex gap-2 p-2 bg-slate-100 rounded-3xl w-fit">
                <TabButton
                    active={activeTab === 'academic'}
                    onClick={() => setActiveTab('academic')}
                    icon={GraduationCap}
                    label="Académico"
                />
                <TabButton
                    active={activeTab === 'certifications'}
                    onClick={() => setActiveTab('certifications')}
                    icon={Award}
                    label="Certificaciones"
                />
                <TabButton
                    active={activeTab === 'experience'}
                    onClick={() => setActiveTab('experience')}
                    icon={Briefcase}
                    label="Experiencia"
                />
                <TabButton
                    active={activeTab === 'collection'}
                    onClick={() => setActiveTab('collection')}
                    icon={Wallet}
                    label="Métodos de cobro"
                />
                <TabButton
                    active={activeTab === 'payment'}
                    onClick={() => setActiveTab('payment')}
                    icon={CreditCard}
                    label="Métodos de pago"
                />
            </div>

            {/* Dynamic Section Content */}
            <section className="space-y-8">
                {activeTab === 'academic' && (
                    <div className="space-y-6">
                        <CredentialGroup
                            title="Pregrado"
                            subtitle="Títulos de medicina general"
                            items={pregradoFiles}
                            onAdd={() => openFileModal('PREGRADO')}
                            onEdit={(item: DoctorFile) => openFileModal('PREGRADO', item)}
                            onDelete={handleDeleteFile}
                        />
                        <CredentialGroup
                            title="Postgrado / Especialidad"
                            subtitle="Estudios de especialización"
                            items={postgradoFiles}
                            onAdd={() => openFileModal('POSTGRADO')}
                            onEdit={(item: DoctorFile) => openFileModal('POSTGRADO', item)}
                            onDelete={handleDeleteFile}
                        />
                        <CredentialGroup
                            title="Otros Estudios"
                            subtitle="Diplomados y cursos de formación"
                            items={otrosEstudiosFiles}
                            onAdd={() => openFileModal('OTROS_ESTUDIOS')}
                            onEdit={(item: DoctorFile) => openFileModal('OTROS_ESTUDIOS', item)}
                            onDelete={handleDeleteFile}
                        />
                    </div>
                )}

                {activeTab === 'certifications' && (
                    <div className="space-y-6">
                        <CredentialGroup
                            title="Certificaciones Médicas"
                            subtitle="Colegios y asociaciones"
                            items={certificacionFiles}
                            onAdd={() => openFileModal('CERTIFICACION')}
                            onEdit={(item: DoctorFile) => openFileModal('CERTIFICACION', item)}
                            onDelete={handleDeleteFile}
                        />
                    </div>
                )}

                {activeTab === 'experience' && (
                    <div className="space-y-6">
                        <CredentialGroup
                            title="Experiencia Internacional y Logros"
                            subtitle="Investigaciones, premios o experiencia destacada"
                            items={experienciaFiles}
                            onAdd={() => openFileModal('EXPERIENCIA')}
                            onEdit={(item: DoctorFile) => openFileModal('EXPERIENCIA', item)}
                            onDelete={handleDeleteFile}
                        />
                        {experienciaFiles.length === 0 && (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] flex flex-col items-center text-center">
                                <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                                <h4 className="font-bold text-slate-500">¿Tienes experiencia internacional o investigaciones?</h4>
                                <p className="text-slate-400 text-sm max-w-xs mt-2">Agrega tus logros más destacados para que las aseguradoras te elijan.</p>
                                <Button variant="outline" onClick={() => openFileModal('EXPERIENCIA')} className="mt-6 border-slate-200 text-slate-600 rounded-xl">
                                    Agregar Experiencia
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'collection' && (
                    <div className="space-y-6">
                        <CredentialGroup
                            title="Cuentas Bancarias para Cobros"
                            subtitle="Donde recibirás tus pagos por servicios prestados"
                            items={[]}
                        />
                        <div className="bg-alteha-turquoise/5 border border-alteha-turquoise/20 p-8 rounded-[2.5rem]">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-alteha-turquoise" />
                                Información de Cobro
                            </h4>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Agrega las cuentas bancarias nacionales o internacionales donde deseas que ALTEHA liquide tus honorarios médicos después de cada procedimiento exitoso.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="space-y-6">
                        <CredentialGroup
                            title="Tarjetas y Métodos de Pago"
                            subtitle="Configura cómo pagarás suscripciones o servicios adicionales"
                            items={[]}
                        />
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                            <h4 className="font-bold mb-2 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-alteha-turquoise" />
                                Pagos Seguros
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Mantén un método de pago activo para servicios premium o reactivación de cuenta si es necesario. ALTEHA protege tus datos financieros con los más altos estándares de seguridad.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <FileModal
                isOpen={isFileModalOpen}
                onClose={() => setIsFileModalOpen(false)}
                fileToEdit={fileToEdit}
                fileType={currentFileType}
                onSave={handleSaveFile}
                isLoading={isFileSaving}
            />
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${active ? 'bg-white text-alteha-violet shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}

function CredentialGroup({ title, subtitle, items, onAdd, onEdit, onDelete }: any) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all duration-300">
            <div className="flex items-center justify-between cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-alteha-violet/10 text-alteha-violet' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                        <p className="text-slate-400 text-sm font-medium">{subtitle}</p>
                    </div>
                </div>
                {onAdd && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAdd(); }} 
                        className="flex items-center gap-2 text-alteha-turquoise font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform bg-alteha-turquoise/5 px-4 py-2 rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="space-y-4 mt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                    {items && items.length > 0 ? items.map((item: any, i: number) => (
                        <div key={item.id || i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-alteha-violet/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-alteha-violet">
                                    <FileCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">
                                        {item.fileUrl ? (
                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-alteha-violet">
                                                {item.fileName}
                                            </a>
                                        ) : (
                                            item.fileName || item.title
                                        )}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        {item.description || item.institution} • <span className="text-slate-400">
                                            {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : item.date}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEdit && (
                                    <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-alteha-violet bg-white rounded-lg shadow-sm transition-all hover:scale-105">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm transition-all hover:scale-105">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm">Completa tu perfil profesional</h4>
                                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                                    Los pacientes confían más en especialistas con credenciales verificadas. Sube tu {title.toLowerCase()} para aumentar tu visibilidad en Alteha.
                                </p>
                            </div>
                            {onAdd && (
                                <Button 
                                    onClick={(e) => { e.stopPropagation(); onAdd(); }} 
                                    variant="outline" 
                                    className="mt-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 text-xs rounded-xl"
                                >
                                    Subir mi primer documento
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function FileModal({ isOpen, onClose, onSave, fileToEdit, fileType, isLoading }: any) {
    if (!isOpen) return null;
    
    // We use a small internal state to track form edits
    const [fileName, setFileName] = useState(fileToEdit?.fileName || '');
    const [description, setDescription] = useState(fileToEdit?.description || '');
    const [file, setFile] = useState<File | null>(null);

    // Reset internal state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFileName(fileToEdit?.fileName || '');
            setDescription(fileToEdit?.description || '');
            setFile(null);
        }
    }, [isOpen, fileToEdit]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">
                    {fileToEdit ? 'Editar Documento' : 'Agregar Documento'}
                </h3>
                
                <div className="space-y-4">
                    <Input 
                        label="Nombre del documento (Ej. Título)" 
                        value={fileName} 
                        onChange={e => setFileName(e.target.value)} 
                        placeholder="Ej. Título de Médico Cirujano"
                    />
                    <Input 
                        label="Descripción / Institución" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        placeholder="Ej. Universidad Central de Venezuela"
                    />
                    
                    <div className="mt-6 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                            <Upload className="w-6 h-6 text-alteha-turquoise" />
                            <span className="text-sm font-bold text-slate-600 hover:text-alteha-violet">
                                {file ? file.name : (fileToEdit ? 'Cambiar archivo PDF/Imagen' : 'Seleccionar archivo PDF/Imagen')}
                            </span>
                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                        </label>
                        {fileToEdit && !file && (
                           <p className="text-xs text-slate-400 mt-3 font-medium">Actualmente subido: {fileToEdit.fileName}</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl border-slate-200 text-slate-600 font-bold">
                        Cancelar
                    </Button>
                    <Button 
                        disabled={isLoading || (!fileToEdit && !file) || !fileName}
                        onClick={() => onSave({ fileName, description, file, fileType })}
                        className="rounded-xl bg-alteha-turquoise text-white font-bold px-6"
                    >
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : 'Guardar Documento'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
