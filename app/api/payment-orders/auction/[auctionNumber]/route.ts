export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// Admin-only: list the payment orders (declared payments) for an auction.
export async function GET(
    request: NextRequest,
    { params }: { params: { auctionNumber: string } }
) {
    try {
        const auctionNumber = params.auctionNumber;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const adminToken = await getAppToken();
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';

        const response = await fetch(`${API_BASE}/payment-orders/auction/${auctionNumber}${qs}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        console.log(`[API Proxy] GET /payment-orders/auction/${auctionNumber} - Status: ${response.status}`);

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Payment orders by auction error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
