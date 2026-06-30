"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getDashboardAdById, type Advertisement } from '@/lib/api';
import AdLanding from '@/components/ads/AdLanding';

export default function SpecialistAdLandingPage() {
    const params = useParams();
    const id = params.id as string;
    const [ad, setAd] = useState<Advertisement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getDashboardAdById(id)
            .then((a) => { if (active) setAd(a); })
            .catch(() => { if (active) setAd(null); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-alteha-violet" />
            </div>
        );
    }

    if (!ad) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center space-y-4 font-outfit">
                <p className="text-slate-500 font-bold">No se encontró esta publicidad.</p>
                <Link href="/dashboard/specialist" className="text-alteha-violet font-black hover:underline">
                    Volver al dashboard
                </Link>
            </div>
        );
    }

    return <AdLanding ad={ad} backHref="/dashboard/specialist" />;
}
