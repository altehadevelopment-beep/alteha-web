import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, MessageSquare, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/Button';

import { useChat } from '@/hooks/useChat';

interface ChatWindowProps {
    auctionId: string;
    participantId: string; // The person I'm talking to
    participantName: string;
    currentUserId: string;
    currentUserName: string;
    onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    auctionId,
    participantId,
    participantName,
    currentUserId,
    currentUserName,
    onClose
}) => {
    const [inputText, setInputText] = useState('');
    const { messages, loading, sendMessage } = useChat(auctionId, currentUserId, participantId);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText(''); // Clear input immediately for better UX
        
        try {
            await sendMessage(text, currentUserId, currentUserName);
        } catch (err) {
            console.error('Error sending message:', err);
            // Optional: Show error toast
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-2xl">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-alteha-violet/10 flex items-center justify-center border border-alteha-violet/20">
                        <User className="w-5 h-5 text-alteha-violet" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 leading-tight">{participantName}</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En línea</span>
                        </div>
                    </div>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-hide bg-pattern"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                            <MessageSquare className="w-8 h-8 text-alteha-violet/20" />
                        </div>
                        <h5 className="font-black text-slate-400 text-sm uppercase tracking-widest mb-2">Comienza la conversación</h5>
                        <p className="text-xs text-slate-400 font-medium max-w-[200px]">
                            Escribe un mensaje para resolver dudas sobre esta subasta.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble 
                            key={msg.id} 
                            message={msg} 
                            isMe={msg.senderId === currentUserId} 
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form 
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-alteha-violet/30 transition-all"
                >
                    <button 
                        type="button"
                        className="p-2 text-slate-400 hover:text-alteha-violet transition-colors"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input 
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                    />
                    <Button 
                        type="submit"
                        disabled={!inputText.trim()}
                        className="bg-alteha-violet text-white w-10 h-10 rounded-full flex items-center justify-center p-0 shadow-lg shadow-violet-100 hover:scale-105 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
