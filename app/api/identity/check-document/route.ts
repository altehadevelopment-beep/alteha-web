export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

const SUPPORTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];

// Alteha revisa que la foto del documento de identidad sea utilizable ANTES de
// enviarla a revisión humana: que sea un documento real, completo y legible.
const PROMPT = `Te doy la FOTO de un documento de identidad (cédula venezolana o licencia/credencial médica). Evalúa si la foto es utilizable para verificar la identidad de una persona.

Criterios para "legible": se ve un documento de identidad real, completo dentro del cuadro, sin dedos tapando datos, texto y números del documento se pueden leer (nombre y número de identificación distinguibles), sin desenfoque ni reflejos severos, iluminación aceptable.

NO es legible si: la imagen está borrosa o movida, el documento está cortado o muy lejos, hay reflejos que tapan los datos, está muy oscura, o la foto no muestra un documento de identidad.

Responde SOLO este JSON, sin markdown:
{"legible": true|false, "tipoDetectado": "CEDULA"|"LICENCIA_MEDICA"|"OTRO"|"NO_ES_DOCUMENTO", "motivo": "explicación breve y amable en español dirigida al usuario (qué corregir si no es legible)"}`;

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY no está configurada." }, { status: 500 });
        }

        const { imageBase64, mimeType } = await req.json();
        if (!imageBase64) {
            return NextResponse.json({ error: "Falta la imagen del documento." }, { status: 400 });
        }
        const mt = SUPPORTED.includes(mimeType) ? mimeType : 'image/jpeg';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: PROMPT },
                            { inline_data: { mime_type: mt, data: imageBase64 } },
                        ],
                    }],
                    generationConfig: { maxOutputTokens: 2048, temperature: 0.1 },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { message: errorData.error?.message || 'Error del servicio de verificación' };
        }

        const data = await response.json();
        let text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);

        return NextResponse.json({
            legible: !!parsed.legible,
            tipoDetectado: String(parsed.tipoDetectado || 'OTRO'),
            motivo: String(parsed.motivo || ''),
        });
    } catch (error: any) {
        // Si la verificación automática falla, no bloqueamos el proceso: el agente
        // humano de Alteha revisará el documento de todos modos.
        return NextResponse.json({ legible: true, tipoDetectado: 'OTRO', motivo: '', fallback: true });
    }
}
