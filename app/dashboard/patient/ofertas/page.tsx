"use client";

// Ofertas dentro del portal del paciente: mismos datos públicos, con filtros.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { contactarPrestador } from '@/lib/contactProvider';
import { Search, Package, Gavel, Loader2, Stethoscope, Building2, MapPin, Clock, Tag } from 'lucide-react';

const money = (n: any) => (n == null ? null : `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);

export default function PatientOffers() {
  const [tab, setTab] = useState<'packages' | 'auctions'>('packages');
  const [q, setQ] = useState('');
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [subastas, setSubastas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const contactar = async (t?: string, id?: number) => router.push(await contactarPrestador(t, id));

  useEffect(() => {
    setCargando(true);
    Promise.all([
      fetch('/api/public/offers/packages').then((r) => r.json()).then((r) => setPaquetes(r?.data || [])).catch(() => {}),
      fetch('/api/public/offers/auctions').then((r) => r.json()).then((r) => setSubastas(r?.data || [])).catch(() => {}),
    ]).finally(() => setCargando(false));
  }, []);

  const especialidades = useMemo(() => {
    const m = new Map<number, string>();
    [...paquetes, ...subastas].forEach((x: any) => { if (x.specialtyId && x.specialty) m.set(x.specialtyId, x.specialty); });
    return [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [paquetes, subastas]);

  const term = q.trim().toLowerCase();
  const m = (t?: string) => !term || (t || '').toLowerCase().includes(term);
  const pf = paquetes.filter((p) => (specialtyId == null || p.specialtyId === specialtyId) && (m(p.name) || m(p.description) || m(p.specialty) || m(p.providerName)));
  const sf = subastas.filter((s) => (specialtyId == null || s.specialtyId === specialtyId) && (m(s.title) || m(s.procedure) || m(s.specialty) || m(s.location)));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-5">Explorar ofertas</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar procedimiento, especialidad, clínica…"
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 font-semibold text-sm outline-none focus:border-alteha-turquoise" />
        </div>
        <select value={specialtyId ?? ''} onChange={(e) => setSpecialtyId(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-3 rounded-2xl bg-white border border-slate-200 font-bold text-sm outline-none min-w-[190px]">
          <option value="">Todas las especialidades</option>
          {especialidades.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('packages')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm ${tab === 'packages' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}><Package className="w-4 h-4" /> Paquetes ({pf.length})</button>
        <button onClick={() => setTab('auctions')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm ${tab === 'auctions' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}><Gavel className="w-4 h-4" /> Subastas ({sf.length})</button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : tab === 'packages' ? (
        pf.length === 0 ? <Vacio /> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pf.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
              {p.specialty && <span className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise">{p.specialty}</span>}
              <h3 className="font-black text-slate-800 mt-1 leading-snug">{p.name}</h3>
              {p.description && <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mt-3">
                {p.providerType === 'CLINIC' ? <Building2 className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}{p.providerName || 'Prestador'}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">{money(p.discountedPrice ?? p.basePrice) || 'Consultar'}</span>
                {p.category && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Tag className="w-3 h-3" />{p.category}</span>}
              </div>
              <button onClick={() => contactar(p.providerType, p.providerId)}
                className="w-full mt-3 bg-slate-900 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">Contactar</button>
            </div>
          ))}
        </div>
      ) : (
        sf.length === 0 ? <Vacio /> : <div className="grid sm:grid-cols-2 gap-4">
          {sf.map((s) => (
            <div key={s.auctionNumber} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                {s.specialty && <span className="text-[10px] font-black uppercase tracking-widest text-alteha-violet">{s.specialty}</span>}
                {s.urgency && <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{s.urgency}</span>}
              </div>
              <h3 className="font-black text-slate-800 mt-1.5 leading-snug">{s.title}</h3>
              {s.procedure && <p className="text-sm text-slate-500 mt-1">{s.procedure}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold mt-3">
                {s.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{s.location}</span>}
                {s.estimatedDate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.estimatedDate}</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{s.totalBids} oferta{s.totalBids === 1 ? '' : 's'}</span>
                {s.currentLowestBid != null && <span className="text-sm font-black text-emerald-600">Mejor {money(s.currentLowestBid)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Vacio() {
  return <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl"><Search className="w-10 h-10 mx-auto text-slate-300 mb-2" /><p className="text-slate-500 font-semibold text-sm">Sin resultados para tu búsqueda.</p></div>;
}
