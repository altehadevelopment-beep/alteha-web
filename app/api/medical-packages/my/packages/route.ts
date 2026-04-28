export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '20';
        
        const userToken = request.headers.get('X-Alteha-Token');
        if (!userToken) {
            return NextResponse.json({ code: '99', message: 'No user token provided' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/medical-packages/my/packages?page=${page}&size=${size}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Medical packages list error:', response.status, errorText);
            return NextResponse.json({ code: '99', message: 'Backend error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Medical packages list exception:', error);
        return NextResponse.json({ code: '99', message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const userToken = request.headers.get('X-Alteha-Token');
        
        if (!userToken) {
            return NextResponse.json({ code: '99', message: 'No user token provided' }, { status: 401 });
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/medical-packages/my/packages`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Medical package creation error:', response.status, errorText);
            return NextResponse.json({ code: '99', message: 'Backend error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Medical package creation exception:', error);
        return NextResponse.json({ code: '99', message: 'Internal server error' }, { status: 500 });
    }
}
