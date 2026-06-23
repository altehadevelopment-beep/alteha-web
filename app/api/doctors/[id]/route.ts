export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No token' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        // Log for debugging
        console.log(`[API Proxy] Fetching doctor ${id} from ${API_BASE}/doctors/${id}`);

        const response = await fetch(`${API_BASE}/doctors/${id}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Proxy] Error fetching doctor ${id}:`, response.status, errorText);
            return NextResponse.json({ code: 'ERROR', message: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Doctor profile proxy error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No token' }, { status: 401 });
        }

        const body = await request.text();
        const adminToken = await getAppToken();

        console.log(`[API Proxy] PATCH doctor ${id} -> ${API_BASE}/doctors/${id} | body: ${body}`);

        const response = await fetch(`${API_BASE}/doctors/${id}`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body
        });

        const text = await response.text();
        console.log(`[API Proxy] PATCH doctor ${id} status:`, response.status, '| body:', text);

        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

        if (!response.ok) {
            return NextResponse.json({
                code: 'ERROR',
                message: data.detail || data.title || data.message || `Error ${response.status} al actualizar el médico`
            }, { status: response.status });
        }

        return NextResponse.json({ code: '00', message: 'Médico actualizado', data }, { status: 200 });
    } catch (error: any) {
        console.error('Doctor PATCH proxy error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
