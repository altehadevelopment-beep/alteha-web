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
                'X-Alteha-Token': userToken,
                'Authorization': `Bearer ${userToken}`
            }
        });

        const text = await response.text();
        console.log('Backend response text:', text);
        
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { message: text || `Error HTTP ${response.status}`, status: response.status };
        }
        
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Fetch winner payment methods error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: `Error de conexión proxy: ${error.message}`
        }, { status: 500 });
    }
}
