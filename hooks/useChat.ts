import React, { useState, useEffect, useRef } from 'react';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    serverTimestamp,
    doc,
    setDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    timestamp: any;
    status: 'sent' | 'delivered' | 'read';
}

export const useChat = (auctionId: string, participantA: string, participantB: string, auctionNumber?: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // Create a unique chat ID based on auction and sorted participants
    const participants = [String(participantA), String(participantB)].sort();
    const chatId = `chat_${auctionId}_${participants[0]}_${participants[1]}`;
    
    // Debug log to ensure both sides use the same chatId
    // console.log("Chat initialized:", { chatId, auctionId, participantA, participantB });

    useEffect(() => {
        if (!auctionId || !participantA || !participantB || participantA === 'undefined' || participantB === 'undefined' || auctionId === 'undefined') {
            console.warn("useChat: Missing or invalid IDs, skipping snapshot.", { auctionId, participantA, participantB });
            setLoading(false);
            return;
        }

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        // Safety timeout for loading state
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        let firstLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            clearTimeout(timeout);
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            
            // Sound notification for new messages
            if (!firstLoad && snapshot.docChanges().length > 0) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        if (data.senderId !== String(participantA)) {
                            try {
                                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                                audio.play().catch(e => console.log("Audio play blocked by browser"));
                            } catch (err) {
                                console.error("Error playing notification sound:", err);
                            }
                        }
                    }
                });
            }

            setMessages(msgs);
            setLoading(false);
            firstLoad = false;
        }, (error) => {
            clearTimeout(timeout);
            console.error("Firestore onSnapshot error:", error);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, [chatId, participantA]);

    const sendMessage = async (text: string, senderId: string, senderName: string, senderPhoto?: string) => {
        if (!text.trim()) return;

        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            
            // Ensure chat document exists
            await setDoc(doc(db, 'chats', chatId), {
                auctionId,
                auctionNumber: auctionNumber || auctionId, // store formatted number for routing
                participants: [String(participantA), String(participantB)],
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                lastSenderId: String(senderId),
                lastSenderName: String(senderName)
            }, { merge: true });

            await addDoc(messagesRef, {
                text,
                senderId: String(senderId),
                senderName: String(senderName),
                senderPhoto: senderPhoto || null,
                timestamp: serverTimestamp(),
                status: 'sent'
            });
        } catch (error) {
            console.error("Error sending message to Firestore:", error);
            throw error; // Re-throw to handle in UI if needed
        }
    };

    const markAsRead = async () => {
        const unreadMessages = messages.filter(m => m.senderId !== String(participantA) && m.status !== 'read');
        if (unreadMessages.length === 0) return;

        try {
            const batch = writeBatch(db);
            unreadMessages.forEach(m => {
                batch.update(doc(db, 'chats', chatId, 'messages', m.id), { status: 'read' });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    return { messages, loading, sendMessage, markAsRead };
};

// New hook for global notifications or specific chat status
export const useUnreadCount = (auctionId: string, currentUserId: string, participantId: string) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const prevUnreadCountRef = React.useRef(0);
    const participants = [String(currentUserId), String(participantId)].sort();
    const chatId = `chat_${auctionId}_${participants[0]}_${participants[1]}`;

    useEffect(() => {
        if (!auctionId || !currentUserId || !participantId || currentUserId === 'undefined' || participantId === 'undefined') return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(
            messagesRef, 
            where('status', 'in', ['sent', 'delivered'])
        );

        let isFirstLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const unread = snapshot.docs.filter(doc => doc.data().senderId !== String(currentUserId)).length;
            
            // Play sound if new unread messages arrive
            if (!isFirstLoad && unread > prevUnreadCountRef.current) {
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                    audio.play().catch(e => console.log("Audio play blocked by browser"));
                } catch (err) {
                    console.error("Error playing notification sound:", err);
                }
            }

            prevUnreadCountRef.current = unread;
            setUnreadCount(unread);
            isFirstLoad = false;
        }, (error) => {
            console.error("Error fetching unread count:", error);
        });

        return () => unsubscribe();
    }, [chatId, currentUserId]);

    return unreadCount;
};
