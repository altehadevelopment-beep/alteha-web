export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/dashboard-ads/[id] — a single ad with its gallery + administrable text (ad landing page).
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/dashboard-ads/${params.id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
        });
        const text = await response.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
        return NextResponse.json(data, { status: response.ok ? 200 : response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
