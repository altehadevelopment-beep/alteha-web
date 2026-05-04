export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const auctionId = searchParams.get('auctionId');
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '50';
        const sort = searchParams.get('sort') || 'createdAt,desc';

        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No token' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        // JHipster supports both styles - try auctionId.equals first, then auction.id.equals
        let url = `${API_BASE}/bids?page=${page}&size=${size}&sort=${sort}`;
        if (auctionId) {
            // Try both JHipster filter conventions
            url += `&auctionId.equals=${auctionId}&auction.id.equals=${auctionId}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        console.log(`[API Proxy] GET /bids?auctionId=${auctionId} - Status: ${response.status}`);

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Bids list error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}
