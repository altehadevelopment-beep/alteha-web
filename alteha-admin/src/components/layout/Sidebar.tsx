"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LogOut, ChevronDown, Users, Building2,
    Stethoscope, HeartPulse, Package, CreditCard,
    Landmark, Bell, Gavel, Pill, MapPin, Settings,
    LayoutDashboard, ShieldPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

// ── Alteha hex SVG mark ──────────────────────────────────────
// ── Alteha Logo ──────────────────────────────────────
function AltehaLogo() {
    return (
        <div className="relative w-10 h-10 flex-shrink-0">
            <Image
                src="/logoalteha.svg"
                alt="Alteha Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
}


interface NavItem { name: string; path: string; }
interface NavGroup { label: string; icon: React.ElementType; items: NavItem[]; }

const navGroups: NavGroup[] = [
    {
        label: 'Usuarios & Acceso', icon: Users,
        items: [
            { name: 'Usuarios', path: '/users' },
            { name: 'Roles & Autoridades', path: '/authorities' },
            { name: 'Permisos', path: '/permisos' },
            { name: 'Perfiles Admin', path: '/admin-profiles' },
            { name: 'Cuentas de Actor', path: '/actor-accounts' },
            { name: 'Registro de Actor', path: '/actor-register' },
            { name: 'Auditoría', path: '/audit-logs' },
        ]
    },
    {
        label: 'Médicos & Clínicas', icon: Stethoscope,
        items: [
            { name: 'Médicos', path: '/doctors' },
            { name: 'Clínicas', path: '/clinics' },
            { name: 'Especialidades', path: '/specialties' },
            { name: 'Experiencias Médicas', path: '/doctor-experiences' },
            { name: 'Historial de Planes', path: '/doctor-plan-histories' },
            { name: 'Archivos Adicionales', path: '/doctor-additional-files' },
            { name: 'Planes de Doctor', path: '/plan-doctors' },
        ]
    },
    {
        label: 'Pacientes & Salud', icon: HeartPulse,
        items: [
            { name: 'Pacientes', path: '/patients' },
            { name: 'Condiciones Médicas', path: '/medical-conditions' },
            { name: 'Alergias', path: '/allergies' },
            { name: 'Medicación Actual', path: '/current-medications' },
            { name: 'Cumplimiento Identidad', path: '/identity-compliances' },
            { name: 'Verificación SMS', path: '/sms-verification' },
            { name: 'Verificación Email', path: '/email-verification' },
            { name: 'Docs de Verificación', path: '/verification-documents' },
        ]
    },
    {
        label: 'Servicios & Paquetes', icon: Package,
        items: [
            { name: 'Servicios', path: '/servicios' },
            { name: 'Órdenes de Servicio', path: '/service-orders' },
            { name: 'Paquetes Médicos', path: '/medical-packages' },
            { name: 'Ítems de Paquete', path: '/package-items' },
            { name: 'Compras de Paquetes', path: '/medical-package-purchases' },
            { name: 'Tipos de Procedimiento', path: '/procedure-types' },
            { name: 'Plantillas Procedimiento', path: '/procedure-templates' },
            { name: 'Suministros Plantillas', path: '/procedure-template-supplies' },
            { name: 'Suministros Médicos', path: '/medical-supplies' },
            { name: 'Reseñas', path: '/reviews' },
        ]
    },
    {
        label: 'Seguros', icon: ShieldPlus,
        items: [
            { name: 'Aseguradoras', path: '/insurance-companies' },
            { name: 'Planes de Seguro', path: '/insurance-plans' },
            { name: 'Pólizas de Seguro', path: '/insurance-policies' },
        ]
    },
    {
        label: 'Finanzas & Pagos', icon: CreditCard,
        items: [
            { name: 'Transacciones', path: '/payment-transactions' },
            { name: 'Métodos de Pago', path: '/payment-receiving-methods' },
            { name: 'Ctas. Bancarias Rec.', path: '/payment-receiving-bank-accounts' },
            { name: 'Canales de Pago', path: '/payment-channels' },
            { name: 'Facturas', path: '/invoices' },
            { name: 'Ítems de Factura', path: '/invoice-items' },
            { name: 'Pagos de Factura', path: '/invoice-payments' },
            { name: 'Reembolsos', path: '/refund-requests' },
            { name: 'Disputas', path: '/transaction-disputes' },
            { name: 'Desembolsos', path: '/disbursements' },
            { name: 'Escrow', path: '/escrow-accounts' },
            { name: 'Billeteras', path: '/wallets' },
            { name: 'Tasas de Cambio', path: '/exchange-rates' },
            { name: 'Monedas', path: '/currencies' },
            { name: 'Config. de Tarifas', path: '/platform-fee-configurations' },
        ]
    },
    {
        label: 'Banca & Cuentas', icon: Landmark,
        items: [
            { name: 'Bancos', path: '/banks' },
            { name: 'Cuentas Bancarias', path: '/bank-accounts' },
            { name: 'Receptores Transf.', path: '/transfer-receivers' },
        ]
    },
    {
        label: 'Subastas & Contratos', icon: Gavel,
        items: [
            { name: 'Subastas', path: '/auctions' },
            { name: 'Ofertas', path: '/bids' },
            { name: 'Ítems de Oferta', path: '/bid-items' },
            { name: 'Historial Ofertas', path: '/bid-histories' },
            { name: 'Suministros Subasta', path: '/auction-supplies' },
            { name: 'Invitaciones Subasta', path: '/auction-invitations' },
            { name: 'Contratos Subasta', path: '/auction-contracts' },
            { name: 'Adjuntos Subasta', path: '/auction-attachments' },
            { name: 'Config. Subasta', path: '/auction-configurations' },
            { name: 'Hitos de Entrega', path: '/delivery-milestones' },
            { name: 'Estado de Órdenes', path: '/order-status-histories' },
        ]
    },
    {
        label: 'Farmacia', icon: Pill,
        items: [
            { name: 'Farmacias', path: '/pharmacies' },
        ]
    },
    {
        label: 'Geografía', icon: MapPin,
        items: [
            { name: 'Países', path: '/countries' },
            { name: 'Estados / Provincias', path: '/state-provinces' },
            { name: 'Ciudades', path: '/cities' },
            { name: 'Direcciones', path: '/addresses' },
            { name: 'Idiomas', path: '/languages' },
        ]
    },
    {
        label: 'Comunicación', icon: Bell,
        items: [
            { name: 'Notificaciones', path: '/notifications' },
            { name: 'Anuncios Dashboard', path: '/dashboard-ads' },
        ]
    },
    {
        label: 'Sistema & Precarga', icon: Settings,
        items: [
            { name: 'Entidades Precargadas', path: '/preloaded-entities' },
            { name: 'Precarga Clínicas', path: '/preload-clinics' },
            { name: 'Precarga Farmacias', path: '/preload-pharmacies' },
            { name: 'Precarga Aseguradoras', path: '/preload-insurance-companies' },
            { name: 'Precarga Médicos', path: '/preload-doctors' },
        ]
    },
];

function NavGroupSection({ group }: { group: NavGroup }) {
    const pathname = usePathname();
    const isGroupActive = group.items.some(
        item => pathname === item.path || pathname?.startsWith(item.path)
    );
    const [isOpen, setIsOpen] = useState(isGroupActive);

    return (
        <div className="mb-0.5">
            {/* Group header button */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group/btn"
                style={{
                    background: isGroupActive ? 'rgba(46,207,191,0.06)' : 'transparent',
                }}
                onMouseEnter={e => {
                    if (!isGroupActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={e => {
                    if (!isGroupActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
            >
                {/* Icon with gradient glow on active */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                        background: isGroupActive
                            ? 'linear-gradient(135deg, rgba(46,207,191,0.25), rgba(123,91,255,0.15))'
                            : 'rgba(255,255,255,0.04)',
                    }}>
                    <group.icon className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: isGroupActive ? '#2ECFBF' : '#4A5568' }} />
                </div>

                {/* Label */}
                <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-[0.12em] leading-none"
                    style={{
                        color: isGroupActive ? '#E2E8F0' : '#4A5A72',
                        fontFamily: 'var(--font-outfit), sans-serif',
                        letterSpacing: '0.1em',
                    }}>
                    {group.label}
                </span>

                {/* Chevron */}
                <ChevronDown
                    className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
                    style={{
                        color: isGroupActive ? '#2ECFBF' : '#2E3A50',
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                />
            </button>

            {/* Items list */}
            {isOpen && (
                <div className="mt-0.5 mb-1 pl-3 ml-3 space-y-0.5"
                    style={{ borderLeft: '1px solid rgba(46,207,191,0.1)' }}>
                    {group.items.map(item => {
                        const isActive = pathname === item.path || pathname?.startsWith(item.path);
                        return (
                            <NavItem key={item.path} item={item} isActive={isActive} />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function NavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            href={item.path}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150"
            style={{
                background: isActive
                    ? 'linear-gradient(90deg, rgba(46,207,191,0.15), rgba(123,91,255,0.08))'
                    : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: isActive ? '1px solid rgba(46,207,191,0.18)' : '1px solid transparent',
            }}
        >
            {/* Active dot */}
            {isActive ? (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                        background: '#2ECFBF',
                        boxShadow: '0 0 6px rgba(46,207,191,0.8)',
                    }} />
            ) : (
                <span className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: hovered ? 'rgba(46,207,191,0.3)' : 'rgba(255,255,255,0.08)' }} />
            )}

            {/* Name */}
            <span className="truncate text-[12.5px] transition-colors"
                style={{
                    color: isActive ? '#E2E8F0' : hovered ? '#A8B8CF' : '#4A5A72',
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: 'var(--font-inter), sans-serif',
                    letterSpacing: isActive ? '0.01em' : '0',
                }}>
                {item.name}
            </span>
        </Link>
    );
}

export default function Sidebar() {
    const { logout } = useAuth();
    const pathname = usePathname();
    const isDashboard = pathname === '/';
    const [dashHover, setDashHover] = useState(false);

    return (
        <aside
            className="w-[270px] h-screen flex flex-col flex-shrink-0 relative z-20"
            style={{
                background: 'linear-gradient(180deg, #0C0E1A 0%, #0D1020 100%)',
                borderRight: '1px solid rgba(46,207,191,0.08)',
            }}
        >
            {/* Subtle top ambient glow */}
            <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(46,207,191,0.06) 0%, transparent 70%)',
                }} />

            {/* ── Logo ── */}
            <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0 relative z-10"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <AltehaLogo />

                <div>
                    <div className="text-[18px] font-black leading-none"
                        style={{
                            background: 'linear-gradient(90deg, #2ECFBF 0%, #7B5BFF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: 'var(--font-outfit), sans-serif',
                        }}>
                        ALTEHA
                    </div>
                    <div className="text-[9px] font-semibold uppercase mt-0.5 tracking-[0.2em]"
                        style={{ color: 'rgba(46,207,191,0.4)', fontFamily: 'var(--font-inter), sans-serif' }}>
                        Admin Panel
                    </div>
                </div>
            </div>

            {/* ── Dashboard home link ── */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
                <Link href="/"
                    onMouseEnter={() => setDashHover(true)}
                    onMouseLeave={() => setDashHover(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                    style={{
                        background: isDashboard
                            ? 'linear-gradient(90deg, rgba(46,207,191,0.15), rgba(123,91,255,0.08))'
                            : dashHover ? 'rgba(255,255,255,0.04)' : 'transparent',
                        border: isDashboard ? '1px solid rgba(46,207,191,0.2)' : '1px solid transparent',
                    }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                            background: isDashboard
                                ? 'linear-gradient(135deg, rgba(46,207,191,0.25), rgba(123,91,255,0.15))'
                                : 'rgba(255,255,255,0.04)',
                        }}>
                        <LayoutDashboard className="w-3.5 h-3.5"
                            style={{ color: isDashboard ? '#2ECFBF' : '#4A5568' }} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{
                            color: isDashboard ? '#E2E8F0' : '#4A5A72',
                            fontFamily: 'var(--font-outfit), sans-serif',
                        }}>
                        Dashboard General
                    </span>
                    {isDashboard && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: '#2ECFBF', boxShadow: '0 0 6px rgba(46,207,191,0.8)' }} />
                    )}
                </Link>
            </div>

            {/* ── Section divider ── */}
            <div className="mx-4 mb-2" style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

            {/* ── Nav groups ── */}
            <nav className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar relative z-10">
                {navGroups.map(group => (
                    <NavGroupSection key={group.label} group={group} />
                ))}
            </nav>

            {/* ── Bottom: logout ── */}
            <div className="flex-shrink-0 px-3 py-3 relative z-10"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group"
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.07)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.08)' }}>
                        <LogOut className="w-3.5 h-3.5" style={{ color: '#EF4444', opacity: 0.7 }} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: '#3A4A60', fontFamily: 'var(--font-outfit), sans-serif' }}>
                        Cerrar Sesión
                    </span>
                </button>
            </div>
        </aside>
    );
}
