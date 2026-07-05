export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET — historial unificado de pagos del actor autenticado (Mis Pagos)
export async function GET(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/payments/mine`, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${adminToken}`, 'X-Alteha-Token': userToken },
        });
        const data = await response.json().catch(() => []);
        return NextResponse.json(data, { status: response.ok ? 200 : response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: error.message }, { status: 500 });
    }
}
