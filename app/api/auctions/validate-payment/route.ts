export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

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
        const body = await request.json();
        const targetUrl = `${API_BASE}/auctions/validate-payment`;
        console.log('Validating payment at:', targetUrl, 'Payload:', JSON.stringify(body));
        console.log('[Validate Payment] Using userToken as X-Alteha-Token:', userToken?.substring(0, 30) + '...');
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,  // <-- Token del admin logueado, no el token de sistema
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: JSON.stringify(body)
        });

        const responseText = await response.text();
        console.log(`[Validate Payment] Backend Status: ${response.status}`);
        if (!response.ok) {
            console.error(`[Validate Payment] Error response:`, responseText);
        }
        
        let data: any;
        try {
            data = responseText ? JSON.parse(responseText) : { message: 'Validación procesada' };
        } catch (e) {
            console.error('Error parsing backend JSON:', e);
            data = { message: responseText || 'Error en respuesta del servidor' };
        }

        if (response.ok) {
            return NextResponse.json({
                code: '00',
                message: 'Validación procesada exitosamente',
                data: data
            }, { status: response.status });
        }

        // Si hay error, retornar tal cual (opcionalmente con el cURL para debug en QA, aunque no se mostrará)
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Payment validation error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: `Error de conexión: ${error.message}`
        }, { status: 500 });
    }
}
