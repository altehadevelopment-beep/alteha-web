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
        const formData = await request.formData();
        const targetUrl = `${API_BASE}/auctions/register-payment-proof`;

        console.log('Forwarding payment proof to:', targetUrl);
        
        // Log formData content to verify payload
        const keys = Array.from(formData.keys());
        console.log('FormData keys:', keys);
        
        const paymentData = formData.get('payment');
        if (paymentData instanceof Blob) {
            const text = await paymentData.text();
            console.log('Payment JSON payload:', text);
        } else if (typeof paymentData === 'string') {
            console.log('Payment JSON payload (string):', paymentData);
        }
        
        // Forwarding multipart/form-data to backend
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken 
            },
            body: formData
        });

        const responseText = await response.text();
        console.log(`[Payment Proof] Backend Status: ${response.status}`);
        
        if (!response.ok) {
            console.error(`[Payment Proof] Error response:`, responseText);
        }

        let data;
        try {
            data = responseText ? JSON.parse(responseText) : { message: 'Operación realizada sin respuesta del servidor' };
        } catch (e) {
            console.error('Error parsing backend JSON:', e);
            data = { message: responseText || 'Error en el formato de respuesta del servidor' };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Payment proof register error DETAILS:', {
            message: error.message,
            stack: error.stack,
            url: `${API_BASE}/auctions/register-payment-proof`
        });
        return NextResponse.json({
            code: 'ERROR',
            message: `Error de conexión con el servidor: ${error.message}`
        }, { status: 500 });
    }
}
