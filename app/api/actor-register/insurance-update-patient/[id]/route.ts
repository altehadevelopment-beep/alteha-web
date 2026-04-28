export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        // Get user token from header
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        // Get app admin token
        const adminToken = await getAppToken();

        // Get the body
        const body = await request.json();

        // Forward to backend
        const response = await fetch(`${API_BASE}/actor-register/insurance-update-patient/${id}`, {
            method: 'PUT',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            },
            body: JSON.stringify(body)
        });

        console.log(`[API Proxy] PUT /actor-register/insurance-update-patient/${id} - Status: ${response.status}`);

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Insurance Patient update error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        console.log(`[API Proxy] Attempting to fetch patient ID: ${id}`);
        const userToken = request.headers.get('X-Alteha-Token');

        if (!userToken) {
            console.error('[API Proxy] No user token provided in headers');
            return NextResponse.json({
                code: 'AUTH_001',
                message: 'No se proporcionó token de usuario'
            }, { status: 401 });
        }

        console.log('[API Proxy] Fetching admin token...');
        const adminToken = await getAppToken();
        console.log('[API Proxy] Admin token acquired.');

        const backendUrl = `${API_BASE}/actor-register/insurance-update-patient/${id}`;
        console.log(`[API Proxy] Requesting backend: GET ${backendUrl}`);

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${adminToken}`,
                'X-Alteha-Token': userToken
            }
        });

        console.log(`[API Proxy] Backend response status: ${response.status}`);
        
        if (response.status === 405 || response.status === 404) {
            console.log('[API Proxy] GET not supported by backend. Trying fallback search by identificationNumber...');
            // Try to search by identification number using the ID as a guess
            const fallbackUrl = `${API_BASE}/actor-register/search-patient?role=PATIENT&documentType=V&documentNumber=${id}`;
            const fallbackResponse = await fetch(fallbackUrl, {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                    'Authorization': `Bearer ${adminToken}`,
                    'X-Alteha-Token': userToken
                }
            });
            
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                console.log('[API Proxy] Fallback search successful.');
                // Backend search-patient returns an array or single object
                return NextResponse.json(fallbackData);
            }
        }

        const data = await response.json();
        console.log('[API Proxy] Data received from backend.');
        
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[API Proxy] Critical error in GET patient:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
