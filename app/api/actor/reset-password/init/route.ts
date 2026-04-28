export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';
import https from 'https';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// Ignorar SSL autofirmado (mismo comportamiento que el proxy general)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, role } = body;

        if (!email || !role) {
            return NextResponse.json({
                code: 'VALIDATION_ERROR',
                message: 'El correo y el rol son requeridos.'
            }, { status: 400 });
        }

        // Obtener token de admin para autorizar la petición
        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/actor/reset-password/init`, {
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

        console.log(`[API Proxy] POST /actor/reset-password/init - Status: ${response.status}`);

        // El backend puede responder con 200 o 204 (sin contenido) en caso de éxito
        if (response.ok) {
            let data: any = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                data = await response.json().catch(() => null);
            }
            return NextResponse.json(
                data ?? { code: '00', message: 'Correo de recuperación enviado exitosamente.' },
                { status: 200 }
            );
        }

        // Error del backend
        let errorData: any = {};
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: `Error del servidor: ${response.status}` };
        }

        return NextResponse.json(errorData, { status: response.status });

    } catch (error: any) {
        console.error('[Reset Password] Error:', error.message);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor.'
        }, { status: 500 });
    }
}
