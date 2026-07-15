export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';
import https from 'https';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// Ignorar SSL autofirmado (mismo comportamiento que el proxy general)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// POST /api/actor/reset-password/confirm-code — valida el código y fija la nueva contraseña.
export async function POST(request: NextRequest) {
    try {
        const { email, role, code, newPassword } = await request.json();

        if (!email || !role || !code || !newPassword) {
            return NextResponse.json(
                { code: 'VALIDATION_ERROR', message: 'Faltan datos para completar el cambio.' },
                { status: 400 }
            );
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/actor/reset-password/confirm-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ email, role, code, newPassword }),
            // @ts-ignore - Node fetch accepts agent
            agent: httpsAgent,
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(
            data ?? { code: 'ERROR', message: 'Respuesta inesperada del servidor.' },
            { status: response.ok ? 200 : response.status }
        );
    } catch (error: any) {
        console.error('[Reset Password confirm-code] Error:', error.message);
        return NextResponse.json(
            { code: 'ERROR', message: 'Error de conexión con el servidor.' },
            { status: 500 }
        );
    }
}
