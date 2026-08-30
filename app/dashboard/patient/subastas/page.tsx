"use client";

// Mis subastas (paciente): estado, presupuesto y ofertas recibidas de médicos/clínicas.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken } from '@/lib/api';
import { Gavel, Loader2, Plus, MapPin, Clock, Stethoscope, Building2 } from 'lucide-react';

const money = (n: any) => (n == null ? null : `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);
const ESTADO: Record<string, { t: string; c: string }> = {
  PUBLISHED: { t: 'Publicada', c: 'bg-emerald-50 text-emerald-600' },
  ACTIVE: { t: 'Activa', c: 'bg-blue-50 text-blue-600' },
  AWARDED: { t: 'Adjudicada', c: 'bg-violet-50 text-alteha-violet' },
  CLOSED: { t: 'Cerrada', c: 'bg-slate-100 text-slate-500' },
  CANCELLED: { t: 'Cancelada', c: 'bg-red-50 text-red-500' },
};

export default function MyPatientAuctions() {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = () => fetch('/api/patient/auctions', { headers: { 'X-Alteha-Token': getStoredToken() || '' } })
    .then((r) => r.json()).then((r) => setItems(r?.data || [])).catch(() => {});

  useEffect(() => { cargar().finally(() => setCargando(false)); }, []);

  const adjudicar = async (num: string, bidNumber: string) => {
    if (!confirm('¿Adjudicar esta oferta? Se cerrará la subasta y el resto de ofertas quedarán rechazadas.')) return;
    const r = await fetch(`/api/patient/auctions/${num}/award/${bidNumber}`, {
      method: 'POST', headers: { 'X-Alteha-Token': getStoredToken() || '' },
    }).then((x) => x.json()).catch(() => ({ code: 'ERROR' }));
    if (r?.code === '00') cargar();
    else alert(r?.message || 'No se pudo adjudicar.');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Gavel className="w-6 h-6 text-alteha-turquoise" /> Mis subastas</h1>
        <Link href="/dashboard/patient/subastas/new" className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold text-sm"><Plus className="w-4 h-4" /> Nueva subasta</Link>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
          <Gavel className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-semibold">Aún no has creado subastas.</p>
          <Link href="/dashboard/patient/subastas/new" className="inline-block mt-4 bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-sm">Crear mi primera subasta</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((a) => {
            const est = ESTADO[a.status] || { t: a.status, c: 'bg-slate-100 text-slate-500' };
            return (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-800">{a.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${est.c}`}>{est.t}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold mt-1.5">
                      {a.specialty && <span>{a.specialty}</span>}
                      {a.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{a.location}</span>}
                      {a.estimatedDate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.estimatedDate}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-slate-900">{a.totalBids}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">ofertas</p>
                  </div>
                </div>

                {(a.bids || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofertas recibidas</p>
                    {a.bids.map((b: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${b.status === 'ACCEPTED' ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          {b.bidderType === 'CLINIC' ? <Building2 className="w-4 h-4 text-slate-400" /> : <Stethoscope className="w-4 h-4 text-slate-400" />}
                          {b.bidderName || 'Oferente'}
                          {b.status === 'ACCEPTED' && <span className="text-[10px] font-black uppercase text-emerald-600">Adjudicada</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-emerald-600">{money(b.amount)}</span>
                          {a.status !== 'AWARDED' && b.status !== 'REJECTED' && (
                            <button onClick={() => adjudicar(a.auctionNumber, b.bidNumber)}
                              className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest">Adjudicar</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
