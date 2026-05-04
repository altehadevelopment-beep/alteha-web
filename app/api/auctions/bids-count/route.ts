export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const auctionNumber = searchParams.get('auctionNumber');
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '1';

        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No token' }, { status: 401 });
        }
        if (!auctionNumber) {
            return NextResponse.json({ code: 'PARAM_001', message: 'Missing auctionNumber' }, { status: 400 });
        }

        const adminToken = await getAppToken();

        const url = `${API_BASE}/bids/list?auctionNumber=${auctionNumber}&page=${page}&size=${size}&sort=desc`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        console.log(`[API Proxy] GET /bids/list?auctionNumber=${auctionNumber} - Status: ${response.status}`);

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Bids count error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}
