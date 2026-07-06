export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET — órdenes de liquidación por actor de una subasta (módulo de aprobación)
export async function GET(_request: NextRequest, { params }: { params: { auctionNumber: string } }) {
    try {
        const adminToken = await getAppToken();
        const response = await fetch(
            `${API_BASE}/commissions/auction/${encodeURIComponent(params.auctionNumber)}/settlements`,
            { headers: { 'Accept': '*/*', 'Authorization': `Bearer ${adminToken}` } }
        );
        const data = await response.json().catch(() => []);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
