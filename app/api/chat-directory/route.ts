export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/chat-directory — actores con los que se puede chatear + mi identidad.
export async function GET(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/chat-directory`, {
            headers: {
                Accept: '*/*',
                Authorization: `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken || '',
            },
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
