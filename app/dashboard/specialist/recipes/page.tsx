"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    FileText, Plus, Printer, Trash2, Save, ChevronDown,
    ChevronUp, User, Calendar, Pill, ClipboardList, ArrowLeft,
    Download, Eye, X, Search, AlignLeft, Hash, Clock
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MedicationLine {
    id: string;
    name: string;
    dose: string;
    frequency: string;
    duration: string;
    notes: string;
}

interface Recipe {
    id: string;
    patientName: string;
    patientAge: string;
    patientId: string;
    date: string;
    diagnosis: string;
    medications: MedicationLine[];
    indications: string;
    followUp: string;
    createdAt: string;
}

type PrintFormat = 'CARTA' | 'MEDIA_CARTA';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const newMed = (): MedicationLine => ({
    id: Math.random().toString(36).slice(2),
    name: '', dose: '', frequency: '', duration: '', notes: ''
});

const newRecipe = (): Recipe => ({
    id: Math.random().toString(36).slice(2),
    patientName: '', patientAge: '', patientId: '',
    date: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    medications: [newMed()],
    indications: '',
    followUp: '',
    createdAt: new Date().toISOString()
});

const STORAGE_KEY = 'alteha_recipes';

function loadRecipes(): Recipe[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveRecipes(recipes: Recipe[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

// ─── Print Styles (injected into a new window) ───────────────────────────────
function buildPrintHTML(recipe: Recipe, doctor: any, format: PrintFormat) {
    const specs = doctor?.specialties?.map((s: any) => s.name).filter(Boolean).join(', ') || 'Especialista Médico';
    const license = doctor?.medicalLicenseNumber || '';
    const phone = doctor?.phone || doctor?.mobilePhone || '';
    const email = doctor?.email || '';
    const name = `Dr. ${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim();
    const isMediaCarta = format === 'MEDIA_CARTA';

    const pageStyle = isMediaCarta
        ? 'width:140mm; min-height:215mm; padding:14mm 14mm 12mm;'
        : 'width:215mm; min-height:279mm; padding:20mm 20mm 16mm;';

    const headerFontSize = isMediaCarta ? '11pt' : '13pt';
    const bodyFontSize = isMediaCarta ? '9pt' : '10.5pt';
    const titleFontSize = isMediaCarta ? '15pt' : '18pt';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Recipe — ${recipe.patientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: white; }
    .page { ${pageStyle} margin: 0 auto; position: relative; }

    /* ── Membrete ── */
    .header {
      display: flex; align-items: flex-start; justify-content: space-between;
      border-bottom: 3px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px;
    }
    .header-left { flex: 1; }
    .doctor-name { font-size: ${titleFontSize}; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .specialty { font-size: ${headerFontSize}; color: #0d9488; font-weight: 700; margin-top: 2px; }
    .license { font-size: 8.5pt; color: #64748b; margin-top: 4px; }
    .header-right { text-align: right; font-size: 8pt; color: #64748b; line-height: 1.6; }
    .alteha-badge {
      display: inline-block; background: #0d9488; color: white;
      font-size: 7pt; font-weight: 900; letter-spacing: 0.15em;
      padding: 2px 8px; border-radius: 20px; margin-bottom: 4px;
    }

    /* ── Datos del paciente ── */
    .patient-row {
      display: grid; grid-template-columns: 2fr 1fr 1.2fr 1.2fr;
      gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;
    }
    .field label { font-size: 7pt; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #94a3b8; display: block; }
    .field span { font-size: ${bodyFontSize}; color: #0f172a; font-weight: 600; }

    /* ── Diagnóstico ── */
    .section-title {
      font-size: 7.5pt; font-weight: 900; text-transform: uppercase;
      letter-spacing: 0.1em; color: #0d9488; margin-bottom: 4px;
      border-left: 3px solid #0d9488; padding-left: 6px;
    }
    .diagnosis-box {
      font-size: ${bodyFontSize}; color: #1e293b; background: #f0fdfa;
      border: 1px solid #99f6e4; border-radius: 6px; padding: 8px 12px;
      margin-bottom: 14px; min-height: 28px;
    }

    /* ── Rx ── */
    .rx-title {
      font-size: 22pt; font-weight: 900; color: #0f172a;
      font-family: 'Georgia', serif; line-height: 1; margin-bottom: 8px;
    }
    .med-item {
      border-left: 3px solid #0d9488; padding: 8px 10px;
      margin-bottom: 10px; background: #fafafa;
    }
    .med-name { font-size: ${bodyFontSize}; font-weight: 900; color: #0f172a; }
    .med-detail { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .med-notes { font-size: 8pt; color: #64748b; margin-top: 3px; font-style: italic; }

    /* ── Indicaciones & seguimiento ── */
    .indications-box {
      font-size: ${bodyFontSize}; color: #1e293b; white-space: pre-wrap;
      border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px;
      margin-bottom: 14px; min-height: 30px;
    }

    /* ── Footer firma ── */
    .footer {
      margin-top: 30px; display: flex; justify-content: flex-end;
    }
    .signature { text-align: center; min-width: 160px; }
    .sig-line { border-top: 1.5px solid #94a3b8; padding-top: 6px; margin-top: 40px; }
    .sig-name { font-size: 8.5pt; font-weight: 700; color: #0f172a; }
    .sig-spec { font-size: 7.5pt; color: #64748b; }

    /* ── Footer bottom ── */
    .bottom-footer {
      position: absolute; bottom: 10mm; left: 14mm; right: 14mm;
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid #e2e8f0; padding-top: 6px;
      font-size: 7pt; color: #94a3b8;
    }

    @media print {
      html, body { margin: 0; padding: 0; }
      .page { margin: 0; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Membrete -->
  <div class="header">
    <div class="header-left">
      <div class="doctor-name">${name}</div>
      <div class="specialty">${specs}</div>
      ${license ? `<div class="license">Nro. Licencia: ${license}</div>` : ''}
    </div>
    <div class="header-right">
      <div><span class="alteha-badge">ALTEHA</span></div>
      ${phone ? `<div>📞 ${phone}</div>` : ''}
      ${email ? `<div>✉ ${email}</div>` : ''}
      <div>📅 ${new Date(recipe.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <!-- Paciente -->
  <div class="patient-row">
    <div class="field"><label>Paciente</label><span>${recipe.patientName || '—'}</span></div>
    <div class="field"><label>Edad</label><span>${recipe.patientAge ? recipe.patientAge + ' años' : '—'}</span></div>
    <div class="field"><label>Cédula / ID</label><span>${recipe.patientId || '—'}</span></div>
    <div class="field"><label>Fecha</label><span>${new Date(recipe.date).toLocaleDateString('es-ES')}</span></div>
  </div>

  <!-- Diagnóstico -->
  ${recipe.diagnosis ? `
  <div class="section-title">Diagnóstico</div>
  <div class="diagnosis-box">${recipe.diagnosis}</div>
  ` : ''}

  <!-- Rx -->
  <div class="rx-title">℞</div>
  ${recipe.medications.filter(m => m.name).map((m, i) => `
  <div class="med-item">
    <div class="med-name">${i + 1}. ${m.name}${m.dose ? ' — ' + m.dose : ''}</div>
    <div class="med-detail">
      ${m.frequency ? '⏱ ' + m.frequency : ''}
      ${m.duration ? '&nbsp;&nbsp;📆 ' + m.duration : ''}
    </div>
    ${m.notes ? `<div class="med-notes">${m.notes}</div>` : ''}
  </div>
  `).join('')}

  <!-- Indicaciones -->
  ${recipe.indications ? `
  <div class="section-title" style="margin-top:14px">Indicaciones Generales</div>
  <div class="indications-box">${recipe.indications}</div>
  ` : ''}

  <!-- Seguimiento -->
  ${recipe.followUp ? `
  <div class="section-title">Próxima Consulta / Seguimiento</div>
  <div class="indications-box">${recipe.followUp}</div>
  ` : ''}

  <!-- Firma -->
  <div class="footer">
    <div class="signature">
      <div class="sig-line">
        <div class="sig-name">${name}</div>
        <div class="sig-spec">${specs}</div>
        ${license ? `<div class="sig-spec">Lic. ${license}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="bottom-footer">
    <span>Emitido mediante <strong>ALTEHA Platform</strong></span>
    <span>Formato: ${format === 'MEDIA_CARTA' ? 'Media Carta' : 'Carta'}</span>
    <span>Válido sin enmendaduras</span>
  </div>

</div>
</body>
</html>`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecipesPage() {
    const { userProfile } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [printFormat, setPrintFormat] = useState<PrintFormat>('CARTA');
    const [search, setSearch] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => { setRecipes(loadRecipes()); }, []);

    const active = recipes.find(r => r.id === activeId) ?? null;

    // ── Mutations ──
    const createRecipe = () => {
        const r = newRecipe();
        const updated = [r, ...recipes];
        setRecipes(updated); saveRecipes(updated); setActiveId(r.id);
    };

    const updateRecipe = (patch: Partial<Recipe>) => {
        const updated = recipes.map(r => r.id === activeId ? { ...r, ...patch } : r);
        setRecipes(updated); saveRecipes(updated);
    };

    const updateMed = (medId: string, patch: Partial<MedicationLine>) => {
        if (!active) return;
        const meds = active.medications.map(m => m.id === medId ? { ...m, ...patch } : m);
        updateRecipe({ medications: meds });
    };

    const addMed = () => {
        if (!active) return;
        updateRecipe({ medications: [...active.medications, newMed()] });
    };

    const removeMed = (medId: string) => {
        if (!active || active.medications.length <= 1) return;
        updateRecipe({ medications: active.medications.filter(m => m.id !== medId) });
    };

    const deleteRecipe = (id: string) => {
        if (!confirm('¿Eliminar este recipe?')) return;
        const updated = recipes.filter(r => r.id !== id);
        setRecipes(updated); saveRecipes(updated);
        if (activeId === id) setActiveId(updated[0]?.id ?? null);
    };

    // ── Print ──
    const handlePrint = () => {
        if (!active) return;
        const html = buildPrintHTML(active, userProfile, printFormat);
        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    // ── Preview ──
    const handlePreview = () => {
        if (!active) return;
        setPreviewOpen(true);
        setTimeout(() => {
            if (iframeRef.current) {
                const html = buildPrintHTML(active, userProfile, printFormat);
                const doc = iframeRef.current.contentDocument;
                if (doc) { doc.open(); doc.write(html); doc.close(); }
            }
        }, 80);
    };

    const filtered = recipes.filter(r =>
        r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        r.diagnosis.toLowerCase().includes(search.toLowerCase())
    );

    const specs = userProfile?.specialties?.map((s: any) => s.name).filter(Boolean).join(', ') || 'Especialista';

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 font-outfit">

            {/* ── Left: list ── */}
            <aside className="w-72 shrink-0 flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recetas Médicas</h1>
                    <p className="text-sm text-slate-400 font-medium">Redacta, guarda e imprime</p>
                </div>

                <Button
                    onClick={createRecipe}
                    className="w-full bg-alteha-turquoise text-slate-900 font-black rounded-2xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-alteha-turquoise/20 hover:scale-[1.02] transition-all"
                >
                    <Plus className="w-5 h-5" /> Nueva Receta
                </Button>

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar paciente..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-alteha-turquoise transition-colors"
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filtered.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm font-medium">
                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            {recipes.length === 0 ? 'Sin recetas aún' : 'Sin resultados'}
                        </div>
                    )}
                    {filtered.map(r => (
                        <div
                            key={r.id}
                            onClick={() => setActiveId(r.id)}
                            className={`group relative p-4 rounded-2xl border cursor-pointer transition-all ${r.id === activeId
                                ? 'bg-alteha-turquoise/10 border-alteha-turquoise/30'
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">
                                        {r.patientName || <span className="text-slate-400 italic">Sin nombre</span>}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{r.diagnosis || 'Sin diagnóstico'}</p>
                                    <p className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(r.date).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteRecipe(r.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-400 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <Link href="/dashboard/specialist" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                </Link>
            </aside>

            {/* ── Right: editor ── */}
            <main className="flex-1 overflow-y-auto">
                {!active ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-6 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="p-6 bg-alteha-turquoise/10 rounded-[2rem]">
                            <FileText className="w-12 h-12 text-alteha-turquoise" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-700">Selecciona o crea una receta</h3>
                            <p className="text-slate-400 text-sm mt-2">Las recetas se guardan localmente en tu navegador</p>
                        </div>
                        <Button onClick={createRecipe} className="bg-alteha-turquoise text-slate-900 font-black rounded-2xl px-8 py-3">
                            <Plus className="w-5 h-5 mr-2" /> Crear Primera Receta
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 pb-10">

                        {/* ── Toolbar ── */}
                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2rem] p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                            <div>
                                <h2 className="font-black text-slate-900 text-lg">
                                    {active.patientName || 'Nueva Receta'}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">{specs}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Format selector */}
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                    <Printer className="w-4 h-4 text-slate-400" />
                                    <select
                                        value={printFormat}
                                        onChange={e => setPrintFormat(e.target.value as PrintFormat)}
                                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                    >
                                        <option value="CARTA">Hoja Carta (Letter)</option>
                                        <option value="MEDIA_CARTA">Media Carta</option>
                                    </select>
                                </div>
                                <Button
                                    onClick={handlePreview}
                                    variant="outline"
                                    className="flex items-center gap-2 rounded-xl border-slate-200 text-slate-600 font-bold px-4 py-2"
                                >
                                    <Eye className="w-4 h-4" /> Vista previa
                                </Button>
                                <Button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-slate-900 text-white rounded-xl font-bold px-5 py-2 hover:bg-alteha-turquoise hover:text-slate-900 transition-all"
                                >
                                    <Printer className="w-4 h-4" /> Imprimir
                                </Button>
                            </div>
                        </div>

                        {/* ── Patient Info ── */}
                        <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-alteha-turquoise">
                                <User className="w-4 h-4" /> Datos del Paciente
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre completo</label>
                                    <input
                                        value={active.patientName}
                                        onChange={e => updateRecipe({ patientName: e.target.value })}
                                        placeholder="Ej. María García López"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Edad</label>
                                    <input
                                        value={active.patientAge}
                                        onChange={e => updateRecipe({ patientAge: e.target.value })}
                                        placeholder="Ej. 35"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cédula / ID</label>
                                    <input
                                        value={active.patientId}
                                        onChange={e => updateRecipe({ patientId: e.target.value })}
                                        placeholder="Ej. V-12345678"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de la receta</label>
                                    <input
                                        type="date"
                                        value={active.date}
                                        onChange={e => updateRecipe({ date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Diagnóstico</label>
                                    <input
                                        value={active.diagnosis}
                                        onChange={e => updateRecipe({ diagnosis: e.target.value })}
                                        placeholder="Ej. Hipertensión arterial esencial (CIE-10: I10)"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ── Medications ── */}
                        <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-alteha-turquoise">
                                    <Pill className="w-4 h-4" /> Medicamentos (Rx)
                                </h3>
                                <button
                                    onClick={addMed}
                                    className="flex items-center gap-1.5 text-xs font-black text-alteha-turquoise hover:bg-alteha-turquoise/10 px-3 py-1.5 rounded-xl transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>

                            <div className="space-y-3">
                                {active.medications.map((med, i) => (
                                    <div key={med.id} className="relative p-4 bg-slate-50 border border-slate-100 rounded-2xl group">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 bg-alteha-turquoise text-slate-900 rounded-lg flex items-center justify-center text-xs font-black">
                                                {i + 1}
                                            </div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Medicamento</span>
                                            {active.medications.length > 1 && (
                                                <button
                                                    onClick={() => removeMed(med.id)}
                                                    className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 rounded-lg transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div className="lg:col-span-3">
                                                <input
                                                    value={med.name}
                                                    onChange={e => updateMed(med.id, { name: e.target.value })}
                                                    placeholder="Nombre del medicamento (Ej. Losartán 50mg)"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                                />
                                            </div>
                                            <input
                                                value={med.dose}
                                                onChange={e => updateMed(med.id, { dose: e.target.value })}
                                                placeholder="Dosis (Ej. 1 tableta)"
                                                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                            />
                                            <input
                                                value={med.frequency}
                                                onChange={e => updateMed(med.id, { frequency: e.target.value })}
                                                placeholder="Frecuencia (Ej. cada 12 horas)"
                                                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                            />
                                            <input
                                                value={med.duration}
                                                onChange={e => updateMed(med.id, { duration: e.target.value })}
                                                placeholder="Duración (Ej. 30 días)"
                                                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                            />
                                            <div className="lg:col-span-3">
                                                <input
                                                    value={med.notes}
                                                    onChange={e => updateMed(med.id, { notes: e.target.value })}
                                                    placeholder="Notas adicionales (Ej. tomar con alimentos)"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm outline-none focus:border-alteha-turquoise transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── Indications & Follow-up ── */}
                        <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-alteha-turquoise">
                                <ClipboardList className="w-4 h-4" /> Indicaciones y Seguimiento
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Indicaciones generales</label>
                                <textarea
                                    value={active.indications}
                                    onChange={e => updateRecipe({ indications: e.target.value })}
                                    rows={3}
                                    placeholder="Ej. Reposo relativo, dieta hiposódica, evitar esfuerzos físicos..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:border-alteha-turquoise transition-colors resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Próxima consulta / seguimiento</label>
                                <textarea
                                    value={active.followUp}
                                    onChange={e => updateRecipe({ followUp: e.target.value })}
                                    rows={2}
                                    placeholder="Ej. Control en 30 días con resultados de laboratorio..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:border-alteha-turquoise transition-colors resize-none"
                                />
                            </div>
                        </section>

                        {/* ── Print actions (bottom) ── */}
                        <div className="flex items-center gap-4 justify-end pb-4">
                            <Button
                                onClick={handlePreview}
                                variant="outline"
                                className="flex items-center gap-2 rounded-2xl border-slate-200 text-slate-600 font-bold px-6 py-3"
                            >
                                <Eye className="w-4 h-4" /> Vista Previa
                            </Button>
                            <Button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-slate-900 text-white rounded-2xl font-black px-8 py-3 hover:bg-alteha-turquoise hover:text-slate-900 transition-all shadow-xl"
                            >
                                <Printer className="w-5 h-5" /> Imprimir Receta
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* ── Preview Modal ── */}
            {previewOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                        style={{ width: '900px', maxWidth: '95vw', height: '90vh' }}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                <Eye className="w-5 h-5 text-alteha-turquoise" /> Vista Previa — {printFormat === 'MEDIA_CARTA' ? 'Media Carta' : 'Carta'}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                    <select
                                        value={printFormat}
                                        onChange={e => {
                                            setPrintFormat(e.target.value as PrintFormat);
                                            // Re-render iframe
                                            setTimeout(() => {
                                                if (iframeRef.current && active) {
                                                    const html = buildPrintHTML(active, userProfile, e.target.value as PrintFormat);
                                                    const doc = iframeRef.current.contentDocument;
                                                    if (doc) { doc.open(); doc.write(html); doc.close(); }
                                                }
                                            }, 50);
                                        }}
                                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                    >
                                        <option value="CARTA">Carta</option>
                                        <option value="MEDIA_CARTA">Media Carta</option>
                                    </select>
                                </div>
                                <Button onClick={handlePrint} className="bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 px-4 py-2">
                                    <Printer className="w-4 h-4" /> Imprimir
                                </Button>
                                <button onClick={() => setPreviewOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-100 p-6 flex justify-center">
                            <iframe
                                ref={iframeRef}
                                className="bg-white shadow-2xl rounded-lg"
                                style={{
                                    width: printFormat === 'MEDIA_CARTA' ? '560px' : '794px',
                                    height: printFormat === 'MEDIA_CARTA' ? '860px' : '1123px',
                                    border: 'none',
                                    transform: 'scale(0.85)',
                                    transformOrigin: 'top center'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
