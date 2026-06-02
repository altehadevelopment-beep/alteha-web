export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

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
        const adminToken = await getAppToken();
        const targetUrl = `${API_BASE}/auctions/${auctionNumber}/complete`;
        console.log('Completing auction at:', targetUrl);
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
                'X-Alteha-Token': userToken,
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });

        const responseText = await response.text();
        console.log('Backend complete status:', response.status, '| body:', responseText);
        
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            data = { message: responseText || 'Respuesta del servidor no es JSON' };
        }

        if (!response.ok) {
            return NextResponse.json({
                code: 'ERROR',
                message: data.detail || data.message || `Error ${response.status} al completar subasta`
            }, { status: response.status });
        }

        return NextResponse.json({ code: '00', message: 'Subasta completada exitosamente', data }, { status: 200 });
    } catch (error: any) {
        console.error('Complete auction error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: `Error de conexión: ${error.message}`
        }, { status: 500 });
    }
}
