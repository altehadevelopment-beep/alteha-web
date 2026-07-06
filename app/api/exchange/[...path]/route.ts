export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// Proxy genérico de Guía Pay: /api/exchange/* → backend /api/exchange/*
async function forward(request: NextRequest, params: { path: string[] }, method: string) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        const url = new URL(request.url);
        const target = `${API_BASE}/exchange/${params.path.join('/')}${url.search}`;

        const headers: Record<string, string> = {
            'Accept': '*/*',
            'Authorization': `Bearer ${adminToken}`,
        };
        if (userToken) headers['X-Alteha-Token'] = userToken;

        let body: string | undefined;
        if (method !== 'GET') {
            headers['Content-Type'] = 'application/json';
            body = await request.text();
        }

        const response = await fetch(target, { method, headers, body });
        console.log(`[API Proxy] ${method} /exchange/${params.path.join('/')} - Status: ${response.status}`);
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    return forward(request, params, 'GET');
}
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
    return forward(request, params, 'POST');
}
export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
    return forward(request, params, 'PUT');
}
