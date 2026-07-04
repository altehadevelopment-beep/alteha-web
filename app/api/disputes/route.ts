export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/disputes — crea una disputa (multipart: dispute JSON + evidence opcional)
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }
        const formData = await request.formData();
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/disputes`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body: formData,
        });
        const text = await response.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
        if (!response.ok) {
            return NextResponse.json({
                code: 'ERROR',
                message: data.detail || data.message || `Error ${response.status} al crear la disputa`
            }, { status: response.status });
        }
        return NextResponse.json({ code: '00', message: 'Disputa creada', data }, { status: 200 });
    } catch (error: any) {
        console.error('[API Proxy] disputes POST error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
