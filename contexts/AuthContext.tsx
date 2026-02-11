"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authenticate as apiAuthenticate, storeToken, clearToken, getStoredToken, type AuthResponse } from '@/lib/api';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string, password: string, role?: string, captchaToken?: string) => Promise<AuthResponse>;
    logout: () => void;
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: async () => ({ code: '', message: '' }),
    logout: () => { },
    token: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const pathname = usePathname();
    const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
    const SESSION_TIMEOUT = process.env.NEXT_PUBLIC_SESSION_TIMEOUT ? parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT) : 600000; // 10 mins

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        router.push('/login');
    }, [router]);

    const resetTimer = useCallback(() => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (token) {
            logoutTimerRef.current = setTimeout(logout, SESSION_TIMEOUT);
        }
    }, [token, logout, SESSION_TIMEOUT]);

    // Initial Check
    useEffect(() => {
        const storedToken = getStoredToken();
        if (storedToken) {
            setToken(storedToken);
            resetTimer();
        }
    }, []);

    // Activity Listeners
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => resetTimer();

        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        };
    }, [resetTimer]);

    const login = async (username: string, password: string, role: string = 'specialist', captchaToken?: string): Promise<AuthResponse> => {
        try {
            const result = await apiAuthenticate(username, password, role, true, captchaToken);

            if (result.code === '00' && result.data?.id_token) {
                const newToken = result.data.id_token;
                storeToken(newToken);
                setToken(newToken);
                resetTimer();
            }

            return result;
        } catch (e) {
            console.error('Login error:', e);
            return { code: 'ERROR', message: 'Error de conexión con el servidor' };
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, login, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
