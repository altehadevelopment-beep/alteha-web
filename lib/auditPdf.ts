// Los dos entregables de la Fase 4 de la metodología de auditoría de azALTEHA,
// construidos sobre el mismo análisis para que no se contradigan entre sí:
//
//   · informeEjecutivo  — Presidencia y Junta Directiva. Máximo cuatro páginas,
//     sin detalle de caso ni argumentación clínica: responde qué decisión tomar.
//   · informeTecnico    — Auditoría y Redes. El documento que va a la mesa con
//     el prestador y debe resistir su contradicción línea por línea.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TURQUOISE: [number, number, number] = [46, 207, 191];
const VIOLET: [number, number, number] = [123, 91, 255];
const GRAY: [number, number, number] = [44, 46, 51];
const SLATE: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [148, 163, 184];

export const RISK: Record<string, { label: string; color: [number, number, number]; soft: [number, number, number] }> = {
    BAJO: { label: 'RIESGO BAJO', color: [16, 185, 129], soft: [236, 253, 245] },
    MEDIO: { label: 'RIESGO MEDIO', color: [245, 158, 11], soft: [255, 251, 235] },
    ALTO: { label: 'RIESGO ALTO', color: [239, 68, 68], soft: [254, 242, 242] },
};

export const CANALES: Record<string, string> = {
    AVAL: 'Cartas avales (programado)',
    EMERGENCIA: 'Emergencias médicas',
    REEMBOLSO: 'Reembolsos',
    APS: 'Atención Primaria de Salud',
    CONTINUO: 'Tratamiento médico continuo',
};

export const ESCALA_RECHAZO: Record<string, string> = {
    'G-1': 'Pertinencia',
    'G-2': 'Codificación',
    'G-3': 'Paquete',
    'G-4': 'Tarifario',
    'G-5': 'Composición',
    'G-6': 'Consumo',
    'G-7': 'Duplicidad',
    'G-8': 'Estadístico',
    'G-9': 'Requerimiento previo',
};

