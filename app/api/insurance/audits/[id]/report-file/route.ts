export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qaback.alteha.com:3232/api';

/**
 * GET /api/insurance/audits/{id}/report-file — devuelve el informe médico del
 * expediente como archivo. Se sirve desde aquí (y no directo desde el bucket)
 * porque el navegador no puede hacer fetch cross-origin al almacenamiento, y el
 * asistente de la subasta necesita los bytes para adjuntarlo al formulario.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userToken = request.headers.get('X-Alteha-Token') || new URL(request.url).searchParams.get('t') || '';
        const adminToken = await getAppToken();

        // El detalle valida que el expediente pertenezca a la aseguradora del token.
        const detalle = await fetch(`${API_BASE}/insurance/audits/${params.id}`, {
            headers: { Accept: '*/*', Authorization: `Bearer ${adminToken}`, 'X-Alteha-Token': userToken },
        }).then((r) => r.json());
        if (detalle?.code !== '00') {
            return NextResponse.json(detalle ?? { code: 'ERROR' }, { status: 403 });
        }

        const docs: any[] = detalle.data?.documents || [];
        const informe =
            docs.find((d) => d.docType === 'INFORME_MEDICO' && d.fileUrl) ||
            docs.find((d) => d.fileUrl) ||
            null;
        const url = informe?.fileUrl || detalle.data?.reportUrl;
        if (!url) {
            return NextResponse.json({ code: '01', message: 'El expediente no tiene un informe archivado' }, { status: 404 });
        }

        const archivo = await fetch(url);
        if (!archivo.ok) {
            return NextResponse.json({ code: '01', message: 'No se pudo recuperar el informe del archivo' }, { status: 502 });
        }
        const bytes = await archivo.arrayBuffer();
        return new NextResponse(bytes, {
            headers: {
                'Content-Type': informe?.contentType || archivo.headers.get('content-type') || 'application/pdf',
                'Content-Disposition': `inline; filename="${(informe?.fileName || 'informe.pdf').replace(/[^\w.-]/g, '_')}"`,
                'Cache-Control': 'private, max-age=60',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ code: 'ERROR', message: `Error de conexión: ${error.message}` }, { status: 500 });
    }
}
