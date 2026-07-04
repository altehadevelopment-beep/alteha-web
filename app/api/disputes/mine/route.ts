export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/disputes/mine — disputas del actor autenticado
export async function GET(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/disputes/mine`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            cache: 'no-store',
        });
        const text = await response.text();
        let data: any = [];
        try { data = text ? JSON.parse(text) : []; } catch { data = []; }
        return NextResponse.json(data, { status: response.ok ? 200 : response.status });
    } catch (error: any) {
        console.error('[API Proxy] disputes/mine error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
