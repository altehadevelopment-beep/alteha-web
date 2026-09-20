export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/insurance/audits/{id}/chat — chat del agente sobre la auditoría.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        const body = await request.text();
        const response = await fetch(`${API_BASE}/insurance/audits/${params.id}/chat`, {
            method: 'POST',
            headers: { Accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}`, 'X-Alteha-Token': userToken || '' },
            body,
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
