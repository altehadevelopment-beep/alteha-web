"use client";

// Cambio de contraseña del paciente. Reutiliza POST /api/actor/change-password.
import { useEffect, useState } from 'react';
import { getProfile, getStoredToken } from '@/lib/api';
import { ShieldCheck, Loader2, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';

export default function PatientSecurity() {
  const [email, setEmail] = useState('');
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [nueva2, setNueva2] = useState('');
  const [ver, setVer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  useEffect(() => { getProfile('PATIENT').then((r) => setEmail((r?.data as any)?.email || '')).catch(() => {}); }, []);

  const valida = nueva.length >= 8 && /[a-zA-Z]/.test(nueva) && /[0-9]/.test(nueva) && /[^a-zA-Z0-9]/.test(nueva);

  const guardar = async () => {
    setMsg(null);
    if (!valida) { setMsg({ ok: false, t: 'La nueva contraseña no cumple los requisitos.' }); return; }
    if (nueva !== nueva2) { setMsg({ ok: false, t: 'Las contraseñas nuevas no coinciden.' }); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/actor/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Alteha-Token': getStoredToken() || '' },
        body: JSON.stringify({ email, currentPassword: actual, newPassword: nueva, role: 'PATIENT' }),
      }).then((x) => x.json());
      if (r?.code === '00') {
        setMsg({ ok: true, t: 'Contraseña actualizada correctamente.' });
        setActual(''); setNueva(''); setNueva2('');
      } else {
        setMsg({ ok: false, t: r?.message || 'No se pudo cambiar la contraseña. Revisa la contraseña actual.' });
      }
    } catch { setMsg({ ok: false, t: 'No se pudo cambiar la contraseña.' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-alteha-turquoise" /> Seguridad</h1>
      <p className="text-slate-500 text-sm mb-6">Cambia tu contraseña de acceso.</p>

      <div className="bg-white border border-slate-200 rounded-3xl p-7 space-y-4">
        {msg && <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-red-50 border border-red-200 text-red-600'}`}>{msg.t}</div>}

        <Field label="Contraseña actual" value={actual} onChange={setActual} type={ver ? 'text' : 'password'} />
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nueva contraseña</label>
            <button onClick={() => setVer((v) => !v)} className="text-slate-400 hover:text-slate-600">{ver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type={ver ? 'text' : 'password'} value={nueva} onChange={(e) => setNueva(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
          </div>
        </div>
        <Field label="Confirmar nueva contraseña" value={nueva2} onChange={setNueva2} type={ver ? 'text' : 'password'} />

        <div className="bg-slate-50 rounded-xl p-3 space-y-1">
          <Req ok={nueva.length >= 8} t="Al menos 8 caracteres" />
          <Req ok={/[a-zA-Z]/.test(nueva)} t="Una letra" />
          <Req ok={/[0-9]/.test(nueva)} t="Un número" />
          <Req ok={/[^a-zA-Z0-9]/.test(nueva)} t="Un carácter especial" />
        </div>

        <button disabled={busy || !valida || nueva !== nueva2 || !actual} onClick={guardar}
          className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Guardar contraseña
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
    </div>
  );
}
function Req({ ok, t }: { ok: boolean; t: string }) {
  return <div className={`flex items-center gap-2 text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className={`w-3.5 h-3.5 ${ok ? 'text-emerald-500' : 'text-slate-300'}`} /> {t}</div>;
}
