"use client";

import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';

// Mercator projection: lat/lng → pixel on a 680×340 canvas
function mercatorX(lng: number): number {
    return ((lng + 180) / 360) * 680;
}
function mercatorY(lat: number): number {
    const rad = (lat * Math.PI) / 180;
    const merc = Math.log(Math.tan(Math.PI / 4 + rad / 2));
    return (280 - (merc / Math.PI) * 280);
}

const COUNTRY_META: Record<string, { name: string; flag: string; lat: number; lng: number }> = {
    '58': { name: 'Venezuela',    flag: '🇻🇪', lat:  6.42,  lng: -66.58 },
    '57': { name: 'Colombia',     flag: '🇨🇴', lat:  4.57,  lng: -74.29 },
    '51': { name: 'Perú',         flag: '🇵🇪', lat: -9.19,  lng: -75.01 },
    '52': { name: 'México',       flag: '🇲🇽', lat: 23.63,  lng: -102.55 },
    '54': { name: 'Argentina',    flag: '🇦🇷', lat: -38.41, lng: -63.61 },
    '56': { name: 'Chile',        flag: '🇨🇱', lat: -35.67, lng: -71.54 },
    '55': { name: 'Brasil',       flag: '🇧🇷', lat: -14.23, lng: -51.92 },
    '53': { name: 'Cuba',         flag: '🇨🇺', lat:  22.0,  lng: -79.5 },
    '1':  { name: 'EEUU',         flag: '🇺🇸', lat:  38.5,  lng: -98.0 },
    '34': { name: 'España',       flag: '🇪🇸', lat:  40.41, lng: -3.70 },
    '58504': { name: 'Venezuela', flag: '🇻🇪', lat:  6.42,  lng: -66.58 },
};

function extractPrefix(phone: string): string {
    const clean = (phone || '').replace(/\D/g, '');
    for (const prefix of ['58', '57', '56', '55', '54', '53', '52', '51', '34', '1']) {
        if (clean.startsWith(prefix)) return prefix;
    }
    return '';
}

interface Props { doctors: any[] }

export default function DoctorLocationMap({ doctors }: Props) {
    const pins = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const d of doctors) {
            const prefix = extractPrefix(d.phone || '');
            if (prefix && COUNTRY_META[prefix]) {
                counts[prefix] = (counts[prefix] || 0) + 1;
            }
        }
        return Object.entries(counts).map(([prefix, count]) => {
            const meta = COUNTRY_META[prefix];
            return {
                prefix,
                name: meta.name,
                flag: meta.flag,
                x: mercatorX(meta.lng),
                y: mercatorY(meta.lat),
                count,
            };
        }).sort((a, b) => b.count - a.count);
    }, [doctors]);

    if (pins.length === 0) return null;

    const maxCount = pins[0]?.count ?? 1;

    return (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-alteha-violet" />
                    <h3 className="font-black text-slate-900">Distribución Geográfica</h3>
                    <span className="text-xs text-slate-400 font-medium">(por prefijo telefónico)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {pins.map(p => (
                        <div key={p.prefix} className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-700">
                            <span>{p.flag}</span>
                            <span>{p.name}</span>
                            <span className="w-5 h-5 rounded-full bg-alteha-violet text-white flex items-center justify-center text-[10px] font-black">{p.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* SVG world map — Mercator, no external deps */}
            <div className="w-full overflow-hidden bg-slate-50" style={{ height: 300 }}>
                <svg
                    viewBox="0 0 680 300"
                    width="100%"
                    height="100%"
                    style={{ display: 'block' }}
                    aria-label="Mapa de distribución de médicos por país"
                >
                    {/* Ocean */}
                    <rect width="680" height="300" fill="#EFF6FF" />

                    {/* Simplified land shapes — key regions only */}
                    {/* North America */}
                    <path d="M 115,45 L 200,40 L 230,55 L 245,75 L 240,95 L 220,105 L 200,100 L 185,115 L 165,110 L 150,95 L 130,90 L 115,75 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Mexico */}
                    <path d="M 165,110 L 195,105 L 210,120 L 205,138 L 190,145 L 175,140 L 162,130 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Central America */}
                    <path d="M 175,140 L 195,145 L 200,158 L 188,162 L 177,155 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Caribbean */}
                    <ellipse cx="218" cy="138" rx="8" ry="4" fill="#CBD5E1"/>
                    <ellipse cx="228" cy="142" rx="5" ry="3" fill="#CBD5E1"/>
                    {/* Colombia */}
                    <path d="M 186,164 L 205,160 L 215,172 L 210,188 L 196,192 L 184,183 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Venezuela */}
                    <path d="M 205,160 L 230,155 L 245,162 L 248,175 L 230,182 L 215,178 L 210,188 L 196,192 L 184,183 L 190,172 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Brazil */}
                    <path d="M 215,178 L 255,165 L 285,170 L 300,190 L 295,220 L 270,240 L 245,245 L 225,235 L 210,215 L 205,195 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Peru */}
                    <path d="M 184,183 L 196,192 L 205,195 L 205,220 L 192,228 L 178,220 L 172,205 L 175,190 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Bolivia */}
                    <path d="M 205,195 L 225,198 L 230,215 L 220,228 L 205,225 L 205,210 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Chile */}
                    <path d="M 192,228 L 205,225 L 208,255 L 202,270 L 195,260 L 190,245 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Argentina */}
                    <path d="M 205,225 L 225,230 L 235,250 L 228,268 L 212,272 L 202,260 L 202,240 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Europe */}
                    <path d="M 445,55 L 490,48 L 510,58 L 508,75 L 492,80 L 470,75 L 455,70 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Africa */}
                    <path d="M 455,95 L 510,88 L 530,105 L 525,150 L 510,175 L 488,182 L 465,170 L 452,148 L 448,120 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>
                    {/* Asia rough */}
                    <path d="M 510,45 L 620,38 L 645,60 L 640,90 L 610,100 L 560,95 L 530,80 L 515,65 Z" fill="#CBD5E1" stroke="#E2E8F0" strokeWidth="0.5"/>

                    {/* Doctor pins */}
                    {pins.map(pin => {
                        const r = 7 + (pin.count / maxCount) * 13;
                        const cx = pin.x;
                        const cy = Math.min(Math.max(pin.y, r + 2), 300 - r - 14);
                        return (
                            <g key={pin.prefix}>
                                {/* Pulse ring */}
                                <circle cx={cx} cy={cy} r={r * 1.7} fill="#7C3AED" fillOpacity={0.15}/>
                                {/* Main dot */}
                                <circle cx={cx} cy={cy} r={r} fill="#7C3AED" stroke="white" strokeWidth={2}/>
                                {/* Count label */}
                                <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={r > 10 ? 9 : 7} fontWeight="bold" fill="white">{pin.count}</text>
                                {/* Country label below */}
                                <text x={cx} y={cy + r + 11} textAnchor="middle" fontSize={8} fontWeight="600" fill="#475569">{pin.flag} {pin.name}</text>
                            </g>
                        );
                    })}

                    {/* Scale legend */}
                    <g transform="translate(12, 278)">
                        <circle cx={6} cy={6} r={6} fill="#7C3AED" fillOpacity={0.15}/>
                        <circle cx={6} cy={6} r={4} fill="#7C3AED"/>
                        <text x={15} y={10} fontSize={8} fill="#94A3B8">Tamaño = cantidad de médicos</text>
                    </g>
                </svg>
            </div>
        </div>
    );
}
