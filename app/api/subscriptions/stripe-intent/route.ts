export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST — crea el PaymentIntent de Stripe para pagar el plan con tarjeta (Elements)
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        const body = await request.json().catch(() => ({}));
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/subscriptions/stripe-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.ok ? 200 : response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: error.message }, { status: 500 });
    }
}
