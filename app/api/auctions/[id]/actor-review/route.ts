export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/auctions/[auctionNumber]/actor-review
// El ganador valora a un actor de la subasta: { targetRole: 'INSURANCE'|'ALTEHA'|'CLINIC', rating, comment }
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }

        const body = await request.json();
        const adminToken = await getAppToken();
        const targetUrl = `${API_BASE}/auctions/${encodeURIComponent(params.id)}/actor-review`;

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body: JSON.stringify(body)
        });

        const text = await response.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

        if (!response.ok) {
            return NextResponse.json({
                code: 'ERROR',
                message: data.detail || data.message || `Error ${response.status} al guardar valoración`
            }, { status: response.status });
        }

        return NextResponse.json({ code: '00', message: 'Valoración guardada', data }, { status: 200 });
    } catch (error: any) {
        console.error('[API Proxy] actor-review error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
