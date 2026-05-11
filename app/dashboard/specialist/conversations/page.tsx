"use client";

import React from 'react';
import { ConversationsList } from '@/components/chat/ConversationsList';
import { MessageSquare } from 'lucide-react';

export default function specialistConversationsPage() {
    return (
        <div className="max-w-4xl mx-auto font-outfit pb-20 px-4">
            <div className="mb-10">
                <div className="flex items-center gap-3 text-alteha-violet mb-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Mensajería Directa</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Conversaciones</h1>
                <p className="text-slate-500 font-medium mt-2">Gestiona tus chats con aseguradoras y clínicas asociadas a las subastas.</p>
            </div>

            <ConversationsList role="specialist" />
        </div>
    );
}
