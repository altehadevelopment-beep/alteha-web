import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const adminToken = await getAppToken();
        const formData = await request.formData();

        // Standardize URL to match my-auctions pattern if possible
        // Trying /auctions/insurance/auctions/publish
        const response = await fetch(`${API_BASE}/auctions/insurance/auctions/publish`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: formData
        });

        console.log(`[API Proxy] POST /auctions/insurance/auctions/publish - Status: ${response.status}`);

        const data = await response.json();

        if (!response.ok) {
            console.error('[API Proxy] Error from backend:', data);
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Auction publish error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
