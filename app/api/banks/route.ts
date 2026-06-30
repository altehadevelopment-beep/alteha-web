export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET /api/banks?countryId.equals=1000&sort=name,asc&size=200
// Reference data (list of banks, filterable by country) — used by the payment-report bank dropdown.
export async function GET(request: NextRequest) {
    try {
        const queryString = request.nextUrl.search; // includes leading '?'
        const adminToken = await getAppToken();
        const url = `${API_BASE}/banks${queryString}`;

        console.log('[API Proxy] GET', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
        });

        const text = await response.text();
        let data: any = [];
        try { data = text ? JSON.parse(text) : []; } catch { data = []; }

        if (!response.ok) {
            return NextResponse.json({
                code: 'ERROR',
                message: data.detail || data.title || data.message || `Error ${response.status}`,
            }, { status: response.status });
        }

        const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        return NextResponse.json(list, { status: 200 });
    } catch (error: any) {
        console.error('[API Proxy] banks GET error:', error);
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
