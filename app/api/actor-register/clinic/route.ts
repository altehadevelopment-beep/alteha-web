import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/auth-service';
import { verifyCaptcha } from '@/lib/captcha-verify';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qa.alteha.com:3232/api';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Verify CAPTCHA
        const captchaToken = formData.get('captchaToken') as string;
        const isHuman = await verifyCaptcha(captchaToken);
        if (!isHuman) {
            return NextResponse.json({
                code: 'VAL_004',
                message: 'Verificación de seguridad fallida'
            }, { status: 400 });
        }

        // Remove captchaToken from formData before forwarding
        formData.delete('captchaToken');

        const token = await getAppToken();

        const response = await fetch(`${API_BASE}/actor-register/clinic`, {
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
        console.error('Clinic registration error:', error);
        return NextResponse.json({
            code: 'ERROR',
            message: 'Error de conexión con el servidor'
        }, { status: 500 });
    }
}
