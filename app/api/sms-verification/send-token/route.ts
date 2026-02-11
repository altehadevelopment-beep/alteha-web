import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const token = await getAppToken();

        const response = await fetch(`${API_BASE}/sms-verification/send-token`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`SMS verification failed: ${response.status} ${response.statusText}`, text);
            try {
                const errorData = JSON.parse(text);
                return NextResponse.json(errorData, { status: response.status });
            } catch {
                return NextResponse.json(
                    { code: 'ERROR', message: `Error del servidor externo: ${response.status}` },
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('SMS verification error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión con el servidor' }, { status: 500 });
    }
}
