export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// Proxy de los endpoints públicos del backend (/api/public/*). No requieren
// autenticación: son la vitrina para el cliente final (ofertas, centros aliados).
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    try {
        const url = new URL(request.url);
        const target = `${API_BASE}/public/${params.path.join('/')}${url.search}`;
        const response = await fetch(target, { headers: { Accept: 'application/json' } });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
    try {
        const url = new URL(request.url);
        const target = `${API_BASE}/public/${params.path.join('/')}${url.search}`;
        const body = await request.text();
        const response = await fetch(target, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', Referer: request.headers.get('referer') || '' },
            body,
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
