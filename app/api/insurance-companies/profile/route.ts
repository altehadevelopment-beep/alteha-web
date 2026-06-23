export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function PUT(request: NextRequest) {
    try {
        const formData = await request.formData();

        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/insurance-companies/profile`, {
            method: 'PUT',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: formData
        });

        console.log(`[API Proxy] PUT /insurance-companies/profile - Status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Insurance profile update error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión con el servidor' }, { status: 500 });
    }
}
