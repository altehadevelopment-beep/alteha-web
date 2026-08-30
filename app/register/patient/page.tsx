"use client";

// Registro del cliente final (paciente). Wizard: datos personales → verificación
// de correo y teléfono por OTP → contraseña. Al terminar crea la cuenta PATIENT.
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Mail, Smartphone, Lock, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { sendEmailToken, verifyEmailToken, sendSmsToken, verifySmsToken } from '@/lib/api';

const ROLE = 'PATIENT';

export default function PatientRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', identificationType: 'CEDULA', idPrefix: 'V', identificationNumber: '',
    dateOfBirth: '', gender: 'MASCULINO', email: '', phone: '', password: '', password2: '',
  });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Verificación
  const [emailCode, setEmailCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailOk, setEmailOk] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsOk, setSmsOk] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const edad = (() => {
    if (!form.dateOfBirth) return null;
    const d = new Date(form.dateOfBirth); const h = new Date();
    let a = h.getFullYear() - d.getFullYear();
    if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
    return a;
  })();

  const passValida = form.password.length >= 8 && /[a-zA-Z]/.test(form.password) && /[0-9]/.test(form.password) && /[^a-zA-Z0-9]/.test(form.password);
  const telE164 = () => `58${form.phone.replace(/\D/g, '').replace(/^0+/, '')}`;

  const paso1Ok = form.firstName.trim() && form.lastName.trim() && form.identificationNumber.trim() && form.dateOfBirth && edad != null && edad >= 18 && edad < 120;

  // ── Verificación de correo ──
  const enviarEmail = async () => {
    setError(null); setBusy(true);
    try {
      const r = await sendEmailToken(form.email.trim().toLowerCase(), ROLE);
      if (r?.code === '00') setEmailSent(true);
      else setError(r?.message || 'No se pudo enviar el código al correo.');
    } catch { setError('No se pudo enviar el código al correo.'); }
    finally { setBusy(false); }
  };
  const validarEmail = async () => {
    setError(null); setBusy(true);
    try {
      const r = await verifyEmailToken(form.email.trim().toLowerCase(), emailCode.trim(), ROLE);
      if (r?.code === '00' && r?.data) setEmailOk(true);
      else setError('El código del correo no es válido o expiró.');
    } catch { setError('El código del correo no es válido o expiró.'); }
    finally { setBusy(false); }
  };

  // ── Verificación de teléfono ──
  const enviarSms = async () => {
    setError(null); setBusy(true);
    try {
      const r = await sendSmsToken(telE164(), ROLE);
      if (r?.code === '00') setSmsSent(true);
      else setError(r?.message || 'No se pudo enviar el código por SMS.');
    } catch { setError('No se pudo enviar el código por SMS.'); }
    finally { setBusy(false); }
  };
  const validarSms = async () => {
    setError(null); setBusy(true);
    try {
      const r = await verifySmsToken(telE164(), smsCode.trim(), ROLE);
      if (r?.code === '00' && r?.data) setSmsOk(true);
      else setError('El código del teléfono no es válido o expiró.');
    } catch { setError('El código del teléfono no es válido o expiró.'); }
    finally { setBusy(false); }
  };

  const registrar = async () => {
    if (!passValida) { setError('La contraseña no cumple los requisitos.'); return; }
    if (form.password !== form.password2) { setError('Las contraseñas no coinciden.'); return; }
    setError(null); setBusy(true);
    try {
      const payload = {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        identificationType: form.identificationType, identificationNumber: `${form.idPrefix}-${form.identificationNumber.replace(/\D/g, '')}`,
        dateOfBirth: form.dateOfBirth, gender: form.gender,
        email: form.email.trim().toLowerCase(), phone: telE164(), password: form.password,
      };
      const r = await fetch('/api/actor-register/patient', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      }).then((x) => x.json());
      if (r?.code === '00' || r?.data?.id) setStep(4);
      else setError(r?.message || 'No se pudo completar el registro.');
    } catch { setError('No se pudo completar el registro. Intenta de nuevo.'); }
    finally { setBusy(false); }
  };

  const pasos = ['Datos', 'Verificación', 'Contraseña'];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-widest mb-6">
          <ArrowLeft className="w-4 h-4" /> Inicio
        </Link>

        <div className="bg-white rounded-[2rem] shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-alteha-turquoise/10 text-alteha-turquoise flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">Crea tu cuenta</h1>
            <p className="text-sm text-slate-400 font-medium">Regístrate para crear tus subastas en Alteha</p>
          </div>

          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mb-7">
              {pasos.map((p, i) => (
                <React.Fragment key={p}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${step > i + 1 ? 'bg-alteha-turquoise text-white' : step === i + 1 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold ${step >= i + 1 ? 'text-slate-600' : 'text-slate-300'}`}>{p}</span>
                  </div>
                  {i < pasos.length - 1 && <div className={`flex-1 h-1 rounded-full ${step > i + 1 ? 'bg-alteha-turquoise' : 'bg-slate-100'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm font-semibold">{error}</div>}

          {/* PASO 1 · Datos personales */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nombre" value={form.firstName} onChange={(v) => set('firstName', v)} />
                <Campo label="Apellido" value={form.lastName} onChange={(v) => set('lastName', v)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cédula</label>
                <div className="flex gap-2 mt-1">
                  <select value={form.idPrefix} onChange={(e) => set('idPrefix', e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-bold text-sm">
                    {['V', 'E', 'J', 'P'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <input value={form.identificationNumber} onChange={(e) => set('identificationNumber', e.target.value)} placeholder="12345678"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha de nacimiento</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
                  {edad != null && <p className="text-[11px] text-slate-400 mt-1 font-semibold">{edad} años</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sexo</label>
                  <select value={form.gender} onChange={(e) => set('gender', e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm">
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                  </select>
                </div>
              </div>
              {edad != null && edad < 18 && <p className="text-xs text-amber-600 font-semibold">Debes ser mayor de edad para registrarte.</p>}
              <button disabled={!paso1Ok} onClick={() => { setError(null); setStep(2); }}
                className="w-full mt-2 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PASO 2 · Verificación correo + teléfono */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Correo */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-alteha-turquoise" /><span className="font-black text-sm text-slate-700">Correo electrónico</span>{emailOk && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}</div>
                <input type="email" disabled={emailOk} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="tucorreo@ejemplo.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm disabled:opacity-60" />
                {!emailOk && (
                  <div className="flex gap-2 mt-2">
                    {emailSent && <input value={emailCode} onChange={(e) => setEmailCode(e.target.value)} placeholder="Código" maxLength={6}
                      className="w-28 px-3 py-2 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-bold text-sm text-center tracking-widest" />}
                    <button disabled={busy || !form.email.includes('@')} onClick={emailSent ? validarEmail : enviarEmail}
                      className="flex-1 bg-alteha-turquoise/10 text-alteha-turquoise py-2 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40">
                      {emailSent ? 'Validar código' : 'Enviar código'}
                    </button>
                  </div>
                )}
              </div>
              {/* Teléfono */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><Smartphone className="w-4 h-4 text-alteha-turquoise" /><span className="font-black text-sm text-slate-700">Teléfono</span>{smsOk && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}</div>
                <input type="tel" disabled={smsOk} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0412 1234567"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm disabled:opacity-60" />
                {!smsOk && (
                  <div className="flex gap-2 mt-2">
                    {smsSent && <input value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="Código" maxLength={6}
                      className="w-28 px-3 py-2 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-bold text-sm text-center tracking-widest" />}
                    <button disabled={busy || form.phone.replace(/\D/g, '').length < 10} onClick={smsSent ? validarSms : enviarSms}
                      className="flex-1 bg-alteha-turquoise/10 text-alteha-turquoise py-2 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40">
                      {smsSent ? 'Validar código' : 'Enviar código'}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setError(null); setStep(1); }} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm">Volver</button>
                <button disabled={!emailOk || !smsOk} onClick={() => { setError(null); setStep(3); }}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 · Contraseña */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contraseña</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirmar contraseña</label>
                <input type={showPass ? 'text' : 'password'} value={form.password2} onChange={(e) => set('password2', e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
              </div>
              <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                <Req ok={form.password.length >= 8} t="Al menos 8 caracteres" />
                <Req ok={/[a-zA-Z]/.test(form.password)} t="Una letra" />
                <Req ok={/[0-9]/.test(form.password)} t="Un número" />
                <Req ok={/[^a-zA-Z0-9]/.test(form.password)} t="Un carácter especial (! @ # $ …)" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setError(null); setStep(2); }} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm">Volver</button>
                <button disabled={busy || !passValida || form.password !== form.password2} onClick={registrar}
                  className="flex-1 bg-alteha-turquoise text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Crear cuenta
                </button>
              </div>
            </div>
          )}

          {/* PASO 4 · Éxito */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-8 h-8" /></div>
              <h2 className="text-xl font-black text-slate-800">¡Cuenta creada!</h2>
              <p className="text-sm text-slate-500 mt-2 mb-6">Ya puedes iniciar sesión y crear tus subastas en Alteha.</p>
              <button onClick={() => router.push('/login?role=patient')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm">Iniciar sesión</button>
            </div>
          )}
        </div>

        {step < 4 && (
          <p className="text-center text-sm text-slate-400 mt-5">
            ¿Ya tienes cuenta? <Link href="/login?role=patient" className="font-bold text-alteha-turquoise hover:underline">Inicia sesión</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function Campo({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-alteha-turquoise outline-none font-semibold text-sm" />
    </div>
  );
}

function Req({ ok, t }: { ok: boolean; t: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
      <CheckCircle2 className={`w-3.5 h-3.5 ${ok ? 'text-emerald-500' : 'text-slate-300'}`} /> {t}
    </div>
  );
}
