export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No token' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        // Let's proxy to /actor/insurance-companies/${id} or just /insurance-companies/${id}?
        // Wait, what is the actual backend endpoint? Usually it's /insurance-companies/${id} or /actor/insurance-company/${id}.
        // Let's try /insurance-companies/${id} first.
        const response = await fetch(`${API_BASE}/insurance-companies/${id}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Proxy] Error fetching insurance company ${id}:`, response.status, errorText);
            return NextResponse.json({ code: 'ERROR', message: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Insurance company profile proxy error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}
