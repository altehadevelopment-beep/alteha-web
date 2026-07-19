export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/actor/login-location — la app reporta desde dónde inició sesión el médico.
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        // La IP real del cliente viaja en X-Forwarded-For (la pone nginx).
        const clientIp = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
        const body = await request.text();
        const response = await fetch(`${API_BASE}/actor/login-location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: '*/*',
                Authorization: `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken || '',
                'X-Client-Ip': clientIp,
            },
            body,
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
