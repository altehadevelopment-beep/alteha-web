export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';
import https from 'https';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// Ignorar SSL autofirmado (mismo comportamiento que el proxy general)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// POST /api/actor/reset-password/request-code — envía un código de 6 dígitos al correo
// para recuperar la contraseña sin salir de la app.
export async function POST(request: NextRequest) {
    try {
        const { email, role } = await request.json();

        if (!email || !role) {
            return NextResponse.json(
                { code: 'VALIDATION_ERROR', message: 'El correo y el rol son requeridos.' },
                { status: 400 }
            );
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/actor/reset-password/request-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ email, role }),
            // @ts-ignore - Node fetch accepts agent
            agent: httpsAgent,
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(
            data ?? { code: '00', message: 'OK' },
            { status: response.ok ? 200 : response.status }
        );
    } catch (error: any) {
        console.error('[Reset Password request-code] Error:', error.message);
        return NextResponse.json(
            { code: 'ERROR', message: 'Error de conexión con el servidor.' },
            { status: 500 }
        );
    }
}
