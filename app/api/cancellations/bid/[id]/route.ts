export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST — el oferente retira su oferta (motivo obligatorio).
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        const body = await request.json().catch(() => ({}));
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/cancellations/bid/${encodeURIComponent(params.id)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body: JSON.stringify(body),
        });
        const text = await response.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
        if (!response.ok) {
            return NextResponse.json({ code: data.code || 'ERROR', message: data.detail || data.message || `Error ${response.status}` }, { status: response.status });
        }
        return NextResponse.json({ code: '00', data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
