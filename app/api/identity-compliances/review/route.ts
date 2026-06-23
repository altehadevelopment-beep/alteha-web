export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/identity-compliances/review
// Admin approves or rejects a doctor's identity verification.
// Body: { complianceId, approved, rejectionReason }
export async function POST(request: NextRequest) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const body = await request.text();
        const adminToken = await getAppToken();
        const targetUrl = `${API_BASE}/identity-compliances/review`;

        console.log('[API Proxy] POST /identity-compliances/review | body:', body);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
            body
        });

        const text = await response.text();
        console.log('[API Proxy] review status:', response.status, '| body:', text);

        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

        if (!response.ok) {
            return NextResponse.json({
                code: 'ERROR',
                message: data.detail || data.title || data.message || `Error ${response.status} al revisar la verificación`
            }, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('[API Proxy] identity-compliances/review error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: `Error de conexión: ${error.message}`
        }, { status: 500 });
    }
}
