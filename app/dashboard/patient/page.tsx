"use client";

// Portal del paciente (placeholder de la Fase 1). El perfil, las ofertas con
// filtros, el cambio de contraseña y la creación de subastas llegan en las
// siguientes fases del portal del cliente final.
import Link from 'next/link';
import { User, Gavel, Search, Sparkles } from 'lucide-react';

export default function PatientDashboardPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center"><User className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Tu portal</h1>
          <p className="text-slate-500 text-sm">Bienvenido a Alteha. Aquí gestionarás tus subastas y verás las ofertas.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <Link href="/ofertas" className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center mb-4"><Search className="w-6 h-6" /></div>
          <h3 className="font-black text-slate-800 mb-1">Explorar ofertas</h3>
          <p className="text-sm text-slate-500">Mira los paquetes y servicios de médicos y clínicas, y las subastas activas.</p>
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 opacity-70">
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-alteha-violet flex items-center justify-center mb-4"><Gavel className="w-6 h-6" /></div>
          <h3 className="font-black text-slate-800 mb-1 flex items-center gap-2">Crear una subasta <Sparkles className="w-4 h-4 text-amber-400" /></h3>
          <p className="text-sm text-slate-500">Muy pronto podrás publicar tu caso para que médicos y clínicas te oferten.</p>
        </div>
      </div>
    </div>
  );
}
