"use client";

// Subastas de pacientes (canal separado): casos publicados por clientes finales
// que el médico o la clínica puede revisar.
import { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api';
import { Users, Loader2, MapPin, Clock, Gavel } from 'lucide-react';

const money = (n: any) => (n == null ? null : `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);

export default function PatientAuctionsMarket() {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/patient/auctions/market', { headers: { 'X-Alteha-Token': getStoredToken() || '' } })
      .then((r) => r.json()).then((r) => setItems(r?.data || [])).catch(() => {}).finally(() => setCargando(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2"><Users className="w-6 h-6 text-alteha-turquoise" /> Subastas de pacientes</h1>
      <p className="text-slate-500 text-sm mb-6">Casos publicados directamente por clientes finales. Un canal aparte de las aseguradoras.</p>

      {cargando ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
          <Gavel className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-semibold">Aún no hay subastas de pacientes.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                {a.specialty && <span className="text-[10px] font-black uppercase tracking-widest text-alteha-violet">{a.specialty}</span>}
                {a.urgency && <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{a.urgency}</span>}
              </div>
              <h3 className="font-black text-slate-800 mt-1.5 leading-snug">{a.title}</h3>
              {a.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{a.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold mt-3">
                {a.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{a.location}</span>}
                {a.estimatedDate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.estimatedDate}</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{a.totalBids} oferta{a.totalBids === 1 ? '' : 's'}</span>
                {a.maxBudget != null && <span className="text-sm font-black text-slate-700">Ref. {money(a.maxBudget)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
