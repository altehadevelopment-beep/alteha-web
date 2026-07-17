"use client";

// Detalle de una auditoría médica IA: evaluación auditable con la marca Alteha
// (folio, CPT, precios de referencia, hallazgos, riesgo) + PDF imprimible.
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, Printer, FileText, Receipt, ShieldAlert, ShieldCheck, Shield,
    ExternalLink, BadgeCheck, AlertTriangle, ListChecks, BrainCircuit,
} from 'lucide-react';
import { getStoredToken } from '@/lib/api';

const RISK: any = {
    BAJO: { label: 'RIESGO BAJO', color: '#10b981', soft: '#ecfdf5', Icon: ShieldCheck },
    MEDIO: { label: 'RIESGO MEDIO', color: '#f59e0b', soft: '#fffbeb', Icon: Shield },
    ALTO: { label: 'RIESGO ALTO', color: '#ef4444', soft: '#fef2f2', Icon: ShieldAlert },
};
const VERDICT: any = {
    DENTRO_DE_RANGO: { label: 'Dentro de rango', color: '#10b981' },
    SOBRE_RANGO: { label: 'Sobre el rango', color: '#ef4444' },
    BAJO_RANGO: { label: 'Bajo el rango', color: '#0ea5e9' },
    NO_VERIFICABLE: { label: 'No verificable', color: '#94a3b8' },
};
const SEV: any = { ALTA: '#ef4444', MEDIA: '#f59e0b', BAJA: '#94a3b8' };

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short' }) : '—');
const money = (v?: number | null) =>
    v == null ? '—' : `$${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function AuditDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [audit, setAudit] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = getStoredToken();
        fetch(`/api/insurance/audits/${id}`, { headers: { 'X-Alteha-Token': token || '' } })
            .then((r) => r.json())
            .then((r) => (r?.code === '00' ? setAudit(r.data) : setError(r?.message || 'No se pudo cargar la auditoría')))
            .catch(() => setError('No se pudo cargar la auditoría'));
    }, [id]);

    if (error) return <p className="text-red-500 font-bold p-10">{error}</p>;
    if (!audit) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 text-alteha-turquoise animate-spin" /></div>;

    let result: any = {};
    try { result = audit.resultJson ? JSON.parse(audit.resultJson) : {}; } catch { result = {}; }
    const risk = RISK[audit.riskLevel] || RISK.MEDIO;
    const items: any[] = Array.isArray(result.cptItems) ? result.cptItems : [];
    const findings: any[] = Array.isArray(result.findings) ? result.findings : [];
    const recs: string[] = Array.isArray(result.recommendations) ? result.recommendations : [];

    // ══════════ PDF con manual de marca Alteha (ventana de impresión) ══════════
    const printReport = () => {
        const rows = items.map((it) => {
            const v = VERDICT[it.verdict] || VERDICT.NO_VERIFICABLE;
            const range = it.marketLow != null && it.marketHigh != null ? `${money(it.marketLow)} – ${money(it.marketHigh)}` : '—';
            return `<tr>
                <td class="cpt">${esc(it.cpt || 'N/A')}</td>
                <td>${esc(it.description || it.invoicedDescription || '')}${it.note ? `<div class="note">${esc(it.note)}</div>` : ''}</td>
                <td class="num">${it.quantity ?? 1}</td>
                <td class="num">${money(it.invoicedAmount)}</td>
                <td class="num">${range}</td>
                <td><span class="chip" style="color:${v.color};border-color:${v.color}">${v.label}</span></td>
            </tr>`;
        }).join('');

        const findingsHtml = findings.map((f) => `
            <div class="finding">
                <span class="sev" style="background:${SEV[f.severity] || SEV.BAJA}">${esc(f.severity || 'BAJA')}</span>
                <div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p></div>
            </div>`).join('') || '<p class="muted">Sin hallazgos relevantes: la cuenta es consistente con el informe médico.</p>';

        const recsHtml = recs.map((r) => `<li>${esc(r)}</li>`).join('');

        const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${esc(audit.auditNumber)} · Auditoría Médica Alteha</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root { --turquoise:#2ECFBF; --violet:#7B5BFF; --gray:#2C2E33; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Outfit',sans-serif; color:var(--gray); background:#fff; font-size:12px; }
  .page { max-width:820px; margin:0 auto; padding:36px 40px; }
  header { display:flex; align-items:center; justify-content:space-between; background:var(--gray); color:#fff; border-radius:20px; padding:22px 28px; }
  header .brand { display:flex; align-items:center; gap:14px; }
  header img { height:40px; }
  header h1 { font-size:19px; font-weight:900; letter-spacing:-0.02em; }
  header .sub { color:#A6ADBB; font-size:10.5px; font-weight:600; margin-top:2px; }
  header .folio { text-align:right; }
  header .folio b { display:block; font-size:14px; font-weight:900; color:var(--turquoise); }
  header .folio span { font-size:10px; color:#A6ADBB; font-weight:600; }
  .band { height:5px; border-radius:99px; background:linear-gradient(135deg,var(--turquoise),var(--violet)); margin:14px 0 22px; }
  h2 { font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:0.14em; color:var(--violet); margin:24px 0 10px; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .card { background:#f8fafc; border-radius:14px; padding:12px 14px; }
  .card .k { font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.12em; color:#94a3b8; }
  .card .v { font-size:12.5px; font-weight:800; margin-top:3px; }
  .riskbox { display:flex; align-items:center; gap:16px; border:2px solid ${risk.color}; background:${risk.soft}; border-radius:16px; padding:16px 20px; margin-top:6px; }
  .riskbox .badge { font-size:15px; font-weight:900; color:${risk.color}; letter-spacing:0.06em; white-space:nowrap; }
  .riskbox p { font-size:11.5px; font-weight:600; color:#475569; }
  table { width:100%; border-collapse:collapse; margin-top:6px; }
  th { text-align:left; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; padding:8px 8px; border-bottom:2px solid #e2e8f0; }
  td { padding:8px; border-bottom:1px solid #f1f5f9; font-weight:600; font-size:11px; vertical-align:top; }
  td.cpt { font-weight:900; color:var(--violet); white-space:nowrap; }
  td.num { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  th.num { text-align:right; }
  .note { font-size:9.5px; color:#94a3b8; font-weight:600; margin-top:2px; }
  .chip { display:inline-block; border:1.5px solid; border-radius:99px; padding:2px 8px; font-size:9px; font-weight:900; white-space:nowrap; }
  .totals { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
  .totals .t { border-radius:14px; padding:14px; text-align:center; }
  .totals .t .k { font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.12em; }
  .totals .t .v { font-size:17px; font-weight:900; margin-top:4px; }
  .finding { display:flex; gap:10px; align-items:flex-start; background:#f8fafc; border-radius:14px; padding:12px 14px; margin-bottom:8px; }
  .finding .sev { color:#fff; font-size:8.5px; font-weight:900; border-radius:99px; padding:3px 9px; letter-spacing:0.08em; margin-top:1px; }
  .finding b { font-size:11.5px; font-weight:900; }
  .finding p { font-size:10.5px; color:#64748b; font-weight:600; margin-top:2px; }
  .conclusion { background:#f8fafc; border-left:4px solid var(--turquoise); border-radius:0 14px 14px 0; padding:14px 18px; font-size:11.5px; font-weight:600; color:#334155; }
  ul { margin:6px 0 0 18px; }
  li { font-size:11px; font-weight:600; color:#334155; margin-bottom:5px; }
  .muted { color:#94a3b8; font-weight:600; font-size:11px; }
  footer { margin-top:28px; border-top:2px solid #e2e8f0; padding-top:14px; display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
  footer .l { font-size:9px; color:#94a3b8; font-weight:600; max-width:520px; line-height:1.5; }
  footer .r { text-align:right; font-size:9.5px; font-weight:900; color:var(--violet); white-space:nowrap; }
  @media print { html, body { margin:0; padding:0; } .page { padding:20px 28px; } }
</style></head>
<body><div class="page">
  <header>
    <div class="brand">
      <img src="${location.origin}/logoalteha.svg" alt="Alteha" />
      <div>
        <h1>Informe de Auditoría Médica</h1>
        <div class="sub">Evaluación asistida por inteligencia artificial · Alteha</div>
      </div>
    </div>
    <div class="folio"><b>${esc(audit.auditNumber)}</b><span>${esc(fmtDate(audit.createdAt))}</span></div>
  </header>
  <div class="band"></div>

  <h2>Datos de la intervención</h2>
  <div class="grid">
    <div class="card"><div class="k">Paciente</div><div class="v">${esc(result.patientName || audit.patientName || '—')}</div></div>
    <div class="card"><div class="k">Prestador</div><div class="v">${esc(result.providerName || '—')}</div></div>
    <div class="card"><div class="k">Fecha del procedimiento</div><div class="v">${esc(result.procedureDate || '—')}</div></div>
    <div class="card"><div class="k">Solicitante</div><div class="v">${esc(audit.insurance?.name || '—')}</div></div>
  </div>
  <div class="grid" style="grid-template-columns:1fr 1fr; margin-top:10px;">
    <div class="card"><div class="k">Diagnóstico</div><div class="v">${esc(result.diagnosis || '—')}</div></div>
    <div class="card"><div class="k">Intervención auditada</div><div class="v">${esc(result.procedureSummary || audit.procedureSummary || '—')}</div></div>
  </div>

  <h2>Dictamen de riesgo</h2>
  <div class="riskbox">
    <div class="badge">■ ${risk.label}</div>
    <p>${esc(result.riskJustification || '')}</p>
  </div>

  <h2>Análisis por procedimiento (CPT · precios de referencia)</h2>
  <table>
    <thead><tr><th>CPT</th><th>Procedimiento</th><th class="num">Cant.</th><th class="num">Facturado</th><th class="num">Rango mercado</th><th>Veredicto</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="muted">No se identificaron renglones facturables.</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <div class="t" style="background:#f8fafc;"><div class="k" style="color:#94a3b8">Total facturado</div><div class="v">${money(result.totalInvoiced ?? audit.totalInvoiced)}</div></div>
    <div class="t" style="background:rgba(46,207,191,0.10);"><div class="k" style="color:#0d9488">Referencia mercado (min)</div><div class="v" style="color:#0d9488">${money(result.totalReferenceLow)}</div></div>
    <div class="t" style="background:rgba(123,91,255,0.10);"><div class="k" style="color:var(--violet)">Referencia mercado (max)</div><div class="v" style="color:var(--violet)">${money(result.totalReferenceHigh)}</div></div>
  </div>

  <h2>Hallazgos de auditoría</h2>
  ${findingsHtml}

  <h2>Conclusión</h2>
  <div class="conclusion">${esc(result.conclusion || '—')}</div>

  ${recsHtml ? `<h2>Recomendaciones</h2><ul>${recsHtml}</ul>` : ''}

  <footer>
    <div class="l">
      <b>Metodología:</b> OCR multimodal del informe médico y la factura; codificación CPT; comparación contra rangos de precio
      de mercado de salud privada (Venezuela/Latam) estimados por IA; cruce informe-factura para detección de inconsistencias.
      Confiabilidad documental estimada: ${esc(result.confidence != null ? `${result.confidence}%` : 'n/d')}.<br/>
      Los precios de referencia son estimaciones y no constituyen tarifas oficiales. Este informe es un apoyo a la decisión y
      no sustituye el juicio del auditor médico humano. Documento confidencial para uso exclusivo de ${esc(audit.insurance?.name || 'la aseguradora solicitante')}.
    </div>
    <div class="r">alteha.com<br/>Folio verificable: ${esc(audit.auditNumber)}</div>
  </footer>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body></html>`;

        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); }
    };

    // ══════════ Vista en pantalla ══════════
    return (
        <div className="space-y-6 max-w-5xl">
            <header className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/dashboard/insurance/audits')} className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-alteha-turquoise">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-alteha-violet" /> {audit.auditNumber}
                        </h1>
                        <p className="text-xs text-slate-400 font-semibold">{fmtDate(audit.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {audit.reportUrl && (
                        <a href={audit.reportUrl} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-white border border-slate-100 font-black text-xs text-slate-500 flex items-center gap-1.5 hover:border-alteha-turquoise/50">
                            <FileText className="w-4 h-4" /> Informe <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                    {audit.invoiceUrl && (
                        <a href={audit.invoiceUrl} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-white border border-slate-100 font-black text-xs text-slate-500 flex items-center gap-1.5 hover:border-alteha-turquoise/50">
                            <Receipt className="w-4 h-4" /> Factura <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                    <button onClick={printReport} className="px-5 py-2.5 rounded-xl font-black text-white bg-alteha-gradient flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Imprimir / PDF
                    </button>
                </div>
            </header>

            {/* Cabecera del expediente */}
            <div className="bg-alteha-gray text-white rounded-3xl p-6 flex items-center gap-5 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intervención auditada</p>
                    <h2 className="text-xl font-black mt-1">{result.procedureSummary || audit.procedureSummary || '—'}</h2>
                    <p className="text-sm text-slate-300 font-semibold mt-1">
                        {result.patientName || audit.patientName || 'Paciente s/d'} · {result.providerName || 'Prestador s/d'}
                        {result.procedureDate ? ` · ${result.procedureDate}` : ''}
                    </p>
                </div>
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background: risk.soft }}>
                    <risk.Icon className="w-7 h-7 mx-auto" style={{ color: risk.color }} />
                    <p className="font-black text-sm mt-1" style={{ color: risk.color }}>{risk.label}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total facturado</p>
                    <p className="text-2xl font-black text-alteha-turquoise">{money(result.totalInvoiced ?? audit.totalInvoiced)}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">
                        Mercado: {money(result.totalReferenceLow)} – {money(result.totalReferenceHigh)}
                    </p>
                </div>
            </div>

            {result.riskJustification && (
                <p className="text-sm font-semibold text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                    {result.riskJustification}
                </p>
            )}

            {/* Tabla CPT */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-2 font-black flex items-center gap-2"><ListChecks className="w-5 h-5 text-alteha-violet" /> Análisis por procedimiento</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-slate-50">
                            {['CPT', 'Procedimiento', 'Cant.', 'Facturado', 'Rango mercado', 'Veredicto'].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {items.map((it, i) => {
                                const v = VERDICT[it.verdict] || VERDICT.NO_VERIFICABLE;
                                return (
                                    <tr key={i} className="border-t border-slate-50 align-top">
                                        <td className="px-5 py-3 font-black text-alteha-violet whitespace-nowrap">{it.cpt || 'N/A'}</td>
                                        <td className="px-5 py-3 font-semibold">
                                            {it.description || it.invoicedDescription}
                                            {it.note && <p className="text-[11px] text-slate-400 mt-0.5">{it.note}</p>}
                                        </td>
                                        <td className="px-5 py-3 font-bold tabular-nums">{it.quantity ?? 1}</td>
                                        <td className="px-5 py-3 font-black tabular-nums whitespace-nowrap">{money(it.invoicedAmount)}</td>
                                        <td className="px-5 py-3 font-semibold tabular-nums text-slate-500 whitespace-nowrap">
                                            {it.marketLow != null ? `${money(it.marketLow)} – ${money(it.marketHigh)}` : '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full border-2 whitespace-nowrap" style={{ color: v.color, borderColor: v.color }}>
                                                {v.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!items.length && <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-semibold">Sin renglones identificados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hallazgos */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
                <p className="font-black flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Hallazgos de auditoría</p>
                {findings.length === 0 ? (
                    <p className="text-sm text-emerald-600 font-bold bg-emerald-50 rounded-2xl p-4 flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5" /> Sin hallazgos relevantes: la cuenta es consistente con el informe médico.
                    </p>
                ) : findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4">
                        <span className="text-[9px] font-black text-white rounded-full px-2.5 py-1 mt-0.5" style={{ background: SEV[f.severity] || SEV.BAJA }}>{f.severity}</span>
                        <div>
                            <p className="font-black text-sm">{f.title}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{f.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Conclusión + recomendaciones */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="border-l-4 border-alteha-turquoise pl-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conclusión</p>
                    <p className="text-sm font-semibold text-slate-600 mt-1">{result.conclusion || '—'}</p>
                </div>
                {recs.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recomendaciones</p>
                        <ul className="space-y-1.5">
                            {recs.map((r, i) => (
                                <li key={i} className="text-sm font-semibold text-slate-600 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-alteha-violet mt-1.5 shrink-0" /> {r}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <p className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3">
                    Los precios de referencia son estimaciones de mercado generadas por IA y no constituyen tarifas oficiales.
                    Este informe es un apoyo a la decisión y no sustituye el juicio del auditor médico humano.
                    Confiabilidad documental estimada: {result.confidence != null ? `${result.confidence}%` : 'n/d'}.
                </p>
            </div>
        </div>
    );
}
