export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const deviceId = searchParams.get('deviceId');
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken || !role || !deviceId) {
            return NextResponse.json({ code: 'ERROR', message: 'Missing parameters' }, { status: 400 });
        }

        const adminToken = await getAppToken();

        // The backend endpoint might be different, but I'll follow a standard pattern
        // based on the user's request to "update with another method"
        const response = await fetch(`${API_BASE}/actor-device-update?role=${role}&deviceId=${deviceId}`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Device ID update proxy error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión' }, { status: 500 });
    }
}
