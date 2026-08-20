export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

// POST /api/insurance/audits/{id}/documents — amplía el expediente y dispara el
// recálculo. Va por su propia ruta porque es multipart y el proxy JSON no sirve.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');
        const adminToken = await getAppToken();
        // El multipart se rearma aquí: reenviar request.body en streaming
        // (duplex: 'half') no funciona en esta versión de Next y la petición al
        // backend muere con "fetch failed".
        const formData = await request.formData();
        const response = await fetch(`${API_BASE}/insurance/audits/${params.id}/documents`, {
            method: 'POST',
            headers: {
                Accept: '*/*',
                Authorization: `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken || '',
            },
            body: formData,
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}${error?.cause?.message ? ' — ' + error.cause.message : ''}` }, { status: 500 });
    }
}
