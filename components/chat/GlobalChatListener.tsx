"use client";

import React, { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';

export const GlobalChatListener = () => {
    const { userProfile, isAuthenticated } = useAuth();
    const router = useRouter();
    const lastNotifiedRef = useRef<Record<string, number>>({});
    const isFirstLoad = useRef(true);
    // Mini-chat flotante que se abre al llegar un mensaje (abajo a la derecha,
    // por encima del chatbot Teha para no taparlo)
    const [floatingChat, setFloatingChat] = React.useState<{
        auctionId: string;
        participantId: string;
        participantName: string;
    } | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !userProfile?.id) return;

        const userId = String(userProfile.id);
        const role = userProfile.role?.toLowerCase() || 'specialist';
        const dashboardPath = role === 'insurance' ? 'insurance' : (role === 'clinic' ? 'clinic' : 'specialist');

        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.lastMessageTime) {
                        lastNotifiedRef.current[doc.id] = data.lastMessageTime.toMillis();
                    }
                });
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified" || change.type === "added") {
                    const data = change.doc.data();
                    const chatId = change.doc.id;
                    const lastTime = data.lastMessageTime?.toMillis() || 0;
                    
                    if (lastTime > (lastNotifiedRef.current[chatId] || 0) && data.lastSenderId !== userId) {
                        lastNotifiedRef.current[chatId] = lastTime;

                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                            audio.play().catch(() => {});
                        } catch (e) {}

                        // Abre el mini-chat flotante con la conversación entrante
                        if (data.auctionId && data.lastSenderId) {
                            setFloatingChat({
                                auctionId: String(data.auctionId),
                                participantId: String(data.lastSenderId),
                                participantName: data.lastSenderName || 'Nuevo mensaje',
                            });
                        } else {
                            toast(data.lastSenderName || "Nuevo Mensaje", {
                                description: data.lastMessage || "Has recibido un nuevo mensaje",
                                icon: <MessageSquare className="w-5 h-5 text-alteha-violet" />,
                                duration: 8000,
                            });
                        }
                    }
                }
            });
        }, (error) => {
            console.error("GlobalChatListener error:", error);
        });

        return () => unsubscribe();
    }, [isAuthenticated, userProfile?.id]);

    if (!floatingChat || !userProfile?.id) return null;

    // Ventana flotante: bottom-28 la deja por encima del chatbot Teha (esquina inferior derecha)
    return (
        <div className="fixed bottom-28 right-4 z-[95] w-[92vw] max-w-[380px] h-[480px] shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
            <ChatWindow
                auctionId={floatingChat.auctionId}
                participantId={floatingChat.participantId}
                participantName={floatingChat.participantName}
                currentUserId={String(userProfile.id)}
                currentUserName={(userProfile as any)?.firstName ? `${(userProfile as any).firstName} ${(userProfile as any).lastName}` : ((userProfile as any)?.name || 'Usuario')}
                currentUserPhoto={(userProfile as any)?.profileImageUrl || (userProfile as any)?.logoUrl}
                onClose={() => setFloatingChat(null)}
            />
        </div>
    );
};
