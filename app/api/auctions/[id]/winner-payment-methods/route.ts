export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://qaback.alteha.com:3232/api';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auctionNumber = params.id;
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const targetUrl = `${API_BASE}/auctions/${auctionNumber}/winner-payment-methods?role=${role || 'DOCTOR'}`;
        console.log('Fetching winner payment methods at:', targetUrl);
        
        const response = await fetch(targetUrl, {
            headers: { 
                'X-Alteha-Token': userToken
            }
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Fetch winner payment methods error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: `Error de conexión: ${error.message}`
        }, { status: 500 });
    }
}
