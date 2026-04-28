export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getAppToken } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const identificationNumber = searchParams.get('identificationNumber');

    if (!identificationNumber) {
        return NextResponse.json({ error: "Missing identificationNumber" }, { status: 400 });
    }

    const apiUrl = `https://qaback.alteha.com:3232/api/preload-clinics?identificationNumber.contains=${identificationNumber}&page=0&size=20`;

    try {
        const adminToken = await getAppToken();

        const response = await fetch(apiUrl, {
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: "External API error" }, { status: response.status });
        }

        const data = await response.json();
        console.log(`[Clinic Preload] identificationNumber=${identificationNumber} | Status: ${response.status} | Results: ${Array.isArray(data) ? data.length : 'N/A'}`);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Clinic Proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
