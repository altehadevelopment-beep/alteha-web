import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';

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
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe }) => {
    const time = message.timestamp?.toDate ? format(message.timestamp.toDate(), 'HH:mm', { locale: es }) : '--:--';

    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4 space-y-1`}>
            {!isMe && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1">
                    {message.senderName}
                </span>
            )}
            <div 
                className={`max-w-[80%] px-5 py-3 rounded-[2rem] shadow-sm relative group transition-all ${
                    isMe 
                        ? 'bg-alteha-violet text-white rounded-tr-md' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-md'
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
    );
};
