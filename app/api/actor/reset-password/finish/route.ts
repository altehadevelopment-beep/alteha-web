export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key, newPassword, role } = body;

        if (!key || !newPassword || !role) {
            return NextResponse.json({
                code: 'VALIDATION_ERROR',
                message: 'key, newPassword y role son requeridos.'
            }, { status: 400 });
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/actor/reset-password/finish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ key, newPassword, role }),
        });

        console.log(`[API Proxy] POST /actor/reset-password/finish - Status: ${response.status}`);

        if (response.ok) {
            let data: any = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                data = await response.json().catch(() => null);
            }
            return NextResponse.json(
                data ?? { code: '00', message: 'Contraseña actualizada exitosamente.' },
                { status: 200 }
            );
        }

        let errorData: any = {};
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: `Error del servidor: ${response.status}` };
        }

        return NextResponse.json(errorData, { status: response.status });

    } catch (error: any) {
        console.error('[Reset Password Finish] Error:', error.message);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor.'
        }, { status: 500 });
    }
}
