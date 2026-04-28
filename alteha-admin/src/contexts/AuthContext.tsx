"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const SESSION_DURATION = 5 * 60; // 5 minutes in seconds
const SESSION_KEY = 'alteha_admin_token';
const SESSION_START_KEY = 'alteha_session_start';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    isLoading: boolean;
    secondsLeft: number;
    login: (token: string) => void;
    logout: () => void;
    resetTimer: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    token: null,
    isLoading: true,
    secondsLeft: SESSION_DURATION,
    login: () => {},
    logout: () => {},
    resetTimer: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [secondsLeft, setSecondsLeft] = useState(SESSION_DURATION);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const logout = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_START_KEY);
        setToken(null);
        setSecondsLeft(SESSION_DURATION);
        if (timerRef.current) clearInterval(timerRef.current);
        router.push('/login');
    }, [router]);

    // Start/restart the countdown
    const startCountdown = useCallback((startedAt: number) => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const remaining = SESSION_DURATION - elapsed;

            if (remaining <= 0) {
                clearInterval(timerRef.current!);
                logout();
            } else {
                setSecondsLeft(remaining);
            }
        }, 1000);
    }, [logout]);

    const resetTimer = useCallback(() => {
        const now = Date.now();
        localStorage.setItem(SESSION_START_KEY, String(now));
        setSecondsLeft(SESSION_DURATION);
        startCountdown(now);
    }, [startCountdown]);

    // On mount: restore session
    useEffect(() => {
        const storedToken = localStorage.getItem(SESSION_KEY);
        const storedStart = localStorage.getItem(SESSION_START_KEY);

        if (storedToken && storedStart) {
            const startedAt = parseInt(storedStart, 10);
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const remaining = SESSION_DURATION - elapsed;

            if (remaining > 0) {
                setToken(storedToken);
                setSecondsLeft(remaining);
                startCountdown(startedAt);
            } else {
                // Session already expired
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(SESSION_START_KEY);
            }
        }
        setIsLoading(false);
    }, [startCountdown]);

    // Route protection
    useEffect(() => {
        if (!isLoading) {
            const isAuthRoute = pathname === '/login';
            if (!token && !isAuthRoute) router.push('/login');
            else if (token && isAuthRoute) router.push('/');
        }
    }, [token, isLoading, pathname, router]);

    const login = (newToken: string) => {
        const now = Date.now();
        localStorage.setItem(SESSION_KEY, newToken);
        localStorage.setItem(SESSION_START_KEY, String(now));
        setToken(newToken);
        setSecondsLeft(SESSION_DURATION);
        startCountdown(now);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, token, isLoading, secondsLeft, login, logout, resetTimer }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
