"use client";

import React, { useEffect, useState } from 'react';
import { 
    Star, 
    MapPin, 
    GraduationCap, 
    Award, 
    Clock, 
    Stethoscope,
    ShieldCheck,
    Mail,
    Phone,
    User,
    FileText,
    BookOpen,
    Trophy,
    ExternalLink,
    Download
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { getDoctorFiles } from '@/lib/api';

export default function PublicDoctorProfile() {
    const { id } = useParams();
    const { userProfile, isLoadingProfile } = useAuth();
    const [isLoaded, setIsLoaded] = useState(false);
    const [doctorFiles, setDoctorFiles] = useState<any[]>([]);

    useEffect(() => {
        setIsLoaded(true);
        getDoctorFiles()
            .then(files => setDoctorFiles(files))
            .catch(() => setDoctorFiles([]));
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (isLoadingProfile || !isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-16 h-16 border-4 border-alteha-turquoise border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const doctor = userProfile || {
        firstName: 'Doctor',
        lastName: 'Especialista',
        profileImageUrl: '/doctor-avatar.png',
        specialties: [{ name: 'Especialista General' }],
        rating: 5.0,
        totalReviews: 0,
        yearsOfExperience: 0,
        preferredClinics: []
    };

    // Group files by type
    const pregrado        = doctorFiles.filter(f => f.fileType === 'PREGRADO');
    const postgrado       = doctorFiles.filter(f => f.fileType === 'POSTGRADO');
    const otrosEstudios   = doctorFiles.filter(f => f.fileType === 'OTROS_ESTUDIOS');
    const certificaciones = doctorFiles.filter(f => f.fileType === 'CERTIFICACIONES_MEDICAS_EXPERIENCIAS');

    const credentialGroups = [
        { label: 'Pregrado',                          icon: GraduationCap, color: 'text-alteha-violet',   items: pregrado },
        { label: 'Postgrado / Especialidad',           icon: BookOpen,      color: 'text-alteha-turquoise',items: postgrado },
        { label: 'Otros Estudios',                    icon: FileText,      color: 'text-blue-500',        items: otrosEstudios },
        { label: 'Certificaciones y Experiencia',     icon: Award,         color: 'text-emerald-500',     items: certificaciones },
    ];

    const clinics = doctor.preferredClinics?.length > 0 ? doctor.preferredClinics : [
        { id: 1, name: 'Clínica Caracas', address: 'Av. Panteón, San Bernardino, Caracas', schedule: 'Lun a Vie - 08:00 AM a 12:00 PM', logoUrl: null },
        { id: 2, name: 'Centro Médico Docente La Trinidad', address: 'Av. Intercomunal La Trinidad, Caracas', schedule: 'Mar y Jue - 02:00 PM a 06:00 PM', logoUrl: null }
    ];

    return (
        <>
            {/* ─── Print Styles ─────────────────────────────────────────── */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #cv-print, #cv-print * { visibility: visible; }
                    #cv-print { 
                        position: fixed; top: 0; left: 0;
                        width: 210mm; min-height: 297mm;
                        padding: 0; margin: 0;
                    }
                    @page { size: A4; margin: 0; }
                }
            `}</style>

            {/* ─── Screen View ──────────────────────────────────────────── */}
            <div className="min-h-screen bg-slate-50 font-outfit selection:bg-alteha-turquoise/20 no-print">
                {/* Nav */}
                <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
                    <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
                        <Logo className="w-24 h-24" />
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-3 rounded-xl hover:bg-alteha-turquoise hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Descargar CV PDF
                        </button>
                    </div>
                </nav>

                {/* Hero */}
                <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-alteha-turquoise/10 to-transparent -z-10" />
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-alteha-violet/10 rounded-full blur-3xl -z-10" />
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white/60 backdrop-blur-xl border border-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row gap-10 items-center md:items-start">
                            <div className="relative group shrink-0">
                                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-slate-100">
                                    <img src={doctor.profileImageUrl || "/doctor-avatar.png"} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="absolute -bottom-4 -right-4 bg-white p-2.5 rounded-2xl shadow-lg border border-slate-50">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-xl flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 bg-alteha-violet/10 text-alteha-violet px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                                    <Stethoscope className="w-4 h-4" />
                                    Perfil Verificado
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
                                    Dr(a). {doctor.firstName} {doctor.lastName}
                                </h1>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                                    {doctor.specialties?.map((spec: any) => (
                                        <span key={spec.id} className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg text-sm font-semibold">{spec.name}</span>
                                    ))}
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-6 text-slate-500 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                        <span className="text-slate-900 font-bold text-lg">{doctor.rating || '5.0'}</span>
                                        <span>({doctor.totalReviews || 0} reseñas)</span>
                                    </div>
                                    <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-alteha-turquoise" />
                                        <span>{doctor.yearsOfExperience || '+5'} años de experiencia</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <section className="max-w-3xl mx-auto px-6 pb-32 space-y-10">

                    {/* About + Info General */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <GraduationCap className="w-6 h-6 text-alteha-violet" />
                            Acerca del Especialista
                        </h3>
                        <p className="text-slate-600 leading-relaxed mb-8">
                            Médico especialista comprometido con brindar una atención médica de la más alta calidad. 
                            Con formación continua y actualización constante en las últimas tecnologías y tratamientos 
                            médicos para asegurar el mejor pronóstico y bienestar de sus pacientes.
                        </p>
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-alteha-turquoise" />
                            Información General
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                                <Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Correo</p>
                                    <p className="text-slate-800 font-medium break-all">{doctor.email || 'dr.especialista@alteha.com'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                                <Phone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Teléfono</p>
                                    <p className="text-slate-800 font-medium">{doctor.phone || '+58 412 123 4567'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                                <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Identificación</p>
                                    <p className="text-slate-800 font-medium">{doctor.identificationNumber ? `${doctor.identificationType || 'V'}-${doctor.identificationNumber}` : 'V-12345678'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                                <Award className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Nº MPPS / Registro</p>
                                    <p className="text-slate-800 font-medium">{doctor.healthLicenseNumber || 'MPPS-98765'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clinics */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-alteha-turquoise" />
                            Centros de Atención
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {clinics.map((clinic: any) => (
                                <div key={clinic.id} className="border border-slate-100 p-5 rounded-3xl hover:border-alteha-turquoise/30 hover:shadow-lg transition-all flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                                            {clinic.logoUrl ? <img src={clinic.logoUrl} alt={clinic.name} className="w-full h-full object-contain" /> : <span className="text-xl font-black text-slate-300">{clinic.name.charAt(0)}</span>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 line-clamp-2">{clinic.name}</h4>
                                            <p className="text-xs font-bold text-alteha-turquoise uppercase tracking-wider mt-1">Presencial</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-slate-50">
                                        <div className="flex items-start gap-2 text-sm text-slate-500">
                                            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                                            <span>{clinic.address || 'Dirección no especificada'}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-slate-500">
                                            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                                            <span>{clinic.schedule || 'Horario por definir'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || clinic.name)}`, '_blank')}
                                        className="w-full bg-slate-50 hover:bg-alteha-turquoise hover:text-white text-slate-700 font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        Ver ubicación
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Credentials */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <GraduationCap className="w-6 h-6 text-alteha-violet" />
                            Formación y Credenciales
                        </h3>
                        {credentialGroups.every(g => g.items.length === 0) ? (
                            <p className="text-slate-400 italic text-sm text-center py-6">Este especialista aún no ha cargado sus credenciales académicas.</p>
                        ) : (
                            <div className="space-y-8">
                                {credentialGroups.map(group => {
                                    const Icon = group.icon;
                                    if (group.items.length === 0) return null;
                                    return (
                                        <div key={group.label}>
                                            <h4 className={`font-bold text-base mb-3 flex items-center gap-2 ${group.color}`}>
                                                <Icon className="w-5 h-5" />{group.label}
                                            </h4>
                                            <div className="space-y-3">
                                                {group.items.map((item: any) => (
                                                    <div key={item.id} className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl">
                                                        <div className={`p-2.5 rounded-xl bg-white border border-slate-100 shrink-0 ${group.color}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-800">{item.fileName || item.name || 'Documento'}</p>
                                                            {item.description && <p className="text-sm text-slate-500 mt-1">{item.description}</p>}
                                                        </div>
                                                        {item.fileUrl && (
                                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-alteha-turquoise hover:border-alteha-turquoise/30 transition-colors">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* ─── Print / PDF View (hidden on screen) ─────────────────── */}
            <div id="cv-print" style={{ display: 'none' }}>
                <style>{`
                    @media print {
                        #cv-print { display: block !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                    #cv-print {
                        font-family: 'Outfit', 'Inter', sans-serif;
                        width: 210mm;
                        min-height: 297mm;
                        background: white;
                        color: #0f172a;
                    }
                    .cv-header {
                        background: linear-gradient(135deg, #0d9488 0%, #7c3aed 100%);
                        padding: 32px 40px;
                        color: white;
                        display: flex;
                        align-items: center;
                        gap: 28px;
                    }
                    .cv-photo {
                        width: 110px; height: 110px;
                        border-radius: 20px;
                        object-fit: cover;
                        border: 3px solid rgba(255,255,255,0.4);
                        flex-shrink: 0;
                    }
                    .cv-name { font-size: 28px; font-weight: 900; margin: 0 0 4px 0; }
                    .cv-badge {
                        display: inline-block;
                        background: rgba(255,255,255,0.2);
                        border-radius: 999px;
                        padding: 2px 12px;
                        font-size: 11px;
                        font-weight: 700;
                        margin-bottom: 10px;
                    }
                    .cv-specs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
                    .cv-spec-tag {
                        background: rgba(255,255,255,0.2);
                        border-radius: 6px;
                        padding: 3px 10px;
                        font-size: 11px;
                        font-weight: 600;
                    }
                    .cv-logo-bar {
                        display: flex; justify-content: space-between; align-items: center;
                        padding: 10px 40px;
                        border-bottom: 2px solid #0d9488;
                        font-size: 11px;
                        color: #64748b;
                    }
                    .cv-body { padding: 24px 40px; }
                    .cv-section { margin-bottom: 24px; }
                    .cv-section-title {
                        font-size: 13px; font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        color: #0d9488;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 4px;
                        margin-bottom: 12px;
                    }
                    .cv-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                    .cv-info-item { font-size: 12px; color: #334155; line-height: 1.5; }
                    .cv-info-label { font-weight: 700; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
                    .cv-clinic { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; font-size: 12px; }
                    .cv-clinic-name { font-weight: 700; color: #0f172a; }
                    .cv-clinic-detail { color: #64748b; margin-top: 2px; }
                    .cv-cred-group { margin-bottom: 14px; }
                    .cv-cred-group-title { font-weight: 700; color: #7c3aed; font-size: 12px; margin-bottom: 6px; }
                    .cv-cred-item { background: #f8fafc; border-radius: 8px; padding: 8px 12px; margin-bottom: 5px; font-size: 12px; }
                    .cv-cred-name { font-weight: 600; color: #0f172a; }
                    .cv-cred-desc { color: #64748b; font-size: 11px; }
                    .cv-footer {
                        position: fixed; bottom: 0; left: 0; right: 0;
                        background: #f8fafc; border-top: 1px solid #e2e8f0;
                        padding: 8px 40px;
                        font-size: 10px; color: #94a3b8;
                        display: flex; justify-content: space-between;
                    }
                `}</style>

                {/* Header */}
                <div className="cv-header">
                    <img
                        src={doctor.profileImageUrl || '/doctor-avatar.png'}
                        className="cv-photo"
                        alt="profile"
                    />
                    <div style={{ flex: 1 }}>
                        <div className="cv-badge">✓ Perfil Verificado Alteha</div>
                        <h1 className="cv-name">Dr(a). {doctor.firstName} {doctor.lastName}</h1>
                        <div className="cv-specs">
                            {doctor.specialties?.map((s: any) => (
                                <span key={s.id} className="cv-spec-tag">{s.name}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Logo bar */}
                <div className="cv-logo-bar">
                    <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '14px' }}>alteha</span>
                    <span>Curriculum Médico Profesional — Generado por Alteha</span>
                    <span>{new Date().toLocaleDateString('es-VE', { day:'2-digit', month:'long', year:'numeric' })}</span>
                </div>

                <div className="cv-body">
                    {/* Información General */}
                    <div className="cv-section">
                        <div className="cv-section-title">Información General</div>
                        <div className="cv-grid-2">
                            <div className="cv-info-item">
                                <div className="cv-info-label">Correo Electrónico</div>
                                {doctor.email || 'dr.especialista@alteha.com'}
                            </div>
                            <div className="cv-info-item">
                                <div className="cv-info-label">Teléfono</div>
                                {doctor.phone || '+58 412 123 4567'}
                            </div>
                            <div className="cv-info-item">
                                <div className="cv-info-label">Identificación</div>
                                {doctor.identificationNumber ? `${doctor.identificationType || 'V'}-${doctor.identificationNumber}` : 'V-12345678'}
                            </div>
                            <div className="cv-info-item">
                                <div className="cv-info-label">Nº MPPS / Registro</div>
                                {doctor.healthLicenseNumber || 'MPPS-98765'}
                            </div>
                        </div>
                    </div>

                    {/* Centros de Atención */}
                    <div className="cv-section">
                        <div className="cv-section-title">Centros de Atención</div>
                        <div className="cv-grid-2">
                            {clinics.map((clinic: any) => (
                                <div key={clinic.id} className="cv-clinic">
                                    <div className="cv-clinic-name">{clinic.name}</div>
                                    <div className="cv-clinic-detail">{clinic.address || 'Dirección no especificada'}</div>
                                    <div className="cv-clinic-detail">{clinic.schedule || 'Horario por definir'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formación y Credenciales */}
                    <div className="cv-section">
                        <div className="cv-section-title">Formación y Credenciales</div>
                        {credentialGroups.every(g => g.items.length === 0) ? (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                                Sin credenciales académicas registradas aún.
                            </p>
                        ) : (
                            credentialGroups.map(group => {
                                if (group.items.length === 0) return null;
                                return (
                                    <div key={group.label} className="cv-cred-group">
                                        <div className="cv-cred-group-title">{group.label}</div>
                                        {group.items.map((item: any) => (
                                            <div key={item.id} className="cv-cred-item">
                                                <div className="cv-cred-name">{item.fileName || item.name || 'Documento'}</div>
                                                {item.description && <div className="cv-cred-desc">{item.description}</div>}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="cv-footer">
                    <span>alteha.com — Red de Salud Digital</span>
                    <span>Este documento fue generado automáticamente desde el perfil verificado del especialista en Alteha.</span>
                    <span>Pág. 1</span>
                </div>
            </div>
        </>
    );
}
