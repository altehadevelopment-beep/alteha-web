export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { auctionNumber, bidId, reason } = body;
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const adminToken = await getAppToken();

        // Trying several potential endpoints based on the "No static resource" error
        // 1. Pattern /auctions/insurance/auctions/award (similar to /publish)
        // 2. Pattern /auctions/insurance/bid-award
        const potentialEndpoints = [
            `${API_BASE}/auctions/insurance/auctions/award`,
            `${API_BASE}/auctions/insurance/bid-award`,
            `${API_BASE}/auctions/insurance/adjudicate`
        ];

        let lastResult: any = null;
        let success = false;

        for (const url of potentialEndpoints) {
            console.log(`[API Proxy] Attempting award at: ${url}`);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': '*/*',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`,
                        'X-Alteha-Token': userToken
                    },
                    body: JSON.stringify({ auctionNumber, bidId, reason })
                });

                lastResult = await response.json();
                
                if (response.status !== 404) {
                    return NextResponse.json(lastResult, { status: response.status });
                }
            } catch (e) {
                console.error(`Error attempting ${url}:`, e);
            }
        }

        return NextResponse.json(lastResult || { code: '404', message: 'Endpoint not found' }, { status: 404 });
    } catch (error) {
        console.error('Auction award error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
