"use client";

import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { useMemo } from 'react';

// Define libraries array outside component to avoid re-loading script
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface Clinic {
    id: number;
    name: string;
    lat: number;
    lng: number;
    city: string;
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

    // Transform center array to object if necessary or use provided object
    // Note: The previous component used [lat, lng], Google Maps uses {lat, lng}
    // The props interface changed to reflect this, but we should handle the default
    const mapCenter = useMemo(() => center, [center]);

    const mapOptions = useMemo(() => ({
        disableDefaultUI: false,
        clickableIcons: true,
        scrollwheel: true,
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
                center={mapCenter}
                zoom={13}
                options={mapOptions}
            >
                {clinics.map((clinic) => (
                    <Marker
                        key={clinic.id}
                        position={{ lat: clinic.lat, lng: clinic.lng }}
                        onClick={() => onSelect(clinic.id)}
                        animation={selectedId === clinic.id ? google.maps.Animation.BOUNCE : undefined}
                    // Google Maps default markers are red. You can customize icons here if needed.
                    // icon={...}
                    />
                ))}
            </GoogleMap>
        </div>
    );
}
