import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';
import { verifyCaptcha } from '@/lib/captcha-verify';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alteha.chanceaapp.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Verify CAPTCHA
        const isHuman = await verifyCaptcha(body.captchaToken);
        if (!isHuman) {
            return NextResponse.json({
                code: 'VAL_004',
                message: 'Verificación de seguridad fallida'
            }, { status: 400 });
        }

        // Remove captchaToken before sending to external API
        const { captchaToken: _, ...authBody } = body;

        const token = await getAppToken();

        const response = await fetch(`${API_BASE}/actor-authenticate`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(authBody)
        });

        const data = await response.json();

        // If authentication successful, return the token
        if (data.id_token) {
            return NextResponse.json({
                code: '00',
                message: 'OK',
                data: {
                    id_token: data.id_token
                }
            });
        }

        // If there's an error code, return it
        if (data.code) {
            return NextResponse.json(data);
        }

        return NextResponse.json({
            code: 'AUTH_001',
            message: 'Usuario o contraseña incorrectos'
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
