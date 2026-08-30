export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/patient/chat/provider?type=&id= — identidad de chat del prestador.
export async function GET(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) return NextResponse.json({ code: 'AUTH_001', message: 'No autenticado' }, { status: 401 });
        const adminToken = await getAppToken();
        const url = new URL(request.url);
        const target = `${API_BASE}/patient/chat/provider${url.search}`;
        const r = await fetch(target, { headers: { Accept: '*/*', Authorization: `Bearer ${adminToken}`, 'X-Alteha-Token': userToken } });
        const data = await r.json().catch(() => ({}));
        return NextResponse.json(data, { status: r.status });
    } catch (e: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${e.message}` }, { status: 500 });
    }
}
