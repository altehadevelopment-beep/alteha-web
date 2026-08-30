"use client";

// Crear una subasta como paciente. Formulario con lo esencial; el caso queda
// PUBLICADO para que médicos y clínicas puedan verlo y ofertar.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/api';
import { Gavel, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const URGENCIAS = [
  { v: 'LOW', t: 'Baja' }, { v: 'MEDIUM', t: 'Media' }, { v: 'HIGH', t: 'Alta' }, { v: 'CRITICAL', t: 'Crítica' },
];
const PAGOS = [
  { v: 'BS_BANK_TRANSFER', t: 'Transferencia en Bs' },
  { v: 'USD_CASH', t: 'Efectivo en USD' },
  { v: 'USD_ZELLE', t: 'Zelle' },
];

export default function NewPatientAuction() {
  const router = useRouter();
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<any>({
    title: '', description: '', specialtyId: '', preferredLocation: '', urgencyLevel: 'MEDIUM',
    estimatedSurgeryDate: '', maxBudget: '', doctorBudget: '', clinicBudget: '',
    requiresHospitalization: false, allowedPaymentMethods: ['BS_BANK_TRANSFER'],
  });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/api/public/offers/packages').then(() => {}).catch(() => {});
    // Reutilizamos el catálogo público de especialidades vía /api/specialties si está,
    // pero por robustez lo dejamos opcional (la especialidad no es obligatoria).
    fetch('/api/specialties?page=0&size=200', { headers: { 'X-Alteha-Token': getStoredToken() || '' } })
      .then((r) => r.json()).then((d) => setEspecialidades(Array.isArray(d) ? d : (d?.content || []))).catch(() => {});
  }, []);

  const togglePago = (v: string) =>
    set('allowedPaymentMethods', f.allowedPaymentMethods.includes(v)
      ? f.allowedPaymentMethods.filter((x: string) => x !== v)
      : [...f.allowedPaymentMethods, v]);

  const publicar = async () => {
    if (!f.title.trim()) { setError('Escribe un título para tu subasta.'); return; }
    if (!f.allowedPaymentMethods.length) { setError('Elige al menos un método de pago.'); return; }
    setBusy(true); setError(null);
    try {
      const payload: any = {
        title: f.title.trim(),
        description: f.description.trim(),
        preferredLocation: f.preferredLocation.trim(),
        urgencyLevel: f.urgencyLevel,
        requiresHospitalization: f.requiresHospitalization,
        allowedPaymentMethods: f.allowedPaymentMethods,
      };
      if (f.specialtyId) payload.specialty = { id: Number(f.specialtyId) };
      if (f.estimatedSurgeryDate) payload.estimatedSurgeryDate = f.estimatedSurgeryDate;
      if (f.maxBudget) payload.maxBudget = Number(f.maxBudget);
      if (f.doctorBudget) payload.doctorBudget = Number(f.doctorBudget);
      if (f.clinicBudget) payload.clinicBudget = Number(f.clinicBudget);
      const r = await fetch('/api/patient/auctions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': getStoredToken() || '' },
        body: JSON.stringify(payload),
      }).then((x) => x.json());
      if (r?.code === '00') router.push('/dashboard/patient/subastas');
      else setError(r?.message || 'No se pudo publicar la subasta.');
    } catch { setError('No se pudo publicar la subasta.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/patient/subastas" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Mis subastas</Link>
      <h1 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2"><Gavel className="w-6 h-6 text-alteha-turquoise" /> Crear subasta</h1>
      <p className="text-slate-500 text-sm mb-6">Publica tu caso para que médicos y clínicas compitan por atenderte.</p>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm font-semibold">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-3xl p-7 space-y-4">
        <Campo label="¿Qué necesitas? (título)" value={f.title} onChange={(v: string) => set('title', v)} placeholder="Ej. Colecistectomía laparoscópica" />
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalles</label>
          <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Describe tu caso, síntomas, estudios que tengas…"
            className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none text-sm resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Especialidad</label>
            <select value={f.specialtyId} onChange={(e) => set('specialtyId', e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm">
              <option value="">Sin especificar</option>
              {especialidades.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Urgencia</label>
            <select value={f.urgencyLevel} onChange={(e) => set('urgencyLevel', e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm">
              {URGENCIAS.map((u) => <option key={u.v} value={u.v}>{u.t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Ciudad / ubicación" value={f.preferredLocation} onChange={(v: string) => set('preferredLocation', v)} placeholder="Caracas" />
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha estimada</label>
            <input type="date" value={f.estimatedSurgeryDate} onChange={(e) => set('estimatedSurgeryDate', e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Presupuesto máximo (opcional, USD)</label>
          <input type="number" value={f.maxBudget} onChange={(e) => set('maxBudget', e.target.value)} placeholder="Ej. 6000"
            className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
          <p className="text-[11px] text-slate-400 mt-1">Es una referencia. Médicos y clínicas ofertarán su precio.</p>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Métodos de pago que aceptas</label>
          <div className="flex flex-wrap gap-2">
            {PAGOS.map((p) => (
              <button key={p.v} type="button" onClick={() => togglePago(p.v)}
                className={`px-4 py-2 rounded-xl text-xs font-black ${f.allowedPaymentMethods.includes(p.v) ? 'bg-alteha-turquoise text-white' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                {p.t}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.requiresHospitalization} onChange={(e) => set('requiresHospitalization', e.target.checked)} className="w-4 h-4 accent-alteha-turquoise" />
          <span className="text-sm font-semibold text-slate-700">Requiere hospitalización</span>
        </label>

        <button disabled={busy} onClick={publicar}
          className="w-full bg-alteha-turquoise text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Publicar subasta
        </button>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
    </div>
  );
}
