export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/auth/google — inicio de sesión con Google (la app envía el idToken de Google).
export async function POST(request: NextRequest) {
    try {
        const { idToken, role } = await request.json();
        if (!idToken || !role) {
            return NextResponse.json(
                { code: 'VAL_001', message: 'Faltan el token de Google o el rol.' },
                { status: 400 }
            );
        }

        const token = await getAppToken();
        const response = await fetch(`${API_BASE}/actor/google-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ idToken, role }),
        });

        const data = await response.json().catch(() => ({}));
        console.log(`[API Proxy] POST /actor/google-login - Status: ${response.status}`);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('[Google Login] Error:', error.message);
        return NextResponse.json(
            { code: 'ERROR', message: 'Error de conexión con el servidor.' },
            { status: 500 }
        );
    }
}
