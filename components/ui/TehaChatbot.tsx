"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2, Headset } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { TEHA_SYSTEM_PROMPT, TEHA_GREETINGS } from '@/lib/teha-persona';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function TehaChatbot() {
    const { userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [shouldSpeak, setShouldSpeak] = useState(true);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

    // Initialize initial message on mount or when opening
    const initChat = useCallback(() => {
        const randomGreeting = TEHA_GREETINGS[Math.floor(Math.random() * TEHA_GREETINGS.length)];
        const initialMsg: Message = {
            id: '1',
            role: 'assistant',
            content: randomGreeting,
            timestamp: new Date()
        };
        setMessages([initialMsg]);
        
        // Auto-speak the greeting after a short delay to ensure voice is ready
        setTimeout(() => {
            speak(randomGreeting);
        }, 500);
    }, [voice]);

    const handleTalkToHuman = () => {
        const roomId = `alteha-support-${Math.random().toString(36).substring(2, 10)}`;
        window.open(`/meet/${roomId}`, '_blank');
    };

    // Handle opening/closing
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            initChat();
        } else if (isOpen && messages.length > 0) {
            // If already has messages, maybe just greet again or stay silent?
            // The user said "cada vez que se le da click", so let's refresh greeting if it's been a while or just always.
            // Let's go with always refreshing for now as requested.
            initChat();
        }
    }, [isOpen]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'es-VE'; // Venezuelan Spanish

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript);
                setIsRecording(false);
            };

            recognitionRef.current.onerror = () => {
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
        
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
            
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                // Priority for Natural/Neural appearing Spanish Female voices (Latin American/Mexico/US)
                const femaleVoice = 
                    voices.find((v: SpeechSynthesisVoice) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural')) && (v.lang.startsWith('es-MX') || v.lang.startsWith('es-US') || v.lang.startsWith('es-VE')) && (v.name.includes('Female') || v.name.includes('femenino'))) ||
                    voices.find((v: SpeechSynthesisVoice) => (v.name.includes('Monica') || v.name.includes('Paulina') || v.name.includes('Paloma')) && (v.lang.startsWith('es-MX') || v.lang.startsWith('es-US'))) ||
                    voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('es-MX') || v.lang.startsWith('es-US') || v.lang.startsWith('es-VE')) ||
                    voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('es') && (v.name.includes('Female') || v.name.includes('femenino') || v.name.includes('Google'))) ||
                    voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('es'));
                
                if (femaleVoice) setVoice(femaleVoice);
            };

            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    // Stop speaking when muting or closing
    useEffect(() => {
        if (!shouldSpeak || !isOpen) {
            stopSpeaking();
        } else if (shouldSpeak && isOpen && messages.length > 0) {
            // Re-speak last assistant message if unmuted
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant' && !isSpeaking) {
                speak(lastMsg.content);
            }
        }
    }, [shouldSpeak, isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    const speak = (text: string) => {
        if (!shouldSpeak || !synthRef.current) return;
        
        // Stop any current speech and RECOGNITION to prevent loop
        stopSpeaking();
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }

        // Audio Cleaning: Remove markdown, symbols and expand abbreviations
        const cleanText = text
            .replace(/\*\*/g, '') // Remove bold
            .replace(/\*/g, '')   // Remove asterisks
            .replace(/#/g, '')    // Remove hashtags
            .replace(/Usdt/gi, 'U S D T')
            .replace(/Bs/gi, 'Bolívares')
            .replace(/\bUSD\b/gi, 'Dólares')
            .replace(/\bk\b/g, ' mil ')
            .replace(/\./g, ' . ') // Add space around dots for better pacing
            .replace(/,/g, ' , '); // Add space around commas

        // Phonetic fix: "Alteha" -> "Altea" for better pronunciation
        const phoneticText = cleanText.replace(/Alteha/gi, 'Altea').replace(/Teha/gi, 'Tea');
        
        const utterance = new SpeechSynthesisUtterance(phoneticText);
        utterance.lang = voice?.lang || 'es-MX'; // Prefer MX over generic for a Latin vibe if VE is missing
        utterance.rate = 1.08; // Slightly faster for a natural, active vibe
        utterance.pitch = 1.2; // Natural high pitch for a younger female voice
        utterance.volume = 1;
        
        if (voice) {
            utterance.voice = voice;
        } else {
            // Fallback voice search if state not populated
            const voices = synthRef.current.getVoices();
            const fallbackVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('es') && (v.name.includes('Female') || v.name.includes('femenino') || v.name.includes('Monica')));
            if (fallbackVoice) utterance.voice = fallbackVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        synthRef.current.speak(utterance);
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        const currentMessages = [...messages, userMsg];
        setMessages(currentMessages);
        setInput('');
        setIsThinking(true);
        stopSpeaking(); // Ensure silence while thinking

        // Check for human escalation keyword triggers first
        const lowerText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isHumano = lowerText.includes('humano') || lowerText.includes('persona') || lowerText.includes('soporte') || lowerText.includes('ayuda');

        if (isHumano) {
            setTimeout(() => {
                const roomId = `alteha-support-${Math.random().toString(36).substring(2, 10)}`;
                const resp = `¡Claro! Entiendo que prefieres hablar con una persona. He activado un canal de soporte por video para ti. Puedes unirte haciendo clic en el botón "Hablar con un Humano" arriba a la derecha, o simplemente usa este enlace para entrar a nuestra sala privada de Alteha Meet: https://meet.chanceaapp.com/${roomId}`;
                
                const assistantMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: resp,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, assistantMsg]);
                setIsThinking(false);
                speak(resp);
            }, 1000);
            return;
        }

        try {
            const response = await fetch('/api/teha/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: currentMessages,
                    userProfile: userProfile 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await response.json();
            const resp = data.content;

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: resp,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMsg]);
            setIsThinking(false);
            speak(resp);
        } catch (error: any) {
            console.error('Chat Error:', error);
            const errorMsg = `Error: ${error.message || 'Error desconocido'}. ¿Podrías intentar de nuevo o usar el botón de soporte humano?`;
            
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: errorMsg,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMsg]);
            setIsThinking(false);
            speak("Hubo un error en la conexión.");
        }
    };

    const toggleRecording = () => {
        if (isSpeaking) return; // Prevent loop
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            setIsRecording(true);
            recognitionRef.current?.start();
        }
    };
    return (
        <div className="fixed bottom-6 right-6 z-50 font-outfit">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="w-full max-w-6xl h-full max-h-[900px] bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/20 flex overflow-hidden relative"
                        >
                            {/* Left Side: Teha Persona & Info */}
                            <div className="hidden lg:flex w-1/3 bg-gradient-to-br from-alteha-turquoise to-alteha-violet p-12 flex-col justify-between text-white relative">
                                <div className="absolute inset-0 opacity-10">
                                    <Sparkles className="w-full h-full scale-150 animate-pulse" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-white/20 shadow-2xl bg-slate-900 flex items-center justify-center">
                                        {isSpeaking ? (
                                            <video 
                                                src="/images/Video_de_avatar_animado_sin_acción.mp4"
                                                autoPlay 
                                                loop 
                                                muted 
                                                playsInline
                                                className="w-full h-full object-cover object-top scale-110"
                                            />
                                        ) : (
                                            <img 
                                                src="/tita-avatar.png"
                                                alt="Teha Avatar"
                                                className="w-full h-full object-cover object-top scale-110"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight">Soy Teha</h2>
                                        <p className="text-white/80 font-medium mt-2">Tu asistente inteligente de Alteha</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 pt-4">
                                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">IA Avanzada</span>
                                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">Ecosistema Alteha</span>
                                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">Soporte 24/7</span>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-6 bg-black/10 p-6 rounded-[2rem] backdrop-blur-sm">
                                    <p className="text-sm leading-relaxed italic opacity-90">
                                        &quot;Mi objetivo es garantizar que tu experiencia en el ecosistema médico de Alteha sea fluida, transparente y automatizada.&quot;
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sistema Operativo</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Chat Interface */}
                            <div className="flex-1 flex flex-col bg-slate-50 relative">
                                {/* Chat Header */}
                                <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="lg:hidden w-12 h-12 rounded-full overflow-hidden border-2 border-alteha-turquoise shadow-md bg-slate-900 flex items-center justify-center">
                                            {isSpeaking ? (
                                                <video 
                                                    src="/images/Video_de_avatar_animado_sin_acción.mp4"
                                                    autoPlay 
                                                    loop 
                                                    muted 
                                                    playsInline
                                                    className="w-full h-full object-cover object-top scale-110"
                                                />
                                            ) : (
                                                <img 
                                                    src="/tita-avatar.png"
                                                    alt="Teha Avatar"
                                                    className="w-full h-full object-cover object-top scale-110"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-800 tracking-tight">Atención al Cliente</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sesión encriptada de alta seguridad</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={handleTalkToHuman}
                                            className="hidden sm:flex p-3 bg-alteha-turquoise text-white rounded-2xl transition-all shadow-lg hover:shadow-alteha-turquoise/30 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest animate-pulse"
                                        >
                                            <Headset className="w-5 h-5" />
                                            <span>Hablar con un Humano</span>
                                        </button>
                                        <button 
                                            onClick={() => setShouldSpeak(!shouldSpeak)}
                                            className={cn(
                                                "p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase tracking-widest",
                                                shouldSpeak ? "bg-alteha-turquoise/10 text-alteha-turquoise" : "bg-slate-100 text-slate-400"
                                            )}
                                        >
                                            {shouldSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                            <span className="hidden sm:inline">{shouldSpeak ? "Audio On" : "Audio Off"}</span>
                                        </button>
                                        <button 
                                            onClick={() => setIsOpen(false)}
                                            className="p-3 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div 
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
                                >
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className={cn(
                                                "flex gap-4 max-w-[90%]",
                                                msg.role === 'user' ? "ml-auto flex-row-reverse items-end" : "mr-auto flex-row items-start"
                                            )}
                                        >
                                            {msg.role === 'assistant' && (
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-xl mt-1 ring-2 ring-alteha-turquoise/20 bg-slate-100 flex items-center justify-center">
                                                    <img src="/tita-avatar.png" alt="Teha" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex flex-col space-y-2">
                                                <div className={cn(
                                                    "p-5 rounded-[2rem] text-sm md:text-base font-medium shadow-sm leading-relaxed",
                                                    msg.role === 'user' 
                                                        ? "bg-alteha-violet text-white rounded-tr-none shadow-alteha-violet/20" 
                                                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-xl shadow-slate-200/50"
                                                )}>
                                                    {msg.content}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black text-slate-300 uppercase tracking-widest px-2",
                                                    msg.role === 'user' ? "text-right" : "text-left"
                                                )}>
                                                    {msg.role === 'user' ? "Tú" : "Teha AI"} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isThinking && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-4 text-alteha-turquoise font-black uppercase tracking-[0.2em] text-[10px] bg-alteha-turquoise/5 p-4 rounded-2xl w-fit"
                                        >
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Teha está pensando...
                                        </motion.div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-8 bg-white border-t border-slate-100">
                                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                                        <button
                                            onClick={toggleRecording}
                                            disabled={isSpeaking}
                                            className={cn(
                                                "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-xl relative group",
                                                isRecording 
                                                    ? "bg-red-500 text-white animate-pulse" 
                                                    : (isSpeaking ? "bg-slate-50 text-slate-200 cursor-not-allowed" : "bg-slate-100 text-slate-400 hover:bg-alteha-turquoise/10 hover:text-alteha-turquoise")
                                            )}
                                        >
                                            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                            {isRecording && (
                                                <div className="absolute -inset-2 rounded-[2rem] border-4 border-red-500/20 animate-ping" />
                                            )}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl">
                                                {isSpeaking ? "Espere que Teha termine" : "Comando de Voz"}
                                            </div>
                                        </button>

                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder="¿En qué puedo ayudarte en relación al ecosistema Alteha?"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] py-5 px-8 text-base font-medium focus:ring-4 focus:ring-alteha-turquoise/10 focus:border-alteha-turquoise outline-none transition-all shadow-inner"
                                            />
                                            <button
                                                onClick={() => handleSend()}
                                                disabled={!input.trim()}
                                                className="absolute right-3 top-2.5 w-12 h-12 flex items-center justify-center bg-alteha-turquoise text-white rounded-2xl transition-all shadow-lg hover:shadow-alteha-turquoise/30 disabled:opacity-30 disabled:bg-slate-300"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-center gap-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                                        <span>Seguridad Bancaria</span>
                                        <span>•</span>
                                        <span>Garantía Alteha</span>
                                        <span>•</span>
                                        <span>Soporte Médico Especializado</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Floating Toggle Button (Always Avatar) */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all relative group overflow-hidden border-4 border-white z-50 bg-slate-900",
                    isOpen ? "bg-white text-alteha-violet rotate-90" : "bg-gradient-to-tr from-alteha-turquoise to-alteha-violet text-white"
                )}
            >
                {isOpen ? (
                    <X className="w-8 h-8" />
                ) : (
                    <img 
                        src="/tita-avatar.png"
                        alt="Teha Avatar"
                        className="w-full h-full object-cover object-top scale-110"
                    />
                )}
                {!isOpen && (
                    <div className="absolute top-0 right-0 w-5 h-5 bg-emerald-400 border-4 border-white rounded-full animate-bounce" />
                )}
                <div className="absolute right-24 bg-white text-slate-800 px-6 py-3 rounded-2xl text-sm font-black opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 pointer-events-none whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-slate-100 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ¡Hola! Soy Teha. ¿Hablamos?
                </div>
            </motion.button>
        </div>
    );
}
