export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/actor-register/patient — auto-registro del cliente final (JSON).
// La cuenta se crea directamente; el correo y el teléfono ya se validaron por OTP
// en los pasos previos del formulario.
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const token = await getAppToken();
        const response = await fetch(`${API_BASE}/actor-register/patient`, {
            method: 'POST',
            headers: { Accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body,
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
