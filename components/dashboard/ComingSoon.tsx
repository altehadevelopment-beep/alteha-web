"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ComingSoonPage({ title }: { title: string }) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white rounded-[3rem] shadow-sm border border-slate-100 font-outfit text-center">
            <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-8"
            >
                <Construction className="w-12 h-12 text-amber-500" />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 mb-4">{title}</h1>
            <p className="text-slate-500 max-w-md mb-8">
                Estamos trabajando duro para traerte esta funcionalidad. Muy pronto podrás gestionar tus {title.toLowerCase()} directamente desde aquí.
            </p>
            <Link href="/dashboard/specialist" className="flex items-center gap-2 text-alteha-turquoise font-black uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
                <ArrowLeft className="w-5 h-5" />
                Regresar al Dashboard
            </Link>
        </div>
    );
}
