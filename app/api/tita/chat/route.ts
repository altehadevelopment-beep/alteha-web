import { GoogleGenerativeAI } from "@google/generative-ai";
import { TITA_SYSTEM_PROMPT } from "@/lib/tita-persona";
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

        const { messages } = await req.json();

        const latestMessage = messages[messages.length - 1].content;
        const recentHistory = messages.slice(-4, -1).map((m: any) => 
            `${m.role === 'user' ? ' Usuario' : ' Tita'}: ${m.content}`
        ).join('\n');

        const promptText = `${TITA_SYSTEM_PROMPT}\n\nHistorial:\n${recentHistory}\n\nUsuario: ${latestMessage}\nTita:`;

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
