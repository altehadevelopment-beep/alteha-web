export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET — desglose de ofertas de una subasta: completas vs en espera de clínica/médico.
export async function GET(request: NextRequest, { params }: { params: { auctionId: string } }) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: 'AUTH_001', message: 'No se proporcionó token de usuario' }, { status: 401 });
        }
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/clinic-invitations/auction/${params.auctionId}/bids-summary`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken,
            },
        });
        const text = await response.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
        if (!response.ok) {
            return NextResponse.json({ code: 'ERROR', message: data.detail || data.message || `Error ${response.status}` }, { status: response.status });
        }
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
