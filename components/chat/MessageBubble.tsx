import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, CheckCheck, User } from 'lucide-react';

interface MessageBubbleProps {
    message: {
        id: string;
        text: string;
        senderId: string;
        senderName: string;
        timestamp: any;
        status?: 'sent' | 'delivered' | 'read';
    };
    isMe: boolean;
    fallbackPhoto?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, fallbackPhoto }) => {
    const time = message.timestamp?.toDate ? format(message.timestamp.toDate(), 'HH:mm', { locale: es }) : '--:--';
    const photoToShow = message.senderPhoto || fallbackPhoto;

    return (
        <div className={`flex gap-3 mb-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
                <div className={`w-8 h-8 rounded-xl overflow-hidden shadow-sm border ${isMe ? 'border-alteha-violet/20' : 'border-slate-100'}`}>
                    {photoToShow ? (
                        <img src={photoToShow} alt={message.senderName} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isMe ? 'bg-alteha-violet text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <User className="w-4 h-4" />
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] space-y-1`}>
                {!isMe && (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                        {message.senderName}
                    </span>
                )}
                <div 
                    className={`px-5 py-3 rounded-[1.5rem] shadow-sm relative group transition-all ${
                        isMe 
                            ? 'bg-alteha-violet text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}
                >
                    <p className="text-sm font-medium leading-relaxed">
                        {message.text}
                    </p>
                    <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] font-bold ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                            {time}
                        </span>
                        {isMe && (
                            <div className="text-white/80">
                                {message.status === 'read' ? (
                                    <CheckCheck className="w-3 h-3 text-alteha-turquoise" />
                                ) : (
                                    <Check className="w-3 h-3" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
