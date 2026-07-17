"use client";

// Detalle de una auditoría médica de Alteha: evaluación auditable con la marca
// (folio, CPT, precios de referencia, hallazgos, riesgo) + descarga en PDF.
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ArrowLeft, Loader2, Download, FileText, Receipt, ShieldAlert, ShieldCheck, Shield,
    ExternalLink, BadgeCheck, AlertTriangle, ListChecks, BrainCircuit,
} from 'lucide-react';
import { getStoredToken } from '@/lib/api';

const RISK: any = {
    BAJO: { label: 'RIESGO BAJO', color: [16, 185, 129], soft: [236, 253, 245], Icon: ShieldCheck },
    MEDIO: { label: 'RIESGO MEDIO', color: [245, 158, 11], soft: [255, 251, 235], Icon: Shield },
    ALTO: { label: 'RIESGO ALTO', color: [239, 68, 68], soft: [254, 242, 242], Icon: ShieldAlert },
};
const VERDICT: any = {
    DENTRO_DE_RANGO: { label: 'Dentro de rango', color: [16, 185, 129] },
    SOBRE_RANGO: { label: 'Sobre el rango', color: [239, 68, 68] },
    BAJO_RANGO: { label: 'Bajo el rango', color: [14, 165, 233] },
    NO_VERIFICABLE: { label: 'No verificable', color: [148, 163, 184] },
};
const SEV: any = { ALTA: [239, 68, 68], MEDIA: [245, 158, 11], BAJA: [148, 163, 184] };

