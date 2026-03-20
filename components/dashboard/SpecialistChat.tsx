"use client";

import React, { useState } from 'react';
import { 
    Search, 
    MoreVertical, 
    Send, 
    CheckCheck, 
    Phone, 
    Video, 
    Paperclip, 
    Smile,
    Building2,
    Shield,
    Clock,
    Filter,
    Landmark,
    Globe,
    HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';

const dummyChats = [
    {
        id: '1',
        name: 'Seguros Mercantil',
        auctionId: '882',
        auctionTitle: 'Colecistectomía Laparoscópica',
        lastMessage: 'Estimado Dr., hemos recibido los recaudos de la cirugía #882.',
        time: '10:30 AM',
        unread: 2,
        online: true,
        logoIcon: Building2,
        color: 'from-blue-600 to-blue-800',
        messages: [
            { id: 1, text: 'Buen día, Dr. Gómez.', sender: 'them', time: '10:15 AM' },
            { id: 2, text: '¿Podría enviarnos el presupuesto actualizado para el caso #882?', sender: 'them', time: '10:16 AM' },
            { id: 3, text: 'Claro, lo subo por la plataforma de Alteha en un momento.', sender: 'me', time: '10:25 AM' },
            { id: 4, text: 'Estimado Dr., hemos recibido los recaudos de la cirugía #882.', sender: 'them', time: '10:30 AM' },
        ]
    },
    {
        id: '2',
        name: 'Banesco Seguros',
        auctionId: '901',
        auctionTitle: 'Artroscopia de Rodilla',
        lastMessage: '¿Podría confirmarnos su disponibilidad para el lunes 25?',
        time: '9:45 AM',
        unread: 0,
        online: false,
        logoIcon: Shield,
        color: 'from-emerald-600 to-emerald-800',
        messages: [
            { id: 1, text: 'Hola Dr., ¿cómo está? ¿Podría confirmarnos su disponibilidad para el lunes 25?', sender: 'them', time: '9:45 AM' },
        ]
    },
    {
        id: '3',
        name: 'Seguros Caracas',
        auctionId: '775',
        auctionTitle: 'Hernia Inguinal Directa',
        lastMessage: 'El pago de la factura AL-009 ha sido procesado.',
        time: 'Ayer',
        unread: 0,
        online: true,
        logoIcon: Landmark,
        color: 'from-red-600 to-red-800',
        messages: [
            { id: 1, text: 'El pago de la factura AL-009 ha sido procesado exitosamente.', sender: 'them', time: 'Ayer' },
        ]
    },
    {
        id: '4',
        name: 'Mapfre',
        auctionId: '1024',
        auctionTitle: 'Apendicectomía Emergencia',
        lastMessage: 'Bienvenido a la red de especialistas de Alteha.',
        time: 'Lunes',
        unread: 0,
        online: false,
        logoIcon: Globe,
        color: 'from-red-700 to-red-900',
        messages: [
            { id: 1, text: 'Bienvenido a la red de especialistas de Alteha.', sender: 'them', time: 'Lunes' },
        ]
    },
    {
        id: '5',
        name: 'Hispana de Seguros',
        auctionId: '664',
        auctionTitle: 'Maternidad y Parto',
        lastMessage: 'Solicitud de baremo para neurocirugía.',
        time: '20 Mar',
        unread: 0,
        online: true,
        logoIcon: HeartPulse,
        color: 'from-orange-500 to-orange-700',
        messages: [
            { id: 1, text: 'Solicitud de baremo para neurocirugía.', sender: 'them', time: '20 Mar' },
        ]
    }
];

export default function SpecialistChat() {
    const [chats, setChats] = useState(dummyChats);
    const [selectedChatId, setSelectedChatId] = useState(dummyChats[0].id);
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const selectedChat = chats.find(c => c.id === selectedChatId) || chats[0];

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        const newMessage = {
            id: Date.now(),
            text: messageInput,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedChats = chats.map(chat => {
            if (chat.id === selectedChatId) {
                return {
                    ...chat,
                    messages: [...chat.messages, newMessage],
                    lastMessage: messageInput,
                    time: 'Ahora'
                };
            }
            return chat;
        });

        setChats(updatedChats);
        setMessageInput('');

        // Simulate response
        setIsTyping(true);
        setTimeout(() => {
            const responseMessage = {
                id: Date.now() + 1,
                text: "Entendido, Dr. Estamos procesando la información. Le avisaremos en breve.",
                sender: 'them',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            setChats(prevChats => prevChats.map(chat => {
                if (chat.id === selectedChatId) {
                    return {
                        ...chat,
                        messages: [...chat.messages, responseMessage],
                        lastMessage: responseMessage.text,
                        time: 'Ahora'
                    };
                }
                return chat;
            }));
            setIsTyping(false);
        }, 2000);
    };

    const handleVideoCall = () => {
        window.open(`/dashboard/meet/${selectedChat.auctionId}`, '_blank');
    };

    const handleAudioCall = () => {
        alert(`Iniciando llamada de audio con ${selectedChat.name}...`);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-96 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chats</h2>
                        <button className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                            <Filter className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Buscar aseguradora..." 
                            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-alteha-turquoise/10 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2">
                    {dummyChats.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300",
                                selectedChat.id === chat.id 
                                    ? "bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100" 
                                    : "hover:bg-white/60"
                            )}
                        >
                            <div className="relative group">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 bg-gradient-to-br", 
                                    chat.color
                                )}>
                                    <chat.logoIcon className="w-8 h-8 opacity-90 drop-shadow-md" />
                                </div>
                                {chat.online && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-50 rounded-full" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-800 truncate">{chat.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{chat.time}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="px-2 py-0.5 bg-alteha-turquoise/10 text-alteha-turquoise text-[9px] font-black rounded-full uppercase">
                                        Subasta #{chat.auctionId}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate">{chat.auctionTitle}</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate font-medium">{chat.lastMessage}</p>
                            </div>
                            {chat.unread > 0 && (
                                <div className="w-5 h-5 bg-alteha-turquoise text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-alteha-turquoise/30">
                                    {chat.unread}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br", 
                            selectedChat.color
                        )}>
                            <selectedChat.logoIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-800 tracking-tight">{selectedChat.name}</h3>
                                <span className="px-2 py-0.5 bg-alteha-turquoise text-white text-[9px] font-black rounded-full uppercase">
                                    Subasta #{selectedChat.auctionId}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", selectedChat.online ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {selectedChat.auctionTitle}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleAudioCall} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-alteha-turquoise transition-colors">
                            <Phone className="w-5 h-5" />
                        </button>
                        <button onClick={handleVideoCall} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-alteha-turquoise transition-colors">
                            <Video className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-alteha-turquoise transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                    <div className="flex justify-center">
                        <div className="bg-white border border-slate-100 px-4 py-2 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                            Hoy, {new Date().toLocaleDateString('es-VE', { month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    {selectedChat.messages.map((msg) => (
                        <div 
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[70%]",
                                msg.sender === 'me' ? "ml-auto items-end" : "items-start"
                            )}
                        >
                            <div className={cn(
                                "p-4 rounded-3xl text-sm font-medium shadow-sm transition-all hover:shadow-md",
                                msg.sender === 'me' 
                                    ? "bg-alteha-turquoise text-white rounded-tr-none" 
                                    : "bg-white text-slate-600 border border-slate-100 rounded-tl-none shadow-slate-200/50"
                            )}>
                                {msg.text}
                            </div>
                            <div className="flex items-center gap-1 mt-2 px-2">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{msg.time}</span>
                                {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-alteha-turquoise" />}
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex flex-col max-w-[70%] items-start animate-in fade-in zoom-in duration-300">
                            <div className="p-4 bg-white text-slate-600 border border-slate-100 rounded-3xl rounded-tl-none shadow-sm shadow-slate-200/50 flex gap-1.5 items-center h-[52px]">
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-slate-50">
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
                        <button onClick={() => alert('Selector de emojis en desarrollo.')} className="p-3 text-slate-400 hover:text-alteha-turquoise transition-colors">
                            <Smile className="w-6 h-6" />
                        </button>
                        <button onClick={() => alert('Función de adjuntar archivos en desarrollo.')} className="p-3 text-slate-400 hover:text-alteha-turquoise transition-colors">
                            <Paperclip className="w-6 h-6" />
                        </button>
                        <input 
                            type="text" 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Escribe un mensaje a la aseguradora..." 
                            className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                        />
                        <button 
                            onClick={handleSendMessage}
                            className="w-12 h-12 bg-alteha-turquoise text-white rounded-2xl flex items-center justify-center shadow-lg shadow-alteha-turquoise/30 hover:scale-105 transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Sidebar (Right) */}
            <div className="hidden xl:flex w-80 border-l border-slate-100 flex-col p-8 bg-slate-50/50">
                <div className="flex flex-col items-center text-center space-y-6 pt-4">
                    <div className={cn(
                        "w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-2xl bg-gradient-to-br scale-110", 
                        selectedChat.color
                    )}>
                        <selectedChat.logoIcon className="w-14 h-14 opacity-90" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">{selectedChat.name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Empresa de Seguros</p>
                    </div>
                </div>

                <div className="mt-12 space-y-8">
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Detalles Corporativos</h5>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Building2 className="w-5 h-5 text-alteha-turquoise" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RIF</span>
                                    <span className="text-xs font-bold text-slate-700 uppercase">J-00000000-1</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Shield className="w-5 h-5 text-alteha-turquoise" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status en Alteha</span>
                                    <span className="text-xs font-bold text-slate-700 uppercase">Verificado</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Clock className="w-5 h-5 text-alteha-turquoise" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Respuesta Promedio</span>
                                    <span className="text-xs font-bold text-slate-700 uppercase">15 min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-auto">
                    <button className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
                        Bloquear Aseguradora
                    </button>
                </div>
            </div>
        </div>
    );
}
