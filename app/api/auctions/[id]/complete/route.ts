export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://qaback.alteha.com:3232/api';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auctionNumber = params.id;
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const formData = await request.formData();
        const targetUrl = `${API_BASE}/auctions/${auctionNumber}/complete`;
        console.log('Completing auction at:', targetUrl);
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
                'X-Alteha-Token': userToken
            },
            body: formData
        });

        const responseText = await response.text();
        console.log('Backend response status:', response.status);
        
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : { message: 'Subasta completada' };
        } catch (e) {
            data = { message: responseText || 'Error en respuesta del servidor' };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Complete auction error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: `Error de conexión: ${error.message}`
        }, { status: 500 });
    }
}
