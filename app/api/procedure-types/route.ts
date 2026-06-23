export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '2000';
        const specialtyId = searchParams.get('specialtyId');
        const token = await getAppToken();

        const qs = new URLSearchParams({ page, size });
        if (specialtyId) qs.set('specialtyId.equals', specialtyId);

        const response = await fetch(`${API_BASE}/procedure-types?${qs.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Procedure types fetch error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
