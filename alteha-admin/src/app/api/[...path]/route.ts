import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

// Create a custom HTTPS agent to bypass self-signed certificate errors (equivalent to curl -k)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

export async function POST(req: NextRequest) {
    return handleRequest(req);
}

export async function GET(req: NextRequest) {
    return handleRequest(req);
}

export async function PUT(req: NextRequest) {
    return handleRequest(req);
}

export async function DELETE(req: NextRequest) {
    return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
    const url = new URL(req.url);
    // Remove the leading /api to map it to the backend's /api
    const targetPath = url.pathname.replace(/^\/api/, '');
    const targetUrl = `https://qaback.alteha.com:3232/api${targetPath}${url.search}`;

    try {
        // Read body if exists
        let bodyData = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const rawBody = await req.text();
            if (rawBody) {
                try {
                    bodyData = JSON.parse(rawBody);
                } catch {
                    bodyData = rawBody;
                }
            }
        }

        // Extract Authorization header
        const authHeader = req.headers.get('authorization');
        const headers: any = {
            'Content-Type': req.headers.get('content-type') || 'application/json',
            'Accept': 'application/json'
        };

        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: bodyData,
            headers: headers,
            httpsAgent: httpsAgent, // Ignore SSL errors
            validateStatus: () => true // Resolve on all HTTP status codes
        });

        // Return the response back to the Next.js client, including JHipster pagination headers
        const responseHeaders: Record<string, string> = {};
        // Relay important response headers
        const headersToRelay = ['x-total-count', 'content-type', 'link', 'x-app-version'];
        headersToRelay.forEach(h => {
            const val = response.headers[h];
            if (val) responseHeaders[h] = String(val);
        });

        return NextResponse.json(response.data, {
            status: response.status,
            headers: responseHeaders,
        });

    } catch (error: any) {
        console.error(`[API Proxy Error] ${req.method} ${targetUrl} -`, error.message);
        return NextResponse.json(
            { error: 'Proxy implementation error', details: error.message },
            { status: 500 }
        );
    }
}
