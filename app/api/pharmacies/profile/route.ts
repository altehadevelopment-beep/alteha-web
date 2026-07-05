export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// PUT /api/pharmacies/profile — actualiza el perfil de la farmacia autenticada (multipart: pharmacy JSON + logo).
export async function PUT(request: NextRequest) {
    try {
        const formData = await request.formData();

        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/pharmacies/profile`, {
            method: 'PUT',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body: formData,
        });

        console.log(`[API Proxy] PUT /pharmacies/profile - Status: ${response.status}`);

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
