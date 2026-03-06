import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        // Get user token from header
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        // Get app admin token
        const adminToken = await getAppToken();

        // Get the form data from the request
        const formData = await request.formData();

        // Forward to backend
        const response = await fetch(`${API_BASE}/actor-register/insurance-register-patient`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: formData
        });

        console.log(`[API Proxy] POST /actor-register/insurance-register-patient - Status: ${response.status}`);

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Insurance Patient registration error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
