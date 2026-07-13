export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

// Tipos de archivo que Gemini puede leer directamente (OCR multimodal).
const SUPPORTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];

const PROMPT = `Eres un asistente clínico. Te doy un INFORME MÉDICO (imagen o PDF). Realiza OCR y redacta un RESUMEN de los ANTECEDENTES Y LA HISTORIA MÉDICA RELEVANTE del paciente para una subasta de intervención quirúrgica.

Instrucciones:
- Escribe en español, en 3ª persona, tono clínico y neutro.
- Incluye solo lo relevante para la intervención: diagnóstico, antecedentes personales/patológicos, alergias, medicación actual, hallazgos y estudios previos pertinentes.
- NO inventes datos que no estén en el informe. Si algún dato no aparece, no lo menciones.
- Devuelve SOLO el texto del resumen, sin encabezados, sin viñetas, sin comillas, en 1 a 3 párrafos breves.`;

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY no está configurada." }, { status: 500 });
        }

        const { fileBase64, mimeType } = await req.json();
        if (!fileBase64 || !mimeType) {
            return NextResponse.json({ error: "Falta el archivo del informe médico." }, { status: 400 });
        }
        if (!SUPPORTED.includes(mimeType)) {
            return NextResponse.json(
                { error: "Formato no soportado para el análisis automático. Usa PDF o imagen (PNG/JPG)." },
                { status: 415 }
            );
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
                            { inline_data: { mime_type: mimeType, data: fileBase64 } },
                        ],
                    }],
                    // gemini-2.5-pro razona internamente y consume tokens de salida (thoughtsTokenCount);
                    // hay que dejar margen suficiente para que además emita el texto del resumen.
                    generationConfig: { maxOutputTokens: 4096, temperature: 0.2 },
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
        const summary = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        if (!summary) {
            return NextResponse.json({ error: "No se pudo extraer el resumen del informe." }, { status: 422 });
        }
        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error("analyze-report error:", error?.message || error);
        return NextResponse.json(
            { error: `No se pudo analizar el informe: ${error?.message || 'error desconocido'}` },
            { status: error?.status || 500 }
        );
    }
}
