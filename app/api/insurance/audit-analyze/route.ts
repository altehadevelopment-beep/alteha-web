export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

// Tipos de archivo que Gemini puede leer directamente (OCR multimodal).
const SUPPORTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];

const PROMPT = `Eres un AUDITOR MÉDICO SENIOR de Alteha, con amplia experiencia en auditoría de cuentas médicas, codificación CPT (Current Procedural Terminology) y tarifas de salud privada en Venezuela y Latinoamérica.

Recibirás DOS documentos de una intervención médica:
1. El INFORME MÉDICO (primer archivo).
2. La FACTURA de la intervención (segundo archivo).

Tu tarea: realizar una AUDITORÍA formal de la cuenta médica.

METODOLOGÍA (síguela estrictamente):
1. OCR de ambos documentos. Extrae: paciente, prestador (clínica/médico), fecha, diagnóstico, procedimientos realizados según el informe, y cada renglón facturado con su monto.
2. Asigna a cada procedimiento identificable su código CPT más apropiado (o el más cercano). Si un renglón no corresponde a un CPT (insumos, habitación, honorarios genéricos), clasifícalo igualmente e indícalo en "cpt" como "N/A".
3. Para cada renglón estima un RANGO DE PRECIO DE MERCADO razonable en USD para salud privada en Venezuela/Latinoamérica (campos marketLow/marketHigh). Son estimaciones referenciales basadas en tu conocimiento del mercado: sé conservador y realista.
4. Compara lo facturado contra el rango y emite un veredicto por renglón: DENTRO_DE_RANGO, SOBRE_RANGO, BAJO_RANGO o NO_VERIFICABLE.
5. Cruza informe vs factura y detecta HALLAZGOS de auditoría: procedimientos facturados sin soporte en el informe, duplicidades, posible unbundling (fraccionar un procedimiento para cobrar más), posible upcoding (facturar una versión más costosa), cantidades inusuales, inconsistencias de fechas o identidad, montos atípicos.
6. Emite un NIVEL DE RIESGO global de la cuenta: BAJO, MEDIO o ALTO, con su justificación.
7. Redacta una conclusión ejecutiva y recomendaciones accionables para el seguro (qué pagar, qué objetar, qué soporte adicional pedir).

REGLAS:
- Escribe TODO en español, tono técnico y neutro de auditoría.
- NO inventes datos que no estén en los documentos; si algo no se puede leer, márcalo NO_VERIFICABLE y dilo en los hallazgos.
- Los precios de referencia son estimaciones de mercado, no tarifas oficiales.
- Responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`), con EXACTAMENTE esta estructura:

{
  "patientName": string|null,
  "providerName": string|null,
  "procedureDate": string|null,
  "diagnosis": string|null,
  "procedureSummary": string,            // 1 frase: qué intervención se auditó
  "currency": "USD",
  "cptItems": [
    {
      "cpt": string,                     // código CPT o "N/A"
      "description": string,             // descripción estándar del CPT o del renglón
      "invoicedDescription": string,     // cómo aparece en la factura
      "quantity": number,
      "invoicedAmount": number,          // monto total facturado del renglón
      "marketLow": number|null,
      "marketHigh": number|null,
      "verdict": "DENTRO_DE_RANGO"|"SOBRE_RANGO"|"BAJO_RANGO"|"NO_VERIFICABLE",
      "note": string|null                // observación breve del renglón
    }
  ],
  "totalInvoiced": number,
  "totalReferenceLow": number,
  "totalReferenceHigh": number,
  "findings": [
    { "severity": "ALTA"|"MEDIA"|"BAJA", "title": string, "detail": string }
  ],
  "riskLevel": "BAJO"|"MEDIO"|"ALTO",
  "riskJustification": string,
  "conclusion": string,                  // párrafo ejecutivo
  "recommendations": [string],
  "confidence": number                   // 0-100: legibilidad/completitud de los documentos
}`;

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY no está configurada." }, { status: 500 });
        }

        const { reportBase64, reportMime, invoiceBase64, invoiceMime } = await req.json();
        if (!reportBase64 || !invoiceBase64) {
            return NextResponse.json({ error: "Faltan el informe médico o la factura." }, { status: 400 });
        }
        for (const m of [reportMime, invoiceMime]) {
            if (!SUPPORTED.includes(m)) {
                return NextResponse.json(
                    { error: "Formato no soportado. Usa PDF o imagen (PNG/JPG) en ambos documentos." },
                    { status: 415 }
                );
            }
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: PROMPT },
                            { text: "DOCUMENTO 1 — INFORME MÉDICO:" },
                            { inline_data: { mime_type: reportMime, data: reportBase64 } },
                            { text: "DOCUMENTO 2 — FACTURA:" },
                            { inline_data: { mime_type: invoiceMime, data: invoiceBase64 } },
                        ],
                    }],
                    // El modelo razona internamente (thoughtsTokenCount) y además debe emitir
                    // un JSON extenso: margen amplio de tokens de salida.
                    generationConfig: { maxOutputTokens: 16384, temperature: 0.2 },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                message: errorData.error?.message || 'Error del servicio de análisis',
                status: response.status,
            };
        }

        const data = await response.json();
        const raw = (data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '').trim();
        // El modelo a veces envuelve el JSON en ```json ... ```: lo limpiamos.
        const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return NextResponse.json({ error: "El análisis no produjo un resultado válido. Intenta con documentos más legibles." }, { status: 422 });
        }
        let result: any;
        try {
            result = JSON.parse(cleaned.slice(start, end + 1));
        } catch {
            return NextResponse.json({ error: "No se pudo interpretar el resultado del análisis. Intenta de nuevo." }, { status: 422 });
        }
        return NextResponse.json({ result });
    } catch (error: any) {
        console.error("audit-analyze error:", error?.message || error);
        return NextResponse.json(
            { error: `No se pudo completar la auditoría: ${error?.message || 'error desconocido'}` },
            { status: error?.status || 500 }
        );
    }
}
