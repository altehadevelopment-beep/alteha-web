export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { TEHA_SYSTEM_PROMPT } from "@/lib/teha-persona";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
    try {
        if (!genAI) {
            return NextResponse.json(
                { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file." },
                { status: 500 }
            );
        }

        const { messages, userProfile } = await req.json();

        // Add user context if logged in
        let userContext = "";
        if (userProfile) {
            const name = userProfile.firstName || userProfile.name || "";
            const role = userProfile.role || "";
            const specialty = userProfile.specialties?.[0]?.name || userProfile.specialty?.name || "";
            
            // Determine if we should use Doctor/Doctora treatment
            const isDoctor = role.toUpperCase().includes('DOCTOR') || role.toUpperCase().includes('SPECIALIST');
            
            userContext = `ESTÁS HABLANDO CON UN USUARIO AUTENTICADO:
Nombre: ${name}
Rol: ${role}
${specialty ? `Especialidad: ${specialty}` : ""}
${isDoctor ? "IMPORTANTE: Este usuario es médico. Dirígete a él/ella SIEMPRE como 'Doctor' o 'Doctora' seguido de su nombre o apellido según el contexto." : ""}
Por favor, dirígete a él/ella de forma personalizada y profesional, manteniendo siempre el contexto de su rol en Alteha.\n\n`;
        }

        const latestMessage = messages[messages.length - 1].content;
        const recentHistory = messages.slice(-4, -1).map((m: any) => 
            `${m.role === 'user' ? ' Usuario' : ' Teha'}: ${m.content}`
        ).join('\n');

        const promptText = `${userContext}${TEHA_SYSTEM_PROMPT}\n\nHistorial:\n${recentHistory}\n\nUsuario: ${latestMessage}\nTeha:`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: promptText }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.6,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw {
                message: errorData.error?.message || 'Gemini API Error',
                status: response.status,
                errorDetails: errorData.error
            };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';

        return NextResponse.json({ content: text });
    } catch (error: any) {
        console.error("Gemini API Error Detail:", {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            stack: error.stack,
            errorDetails: error.errorDetails
        });
        return NextResponse.json(
            { error: `Error processing your request: ${error.message || 'Unknown error'}` },
            { status: error.status || 500 }
        );
    }
}
