import { useState, useEffect } from 'react';
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
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: any;
    status: 'sent' | 'delivered' | 'read';
}

export const useChat = (auctionId: string, participantA: string, participantB: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // Create a unique chat ID based on auction and sorted participants
    const participants = [participantA, participantB].sort();
    const chatId = `chat_${auctionId}_${participants[0]}_${participants[1]}`;

    useEffect(() => {
        if (!auctionId || !participantA || !participantB) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    const sendMessage = async (text: string, senderId: string, senderName: string) => {
        if (!text.trim()) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        
        // Ensure chat document exists
        await setDoc(doc(db, 'chats', chatId), {
            auctionId,
            participants: [participantA, participantB],
            lastMessage: text,
            lastMessageTime: serverTimestamp()
        }, { merge: true });

        await addDoc(messagesRef, {
            text,
            senderId,
            senderName,
            timestamp: serverTimestamp(),
            status: 'sent'
        });
    };

    return { messages, loading, sendMessage };
};
