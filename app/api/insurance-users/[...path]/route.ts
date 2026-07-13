export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';
async function forward(request: NextRequest, params: { path: string[] }, method: string) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        const headers: Record<string, string> = { Accept: '*/*', Authorization: `Bearer ${adminToken}` };
        if (userToken) headers['X-Alteha-Token'] = userToken;
        let body: string | undefined;
        if (method !== 'GET') { headers['Content-Type'] = 'application/json'; body = await request.text(); }
        const response = await fetch(`${API_BASE}/insurance-users/${params.path.join('/')}`, { method, headers, body });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) { return forward(request, params, 'PUT'); }
export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) { return forward(request, params, 'DELETE'); }
