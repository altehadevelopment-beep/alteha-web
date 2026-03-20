"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ArrowLeft, Users, Shield } from 'lucide-react';
import Script from 'next/script';

export default function MeetingPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;
    const [isLoading, setIsLoading] = useState(true);
    const [showSweep, setShowSweep] = useState(false);

    const [isJitsiReady, setIsJitsiReady] = useState(false);
    const jitsiContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Simulating a brief loading state for a smoother transition
        const timer = setTimeout(() => setIsLoading(false), 1500);
        
        // Sweep animation every minute
        const sweepInterval = setInterval(() => {
            setShowSweep(true);
            setTimeout(() => setShowSweep(false), 5000); // Animation duration
        }, 60000);

        return () => {
            clearTimeout(timer);
            clearInterval(sweepInterval);
        };
    }, []);

    const initJitsi = () => {
        if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return;

        const domain = "meet.chanceaapp.com";
        const options = {
            roomName: roomId,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            interfaceConfigOverwrite: {
                // Branding
                SHOW_BRAND_WATERMARK: false,
                DEFAULT_LOGO_URL: '',
                DEFAULT_WELCOME_PAGE_LOGO_URL: '',
                HIDE_DEEP_LINKING_LOGO: true,
                JITSI_WATERMARK_LINK: '',
                DYNAMIC_BRANDING_CONTENT: '',
                BRAND_WATERMARK_LINK: '',
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                
                // UI Elements
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
                SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
                SHOW_CHROME_EXTENSION_BANNER: false,
            },
            configOverwrite: {
                disableDeepLinking: true,
                prejoinPageEnabled: false,
                startWithAudioMuted: true,
                startWithVideoMuted: false,
            },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        api.executeCommand('subject', 'Soporte Alteha');
        
        // Redirect on hangout
        api.addEventListener('videoConferenceLeft', () => {
            router.push('/');
        });
        
        setIsJitsiReady(true);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden relative">
            {/* Header / Branding Bar */}
            <div className="bg-gradient-to-r from-alteha-turquoise to-alteha-violet p-4 flex items-center justify-between text-white shadow-lg z-20">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        title="Volver"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Logo className="w-8 h-8 filter brightness-0 invert" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tight leading-none">Canal de Soporte Humano</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Sesión Segura y Privada</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-300" />
                        <span className="text-xs font-bold uppercase tracking-widest">Encriptado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-300" />
                        <span className="text-xs font-bold uppercase tracking-widest">Multi-persona</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                        Sala: {roomId.substring(0, 8)}...
                    </div>
                </div>
            </div>

            {/* Jitsi Area */}
            <div className="flex-1 bg-slate-900 relative">
                {(isLoading && !isJitsiReady) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900 text-white">
                        <div className="relative mb-8">
                            <Logo className="w-24 h-24 animate-pulse opacity-50" />
                            <div className="absolute inset-0 border-4 border-alteha-turquoise border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="font-bold uppercase tracking-[0.3em] text-alteha-turquoise animate-pulse">Iniciando Videollamada Alteha...</p>
                    </div>
                )}
                
                {/* Floating Sweep Logo (Every 60s) */}
                {showSweep && (
                    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
                        <div className="flex flex-col items-center gap-2 animate-[sweep_5s_ease-in-out_forwards] opacity-0">
                            <Logo className="w-32 h-32 filter brightness-0 invert opacity-20" />
                            <span className="text-white/20 font-black uppercase tracking-[1em] text-xl">Alteha Secure</span>
                        </div>
                    </div>
                )}

                <div 
                    ref={jitsiContainerRef}
                    className="w-full h-full"
                />

                {/* Anti-branding Overlay (Covers Jitsi Logo) */}
                {isJitsiReady && (
                    <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-1000">
                        <Logo className="w-8 h-8 filter brightness-0 invert" />
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white leading-none">Alteha Live</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-alteha-turquoise/80 mt-1">Conexión Segura</span>
                        </div>
                    </div>
                )}

                <Script 
                    src="https://meet.chanceaapp.com/external_api.js" 
                    onLoad={initJitsi}
                    strategy="afterInteractive"
                />
            </div>

            {/* Footer / Branding */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-8 overflow-hidden z-20">
                <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <Logo className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Powered by Alteha Technology</span>
                </div>
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Privacidad Garantizada</span>
                    <span>•</span>
                    <span>Soporte 24/7</span>
                    <span>•</span>
                    <span>Infraestructura Segura</span>
                </div>
            </div>

            <style jsx global>{`
                @keyframes sweep {
                    0% { transform: translateX(-100vw) rotate(-10deg); opacity: 0; }
                    20% { opacity: 0.1; }
                    50% { transform: translateX(0) rotate(0deg); opacity: 0.2; }
                    80% { opacity: 0.1; }
                    100% { transform: translateX(100vw) rotate(10deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
