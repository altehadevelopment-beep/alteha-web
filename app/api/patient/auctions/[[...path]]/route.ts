export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// Proxy de las subastas del paciente (/api/patient/auctions[/market]).
async function forward(request: NextRequest, path: string[] | undefined, method: string) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) return NextResponse.json({ code: 'AUTH_001', message: 'No autenticado' }, { status: 401 });
        const adminToken = await getAppToken();
        const sub = path && path.length ? '/' + path.join('/') : '';
        const url = new URL(request.url);
        const target = `${API_BASE}/patient/auctions${sub}${url.search}`;
        const headers: Record<string, string> = {
            Accept: '*/*',
            Authorization: `Bearer ${adminToken}`,
            'X-Alteha-Token': userToken,
        };
        let body: string | undefined;
        if (method !== 'GET') { headers['Content-Type'] = 'application/json'; body = await request.text(); }
        const response = await fetch(target, { method, headers, body });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
    return forward(request, params.path, 'GET');
}
export async function POST(request: NextRequest, { params }: { params: { path?: string[] } }) {
    return forward(request, params.path, 'POST');
}
