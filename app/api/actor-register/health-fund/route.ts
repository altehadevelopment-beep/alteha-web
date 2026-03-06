import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const token = await getAppToken();

        // Forward the form data to the backend
        // Assuming /actor-register/health-fund exists on backend
        const response = await fetch(`${API_BASE}/actor-register/health-fund`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Health Fund registration proxy error:', error);
        return NextResponse.json({ code: 'ERROR', message: 'Error de conexión con el servidor' }, { status: 500 });
    }
}
