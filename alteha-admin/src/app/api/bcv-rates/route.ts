import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Never cache — always fresh

export async function GET(req: NextRequest) {
    try {
        // Fetch BCV page — use a browser-like User-Agent to avoid blocks
        const res = await fetch('https://www.bcv.org.ve/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
                'Accept-Language': 'es-VE,es;q=0.9',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) throw new Error(`BCV responded with ${res.status}`);
        const html = await res.text();

        const $ = load(html);

        const rates: Record<string, { value: string; currency: string }> = {};

        // BCV uses divs with ids like #dolar, #euro, #yuan, #lira, #rublo
        const currencyMap: Record<string, string> = {
            'dolar':  'USD',
            'euro':   'EUR',
            'yuan':   'CNY',
            'lira':   'TRY',
            'rublo':  'RUB',
        };

        for (const [id, code] of Object.entries(currencyMap)) {
            const el = $(`#${id}`);
            if (el.length) {
                // The rate is in a <strong> tag inside the div
                const rawValue = el.find('strong').first().text().trim()
                    || el.find('.centrado strong').text().trim()
                    || el.text().trim();
                const cleaned = rawValue.replace(/\s+/g, '').replace(',', '.');
                if (cleaned) {
                    rates[code] = { value: cleaned, currency: code };
                }
            }
        }

        // If scraping found nothing, check for alternative structure
        if (Object.keys(rates).length === 0) {
            // Try table approach
            $('div.col-sm-12 strong').each((i: number, el: any) => {
                const text = $(el).text().trim();
                const keys = Object.values(currencyMap);
                // Look for known numeric pattern (Venezuelan format: 468,51450000)
                if (/^\d{1,4},\d{4,}$/.test(text.replace(/\./g, ''))) {
                    // Associate by position — fallback
                    const code = keys[i] || `RATE${i}`;
                    if (code) rates[code] = { value: text.replace(',', '.'), currency: code };
                }
            });
        }

        // Fetch the date displayed on BCV
        let rateDate = '';
        const dateEl = $('div.centrado p').last().text().trim()
            || $('p.informacion').text().trim()
            || '';
        rateDate = dateEl;

        return NextResponse.json({
            rates,
            date: rateDate || new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            fetchedAt: new Date().toISOString(),
        });

    } catch (err: any) {
        console.error('BCV scraper error:', err.message);
        // Return last-known fallback values (from user's sample) so UI never breaks
        return NextResponse.json({
            rates: {
                EUR: { value: '541.19046924', currency: 'EUR' },
                CNY: { value: '67.81907270',  currency: 'CNY' },
                TRY: { value: '10.56231006',  currency: 'TRY' },
                RUB: { value: '5.68654569',   currency: 'RUB' },
                USD: { value: '468.51450000', currency: 'USD' },
            },
            date: 'Viernes, 27 Marzo 2026',
            fetchedAt: new Date().toISOString(),
            fallback: true,
            error: err.message,
        }, { status: 200 });
    }
}
