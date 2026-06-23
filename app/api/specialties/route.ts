export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '50';
        const withProcedures = searchParams.get('withProcedures') === 'true';
        const token = await getAppToken();

        const headers = { 'Accept': '*/*', 'Authorization': `Bearer ${token}` };

        const response = await fetch(`${API_BASE}/specialties?page=${page}&size=${size}`, {
            method: 'GET',
            headers
        });
        const allSpecialties = await response.json();

        if (!withProcedures) {
            return NextResponse.json(allSpecialties);
        }

        // Cross-reference with procedure types to only return specialties that have procedures
        const ptResponse = await fetch(`${API_BASE}/procedure-types?page=0&size=2000`, {
            method: 'GET',
            headers
        });
        const ptData = await ptResponse.json();
        const procedureTypes = Array.isArray(ptData) ? ptData : [];

        const specialtyIdsWithProcedures = new Set(
            procedureTypes
                .map((t: any) => t.specialty?.id ?? t.specialtyId)
                .filter(Boolean)
        );

        if (specialtyIdsWithProcedures.size === 0) {
            return NextResponse.json(allSpecialties);
        }

        const filtered = (Array.isArray(allSpecialties) ? allSpecialties : [])
            .filter((s: any) => specialtyIdsWithProcedures.has(s.id));

        return NextResponse.json(filtered);
    } catch (error) {
        console.error('Specialties fetch error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
