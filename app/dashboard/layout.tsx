"use client";

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            // Conservar el perfil en el login: si la sesión venció en /dashboard/insurance,
            // el login debe abrir con "Seguro" preseleccionado (y así con cada rol).
            const segments = (pathname || '').split('/');
            const dashboardIndex = segments.indexOf('dashboard');
            const role = dashboardIndex !== -1 ? segments[dashboardIndex + 1] : null;
            router.replace(role ? `/login?role=${role}` : '/login');
        }
    }, [isAuthenticated, isInitializing, router, pathname]);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-alteha-violet border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <DashboardSidebar />
            <main className="lg:pl-72 min-h-screen">
                <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
