"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import {
    Bell, Loader2, Inbox, MessageSquare, Gavel, CheckCheck, Circle
} from 'lucide-react';
import { db } from '@/lib/firebase-db';
import { useAuth } from '@/contexts/AuthContext';

type NotificationItem = {
    id: string;
    type: 'INVITATION' | 'CHAT';
    title: string;
    subtitle: string;
    date: Date | null;
    unread: boolean;
    href: string;
};

const READ_KEY = 'alteha_notif_read_v1';

const readSet = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
};
const persistRead = (s: Set<string>) => {
    try { localStorage.setItem(READ_KEY, JSON.stringify([...s].slice(-500))); } catch { /* ignore */ }
};

function timeAgo(date: Date | null): string {
    if (!date) return '';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Hace ${days}d`;
    return date.toLocaleDateString('es-VE');
}

/**
 * Centro de notificaciones (médico y clínica): agrega en un solo lugar las
 * invitaciones a subastas y las conversaciones sin responder, con estado
 * leída / no leída (derivado + marcas locales del usuario).
 */
export default function NotificationsCenter() {
    const { userProfile } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isClinic = pathname?.includes('/clinic') ?? false;
    const base = isClinic ? '/dashboard/clinic' : '/dashboard/specialist';

    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

    useEffect(() => { setReadIds(readSet()); }, []);

    useEffect(() => {
        if (!userProfile?.id) return;
        let active = true;
        (async () => {
            const collected: NotificationItem[] = [];

            // 1) Invitaciones a subastas (dupla): pendiente = no leída
            try {
                const api = await import('@/lib/api');
                const invitations: any[] = isClinic
                    ? await api.getClinicInvitations()
                    : await api.getDoctorDuplaInvitations();
                (invitations || []).forEach((inv: any) => {
                    const who = isClinic ? (inv.doctorName || 'Un médico') : (inv.clinicName || 'Una clínica');
                    collected.push({
                        id: `inv-${inv.id}`,
                        type: 'INVITATION',
                        title: inv.status === 'PENDING'
                            ? `${who} te invitó a una subasta`
                            : `Invitación ${inv.status === 'ACCEPTED' ? 'aceptada' : 'rechazada'}`,
                        subtitle: inv.auctionTitle || `Subasta #${inv.auctionNumber}`,
                        date: inv.invitedAt ? new Date(inv.respondedAt || inv.invitedAt) : null,
                        unread: inv.status === 'PENDING',
                        href: `${base}/invitations`,
                    });
                });
            } catch { /* sin invitaciones */ }

            // 2) Conversaciones: sin responder = el último mensaje no es mío
            try {
                const myId = String(userProfile.id);
                const q = query(
                    collection(db, 'chats'),
                    where('participants', 'array-contains', myId),
                    orderBy('lastMessageTime', 'desc')
                );
                const snap = await getDocs(q);
                snap.docs.slice(0, 30).forEach((doc) => {
                    const c: any = doc.data();
                    const pendingReply = c.lastSenderId && String(c.lastSenderId) !== myId;
                    const when = c.lastMessageTime?.toDate ? c.lastMessageTime.toDate() : (c.lastMessageTime ? new Date(c.lastMessageTime) : null);
                    collected.push({
                        id: `chat-${doc.id}`,
                        type: 'CHAT',
                        title: pendingReply
                            ? `Mensaje sin responder de ${c.lastSenderName || 'un participante'}`
                            : `Conversación con ${c.lastSenderName || 'un participante'}`,
                        subtitle: c.lastMessage || 'Nuevo mensaje',
                        date: when,
                        unread: !!pendingReply,
                        href: `${base}/conversations`,
                    });
                });
            } catch { /* chat no disponible */ }

            if (!active) return;
            collected.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
            setItems(collected);
            setLoading(false);
        })();
        return () => { active = false; };
    }, [userProfile?.id, isClinic, base]);

    const effective = useMemo(
        () => items.map((n) => ({ ...n, unread: n.unread && !readIds.has(n.id) })),
        [items, readIds]
    );
    const unreadCount = effective.filter((n) => n.unread).length;
    const visible = filter === 'UNREAD' ? effective.filter((n) => n.unread) : effective;

    const markAllRead = () => {
        const s = new Set(readIds);
        items.forEach((n) => s.add(n.id));
        setReadIds(s);
        persistRead(s);
    };

    const open = (n: NotificationItem) => {
        const s = new Set(readIds);
        s.add(n.id);
        setReadIds(s);
        persistRead(s);
        router.push(n.href);
    };

    return (
        <div className="space-y-8 font-outfit max-w-3xl mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Bell className="w-8 h-8 text-alteha-turquoise" />
                        Notificaciones
                    </h1>
                    <p className="text-slate-400 text-sm font-medium mt-1">
                        Invitaciones a subastas y conversaciones sin responder, en un solo lugar.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-emerald-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" /> Marcar todas como leídas
                    </button>
                )}
            </header>

            {/* Filtro */}
            <div className="flex items-center gap-2">
                {([['ALL', 'Todas'], ['UNREAD', `No leídas${unreadCount ? ` (${unreadCount})` : ''}`]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${filter === key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : visible.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-16 text-center space-y-3">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-black text-slate-700">
                        {filter === 'UNREAD' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones todavía'}
                    </p>
                    <p className="text-sm text-slate-400">
                        Aquí verás las invitaciones a subastas y los chats que esperan tu respuesta.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => open(n)}
                            className={`w-full text-left flex items-start gap-4 p-5 rounded-[1.75rem] border transition-all hover:shadow-md ${n.unread ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50/60 border-slate-100'}`}
                        >
                            <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${n.type === 'INVITATION' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                                {n.type === 'INVITATION' ? <Gavel className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm ${n.unread ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>{n.title}</p>
                                <p className="text-xs text-slate-400 font-medium truncate">{n.subtitle}</p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{timeAgo(n.date)}</span>
                                {n.unread && <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <p className="text-center">
                <Link href={`${base}/invitations`} className="text-xs font-black text-slate-400 hover:text-emerald-600 underline underline-offset-2">
                    Ir a Invitaciones
                </Link>
                <span className="text-slate-300 mx-2">·</span>
                <Link href={`${base}/conversations`} className="text-xs font-black text-slate-400 hover:text-emerald-600 underline underline-offset-2">
                    Ir a Conversaciones
                </Link>
            </p>
        </div>
    );
}
