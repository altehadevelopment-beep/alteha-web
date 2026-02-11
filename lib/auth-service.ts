
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qa.alteha.com:3232/api';
const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin';

let cachedToken: string | null = null;
let tokenExpiration: number = 0;

export async function getAppToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if valid (with 1 minute buffer)
    if (cachedToken && now < tokenExpiration - 60000) {
        return cachedToken;
    }

    try {
        console.log('Authenticating as app admin...');
        const response = await fetch(`${API_BASE}/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: JSON.stringify({
                username: ADMIN_USER,
                password: ADMIN_PASS
            }),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`App authentication failed: ${response.status}`, errorText);
            throw new Error(`Authentication failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.id_token) {
            cachedToken = data.id_token;
            // Decode token to find expiration or set default expiration (e.g. 1 hour)
            // For simplicity, we'll assume 1 hour expiration if not parsed
            tokenExpiration = now + 3600 * 1000;

            // Try to parse expiration from JWT
            try {
                const parts = cachedToken!.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    if (payload.exp) {
                        tokenExpiration = payload.exp * 1000;
                    }
                }
            } catch (e) {
                console.warn('Could not parse JWT expiration, using default', e);
            }

            return cachedToken!;
        } else {
            throw new Error('Invalid authentication response format');
        }
    } catch (error) {
        console.error('Error getting app token:', error);
        throw error;
    }
}
