export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/reviews?auctionId.equals=X&reviewerId.equals=Y — lista valoraciones (filtros JHipster)
export async function GET(request: NextRequest) {
    try {
        const adminToken = await getAppToken();
        const queryString = request.nextUrl.search || '';
        const response = await fetch(`${API_BASE}/reviews${queryString}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            cache: 'no-store'
        });

        const text = await response.text();
        let data: any = [];
        try { data = text ? JSON.parse(text) : []; } catch { data = []; }

        if (!response.ok) {
            return NextResponse.json({ code: 'ERROR', message: `Error ${response.status} al listar valoraciones` }, { status: response.status });
        }
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('[API Proxy] reviews GET error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}

// POST /api/reviews — crea una valoración (rating, description, reviewer, reviewee, auction)
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }

        const body = await request.json();
        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/reviews`, {
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

        return NextResponse.json({ code: '00', message: 'Valoración guardada', data }, { status: 201 });
    } catch (error: any) {
        console.error('[API Proxy] reviews POST error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
