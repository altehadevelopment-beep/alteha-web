"use client";

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SessionTimer from '@/components/layout/SessionTimer';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#EEF2FF' }}>
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: '#2ECFBF', borderTopColor: 'transparent' }} />
                <p className="mt-4 font-medium" style={{ color: '#9CA3AF' }}>Verificando sesión...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#EEF2FF' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />
                <SessionTimer />
                <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className="max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
