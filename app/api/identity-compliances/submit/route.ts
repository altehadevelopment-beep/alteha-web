import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const actorRole = searchParams.get('actorRole') || 'DOCTOR';
        const documentType = searchParams.get('documentType') || 'CEDULA';
        const matchPercentage = searchParams.get('matchPercentage') || '100';

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

        // Get the multipart form data from the original request
        const formData = await request.formData();

        // Build the target URL with search params
        const targetUrl = new URL(`${API_BASE}/identity-compliances/submit`);
        targetUrl.searchParams.append('actorRole', actorRole);
        targetUrl.searchParams.append('documentType', documentType);
        targetUrl.searchParams.append('matchPercentage', matchPercentage);

        const response = await fetch(targetUrl.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: formData
        });

        console.log(`[API Proxy] POST /identity-compliances/submit - Status: ${response.status}`);

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Identity compliance submission error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
