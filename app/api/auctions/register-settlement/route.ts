export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }

        const formData = await request.formData();
        const adminToken = await getAppToken();
        const targetUrl = `${API_BASE}/auctions/register-settlement`;

        console.log('[API Proxy] POST /auctions/register-settlement');

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body: formData
        });

        const text = await response.text();
        console.log('[API Proxy] register-settlement status:', response.status, '| body:', text);

        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

        if (!response.ok) {
            return NextResponse.json({
                code: 'ERROR',
                message: data.detail || data.message || `Error ${response.status} al registrar liquidación`
            }, { status: response.status });
        }

        return NextResponse.json({ code: '00', message: 'Liquidación registrada exitosamente', data }, { status: 200 });
    } catch (error: any) {
        console.error('[API Proxy] register-settlement error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
