"use client";

// Perfil del paciente: sus datos personales (solo lectura en esta fase).
import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/api';
import { User, Loader2, Mail, Smartphone, IdCard, Calendar, Venus } from 'lucide-react';

export default function PatientProfile() {
  const [p, setP] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getProfile('PATIENT').then((r) => setP(r?.data || null)).catch(() => {}).finally(() => setCargando(false));
  }, []);

  const edad = (() => {
    if (!p?.dateOfBirth) return null;
    const d = new Date(p.dateOfBirth), h = new Date();
    let a = h.getFullYear() - d.getFullYear();
    if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
    return a;
  })();

  if (cargando) return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!p) return <div className="p-8 text-slate-500">No se pudo cargar tu perfil.</div>;

  const nombre = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim();
  const datos = [
    { icon: IdCard, label: 'Cédula', value: p.identificationNumber },
    { icon: Calendar, label: 'Fecha de nacimiento', value: p.dateOfBirth ? `${p.dateOfBirth}${edad != null ? ` · ${edad} años` : ''}` : '—' },
    { icon: Venus, label: 'Sexo', value: p.gender === 'MASCULINO' ? 'Masculino' : p.gender === 'FEMENINO' ? 'Femenino' : '—' },
    { icon: Mail, label: 'Correo', value: p.email },
    { icon: Smartphone, label: 'Teléfono', value: p.phone },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-6">Mi perfil</h1>
      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center">
            {p.profileImageUrl ? <img src={p.profileImageUrl} className="w-full h-full rounded-2xl object-cover" /> : <User className="w-8 h-8" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">{nombre}</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-alteha-turquoise">Paciente</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {datos.map((d) => (
            <div key={d.label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0"><d.icon className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.label}</p>
                <p className="font-bold text-slate-700 text-sm break-all">{d.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
