"use client";

// Referir a otra persona: enlace de invitación compartible + WhatsApp.
import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/api';
import { Users, Copy, Check, MessageCircle, Gift } from 'lucide-react';

export default function PatientRefer() {
  const [ced, setCed] = useState('');
  const [nombre, setNombre] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    getProfile('PATIENT').then((r) => {
      const p: any = r?.data || {};
      setCed((p.identificationNumber || '').replace(/\D/g, ''));
      setNombre(p.firstName || p.fullName || '');
    }).catch(() => {});
  }, []);

  const enlace = typeof window !== 'undefined'
    ? `${window.location.origin}/register/patient${ced ? `?ref=${ced}` : ''}`
    : '';
  const mensaje = `¡Hola! Te invito a Alteha, donde médicos y clínicas compiten por darte el mejor precio en tu atención médica. Regístrate aquí: ${enlace}`;

  const copiar = () => {
    navigator.clipboard?.writeText(enlace).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1800); });
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2"><Users className="w-6 h-6 text-alteha-turquoise" /> Referir a alguien</h1>
      <p className="text-slate-500 text-sm mb-6">Comparte Alteha con un familiar o amigo.</p>

      <div className="bg-gradient-to-br from-alteha-turquoise/10 to-alteha-violet/10 border border-alteha-turquoise/20 rounded-3xl p-7 text-center mb-5">
        <Gift className="w-9 h-9 text-alteha-violet mx-auto mb-3" />
        <h2 className="font-black text-slate-800 text-lg">Invita y ayuda a otros a ahorrar</h2>
        <p className="text-sm text-slate-500 mt-1">Comparte tu enlace personal. Quien se registre desde él quedará vinculado a tu invitación.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tu enlace de invitación</label>
          <div className="flex gap-2 mt-1.5">
            <input readOnly value={enlace} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 font-semibold text-sm text-slate-600 outline-none" />
            <button onClick={copiar} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener"
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-2xl font-black text-sm hover:bg-emerald-600">
          <MessageCircle className="w-4 h-4" /> Compartir por WhatsApp
        </a>
      </div>
    </div>
  );
}
