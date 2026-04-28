export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const adminToken = await getAppToken();
        const formData = await request.formData();
        
        // Extract query parameters from form data
        const fileName = formData.get('fileName') as string;
        const fileType = formData.get('fileType') as string;
        const description = formData.get('description') as string;
        const file = formData.get('file');

        // Build URL with query params
        const url = new URL(`${API_BASE}/doctor-additional-files/custom-upload/${params.id}`);
        if (fileName) url.searchParams.append('fileName', fileName);
        if (fileType) url.searchParams.append('fileType', fileType);
        if (description) url.searchParams.append('description', description);

        // Build new form data with just the file if it exists
        const submitFormData = new FormData();
        if (file) {
            submitFormData.append('file', file);
        }

        const response = await fetch(url.toString(), {
            method: 'PUT',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: submitFormData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Update doctor file error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        const adminToken = await getAppToken();

        const response = await fetch(`${API_BASE}/doctor-additional-files/custom-upload/${params.id}`, {
            method: 'DELETE',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(errorData, { status: response.status });
        }

        // DELETE often returns 204 No Content
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Delete doctor file error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
