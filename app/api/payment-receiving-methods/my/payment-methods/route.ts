export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No session token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/payment-receiving-methods/my/payment-methods?${queryString}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        const data = await response.json();
        return NextResponse.json({ code: '00', message: 'Success', data }, { status: response.status });
    } catch (error) {
        console.error('[API Proxy] Get payment methods error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No session token' }, { status: 401 });
        }

        const body = await request.json();
        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/payment-receiving-methods/my/payment-methods`, {
            method: 'POST',
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
        console.error('[API Proxy] Create payment method error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}
