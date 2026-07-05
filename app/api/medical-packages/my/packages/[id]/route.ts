export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

async function forward(request: NextRequest, method: string, path: string, withBody: boolean) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        const body = withBody ? await request.json().catch(() => ({})) : undefined;
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}${path}`, {
            method,
            headers: {
                'Accept': 'application/json',
                ...(withBody ? { 'Content-Type': 'application/json' } : {}),
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            ...(withBody ? { body: JSON.stringify(body) } : {}),
            cache: 'no-store',
        });
        const text = await response.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
        if (!response.ok) {
            return NextResponse.json({ code: 'ERROR', message: data.detail || data.message || `Error ${response.status}` }, { status: response.status });
        }
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    return forward(request, 'PUT', `/medical-packages/my/packages/${encodeURIComponent(params.id)}`, true);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    return forward(request, 'DELETE', `/medical-packages/my/packages/${encodeURIComponent(params.id)}`, false);
}
