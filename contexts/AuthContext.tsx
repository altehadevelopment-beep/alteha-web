"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authenticate as apiAuthenticate, storeToken, clearToken, getStoredToken, type AuthResponse } from '@/lib/api';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string, password: string, role?: string, captchaToken?: string) => Promise<AuthResponse>;
    logout: () => void;
    token: string | null;
    userProfile: any | null;
    isLoadingProfile: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: async () => ({ code: '', message: '' }),
    logout: () => { },
    token: null,
    userProfile: null,
    isLoadingProfile: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const pathname = usePathname();
    const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
    const SESSION_TIMEOUT = process.env.NEXT_PUBLIC_SESSION_TIMEOUT ? parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT) : 600000; // 10 mins

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setUserProfile(null);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        router.push('/login');
    }, [router]);

    const fetchProfile = useCallback(async (role: string) => {
        console.log(`[AuthContext] Fetching profile for role: ${role}`);
        setIsLoadingProfile(true);
        try {
            const { getProfile } = await import('@/lib/api');
            const result = await getProfile(role);
            console.log(`[AuthContext] Profile result:`, result);
            if (result.code === '00') {
                setUserProfile(result.data);
            }
        } catch (error) {
            console.error('[AuthContext] Failed to fetch profile:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    }, []);

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
            // Infer role from path if possible, or wait for explicit login
            // For now, if we have a token and we are in a dashboard, fetch profile
            const segments = pathname.split('/');
            if (segments.includes('dashboard')) {
                const role = segments[segments.indexOf('dashboard') + 1];
                if (role) {
                    const apiRole = role === 'specialist' ? 'DOCTOR' : role.toUpperCase();
                    fetchProfile(apiRole);
                }
            }
        }
    }, [pathname, fetchProfile, resetTimer]);

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
                const apiRole = role === 'specialist' ? 'DOCTOR' : role.toUpperCase();
                await fetchProfile(apiRole);
                resetTimer();
            }

            return result;
        } catch (e) {
            console.error('Login error:', e);
            return { code: 'ERROR', message: 'Error de conexión con el servidor' };
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, login, logout, token, userProfile, isLoadingProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
