import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(
    request: NextRequest
) {
    try {
        const { searchParams } = new URL(request.url);
        const auctionNumber = searchParams.get('auctionNumber');

        if (!auctionNumber) {
            return NextResponse.json({
                code: 'BAD_REQUEST',
                message: 'No se proporcionó el número de subasta'
            }, { status: 400 });
        }

        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const adminToken = await getAppToken();
        const formData = await request.formData();

        const response = await fetch(`${API_BASE}/auctions/insurance/auctions/${auctionNumber}/attachments`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: formData
        });

        console.log(`[API Proxy] POST /auctions/insurance/auctions/${auctionNumber}/attachments - Status: ${response.status}`);

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Auction attachment error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
