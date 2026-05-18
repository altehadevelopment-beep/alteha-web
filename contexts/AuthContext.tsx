"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authenticate as apiAuthenticate, storeToken, clearToken, getStoredToken, getDeviceId, updateDeviceId, type AuthResponse } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string, password: string, role?: string, captchaToken?: string) => Promise<AuthResponse>;
    logout: () => void;
    token: string | null;
    userProfile: any | null;
    isLoadingProfile: boolean;
    isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: async () => ({ code: '', message: '' }),
    logout: () => { },
    token: null,
    userProfile: null,
    isLoadingProfile: false,
    isInitializing: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const pathname = usePathname();
    const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
    const SESSION_TIMEOUT = process.env.NEXT_PUBLIC_SESSION_TIMEOUT ? parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT) : 600000; // 10 mins

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setUserProfile(null);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        router.replace('/login');
    }, [router]);

    const fetchProfile = useCallback(async (role: string) => {
        setIsLoadingProfile(true);
        try {
            const { getProfile } = await import('@/lib/api');
            const result = await getProfile(role);
            if (result.code === '00') {
                setUserProfile(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
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

            const segments = pathname.split('/');
            if (segments.includes('dashboard')) {
                const role = segments[segments.indexOf('dashboard') + 1];
                if (role) {
                    const apiRole = role === 'specialist' ? 'DOCTOR' : (role === 'insurance' ? 'INSURANCE_COMPANY' : (role === 'provider' ? 'PHARMACY' : (role === 'health-fund' ? 'HEALTH_FUND' : (role === 'approval' ? 'ADMIN' : role.toUpperCase()))));
                    fetchProfile(apiRole);
                }
            }
            // Also sign in to Firebase anonymously if not already signed in
            if (!auth.currentUser) {
                signInAnonymously(auth).catch(err => console.error('Firebase auto sign-in failed:', err));
            }
        }
        setIsInitializing(false);
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
            const deviceId = getDeviceId();
            const result = await apiAuthenticate(username, password, role, true, captchaToken, deviceId);

            if (result.code === '00' && result.data?.id_token) {
                const newToken = result.data.id_token;
                storeToken(newToken);
                setToken(newToken);
                const apiRole = role === 'specialist' ? 'DOCTOR' : (role === 'insurance' ? 'INSURANCE_COMPANY' : (role === 'provider' ? 'PHARMACY' : (role === 'health-fund' ? 'HEALTH_FUND' : (role === 'approval' ? 'ADMIN' : role.toUpperCase()))));

                // Also update deviceId specifically after login to be sure
                updateDeviceId(apiRole, deviceId).catch(err => console.error('Failed to update device ID:', err));

                await fetchProfile(apiRole);
                
                // Sign in to Firebase anonymously for real-time features
                try {
                    await signInAnonymously(auth);
                } catch (fbErr) {
                    console.error('Firebase sign-in failed:', fbErr);
                }

                resetTimer();
            }

            return result;
        } catch (e) {
            console.error('Login error:', e);
            return { code: 'ERROR', message: 'Error de conexión con el servidor' };
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, login, logout, token, userProfile, isLoadingProfile, isInitializing }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
