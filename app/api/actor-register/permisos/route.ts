export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/actor-register/permisos?role=… — permisos activos por rol, para que el
// usuario principal asigne la permisología de sus usuarios complementarios.
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'INSURANCE_COMPANY';
        const token = await getAppToken();
        const response = await fetch(`${API_BASE}/actor-register/permisos?role=${role}`, {
            headers: { Accept: '*/*', Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
