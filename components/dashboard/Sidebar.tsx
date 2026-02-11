"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    Wallet,
    MessageSquare,
    AlertCircle,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Users,
    Gavel,
    Star,
    Plus
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const specialistItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/specialist' },
    { title: 'Mis Órdenes', icon: FileText, href: '/dashboard/specialist/orders' },
    { title: 'Métodos de Pago', icon: CreditCard, href: '/dashboard/specialist/payments' },
    { title: 'Recepción de Fondos', icon: Wallet, href: '/dashboard/specialist/withdrawals' },
    { title: 'Publicar Paquete', icon: Package, href: '/dashboard/specialist/packages' },
    { title: 'Chat', icon: MessageSquare, href: '/dashboard/specialist/chat' },
    { title: 'Referir Colega', icon: Users, href: '/dashboard/specialist/referrals' },
    { title: 'Disputas', icon: AlertCircle, href: '/dashboard/specialist/disputes' },
];

const clinicItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/clinic' },
    { title: 'Subastas', icon: Gavel, href: '/dashboard/clinic/auctions' },
    { title: 'Mis Paquetes', icon: Package, href: '/dashboard/clinic/packages' },
    { title: 'Mis Órdenes', icon: FileText, href: '/dashboard/clinic/orders' },
    { title: 'Pagos', icon: CreditCard, href: '/dashboard/clinic/payments' },
    { title: 'Chat', icon: MessageSquare, href: '/dashboard/clinic/chat' },
    { title: 'Notificaciones', icon: Bell, href: '/dashboard/clinic/notifications' },
    { title: 'Puntuación', icon: Star, href: '/dashboard/clinic/score' },
];

const insuranceItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/insurance' },
    { title: 'Crear Subasta', icon: Plus, href: '/dashboard/insurance/auctions/new' },
    { title: 'Subastas Activas', icon: Gavel, href: '/dashboard/insurance/auctions' },
    { title: 'Órdenes Emitidas', icon: FileText, href: '/dashboard/insurance/orders' },
    { title: 'Pagos y Siniestros', icon: CreditCard, href: '/dashboard/insurance/payments' },
    { title: 'Chat Corporativo', icon: MessageSquare, href: '/dashboard/insurance/chat' },
    { title: 'Directorio Médico', icon: Users, href: '/dashboard/insurance/directory' },
];

const providerItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/provider' },
    { title: 'Subastas Disponibles', icon: Gavel, href: '/dashboard/provider/auctions' },
    { title: 'Mis Ofertas', icon: FileText, href: '/dashboard/provider/bids' },
    { title: 'Catálogo de Productos', icon: Package, href: '/dashboard/provider/catalog' },
    { title: 'Órdenes Recibidas', icon: FileText, href: '/dashboard/provider/orders' },
    { title: 'Pagos', icon: CreditCard, href: '/dashboard/provider/payments' },
    { title: 'Chat', icon: MessageSquare, href: '/dashboard/provider/chat' },
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);

    const isClinic = pathname.includes('/dashboard/clinic');
    const isInsurance = pathname.includes('/dashboard/insurance');
    const isProvider = pathname.includes('/dashboard/provider');

    let menuItems = specialistItems;
    if (isClinic) menuItems = clinicItems;
    if (isInsurance) menuItems = insuranceItems;
    if (isProvider) menuItems = providerItems;

    const settingsHref = isClinic ? '/dashboard/clinic/settings' :
        isInsurance ? '/dashboard/insurance/settings' :
            isProvider ? '/dashboard/provider/settings' :
                '/dashboard/specialist/settings';

    const handleLogout = () => {
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 right-4 z-[60] p-2 bg-white rounded-xl shadow-lg lg:hidden"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-full bg-white border-r border-slate-100 z-50 transition-all duration-300 w-72 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-6">
                    <Link href="/" className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
                        <Logo className="w-10 h-10 group-hover:scale-105 transition-transform" />
                        <span className="font-black text-2xl tracking-[0.05em] text-slate-800">ALTEHA</span>
                    </Link>

                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300",
                                        isActive
                                            ? "bg-alteha-turquoise/10 text-alteha-turquoise"
                                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-alteha-turquoise" : "text-slate-400")} />
                                    <span>{item.title}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-alteha-turquoise" />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="pt-6 border-t border-slate-50 space-y-2">
                        <Link
                            href={settingsHref}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Configuración</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                />
            )}
        </>
    );
}