const money = (v?: number | null, cur = 'USD') =>
    v == null || isNaN(Number(v))
        ? '—'
        : `${cur === 'USD' ? '$' : ''}${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fecha = (v?: string) => (v ? new Date(v).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short' }) : '—');

/** El modelo a veces devuelve la confiabilidad como fracción (0,95) en vez de porcentaje. */
export const confianza = (v: any) => {
    const n = Number(v);
    if (v == null || isNaN(n)) return null;
    return Math.round(n <= 1 ? n * 100 : n);
};

// El logo es SVG: se rasteriza con un canvas para poder incrustarlo en el PDF.
// El lienzo se fija a un tamaño acotado —el SVG de marca no declara dimensiones
// intrínsecas fiables y con lienzos muy grandes toDataURL devuelve una cadena
// vacía que jsPDF rechaza con «wrong PNG signature»—. Se cachea porque los dos
// entregables lo piden y la rasterización no es gratis.
let logoCache: { data: string; razon: number } | null | undefined;

async function logoPng(): Promise<{ data: string; razon: number } | null> {
    if (logoCache !== undefined) return logoCache;
    try {
        const svgText = await fetch('/logoalteha.svg').then((r) => r.text());
        const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
        const img = new Image();
        img.width = 360;
        img.height = 144;
        await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = url; });
        // El lienzo toma la proporción real del SVG para que el logo no quede
        // rodeado de aire dentro de la cabecera.
        const razon = (img.naturalWidth || 360) / (img.naturalHeight || 144);
        const canvas = document.createElement('canvas');
        canvas.height = 300;
        canvas.width = Math.round(300 * razon);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const data = canvas.toDataURL('image/png');
        logoCache = data.startsWith('data:image/png') && data.length > 200 ? { data, razon } : null;
        return logoCache;
    } catch {
        logoCache = null;
        return null;
    }
}

/** Utilidades de maquetación compartidas por los dos entregables. */
class Lienzo {
    doc: jsPDF;
    W: number;
    H: number;
    M = 40;
    y = 40;

    constructor() {
        this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
        this.W = this.doc.internal.pageSize.getWidth();
        this.H = this.doc.internal.pageSize.getHeight();
    }

    get ancho() {
        return this.W - this.M * 2;
    }

    espacio(necesario: number) {
        if (this.y + necesario > this.H - 62) {
            this.doc.addPage();
            this.y = this.M;
        }
    }

    seccion(titulo: string, sub?: string) {
        this.espacio(46);
        this.doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...VIOLET);
        this.doc.text(titulo.toUpperCase(), this.M, this.y);
        this.y += 11;
        if (sub) {
            this.doc.setFont('helvetica', 'normal').setFontSize(7.6).setTextColor(...MUTED);
            const l = this.doc.splitTextToSize(sub, this.ancho);
            this.doc.text(l, this.M, this.y);
            this.y += l.length * 9 + 3;
        }
        this.doc.setDrawColor(...TURQUOISE).setLineWidth(1.4);
        this.doc.line(this.M, this.y, this.M + 34, this.y);
        this.y += 12;
    }

    parrafo(texto: string, tam = 8.6) {
        if (!texto) return;
        const l = this.doc.splitTextToSize(String(texto), this.ancho);
        this.espacio(l.length * (tam + 3) + 8);
        this.doc.setFont('helvetica', 'normal').setFontSize(tam).setTextColor(...SLATE);
        this.doc.text(l, this.M, this.y + tam);
        this.y += l.length * (tam + 3) + 8;
    }

    /** Bloque destacado con barra de color: para citas de la metodología. */
    nota(texto: string, color: [number, number, number] = TURQUOISE, fondo: [number, number, number] = [248, 250, 252]) {
        const l = this.doc.splitTextToSize(String(texto), this.ancho - 26);
        const alto = 14 + l.length * 10.5;
        this.espacio(alto + 10);
        this.doc.setFillColor(...fondo);
        this.doc.roundedRect(this.M, this.y, this.ancho, alto, 8, 8, 'F');
        this.doc.setFillColor(...color);
        this.doc.rect(this.M, this.y + 4, 3.5, alto - 8, 'F');
        this.doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...SLATE);
        this.doc.text(l, this.M + 16, this.y + 15);
        this.y += alto + 12;
    }

    vinetas(items: string[]) {
        for (const it of items) {
            const l = this.doc.splitTextToSize(String(it), this.ancho - 18);
            this.espacio(l.length * 11 + 6);
            this.doc.setFillColor(...VIOLET);
            this.doc.circle(this.M + 4, this.y + 3.2, 2, 'F');
            this.doc.setFont('helvetica', 'normal').setFontSize(8.4).setTextColor(...SLATE);
            this.doc.text(l, this.M + 14, this.y + 6);
            this.y += l.length * 11 + 6;
        }
        this.y += 4;
    }

    tabla(opts: any) {
        autoTable(this.doc, {
            startY: this.y,
            margin: { left: this.M, right: this.M },
            headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold', fontSize: 7.2 },
            styles: { font: 'helvetica', fontSize: 7.6, cellPadding: 4.5, textColor: SLATE, valign: 'top' },
            ...opts,
        });
        this.y = (this.doc as any).lastAutoTable.finalY + 14;
    }

    async portada(audit: any, titulo: string, bajada: string, etiqueta: string) {
        const d = this.doc;
        d.setFillColor(...GRAY);
        d.roundedRect(this.M, this.y, this.ancho, 84, 14, 14, 'F');
        const logo = await logoPng();
        // El logotipo lleva el wordmark en negro: va sobre una pastilla blanca
        // para que se lea contra la cabecera oscura.
        const alto = 40;
        const ancho = logo ? Math.min(alto * logo.razon, 104) : 0;
        if (logo) {
            d.setFillColor(255, 255, 255);
            d.roundedRect(this.M + 16, this.y + 14, ancho + 24, alto + 16, 10, 10, 'F');
            d.addImage(logo.data, 'PNG', this.M + 28, this.y + 22, ancho, alto);
        }
        const x = this.M + 16 + (ancho ? ancho + 24 : 70) + 20;
        d.setFont('helvetica', 'bold').setFontSize(14).setTextColor(255, 255, 255);
        d.text(titulo, x, this.y + 34);
        d.setFont('helvetica', 'normal').setFontSize(8).setTextColor(166, 173, 187);
        d.text(bajada, x, this.y + 48);
        d.setFont('helvetica', 'bold').setFontSize(6.6).setTextColor(...TURQUOISE);
        d.text(etiqueta.toUpperCase(), x, this.y + 63);
        d.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...TURQUOISE);
        d.text(String(audit.auditNumber || ''), this.W - this.M - 20, this.y + 34, { align: 'right' });
        d.setFont('helvetica', 'normal').setFontSize(7).setTextColor(166, 173, 187);
        d.text(fecha(audit.createdAt), this.W - this.M - 20, this.y + 48, { align: 'right' });
        d.text(audit.insurance?.name || '', this.W - this.M - 20, this.y + 60, { align: 'right' });
        this.y += 96;

        // Banda degradada turquesa → violeta
        const segs = 40, bw = this.ancho / segs;
        for (let i = 0; i < segs; i++) {
            const t = i / (segs - 1);
            d.setFillColor(
                Math.round(TURQUOISE[0] + (VIOLET[0] - TURQUOISE[0]) * t),
                Math.round(TURQUOISE[1] + (VIOLET[1] - TURQUOISE[1]) * t),
                Math.round(TURQUOISE[2] + (VIOLET[2] - TURQUOISE[2]) * t),
            );
            d.rect(this.M + i * bw, this.y, bw + 0.5, 4, 'F');
        }
        this.y += 22;
    }

    cierre(audit: any, r: any, textoMetodologia: string) {
        const d = this.doc;
        const pie =
            `${textoMetodologia} Confiabilidad documental estimada: ${confianza(r.confidence) != null ? `${confianza(r.confidence)}%` : 'n/d'}. ` +
            `Motor de análisis: ${audit.aiProvider || 'n/d'}${audit.aiModel ? ` · ${audit.aiModel}` : ''}. ` +
            `Las tipologías descritas son indicadores de irregularidad que exigen confirmación documental y no equivalen a una determinación ` +
            `de conducta sancionable. Los precios de referencia son estimaciones de mercado y no constituyen tarifas oficiales. ` +
            `Este informe es un apoyo a la decisión y no sustituye el juicio del auditor médico. Documento confidencial para uso exclusivo de ` +
            `${audit.insurance?.name || 'la aseguradora solicitante'}.`;
        const l = d.splitTextToSize(pie, this.ancho - 110);
        this.espacio(l.length * 9 + 34);
        d.setDrawColor(226, 232, 240).setLineWidth(1);
        d.line(this.M, this.y, this.W - this.M, this.y);
        this.y += 14;
        d.setFont('helvetica', 'normal').setFontSize(6.6).setTextColor(...MUTED);
        d.text(l, this.M, this.y);
        d.setFont('helvetica', 'bold').setFontSize(7.4).setTextColor(...VIOLET);
        d.text('alteha.com', this.W - this.M, this.y, { align: 'right' });
        d.text(`Folio: ${audit.auditNumber}`, this.W - this.M, this.y + 11, { align: 'right' });

        const paginas = d.getNumberOfPages();
        for (let i = 1; i <= paginas; i++) {
            d.setPage(i);
            d.setFont('helvetica', 'normal').setFontSize(6.8).setTextColor(...MUTED);
            d.text(
                `${audit.auditNumber} · Metodología de Auditoría Médica azALTEHA V1.1 · Documento confidencial · Página ${i} de ${paginas}`,
                this.W / 2,
                this.H - 24,
                { align: 'center' },
            );
        }
    }
}

/** Recuadro del dictamen de riesgo, común a los dos entregables. */
function dictamenRiesgo(c: Lienzo, riskLevel: string, justificacion: string) {
    const risk = RISK[riskLevel] || RISK.MEDIO;
    const just = c.doc.splitTextToSize(String(justificacion || '—'), c.ancho - 160);
    const alto = Math.max(46, 22 + just.length * 11);
    c.espacio(alto + 12);
    c.doc.setFillColor(...risk.soft);
    c.doc.setDrawColor(...risk.color).setLineWidth(1.5);
    c.doc.roundedRect(c.M, c.y, c.ancho, alto, 10, 10, 'FD');
    c.doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...risk.color);
    c.doc.text(risk.label, c.M + 16, c.y + alto / 2 + 4);
    c.doc.setFont('helvetica', 'normal').setFontSize(8.4).setTextColor(71, 85, 105);
    c.doc.text(just, c.M + 140, c.y + 16);
    c.y += alto + 16;
}

// ══════════════════════════════════════════════════════════════════════
// ENTREGABLE I — Informe ejecutivo
// ══════════════════════════════════════════════════════════════════════

export async function informeEjecutivo(audit: any, r: any) {
    const c = new Lienzo();
    const cur = audit.currency || 'USD';
    const f3 = r.fase3 || {};
    const f4 = r.fase4 || {};
    const tab = f4.tableroImpacto || {};
    const comp = f4.composicionImpacto || {};
    const exp = r.expediente || {};

    await c.portada(
        audit,
        'Informe Ejecutivo de Auditoría',
        'Presidencia y Junta Directiva · Dirección Médica y de Auditoría',
        'Entregable I · Fase 4 de la metodología',
    );

    // ── Tablero de impacto ──
    c.seccion('Tablero de impacto', 'Cuatro indicadores de decisión. La contención se separa de la recuperación: no son la misma cifra.');
    c.tabla({
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 8.6, fontStyle: 'bold', cellPadding: 9, halign: 'center', textColor: SLATE },
        body: [
            [
                `Monto facturado\n${money(tab.montoFacturado ?? f3.totalFacturado, cur)}`,
                `Monto procedente\n${money(f3.totalProcedente, cur)}`,
                `Total objetado\n${money(f3.totalRechazado, cur)}`,
                `Desviación\n${f3.porcentajeDesviacion != null ? `${Number(f3.porcentajeDesviacion).toFixed(1)}%` : '—'}`,
            ],
        ],
        didParseCell: (d: any) => {
            const fills = [[248, 250, 252], [236, 253, 245], [254, 242, 242], [240, 235, 255]];
            const texts = [SLATE, [13, 148, 136], [220, 38, 38], VIOLET];
            d.cell.styles.fillColor = fills[d.column.index];
            d.cell.styles.textColor = texts[d.column.index];
        },
    });
    c.tabla({
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 4, bottom: 4, left: 0, right: 10 }, textColor: SLATE },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 230 }, 1: { halign: 'right', fontStyle: 'bold' }, 2: { cellWidth: 150, fontSize: 7.2, textColor: MUTED } },
        body: [
            ['Ahorro contenido — antes del pago', money(tab.ahorroContenido, cur), 'Alta probabilidad de captura'],
            ['Ahorro en recuperación — caso liquidado', money(tab.ahorroRecuperacion, cur), 'Baja probabilidad de captura'],
            ['Retención neta de la compañía', money(tab.retencionNeta ?? f3.totalRechazado, cur), 'Beneficio económico efectivo'],
        ],
    });

    // ── Hallazgo central ──
    if (f4.hallazgoCentral) {
        c.seccion('Hallazgo central', 'La causa estructural que produce las desviaciones, no la lista de sus síntomas.');
        c.nota(f4.hallazgoCentral, VIOLET, [244, 242, 255]);
    }

    // ── Dictamen ──
    c.seccion('Dictamen de riesgo');
    dictamenRiesgo(c, audit.riskLevel || r.riskLevel, r.riskJustification);

    // ── Composición del impacto ──
    c.seccion('Composición del impacto', 'La Junta debe distinguir lo cobrable de lo negociable.');
    c.tabla({
        head: [['Concepto', 'Monto', 'Naturaleza de la objeción']],
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold', cellWidth: 90 } },
        body: [
            ['Objetable directo', money(comp.objetableDirecto, cur), 'Con soporte contractual — incumplimiento oponible'],
            ['Condicional', money(comp.condicionalRecodificacion, cur), 'Sujeto a recodificación o a consignación de soporte'],
        ],
    });
    if (comp.comentario) c.parrafo(comp.comentario, 8.2);

    // ── Datos del caso ──
    c.seccion('Caso auditado');
    c.tabla({
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 8.2, cellPadding: { top: 3, bottom: 3, left: 0, right: 10 }, textColor: SLATE },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 130 } },
        body: [
            ['Paciente', exp.paciente || audit.patientName || '—'],
            ['Prestador', `${exp.prestador || '—'}${exp.categoriaPrestador ? ` · categoría ${exp.categoriaPrestador}` : ''}`],
            ['Canal de atención', CANALES[r.fase5?.canal || exp.canal] || exp.canal || '—'],
            ['Fecha del evento', exp.fechaEvento || '—'],
            ['Diagnóstico', `${exp.diagnosticoCIE ? `${exp.diagnosticoCIE} · ` : ''}${exp.diagnosticoTexto || '—'}`],
            ['Intervención', exp.procedimientoResumen || audit.procedureSummary || '—'],
            ['Pertinencia médica', `${r.fase1?.nivel || '—'} · ${r.fase1?.calificacion || ''}`],
        ],
    });

    // ── Riesgo financiero ──
    if (f4.riesgoFinanciero) {
        c.seccion('Riesgo financiero');
        c.parrafo(f4.riesgoFinanciero);
    }

    // ── Recomendaciones ──
    const recs: any[] = Array.isArray(r.recomendaciones) ? r.recomendaciones.slice(0, 5) : [];
    if (recs.length) {
        c.seccion('Recomendaciones', 'Formuladas como decisión a aprobar. Máximo cinco, cada una con monto y plazo.');
        c.tabla({
            head: [['#', 'Decisión a aprobar', 'Monto asociado', 'Plazo']],
            columnStyles: {
                0: { cellWidth: 22, fontStyle: 'bold', textColor: VIOLET },
                2: { halign: 'right', cellWidth: 80, fontStyle: 'bold' },
                3: { cellWidth: 80 },
            },
            body: recs.map((x, i) => [String(i + 1), x.accion || '', money(x.montoAsociado, cur), x.plazo || '—']),
        });
    }

    // ── Conclusión ──
    c.seccion('Conclusión ejecutiva');
    c.nota(r.conclusionEjecutiva || '—');

    if (Array.isArray(r.requerimientosPrevios) && r.requerimientosPrevios.length) {
        c.seccion('Requerimientos previos', 'Su ausencia suspende el plazo de respuesta al prestador; no habilita el pago.');
        c.vinetas(r.requerimientosPrevios);
    }

    c.cierre(
        audit,
        r,
        'Metodología de Auditoría Médica, Barematación y Negociación de Redes V1.1 de azALTEHA: pertinencia médica, auditoría de codificación CPT, ' +
            'auditoría financiera con jerarquía de anclaje tarifario y consolidación en dictamen único.',
    );
    c.doc.save(`${audit.auditNumber}-informe-ejecutivo.pdf`);
}

// ══════════════════════════════════════════════════════════════════════
// ENTREGABLE II — Informe técnico-operativo
// ══════════════════════════════════════════════════════════════════════

export async function informeTecnico(audit: any, r: any) {
    const c = new Lienzo();
    const cur = audit.currency || 'USD';
    const exp = r.expediente || {};
    const f1 = r.fase1 || {};
    const f2 = r.fase2 || {};
    const f3 = r.fase3 || {};
    const f4 = r.fase4 || {};
    const f5 = r.fase5 || {};

    await c.portada(
        audit,
        'Informe Técnico-Operativo de Auditoría',
        'Gerencia de Auditoría Médica y Gerencia de Redes',
        'Entregable II · Fase 4 de la metodología',
    );

    c.nota(
        'Principio rector: el control se ejerce antes del compromiso del gasto. Cada objeción de este pliego identifica la línea facturada, ' +
            'el código correcto propuesto, el monto que sí se reconoce y el fundamento citado, para que sea oponible ante el prestador. ' +
            'Las tipologías son indicadores de irregularidad que exigen confirmación documental y no constituyen determinación de conducta sancionable.',
        VIOLET,
        [244, 242, 255],
    );

    // ── Expediente ──
    c.seccion('Expediente del caso');
    c.tabla({
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 8.2, cellPadding: { top: 3, bottom: 3, left: 0, right: 10 }, textColor: SLATE },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 130 }, 2: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 110 } },
        body: [
            ['Paciente', exp.paciente || audit.patientName || '—', 'Póliza', exp.poliza || '—'],
            ['Prestador', exp.prestador || '—', 'Ramo', exp.ramo || '—'],
            ['Categoría de clínica', exp.categoriaPrestador || '—', 'Moneda', exp.moneda || cur],
            ['Canal de atención', CANALES[f5.canal || exp.canal] || '—', 'Fecha del evento', exp.fechaEvento || '—'],
            ['Diagnóstico CIE', exp.diagnosticoCIE || '—', 'Fecha de factura', exp.fechaFactura || '—'],
            ['Diagnóstico', exp.diagnosticoTexto || '—', 'Solicitante', audit.insurance?.name || '—'],
            ['Intervención auditada', exp.procedimientoResumen || '—', 'Motor', `${audit.aiProvider || '—'}`],
        ],
    });

    // ── Documentos ──
    const docs: any[] = Array.isArray(r.documentosRecibidos) ? r.documentosRecibidos : [];
    if (docs.length) {
        c.seccion('Expediente mínimo auditable', 'La ausencia de cualquiera de estos elementos genera requerimiento previo y suspende el cómputo del plazo.');
        c.tabla({
            head: [['Documento', 'Estado', 'Observación']],
            columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: 70, fontStyle: 'bold' } },
            body: docs.map((d) => [d.documento || '', d.presente ? 'Consignado' : 'Ausente', d.observacion || '—']),
            didParseCell: (d: any) => {
                if (d.section === 'body' && d.column.index === 1) {
                    d.cell.styles.textColor = docs[d.row.index]?.presente ? [16, 185, 129] : [239, 68, 68];
                }
            },
        });
    }

    // ══ FASE 1 ══
    c.seccion('Fase 1 · Pertinencia médica y evidencia diagnóstica', 'El dictamen final es el peor resultado de los cuatro ejes, no su promedio.');
    const ejes: any[] = Array.isArray(f1.ejes) ? f1.ejes : [];
    if (ejes.length) {
        c.tabla({
            head: [['Eje', 'Pregunta de auditoría', 'Evidencia que lo resuelve', 'Resultado']],
            columnStyles: { 0: { cellWidth: 96, fontStyle: 'bold' }, 3: { cellWidth: 74, fontStyle: 'bold' } },
            body: ejes.map((e) => [e.eje || '', e.pregunta || '', `${e.evidencia || ''}${e.comentario ? `\n${e.comentario}` : ''}`, e.resultado || '']),
            didParseCell: (d: any) => {
                if (d.section === 'body' && d.column.index === 3) {
                    const v = ejes[d.row.index]?.resultado;
                    d.cell.styles.textColor = v === 'CONFORME' ? [16, 185, 129] : v === 'OBSERVADO' ? [245, 158, 11] : [239, 68, 68];
                }
            },
        });
    }
    c.tabla({
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 8.2, cellPadding: { top: 3, bottom: 3, left: 0, right: 10 }, textColor: SLATE },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 150 } },
        body: [
            ['Escala de pertinencia', `${f1.nivel || '—'} · ${f1.calificacion || ''}`],
            ['Efecto sobre el aval', f1.efectoSobreAval || '—'],
            ['Fuente aplicada', `${f1.fuenteAplicada || '—'}${f1.nivelJerarquico ? ` (nivel jerárquico ${f1.nivelJerarquico})` : ''}`],
        ],
    });
    if (Array.isArray(f1.senalesSobreindicacion) && f1.senalesSobreindicacion.length) {
        c.parrafo('Señales de sobreindicación revisadas:', 8.4);
        c.vinetas(f1.senalesSobreindicacion);
    }

    // ══ FASE 2 ══
    c.seccion('Fase 2 · Auditoría de codificación (CPT / AMA)', 'Determina si lo facturado corresponde a lo realizado según el informe operatorio.');
    if (f2.codigoPrincipal?.cpt) {
        c.nota(
            `Procedimiento principal — ${f2.codigoPrincipal.cpt}: ${f2.codigoPrincipal.descripcion || ''}. ${f2.codigoPrincipal.justificacion || ''}`,
        );
    }
    const items: any[] = Array.isArray(f2.items) ? f2.items : [];
    if (items.length) {
        c.tabla({
            head: [['CPT', 'Renglón facturado', 'Cant.', 'Facturado', 'Procedente', 'Rechazado', 'Tipología']],
            columnStyles: {
                0: { cellWidth: 42, fontStyle: 'bold', textColor: VIOLET },
                2: { cellWidth: 26, halign: 'right' },
                3: { cellWidth: 56, halign: 'right' },
                4: { cellWidth: 56, halign: 'right' },
                5: { cellWidth: 56, halign: 'right', fontStyle: 'bold' },
                6: { cellWidth: 76, fontStyle: 'bold', fontSize: 6.6 },
            },
            body: items.map((it) => [
                `${it.cpt || 'N/A'}${it.cptPropuesto && it.cptPropuesto !== it.cpt ? `\n→ ${it.cptPropuesto}` : ''}`,
                `${it.invoicedDescription || it.descripcion || ''}${it.senalDeteccion ? `\n${it.senalDeteccion}` : ''}`,
                String(it.quantity ?? 1),
                money(it.invoicedAmount, cur),
                money(it.montoProcedente, cur),
                money(it.montoRechazado, cur),
                (it.tipologia || 'CONFORME').replace(/_/g, ' '),
            ]),
            didParseCell: (d: any) => {
                if (d.section === 'body' && d.column.index === 6) {
                    d.cell.styles.textColor = items[d.row.index]?.tipologia === 'CONFORME' ? [16, 185, 129] : [239, 68, 68];
                }
                if (d.section === 'body' && d.column.index === 5 && Number(items[d.row.index]?.montoRechazado) > 0) {
                    d.cell.styles.textColor = [239, 68, 68];
                }
            },
        });
    }
    const equipo: any[] = Array.isArray(f2.equipoQuirurgico) ? f2.equipoQuirurgico : [];
    if (equipo.length) {
        c.parrafo(
            'Composición del equipo quirúrgico. Un honorario de ayudantía sin profesional identificado por nombre y colegiatura se rechaza en su totalidad.',
            8.2,
        );
        c.tabla({
            head: [['Rol', 'Profesional', 'Identificado', '% referencia', 'Facturado', 'Procede', 'Observación']],
            columnStyles: {
                2: { cellWidth: 58, fontStyle: 'bold' },
                3: { cellWidth: 60, halign: 'right' },
                4: { cellWidth: 58, halign: 'right' },
                5: { cellWidth: 46, fontStyle: 'bold' },
            },
            body: equipo.map((e) => [
                e.rol || '',
                e.profesional || '—',
                e.identificado ? 'Sí' : 'No',
                e.porcentajeReferencia != null ? `${e.porcentajeReferencia}%` : '—',
                money(e.montoFacturado, cur),
                e.procede ? 'Sí' : 'No',
                e.observacion || '',
            ]),
            didParseCell: (d: any) => {
                if (d.section === 'body' && (d.column.index === 2 || d.column.index === 5)) {
                    const ok = d.column.index === 2 ? equipo[d.row.index]?.identificado : equipo[d.row.index]?.procede;
                    d.cell.styles.textColor = ok ? [16, 185, 129] : [239, 68, 68];
                }
            },
        });
    }
    if (f2.resumen) c.parrafo(f2.resumen);

    // ══ FASE 3 ══
    c.seccion('Fase 3 · Auditoría financiera, barematación y benchmarking', 'Un presupuesto en cifra global no es auditable: el importe único se devuelve sin auditar.');
    const bloques: any[] = Array.isArray(f3.bloques) ? f3.bloques : [];
    if (bloques.length) {
        c.tabla({
            head: [['Bloque', 'Facturado', 'Procedente', 'Ancla', 'Riesgo dominante / observación']],
            columnStyles: {
                0: { cellWidth: 110, fontStyle: 'bold' },
                1: { cellWidth: 62, halign: 'right' },
                2: { cellWidth: 62, halign: 'right' },
                3: { cellWidth: 40, fontStyle: 'bold', textColor: VIOLET, halign: 'center' },
            },
            body: bloques.map((b) => [
                b.bloque || '',
                money(b.montoFacturado, cur),
                money(b.montoProcedente, cur),
                b.anclaAplicada || 'N/A',
                `${b.riesgoDominante || ''}${b.observacion ? `\n${b.observacion}` : ''}`,
            ]),
        });
    }
    c.nota(
        'Jerarquía de anclaje tarifario — A-1 paquete del convenio (máxima, incumplimiento contractual) · A-2 baremo del convenio (alta) · ' +
            'A-3 referencial propio (media, política interna) · A-4 comparable de igual categoría (media, evidencia de mercado) · ' +
            'A-5 percentil histórico del prestador (baja, estadístico y negociable). La diferencia entre A-1 y A-5 no es de monto sino de ' +
            'capacidad de sostener la objeción.',
    );
    const indicadores: any[] = Array.isArray(f3.indicadores) ? f3.indicadores : [];
    if (indicadores.length) {
        c.tabla({
            head: [['Índice', 'Indicador', 'Valor', 'Umbral', 'Estado', 'Lectura']],
            columnStyles: {
                0: { cellWidth: 36, fontStyle: 'bold', textColor: VIOLET },
                2: { cellWidth: 48, halign: 'right', fontStyle: 'bold' },
                3: { cellWidth: 56 },
                4: { cellWidth: 62, fontStyle: 'bold' },
            },
            body: indicadores.map((i) => [
                i.indice || '',
                i.nombre || '',
                i.valor != null ? Number(i.valor).toLocaleString('es-VE', { maximumFractionDigits: 2 }) : '—',
                i.umbral || '—',
                (i.estado || '').replace(/_/g, ' '),
                i.lectura || '',
            ]),
            didParseCell: (d: any) => {
                if (d.section === 'body' && d.column.index === 4) {
                    const v = indicadores[d.row.index]?.estado;
                    d.cell.styles.textColor = v === 'CONFORME' ? [16, 185, 129] : v === 'ALERTA' ? [239, 68, 68] : MUTED;
                }
            },
        });
    }
    if (f3.benchmarking?.comentario) {
        c.parrafo(
            `Benchmarking ${f3.benchmarking.nivel || ''} — ${f3.benchmarking.comentario}` +
                (f3.benchmarking.rangoMercadoMin != null
                    ? ` Rango de mercado estimado: ${money(f3.benchmarking.rangoMercadoMin, cur)} – ${money(f3.benchmarking.rangoMercadoMax, cur)}.`
                    : ''),
        );
        if (f3.benchmarking.nivel === 'B-3') {
            c.nota(
                'Advertencia metodológica: el benchmarking de mercado (B-3) no es oponible al prestador, que no es parte de esa comparación. ' +
                    'Su función es de política tarifaria y de negociación de convenio, no de fundamento de un rechazo individual.',
                [245, 158, 11],
                [255, 251, 235],
            );
        }
    }
    c.tabla({
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 9, fontStyle: 'bold', cellPadding: 9, halign: 'center' },
        body: [[
            `Total facturado\n${money(f3.totalFacturado, cur)}`,
            `Total procedente\n${money(f3.totalProcedente, cur)}`,
            `Total rechazado\n${money(f3.totalRechazado, cur)}`,
        ]],
        didParseCell: (d: any) => {
            const fills = [[248, 250, 252], [236, 253, 245], [254, 242, 242]];
            const texts = [SLATE, [13, 148, 136], [220, 38, 38]];
            d.cell.styles.fillColor = fills[d.column.index];
            d.cell.styles.textColor = texts[d.column.index];
        },
    });

    // ══ FASE 4 · Pliego ══
    c.seccion('Fase 4 · Pliego de rechazos', 'Una línea por objeción. Tres cifras, nunca la diferencia sola: el prestador debe ver qué se le reconoce.');
    const lineas: any[] = Array.isArray(f4.lineasRechazo) ? f4.lineasRechazo : [];
    if (!lineas.length) {
        c.nota('Sin líneas objetables: la cuenta es consistente con el expediente clínico y con el anclaje tarifario aplicado.', [16, 185, 129], [236, 253, 245]);
    } else {
        c.tabla({
            head: [['Línea facturada', 'Cód. fact.', 'Cód. prop.', 'Tipología', 'Ancla', 'Facturado', 'Procedente', 'Rechazado', 'Clase']],
            styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 3.5, textColor: SLATE, valign: 'top' },
            headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold', fontSize: 6.4 },
            columnStyles: {
                1: { cellWidth: 36 },
                2: { cellWidth: 38, textColor: VIOLET, fontStyle: 'bold' },
                3: { cellWidth: 60, fontSize: 6.2 },
                4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
                5: { cellWidth: 47, halign: 'right' },
                6: { cellWidth: 47, halign: 'right' },
                7: { cellWidth: 47, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
                8: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
            },
            body: lineas.map((l) => [
                l.lineaFacturada || '',
                l.codigoFacturado || '—',
                l.codigoPropuesto || '—',
                (l.tipologia || '').replace(/_/g, ' '),
                l.anclaAplicada || 'N/A',
                money(l.montoFacturado, cur),
                money(l.montoProcedente, cur),
                money(l.montoRechazado, cur),
                l.escalaRechazo || '',
            ]),
        });

        c.seccion('Fundamento y documento requerido por objeción', 'Un rechazo sin fundamento citado es indefendible ante el prestador y ante el regulador.');
        c.tabla({
            head: [['#', 'Clase', 'Fundamento citado', 'Documento requerido']],
            columnStyles: {
                0: { cellWidth: 20, fontStyle: 'bold', textColor: VIOLET },
                1: { cellWidth: 84, fontStyle: 'bold', fontSize: 6.8 },
                3: { cellWidth: 130 },
            },
            body: lineas.map((l, i) => [
                String(i + 1),
                `${l.escalaRechazo || ''}${ESCALA_RECHAZO[l.escalaRechazo] ? `\n${ESCALA_RECHAZO[l.escalaRechazo]}` : ''}`,
                l.fundamento || '—',
                l.documentoRequerido || '—',
            ]),
        });
    }

    // ══ FASE 5 ══
    c.seccion(
        `Fase 5 · Vulnerabilidades del canal — ${CANALES[f5.canal] || f5.canal || 'no determinado'}`,
        'Cada canal tiene una fisiología distinta y, por tanto, una patología distinta.',
    );
    const tips: any[] = Array.isArray(f5.tipologiasDetectadas) ? f5.tipologiasDetectadas : [];
    if (!tips.length) {
        c.parrafo('No se detectaron tipologías propias del canal en este expediente.');
    } else {
        c.tabla({
            head: [['Tipología', 'Cómo opera', 'Señal de detección', 'Riesgo']],
            columnStyles: { 0: { cellWidth: 96, fontStyle: 'bold' }, 3: { cellWidth: 46, fontStyle: 'bold', halign: 'center' } },
            body: tips.map((t) => [t.tipologia || '', t.comoOpera || '', t.senalDeteccion || '', t.riesgo || '']),
            didParseCell: (d: any) => {
                if (d.section === 'body' && d.column.index === 3) {
                    const v = tips[d.row.index]?.riesgo;
                    d.cell.styles.textColor = v === 'ALTA' ? [239, 68, 68] : v === 'MEDIA' ? [245, 158, 11] : MUTED;
                }
            },
        });
    }

    // ══ Dictamen y mesa ══
    c.seccion('Dictamen de riesgo de la cuenta');
    dictamenRiesgo(c, audit.riskLevel || r.riskLevel, r.riskJustification);

    const mesa = r.hojaNegociacion || {};
    if (mesa.aperturaSugerida || (mesa.bloquesDiscusion || []).length) {
        c.seccion('Hoja de ruta de la mesa de negociación', 'Abrir por el hallazgo estructural, nunca por el caso de mayor monto.');
        if (mesa.aperturaSugerida) c.nota(`Apertura sugerida: ${mesa.aperturaSugerida}`);
        if ((mesa.bloquesDiscusion || []).length) {
            c.parrafo('Bloques de discusión por tipología — un patrón aceptado resuelve decenas de líneas en una sola decisión:', 8.2);
            c.vinetas(mesa.bloquesDiscusion);
        }
        if ((mesa.cederPrimero || []).length) {
            c.parrafo('Ceder primero (objeciones de ancla A-5, estadísticas y negociables):', 8.2);
            c.vinetas(mesa.cederPrimero);
        }
        if ((mesa.compromisosSugeridos || []).length) {
            c.parrafo('Compromisos de conducta futura a incorporar en el acta:', 8.2);
            c.vinetas(mesa.compromisosSugeridos);
        }
        c.nota(
            'Los tres errores que pierden la mesa: llevar cifras no depuradas de solapamiento; rechazar prácticas que el propio convenio autoriza; ' +
                'y abrir por el caso de mayor monto, que convierte la mesa en la negociación de ese caso y deja los patrones sin resolver.',
            [245, 158, 11],
            [255, 251, 235],
        );
    }

    if (Array.isArray(r.requerimientosPrevios) && r.requerimientosPrevios.length) {
        c.seccion('Requerimientos previos (G-9)', 'Suspenden el plazo de respuesta hasta su consignación. No se convierten en rechazo.');
        c.vinetas(r.requerimientosPrevios);
    }

    c.seccion('Conclusión');
    c.nota(r.conclusionEjecutiva || '—');

    if (Array.isArray(r.advertencias) && r.advertencias.length) {
        c.seccion('Advertencias metodológicas');
        c.vinetas(r.advertencias);
    }

    c.cierre(
        audit,
        r,
        'Metodología de Auditoría Médica, Barematación y Negociación de Redes V1.1 de azALTEHA, aplicada en sus cinco fases: pertinencia médica y ' +
            'evidencia diagnóstica; auditoría de codificación CPT y detección de tipologías; auditoría financiera con descomposición en bloques y ' +
            'jerarquía de anclaje tarifario A-1 a A-5; consolidación en pliego de rechazos con escala G-1 a G-9; y análisis de vulnerabilidades por canal.',
    );
    c.doc.save(`${audit.auditNumber}-informe-tecnico.pdf`);
}
