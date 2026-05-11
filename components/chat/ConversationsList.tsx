"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, User, Search, Loader2, ChevronRight, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useUnreadCount } from '@/hooks/useChat';
import { getDoctorById, getAuctionDetailsAsDoctor } from '@/lib/api';

interface Conversation {
    id: string;
    auctionId: string;
    auctionNumber?: string; // formatted auction number for routing
    participants: string[];
    lastMessage: string;
    lastMessageTime: any;
    lastSenderId: string;
    lastSenderName: string;
}

export const ConversationsList = ({ role }: { role: 'specialist' | 'insurance' | 'clinic' }) => {
    const { userProfile } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeChat, setActiveChat] = useState<{
        auctionId: string;
        auctionNumber?: string;
        participantId: string;
        participantName: string;
        participantPhoto?: string;
    } | null>(null);

    const handleOpenChat = (conv: Conversation, participantId: string, participantName: string, participantPhoto?: string) => {
        setActiveChat({
            auctionId: conv.auctionId,
            auctionNumber: conv.auctionNumber,
            participantId,
            participantName: participantName === 'Cargando...' ? 'Contacto' : participantName,
            participantPhoto
        });
    };

    useEffect(() => {
        if (!userProfile?.id) return;

        const userId = String(userProfile.id);
        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Conversation[];
            setConversations(list);
            setLoading(false);
        }, (error) => {
            console.error("ConversationsList error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile?.id]);

    const filtered = conversations.filter(c => {
        const term = search.toLowerCase();
        return (c.lastMessage || '').toLowerCase().includes(term) ||
               (c.lastSenderName || '').toLowerCase().includes(term) ||
               (c.auctionNumber || '').toLowerCase().includes(term) ||
               (c.auctionId || '').toLowerCase().includes(term);
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-alteha-violet animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando conversaciones...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-alteha-violet transition-colors" />
                <input 
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por mensaje, remitente o subasta..."
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-50 focus:border-alteha-violet rounded-2xl font-bold text-slate-900 transition-all outline-none text-sm shadow-sm"
                />
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100"
                        >
                            <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No se encontraron conversaciones</p>
                        </motion.div>
                    ) : (
                        filtered.map((conv, idx) => {
                            const isMe = conv.lastSenderId === String(userProfile?.id);
                            const dashboardPath = role === 'insurance' ? 'insurance' : (role === 'clinic' ? 'clinic' : 'specialist');
                            
                            return (
                                <ConversationItem 
                                    key={conv.id} 
                                    conv={conv} 
                                    idx={idx} 
                                    userProfile={userProfile} 
                                    role={role}
                                    onOpenChat={(pId, pName, pPhoto) => handleOpenChat(conv, pId, pName, pPhoto)} 
                                />
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            <Modal
                isOpen={!!activeChat}
                onClose={() => setActiveChat(null)}
                title="Mensajería Directa"
                maxWidth="max-w-xl"
            >
                <div className="h-[600px] -m-6">
                    {activeChat && (
                        <ChatWindow 
                            auctionId={activeChat.auctionId}
                            auctionNumber={activeChat.auctionNumber}
                            participantId={activeChat.participantId}
                            participantName={activeChat.participantName}
                            participantPhoto={activeChat.participantPhoto}
                            currentUserId={String(userProfile?.id || 'guest')}
                            currentUserName={userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : (userProfile?.name || 'Usuario')}
                            currentUserPhoto={userProfile?.profileImageUrl || userProfile?.logoUrl || (userProfile as any)?.imageUrl || (userProfile as any)?.avatarUrl}
                            onClose={() => setActiveChat(null)}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};

const ConversationItem = ({ conv, idx, userProfile, role, onOpenChat }: { conv: Conversation; idx: number; userProfile: any; role: string; onOpenChat: (participantId: string, participantName: string, participantPhoto?: string) => void }) => {
    const isMe = conv.lastSenderId === String(userProfile?.id);
    const participantId = conv?.participants?.find(p => p !== String(userProfile?.id)) || conv?.participants?.[0] || conv.lastSenderId || 'unknown';
    
    const [otherName, setOtherName] = useState('Cargando...');
    const [otherPhoto, setOtherPhoto] = useState<string | undefined>();
    
    useEffect(() => {
        let mounted = true;
        const loadParticipantInfo = async () => {
            try {
                // STRATEGY: We already have the other participant's info (name and photo) in the messages they've sent!
                // Instead of relying on potentially missing API endpoints, we can query their latest message in this chat.
                const messagesRef = collection(db, 'chats', conv.id, 'messages');
                const participantMessagesQuery = query(
                    messagesRef, 
                    where('senderId', '==', participantId), 
                    limit(1)
                );
                
                const snapshot = await getDocs(participantMessagesQuery);
                let foundPhoto = null;
                let foundName = null;

                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    if (data.senderPhoto) foundPhoto = data.senderPhoto;
                    if (data.senderName) foundName = data.senderName;
                }

                // If not found in messages, fall back to API
                if (role === 'insurance' || role === 'clinic') {
                    if (foundPhoto && foundName && mounted) {
                        setOtherName(foundName);
                        setOtherPhoto(foundPhoto);
                    } else {
                        const res = await getDoctorById(participantId);
                        const data = res.code === '00' && res.data ? res.data : (res as any).id ? res as any : null;
                        if (data && mounted) {
                            setOtherName(data.fullName || data.name || 'Médico');
                            setOtherPhoto(data.profileImageUrl || data.logoUrl || (data as any).imageUrl);
                        } else if (mounted) {
                            setOtherName('Médico');
                        }
                    }
                } else {
                    if (foundPhoto && foundName && mounted) {
                        setOtherName(foundName);
                        setOtherPhoto(foundPhoto);
                    } else {
                        const auctionRes = await getAuctionDetailsAsDoctor(conv.auctionNumber || conv.auctionId);
                        const auctionData = auctionRes.code === '00' && auctionRes.data ? auctionRes.data : null;
                        if (auctionData?.insuranceCompany && mounted) {
                            setOtherName(auctionData.insuranceCompany.name || 'Compañía de Seguros');
                            setOtherPhoto(auctionData.insuranceCompany.logoUrl || (auctionData.insuranceCompany as any).profileImageUrl || (auctionData.insuranceCompany as any).logo);
                        } else if (mounted) {
                            setOtherName('Compañía de Seguros');
                        }
                    }
                }
            } catch (err) {
                if (mounted) setOtherName('Contacto');
            }
        };
        loadParticipantInfo();
        return () => { mounted = false; };
    }, [participantId, role]);

    // Auto-open chat if navigated from notification
    useEffect(() => {
        if (typeof window !== 'undefined' && otherName !== 'Cargando...') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('openChat') === 'true' && params.get('auctionId') === String(conv.auctionId) && params.get('participantId') === String(participantId)) {
                onOpenChat(participantId, otherName, otherPhoto);
                // Clear the URL so it doesn't reopen on subsequent renders if closed
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [otherName, otherPhoto, participantId, conv.auctionId]);
    
    const unreadCount = useUnreadCount(conv.auctionId, String(userProfile?.id || 'guest'), participantId);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
        >
            <div 
                onClick={() => onOpenChat(participantId, otherName, otherPhoto)}
                className="block p-5 bg-white rounded-3xl border border-slate-50 hover:border-alteha-violet hover:shadow-xl hover:shadow-slate-100 transition-all group cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center text-slate-400 group-hover:shadow-lg transition-all border-2 border-transparent group-hover:border-alteha-violet/20">
                            {otherPhoto ? (
                                <img src={otherPhoto} alt={otherName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-alteha-violet to-alteha-turquoise flex items-center justify-center">
                                    <span className="text-white font-black text-sm">
                                        {otherName !== 'Cargando...' ? otherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
                                    </span>
                                </div>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                            >
                                {unreadCount}
                            </motion.span>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-black text-slate-900 truncate">
                                {otherName}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {conv.lastMessageTime ? format(typeof conv.lastMessageTime?.toMillis === 'function' ? conv.lastMessageTime.toMillis() : new Date(conv.lastMessageTime).getTime(), 'HH:mm', { locale: es }) : ''}
                            </span>
                        </div>
                        
                        <p className={`text-sm truncate mb-2 ${unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
                            {isMe && <span className="font-bold mr-1">Tú:</span>}
                            {conv.lastMessage}
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-md group-hover:bg-alteha-violet/5 group-hover:text-alteha-violet transition-colors">
                                Subasta: {conv.auctionNumber || conv.auctionId}
                            </span>
                        </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-alteha-violet group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </motion.div>
    );
};
