export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// GET — comisión registrada de una subasta adjudicada
export async function GET(_request: NextRequest, { params }: { params: { auctionNumber: string } }) {
    try {
        const adminToken = await getAppToken();
        const response = await fetch(`${API_BASE}/commissions/auction/${encodeURIComponent(params.auctionNumber)}`, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.ok ? 200 : response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: error.message }, { status: 500 });
    }
}
