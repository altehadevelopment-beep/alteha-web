export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/insurance/audits/context — lista de documentos de contexto.
export async function GET(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/insurance/audits/context`, {
            headers: { Accept: '*/*', Authorization: `Bearer ${adminToken}`, 'X-Alteha-Token': userToken || '' },
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}

// POST /api/insurance/audits/context — sube documentos de contexto (multipart).
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        const formData = await request.formData();
        const response = await fetch(`${API_BASE}/insurance/audits/context`, {
            method: 'POST',
            headers: { Accept: '*/*', Authorization: `Bearer ${adminToken}`, 'X-Alteha-Token': userToken || '' },
            body: formData,
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
