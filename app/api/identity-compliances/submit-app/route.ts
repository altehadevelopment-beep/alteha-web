export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/identity-compliances/submit-app — verificación de identidad desde la
// app móvil: el video viaja como archivo y la foto del documento en base64 (campo
// del formulario), porque el uploader nativo solo admite un archivo por petición.
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }

        const adminToken = await getAppToken();
        const formData = await request.formData();

        const response = await fetch(`${API_BASE}/identity-compliances/submit-app`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body: formData,
        });

        console.log(`[API Proxy] POST /identity-compliances/submit-app - Status: ${response.status}`);
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Identity compliance app submission error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión con el servidor' }, { status: 500 });
    }
}
