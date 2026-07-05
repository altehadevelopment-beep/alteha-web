"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * Selector de ubicación con mapa (Leaflet + OpenStreetMap):
 * clic en el mapa o arrastre del marcador para fijar latitud/longitud.
 * Con `withSearch` incluye un buscador de direcciones (geocodificador Nominatim).
 */
export default function LocationPicker({ latitude, longitude, onChange, heightClass = 'h-72', withSearch = false, onAddressFound }: {
    latitude?: number | null;
    longitude?: number | null;
    onChange: (lat: number, lng: number) => void;
    heightClass?: string;
    withSearch?: boolean;
    onAddressFound?: (address: string) => void;
}) {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const mountRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Caracas como centro por defecto cuando no hay coordenadas guardadas
    const hasCoords = !!(latitude && longitude);
    const initial: [number, number] = hasCoords ? [Number(latitude), Number(longitude)] : [10.4806, -66.9036];

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const L = (await import('leaflet')).default;
            if (cancelled || !mountRef.current || mapRef.current) return;

            const map = L.map(mountRef.current).setView(initial, hasCoords ? 15 : 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            // Ícono propio (los assets por defecto de Leaflet no cargan con el bundler)
            const icon = L.divIcon({
                className: '',
                html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#10b981;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><div style="width:10px;height:10px;border-radius:50%;background:white;transform:rotate(45deg)"></div></div>',
                iconSize: [34, 34],
                iconAnchor: [17, 34],
            });

            const marker = L.marker(initial, { draggable: true, icon }).addTo(map);
            marker.on('dragend', () => {
                const p = marker.getLatLng();
                onChangeRef.current(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
            });
            map.on('click', (e: any) => {
                marker.setLatLng(e.latlng);
                onChangeRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
            });

            mapRef.current = map;
            markerRef.current = marker;
            // Asegura el render correcto dentro de tarjetas/tabs
            setTimeout(() => map.invalidateSize(), 200);
        })();
        return () => {
            cancelled = true;
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Si las coordenadas cambian desde afuera (p. ej. al cargar el perfil), mover el marcador
    useEffect(() => {
        if (mapRef.current && markerRef.current && latitude && longitude) {
            const target: [number, number] = [Number(latitude), Number(longitude)];
            markerRef.current.setLatLng(target);
            mapRef.current.setView(target, Math.max(mapRef.current.getZoom(), 13));
        }
    }, [latitude, longitude]);

    const runSearch = async () => {
        const q = query.trim();
        if (!q || searching) return;
        setSearching(true);
        setResults([]);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=es&q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const pickResult = (r: any) => {
        const lat = Number(Number(r.lat).toFixed(6));
        const lng = Number(Number(r.lon).toFixed(6));
        if (mapRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapRef.current.setView([lat, lng], 16);
        }
        onChangeRef.current(lat, lng);
        if (onAddressFound && r.display_name) onAddressFound(r.display_name);
        setResults([]);
        setQuery(r.display_name || query);
    };

    return (
        <div className="space-y-2">
            {withSearch && (
                <div className="relative">
                    <div className="flex gap-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }}
                            placeholder="Busca una dirección o lugar (ej. Av. Libertador, Caracas)"
                            className="flex-1 px-5 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-alteha-turquoise/50 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={runSearch}
                            disabled={searching}
                            className="px-6 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-black hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {searching ? 'Buscando…' : 'Buscar'}
                        </button>
                    </div>
                    {results.length > 0 && (
                        <div className="absolute z-[500] left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                            {results.map((r: any) => (
                                <button
                                    key={r.place_id}
                                    type="button"
                                    onClick={() => pickResult(r)}
                                    className="block w-full text-left px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                >
                                    {r.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div ref={mountRef} className={`${heightClass} w-full rounded-2xl overflow-hidden border-2 border-slate-100 z-0`} />
            <p className="text-[10px] font-bold text-slate-400">
                Haz clic en el mapa o arrastra el marcador para fijar la ubicación exacta.
                {latitude && longitude ? ` (${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)})` : ''}
            </p>
        </div>
    );
}
