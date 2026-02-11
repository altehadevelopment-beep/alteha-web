"use client";

import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import React, { useMemo, useEffect, useState } from 'react';

// Define libraries array outside component to avoid re-loading script
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface Clinic {
    id: number;
    name: string;
    lat: number;
    lng: number;
    city: string;
    logoUrl?: string;
}

interface MapProps {
    clinics: Clinic[];
    selectedId?: number;
    onSelect: (id: number) => void;
    center?: { lat: number; lng: number };
}

export default function ClinicMap({ clinics, selectedId, onSelect, center = { lat: 10.4806, lng: -66.9036 } }: MapProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        libraries: libraries,
    });

    const [map, setMap] = React.useState<google.maps.Map | null>(null);

    // Smooth panning when center changes
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
        }
    }, [map, center]);

    const mapOptions = useMemo(() => ({
        disableDefaultUI: false,
        clickableIcons: true,
        scrollwheel: true,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    }), []);

    if (!isLoaded) {
        return (
            <div className="h-[400px] w-full rounded-xl flex items-center justify-center bg-slate-100 border border-slate-200">
                <p className="text-slate-500">Cargando mapa...</p>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 z-0 relative">
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={center}
                zoom={14}
                options={mapOptions}
                onLoad={(map) => setMap(map)}
            >
                {clinics.map((clinic) => (
                    <Marker
                        key={clinic.id}
                        position={{ lat: clinic.lat, lng: clinic.lng }}
                        onClick={() => onSelect(clinic.id)}
                        animation={selectedId === clinic.id ? google.maps.Animation.BOUNCE : undefined}
                        icon={{
                            url: clinic.logoUrl || '/hospital-placeholder.png', // Fallback
                            scaledSize: new google.maps.Size(40, 40),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(20, 20),
                        }}
                        label={{
                            text: selectedId === clinic.id ? clinic.name : '',
                            color: '#1e293b',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            className: 'mt-10 bg-white/90 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm'
                        }}
                    />
                ))}
            </GoogleMap>
        </div>
    );
}