const TURQUOISE = [46, 207, 191] as const;
const VIOLET = [123, 91, 255] as const;
const GRAY = [44, 46, 51] as const;

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short' }) : '—');
const money = (v?: number | null) =>
    v == null ? '—' : `$${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// El logo es SVG: lo rasterizamos a PNG con un canvas para poder incrustarlo en el PDF.
async function logoPng(): Promise<string | null> {
    try {
        const svgText = await fetch('/logoalteha.svg').then((r) => r.text());
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = url; });
        const canvas = document.createElement('canvas');
        const w = img.width || 300, h = img.height || 100;
        canvas.width = w * 3; canvas.height = h * 3;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        return canvas.toDataURL('image/png');
    } catch { return null; }
}

export default function AuditDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [audit, setAudit] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pdfBusy, setPdfBusy] = useState(false);

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

    // ══════════ PDF con el manual de marca Alteha ══════════
    const downloadPdf = async () => {
        setPdfBusy(true);
        try {
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            const M = 40;
            let y = M;

            const ensure = (need: number) => {
                if (y + need > H - 60) { doc.addPage(); y = M; }
            };
            const section = (title: string) => {
                ensure(40);
                doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...VIOLET);
                doc.text(title.toUpperCase(), M, y);
                y += 12;
            };

            // ── Cabecera de marca ──
            doc.setFillColor(...GRAY);
            doc.roundedRect(M, y, W - M * 2, 74, 14, 14, 'F');
            const logo = await logoPng();
            if (logo) doc.addImage(logo, 'PNG', M + 20, y + 19, 90, 36);
            doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(255, 255, 255);
            doc.text('Informe de Auditoría Médica', M + 124, y + 32);
            doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(166, 173, 187);
            doc.text('Auditoría de cuentas médicas · Alteha', M + 124, y + 46);
            doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...TURQUOISE);
            doc.text(String(audit.auditNumber || ''), W - M - 20, y + 32, { align: 'right' });
            doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(166, 173, 187);
            doc.text(fmtDate(audit.createdAt), W - M - 20, y + 46, { align: 'right' });
            y += 86;

            // Banda degradada turquesa → violeta
            const segs = 40, bw = (W - M * 2) / segs;
            for (let i = 0; i < segs; i++) {
                const t = i / (segs - 1);
                doc.setFillColor(
                    Math.round(TURQUOISE[0] + (VIOLET[0] - TURQUOISE[0]) * t),
                    Math.round(TURQUOISE[1] + (VIOLET[1] - TURQUOISE[1]) * t),
                    Math.round(TURQUOISE[2] + (VIOLET[2] - TURQUOISE[2]) * t),
                );
                doc.rect(M + i * bw, y, bw + 0.5, 4, 'F');
            }
            y += 22;

            // ── Datos de la intervención ──
            section('Datos de la intervención');
            autoTable(doc, {
                startY: y, margin: { left: M, right: M }, theme: 'plain',
                styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 0, right: 10 }, textColor: [51, 65, 85] },
                columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 120 } },
                body: [
                    ['Paciente', result.patientName || audit.patientName || '—'],
                    ['Prestador', result.providerName || '—'],
                    ['Fecha del procedimiento', result.procedureDate || '—'],
                    ['Diagnóstico', result.diagnosis || '—'],
                    ['Intervención auditada', result.procedureSummary || audit.procedureSummary || '—'],
                    ['Solicitante', audit.insurance?.name || '—'],
                ],
            });
            y = (doc as any).lastAutoTable.finalY + 16;

            // ── Dictamen de riesgo ──
            section('Dictamen de riesgo');
            const just = doc.splitTextToSize(String(result.riskJustification || ''), W - M * 2 - 150);
            const rh = Math.max(44, 22 + just.length * 11);
            ensure(rh + 10);
            doc.setFillColor(risk.soft[0], risk.soft[1], risk.soft[2]);
            doc.setDrawColor(risk.color[0], risk.color[1], risk.color[2]);
            doc.setLineWidth(1.5);
            doc.roundedRect(M, y, W - M * 2, rh, 10, 10, 'FD');
            doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(risk.color[0], risk.color[1], risk.color[2]);
            doc.text(risk.label, M + 16, y + rh / 2 + 4);
            doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(71, 85, 105);
            doc.text(just, M + 130, y + 16);
            y += rh + 18;

            // ── Tabla CPT ──
            section('Análisis por procedimiento (CPT · precios de referencia)');
            autoTable(doc, {
                startY: y, margin: { left: M, right: M },
                headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold', fontSize: 7.5 },
                styles: { font: 'helvetica', fontSize: 8, cellPadding: 5, textColor: [51, 65, 85] },
                columnStyles: {
                    0: { fontStyle: 'bold', textColor: [VIOLET[0], VIOLET[1], VIOLET[2]], cellWidth: 52 },
                    2: { halign: 'right', cellWidth: 34 },
                    3: { halign: 'right', cellWidth: 66 },
                    4: { halign: 'right', cellWidth: 90 },
                    5: { cellWidth: 78 },
                },
                head: [['CPT', 'Procedimiento', 'Cant.', 'Facturado', 'Rango mercado', 'Veredicto']],
                body: items.map((it) => [
                    it.cpt || 'N/A',
                    (it.description || it.invoicedDescription || '') + (it.note ? `\n${it.note}` : ''),
                    String(it.quantity ?? 1),
                    money(it.invoicedAmount),
                    it.marketLow != null ? `${money(it.marketLow)} – ${money(it.marketHigh)}` : '—',
                    (VERDICT[it.verdict] || VERDICT.NO_VERIFICABLE).label,
                ]),
                didParseCell: (d) => {
                    if (d.section === 'body' && d.column.index === 5) {
                        const v = VERDICT[items[d.row.index]?.verdict] || VERDICT.NO_VERIFICABLE;
                        d.cell.styles.textColor = v.color;
                        d.cell.styles.fontStyle = 'bold';
                    }
                },
            });
            y = (doc as any).lastAutoTable.finalY + 10;

            // ── Totales ──
            autoTable(doc, {
                startY: y, margin: { left: M, right: M }, theme: 'plain',
                styles: { font: 'helvetica', fontSize: 9, fontStyle: 'bold', cellPadding: 8, halign: 'center' },
                body: [[
                    `Total facturado\n${money(result.totalInvoiced ?? audit.totalInvoiced)}`,
                    `Referencia mercado (mín)\n${money(result.totalReferenceLow)}`,
                    `Referencia mercado (máx)\n${money(result.totalReferenceHigh)}`,
                ]],
                didParseCell: (d) => {
                    const fills = [[248, 250, 252], [231, 249, 247], [240, 235, 255]];
                    const texts = [[51, 65, 85], [13, 148, 136], [VIOLET[0], VIOLET[1], VIOLET[2]]];
                    d.cell.styles.fillColor = fills[d.column.index] as any;
                    d.cell.styles.textColor = texts[d.column.index] as any;
                },
            });
            y = (doc as any).lastAutoTable.finalY + 18;

            // ── Hallazgos ──
            section('Hallazgos de auditoría');
            if (!findings.length) {
                ensure(20);
                doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(16, 185, 129);
                doc.text('Sin hallazgos relevantes: la cuenta es consistente con el informe médico.', M, y + 4);
                y += 20;
            }
            for (const f of findings) {
                const detail = doc.splitTextToSize(String(f.detail || ''), W - M * 2 - 70);
                const bh = 26 + detail.length * 10;
                ensure(bh + 8);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(M, y, W - M * 2, bh, 8, 8, 'F');
                const sc = SEV[f.severity] || SEV.BAJA;
                doc.setFillColor(sc[0], sc[1], sc[2]);
                doc.roundedRect(M + 12, y + 9, 38, 12, 6, 6, 'F');
                doc.setFont('helvetica', 'bold').setFontSize(6.5).setTextColor(255, 255, 255);
                doc.text(String(f.severity || 'BAJA'), M + 31, y + 17.5, { align: 'center' });
                doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...GRAY);
                doc.text(String(f.title || ''), M + 58, y + 18);
                doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(100, 116, 139);
                doc.text(detail, M + 58, y + 30);
                y += bh + 8;
            }
            y += 10;

            // ── Conclusión ──
            section('Conclusión');
            const conc = doc.splitTextToSize(String(result.conclusion || '—'), W - M * 2 - 24);
            const ch = 16 + conc.length * 11;
            ensure(ch + 10);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(M, y, W - M * 2, ch, 8, 8, 'F');
            doc.setFillColor(...TURQUOISE);
            doc.rect(M, y + 4, 3.5, ch - 8, 'F');
            doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(51, 65, 85);
            doc.text(conc, M + 16, y + 15);
            y += ch + 16;

            // ── Recomendaciones ──
            if (recs.length) {
                section('Recomendaciones');
                for (const r of recs) {
                    const lines = doc.splitTextToSize(String(r), W - M * 2 - 20);
                    ensure(lines.length * 11 + 6);
                    doc.setFillColor(...VIOLET);
                    doc.circle(M + 4, y + 3.2, 2, 'F');
                    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(51, 65, 85);
                    doc.text(lines, M + 14, y + 6);
                    y += lines.length * 11 + 6;
                }
                y += 8;
            }

            // ── Pie: metodología + confidencialidad ──
            const foot =
                `Metodología: lectura documental del informe médico y la factura; codificación CPT; comparación contra rangos de precio de mercado ` +
                `de salud privada (Venezuela/Latam) estimados por Alteha; cruce informe-factura para detección de inconsistencias. ` +
                `Confiabilidad documental estimada: ${result.confidence != null ? `${result.confidence}%` : 'n/d'}. ` +
                `Los precios de referencia son estimaciones y no constituyen tarifas oficiales. Este informe es un apoyo a la decisión y no sustituye ` +
                `el juicio del auditor médico. Documento confidencial para uso exclusivo de ${audit.insurance?.name || 'la aseguradora solicitante'}.`;
            const flines = doc.splitTextToSize(foot, W - M * 2 - 110);
            ensure(flines.length * 9 + 30);
            doc.setDrawColor(226, 232, 240).setLineWidth(1);
            doc.line(M, y, W - M, y);
            y += 14;
            doc.setFont('helvetica', 'normal').setFontSize(6.8).setTextColor(148, 163, 184);
            doc.text(flines, M, y);
            doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...VIOLET);
            doc.text('alteha.com', W - M, y, { align: 'right' });
            doc.text(`Folio verificable: ${audit.auditNumber}`, W - M, y + 11, { align: 'right' });

            // Numeración de páginas
            const pages = doc.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(148, 163, 184);
                doc.text(`${audit.auditNumber} · Página ${i} de ${pages}`, W / 2, H - 24, { align: 'center' });
            }

            doc.save(`${audit.auditNumber}.pdf`);
        } finally {
            setPdfBusy(false);
        }
    };

    const riskColor = `rgb(${risk.color.join(',')})`;
    const riskSoft = `rgb(${risk.soft.join(',')})`;

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
                    <button onClick={downloadPdf} disabled={pdfBusy}
                        className="px-5 py-2.5 rounded-xl font-black text-white bg-alteha-gradient flex items-center gap-2 disabled:opacity-60">
                        {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Descargar PDF
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
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background: riskSoft }}>
                    <risk.Icon className="w-7 h-7 mx-auto" style={{ color: riskColor }} />
                    <p className="font-black text-sm mt-1" style={{ color: riskColor }}>{risk.label}</p>
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
                                const vc = `rgb(${v.color.join(',')})`;
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
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full border-2 whitespace-nowrap" style={{ color: vc, borderColor: vc }}>
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
                        <span className="text-[9px] font-black text-white rounded-full px-2.5 py-1 mt-0.5" style={{ background: `rgb(${(SEV[f.severity] || SEV.BAJA).join(',')})` }}>{f.severity}</span>
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
                    Los precios de referencia son estimaciones de mercado de Alteha y no constituyen tarifas oficiales.
                    Este informe es un apoyo a la decisión y no sustituye el juicio del auditor médico.
                    Confiabilidad documental estimada: {result.confidence != null ? `${result.confidence}%` : 'n/d'}.
                </p>
            </div>
        </div>
    );
}
