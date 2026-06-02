export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No session token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const body = await request.json();
        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/payment-receiving-methods/my/payment-methods/${id}?${queryString}`, {
            method: 'PUT',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return NextResponse.json({ code: '00', message: 'Success', data }, { status: response.status });
    } catch (error) {
        console.error('[API Proxy] Update payment method error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No session token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/payment-receiving-methods/my/payment-methods/${id}?${queryString}`, {
            method: 'DELETE',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        const text = await response.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

        return NextResponse.json({ code: '00', message: 'Eliminado correctamente', data }, { status: response.status });
    } catch (error) {
        console.error('[API Proxy] Delete payment method error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}
