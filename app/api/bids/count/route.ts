export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const auctionId = searchParams.get('auctionId');

        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No token' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        // JHipster count endpoint with filters
        let url = `${API_BASE}/bids/count`;
        if (auctionId) {
            url += `?auctionId.equals=${auctionId}&auction.id.equals=${auctionId}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        console.log(`[API Proxy] GET /bids/count?auctionId=${auctionId} - Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ code: 'ERROR', message: errorText }, { status: response.status });
        }

        const count = await response.json();
        return NextResponse.json({ count }, { status: 200 });
    } catch (error) {
        console.error('Bids count error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}
