"use client";

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * Selector de ubicación con mapa (Leaflet + OpenStreetMap):
 * clic en el mapa o arrastre del marcador para fijar latitud/longitud.
 */
export default function LocationPicker({ latitude, longitude, onChange, heightClass = 'h-72' }: {
    latitude?: number | null;
    longitude?: number | null;
    onChange: (lat: number, lng: number) => void;
    heightClass?: string;
}) {
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

    return (
        <div className="space-y-2">
            <div ref={mountRef} className={`${heightClass} w-full rounded-2xl overflow-hidden border-2 border-slate-100 z-0`} />
            <p className="text-[10px] font-bold text-slate-400">
                Haz clic en el mapa o arrastra el marcador para fijar la ubicación exacta.
                {latitude && longitude ? ` (${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)})` : ''}
            </p>
        </div>
    );
}
