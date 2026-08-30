"use client";

// Vitrina pública de ofertas para el cliente final (sin login): paquetes y
// servicios de médicos y clínicas, y subastas activas del mercado. Con filtros.
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Package, Gavel, Loader2, Stethoscope, Building2, MapPin, Clock, Tag, Sparkles,
} from 'lucide-react';

type Paquete = {
  id: number; name: string; description?: string; basePrice?: number; discountedPrice?: number;
  category?: string; imageUrl?: string; specialtyId?: number; specialty?: string;
  providerName?: string; providerType?: string;
};
type Subasta = {
  auctionNumber: string; title: string; specialtyId?: number; specialty?: string; procedure?: string;
  location?: string; urgency?: string; estimatedDate?: string; endDate?: string;
  totalBids: number; currentLowestBid?: number;
};

const money = (n: any) => (n == null ? null : `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);

export default function OfertasPage() {
  const [tab, setTab] = useState<'packages' | 'auctions'>('packages');
  const [q, setQ] = useState('');
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    Promise.all([
      fetch('/api/public/offers/packages').then((r) => r.json()).then((r) => setPaquetes(r?.data || [])).catch(() => {}),
      fetch('/api/public/offers/auctions').then((r) => r.json()).then((r) => setSubastas(r?.data || [])).catch(() => {}),
    ]).finally(() => setCargando(false));
  }, []);

  // Filtro de especialidades derivado de lo que hay en los resultados.
  const especialidades = useMemo(() => {
    const m = new Map<number, string>();
    [...paquetes, ...subastas].forEach((x: any) => { if (x.specialtyId && x.specialty) m.set(x.specialtyId, x.specialty); });
    return [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [paquetes, subastas]);

  const term = q.trim().toLowerCase();
  const matches = (txt?: string) => !term || (txt || '').toLowerCase().includes(term);

  const paquetesFiltrados = paquetes.filter((p) =>
    (specialtyId == null || p.specialtyId === specialtyId) &&
    (matches(p.name) || matches(p.description) || matches(p.specialty) || matches(p.providerName)));
  const subastasFiltradas = subastas.filter((s) =>
    (specialtyId == null || s.specialtyId === specialtyId) &&
    (matches(s.title) || matches(s.procedure) || matches(s.specialty) || matches(s.location)));

  return (
    <div className="min-h-screen bg-slate-50 font-outfit">
      {/* Encabezado */}
      <div className="bg-gradient-to-br from-alteha-turquoise via-blue-500 to-alteha-violet text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>
          <h1 className="text-3xl md:text-4xl font-black mt-6 tracking-tight">Explora las ofertas de Alteha</h1>
          <p className="text-white/90 mt-2 max-w-2xl">Paquetes y servicios de médicos y clínicas, y subastas activas del mercado. Sin necesidad de registrarte.</p>

          {/* Buscador */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar procedimiento, especialidad, clínica…"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-800 font-semibold outline-none shadow-lg" />
            </div>
            <select value={specialtyId ?? ''} onChange={(e) => setSpecialtyId(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-3.5 rounded-2xl bg-white text-slate-800 font-bold text-sm outline-none shadow-lg min-w-[200px]">
              <option value="">Todas las especialidades</option>
              {especialidades.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Pestañas */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('packages')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm ${tab === 'packages' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            <Package className="w-4 h-4" /> Paquetes y servicios ({paquetesFiltrados.length})
          </button>
          <button onClick={() => setTab('auctions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm ${tab === 'auctions' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            <Gavel className="w-4 h-4" /> Subastas activas ({subastasFiltradas.length})
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-7 h-7 animate-spin" /></div>
        ) : tab === 'packages' ? (
          paquetesFiltrados.length === 0 ? <Vacio texto="No hay paquetes que coincidan con tu búsqueda." />
          : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paquetesFiltrados.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="h-36 w-full object-cover" />
                    : <div className="h-36 w-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center"><Package className="w-10 h-10 text-slate-300" /></div>}
                  <div className="p-5 flex flex-col flex-1">
                    {p.specialty && <span className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise">{p.specialty}</span>}
                    <h3 className="font-black text-slate-800 mt-1 leading-snug">{p.name}</h3>
                    {p.description && <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mt-3">
                      {p.providerType === 'CLINIC' ? <Building2 className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                      {p.providerName || 'Prestador Alteha'}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        {p.discountedPrice != null && p.discountedPrice !== p.basePrice && (
                          <span className="text-xs text-slate-400 line-through mr-1">{money(p.basePrice)}</span>
                        )}
                        <span className="text-lg font-black text-slate-900">{money(p.discountedPrice ?? p.basePrice) || 'Consultar'}</span>
                      </div>
                      {p.category && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Tag className="w-3 h-3" />{p.category}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
        ) : (
          subastasFiltradas.length === 0 ? <Vacio texto="No hay subastas activas que coincidan con tu búsqueda." />
          : <div className="grid sm:grid-cols-2 gap-5">
              {subastasFiltradas.map((s) => (
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
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{s.totalBids} oferta{s.totalBids === 1 ? '' : 's'}</span>
                    {s.currentLowestBid != null && <span className="text-sm font-black text-emerald-600">Mejor oferta {money(s.currentLowestBid)}</span>}
                  </div>
                </div>
              ))}
            </div>
        )}

        {/* CTA registro */}
        <div className="mt-12 bg-white border border-slate-200 rounded-3xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-alteha-turquoise mx-auto mb-3" />
          <h3 className="text-xl font-black text-slate-800">¿Quieres tu propio precio?</h3>
          <p className="text-slate-500 mt-1 mb-5 max-w-xl mx-auto">Regístrate y crea tu subasta: médicos y clínicas competirán por atenderte al mejor precio.</p>
          <Link href="/register/patient" className="inline-block bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm">Crear mi cuenta</Link>
        </div>
      </div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
      <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
      <p className="text-slate-500 font-semibold">{texto}</p>
    </div>
  );
}
