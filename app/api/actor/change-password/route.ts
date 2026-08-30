export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/actor/change-password — cambia la contraseña del actor autenticado.
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }
        const body = await request.text();
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/actor/change-password`, {
            method: 'POST',
            headers: {
                Accept: '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body,
        });
        // El backend responde 200 sin cuerpo cuando todo va bien.
        if (response.ok) return NextResponse.json({ code: '00', message: 'OK' });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(
            { code: data?.code || 'ERROR', message: data?.message || data?.detail || 'No se pudo cambiar la contraseña' },
            { status: response.status },
        );
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
