import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, MessageSquare, Loader2, User, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ChatWindowProps {
    auctionId: string;
    auctionNumber?: string; // formatted number for routing (e.g. "AUC-2024-001")
    participantId: string;
    participantName: string;
    participantPhoto?: string;
    participantProfileUrl?: string; // when set, the detail modal shows a "Ver perfil completo" link
    currentUserId: string;
    currentUserName: string;
    currentUserPhoto?: string;
    onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    auctionId,
    auctionNumber,
    participantId,
    participantName,
    participantPhoto,
    participantProfileUrl,
    currentUserId,
    currentUserName,
    currentUserPhoto,
    onClose
}) => {
    const [inputText, setInputText] = useState('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const { messages, loading, sendMessage, markAsRead } = useChat(auctionId, currentUserId, participantId, auctionNumber);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { userProfile } = useAuth();
    const router = useRouter();

    const role = userProfile?.role?.toLowerCase() || 'specialist';
    const dashboardPath = role === 'insurance' ? 'insurance' : (role === 'clinic' ? 'clinic' : 'specialist');

    const handleViewAuction = () => {
        router.push(`/dashboard/${dashboardPath}/auctions/${auctionNumber || auctionId}`);
        if (onClose) onClose();
    };

    // Mark as read when messages change
    useEffect(() => {
        if (!loading && messages.length > 0) {
            markAsRead();
        }
    }, [messages, loading]);

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
            await sendMessage(text, currentUserId, currentUserName, currentUserPhoto);
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Error al enviar el mensaje. Verifique su conexión.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-2xl font-outfit">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                <div 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setIsProfileModalOpen(true)}
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-white group-hover:scale-105 transition-transform">
                            {participantPhoto ? (
                                <img 
                                    src={participantPhoto} 
                                    alt={participantName} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // On broken image, replace with initials
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && !parent.querySelector('.initials-fallback')) {
                                            const initials = participantName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                            const div = document.createElement('div');
                                            div.className = 'initials-fallback w-full h-full bg-gradient-to-br from-alteha-violet to-alteha-turquoise flex items-center justify-center text-white font-black text-sm';
                                            div.textContent = initials;
                                            parent.appendChild(div);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-alteha-violet to-alteha-turquoise flex items-center justify-center">
                                    <span className="text-white font-black text-sm">
                                        {participantName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 leading-tight group-hover:text-alteha-violet transition-colors">{participantName}</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ver perfil del profesional</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-hide bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]"
            >
                {/* Auction Summary Banner */}
                <div className="mb-6 bg-white/80 backdrop-blur-md rounded-2xl border border-alteha-violet/20 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-alteha-violet/10 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-alteha-violet" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencia del Chat</p>
                            <p className="text-sm font-bold text-slate-900">Subasta #{auctionNumber || auctionId}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleViewAuction}
                        className="bg-alteha-violet/10 text-alteha-violet hover:bg-alteha-violet hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Ver Subasta
                    </Button>
                </div>

                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-4">
                            <Loader2 className="w-6 h-6 text-alteha-violet animate-spin" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando mensajes...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl mb-6"
                        >
                            <MessageSquare className="w-10 h-10 text-alteha-violet/20" />
                        </motion.div>
                        <h5 className="font-black text-slate-400 text-sm uppercase tracking-widest mb-2">Comienza la conversación</h5>
                        <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                            Escribe un mensaje para resolver dudas o coordinar logística.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <MessageBubble 
                                    message={msg} 
                                    isMe={msg.senderId === currentUserId} 
                                    fallbackPhoto={msg.senderId === currentUserId ? currentUserPhoto : participantPhoto}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white/80 backdrop-blur-md border-t border-slate-100">
                <form 
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-alteha-violet/30 focus-within:bg-white focus-within:shadow-lg transition-all duration-300"
                >
                    <button 
                        type="button"
                        className="p-2.5 text-slate-400 hover:text-alteha-violet hover:bg-white rounded-full transition-all"
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
                        className="bg-alteha-violet text-white w-12 h-12 rounded-full flex items-center justify-center p-0 shadow-xl shadow-violet-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>

            {/* Profile Detail Modal */}
            <AnimatePresence>
                {isProfileModalOpen && (
                    <Modal 
                        isOpen={isProfileModalOpen} 
                        onClose={() => setIsProfileModalOpen(false)}
                        title="Detalle del Participante"
                    >
                        <div className="p-8 text-center space-y-6">
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden mx-auto shadow-2xl border-4 border-white">
                                {participantPhoto ? (
                                    <img src={participantPhoto} alt={participantName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                        <User className="w-12 h-12 text-slate-300" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{participantName}</h3>
                                <p className="text-alteha-violet font-black text-xs uppercase tracking-widest mt-1">Participante de la Subasta</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-left space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Loader2 className="w-5 h-5 text-alteha-violet" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID de Referencia</p>
                                        <p className="text-sm font-bold text-slate-700">#{participantId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <MessageSquare className="w-5 h-5 text-alteha-turquoise" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                                        <p className="text-sm font-bold text-slate-700">Canal de comunicación activo</p>
                                    </div>
                                </div>
                            </div>
                            {participantProfileUrl && (
                                <a
                                    href={participantProfileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-alteha-violet text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
                                >
                                    Ver perfil completo <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                            <Button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs"
                            >
                                Volver al Chat
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};
