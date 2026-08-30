"use client";

// Inicio del portal del paciente: saludo + accesos rápidos.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/api';
import { User, Gavel, Search, ShieldCheck, Users, Sparkles } from 'lucide-react';

export default function PatientHome() {
  const [nombre, setNombre] = useState('');
  useEffect(() => {
    getProfile('PATIENT').then((r) => {
      const p: any = r?.data || {};
      setNombre(p.firstName || p.fullName || '');
    }).catch(() => {});
  }, []);

  const accesos = [
    { href: '/dashboard/patient/ofertas', icon: Search, t: 'Explorar ofertas', d: 'Paquetes, servicios y subastas activas, con filtros.' },
    { href: '/dashboard/patient/perfil', icon: User, t: 'Mi perfil', d: 'Revisa tus datos personales.' },
    { href: '/dashboard/patient/referir', icon: Users, t: 'Referir a alguien', d: 'Invita a un familiar o amigo a Alteha.' },
    { href: '/dashboard/patient/seguridad', icon: ShieldCheck, t: 'Seguridad', d: 'Cambia tu contraseña.' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center"><User className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Hola{nombre ? `, ${nombre}` : ''} 👋</h1>
          <p className="text-slate-500 text-sm">Bienvenido a tu portal en Alteha.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {accesos.map((a) => (
          <Link key={a.href} href={a.href} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center mb-4"><a.icon className="w-6 h-6" /></div>
            <h3 className="font-black text-slate-800 mb-1">{a.t}</h3>
            <p className="text-sm text-slate-500">{a.d}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-br from-alteha-turquoise/10 to-alteha-violet/10 border border-alteha-turquoise/20 rounded-2xl p-6 flex items-start gap-4">
        <Gavel className="w-6 h-6 text-alteha-violet flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-black text-slate-800 flex items-center gap-2">Crea tu propia subasta <Sparkles className="w-4 h-4 text-amber-400" /></h3>
          <p className="text-sm text-slate-500 mt-1">Muy pronto podrás publicar tu caso para que médicos y clínicas compitan por atenderte al mejor precio.</p>
        </div>
      </div>
    </div>
  );
}
