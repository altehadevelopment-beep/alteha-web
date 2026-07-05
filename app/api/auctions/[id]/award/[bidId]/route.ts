export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string, bidId: string } }
) {
    try {
        const { id: auctionNumber, bidId } = params;
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const adminToken = await getAppToken();

        // New endpoint pattern: /api/auctions/{auctionNumber}/award/{bidId}
        const pharmacyBidId = request.nextUrl.searchParams.get('pharmacyBidId');
        const url = `${API_BASE}/auctions/${auctionNumber}/award/${bidId}${pharmacyBidId ? `?pharmacyBidId=${pharmacyBidId}` : ''}`;
        
        console.log(`[API Proxy] Adjudicando subasta ${auctionNumber} con oferta ${bidId}`);
        console.log(`[API Proxy] URL final: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Proxy] Error en adjudicación: ${response.status}`, errorText);
            return NextResponse.json({ code: 'ERROR', message: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Auction award error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
