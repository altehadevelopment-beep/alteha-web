import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qa.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '50';
        const token = await getAppToken();

        const response = await fetch(`${API_BASE}/specialties?page=${page}&size=${size}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Specialties fetch error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
