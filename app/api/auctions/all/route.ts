export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '50';
        const sort = searchParams.get('sort') || 'createdAt,desc';

        const adminToken = await getAppToken();

        let targetUrl = `${API_BASE}/auctions?page=${page}&size=${size}&sort=${sort}`;
        if (status) {
            targetUrl += `&status.equals=${status}`;
        }

        console.log('[API Proxy] Fetching all auctions from:', targetUrl);

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json({
                code: '00',
                message: 'OK',
                data: data
            });
        }

        return NextResponse.json({
            code: 'ERROR',
            message: data.message || 'Error fetching auctions'
        }, { status: response.status });

    } catch (error) {
        console.error('GetAllAuctions error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
