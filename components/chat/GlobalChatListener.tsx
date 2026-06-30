"use client";

import React, { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export const GlobalChatListener = () => {
    const { userProfile, isAuthenticated } = useAuth();
    const router = useRouter();
    const lastNotifiedRef = useRef<Record<string, number>>({});
    const isFirstLoad = useRef(true);

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

                        toast(data.lastSenderName || "Nuevo Mensaje", {
                            description: data.lastMessage || "Has recibido un nuevo mensaje",
                            icon: <MessageSquare className="w-5 h-5 text-alteha-violet" />,
                            duration: 8000,
                            action: {
                                label: 'Ir al Chat',
                                onClick: () => {
                                    if (data.auctionId) {
                                        router.push(`/dashboard/${dashboardPath}/conversations?openChat=true&auctionId=${data.auctionId}&participantId=${data.lastSenderId}`);
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }, (error) => {
            console.error("GlobalChatListener error:", error);
        });

        return () => unsubscribe();
    }, [isAuthenticated, userProfile?.id]);

    return null; // This component doesn't render anything
};
