"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ExternalLink, Images } from 'lucide-react';
import type { Advertisement } from '@/lib/api';

interface Props {
    ad: Advertisement;
    backHref?: string;
}

/**
 * Commercial "landing" for a dashboard ad: hero, administrable text, and a clickable gallery
 * (grid + fullscreen lightbox with keyboard nav). Shared across roles.
 */
export default function AdLanding({ ad, backHref }: Props) {
    // Build the full image list: main media first (if image), then gallery, de-duplicated.
    const images = useMemo(() => {
        const gallery = (ad.images || [])
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((im) => ({ url: im.imageUrl, caption: im.caption || '' }))
            .filter((i) => i.url);
        const mainIsImage = ad.mediaUrl && ad.mediaType === 'IMAGE';
        const hasMain = gallery.some((g) => g.url === ad.mediaUrl);
        if (mainIsImage && !hasMain) return [{ url: ad.mediaUrl, caption: '' }, ...gallery];
        if (!gallery.length && mainIsImage) return [{ url: ad.mediaUrl, caption: '' }];
        return gallery;
    }, [ad]);

    const [lightbox, setLightbox] = useState<number | null>(null);
    const close = useCallback(() => setLightbox(null), []);
    const prev = useCallback(() => setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length)), [images.length]);
    const next = useCallback(() => setLightbox((i) => (i === null ? i : (i + 1) % images.length)), [images.length]);

    useEffect(() => {
        if (lightbox === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [lightbox, prev, next, close]);

    const text = ad.detailContent || ad.bodyText;

    return (
        <div className="max-w-5xl mx-auto font-outfit pb-24 space-y-8">
            {backHref && (
                <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-black text-slate-500 hover:text-alteha-violet transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Volver
                </Link>
            )}

            {/* Header + hero */}
            <section className="space-y-5">
                <div className="space-y-2">
                    <span className="text-alteha-turquoise text-[11px] font-black uppercase tracking-[0.25em]">
                        {ad.subtitle || 'Publicidad especializada'}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{ad.title}</h1>
                </div>

                {images.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setLightbox(0)}
                        className="w-full rounded-[2.5rem] overflow-hidden bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200 cursor-zoom-in"
                    >
                        <img src={images[0].url} alt={ad.title} className="w-full max-h-[460px] object-contain" />
                    </button>
                )}
            </section>

            {/* Administrable text + CTA */}
            {(text || ad.clickUrl) && (
                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 space-y-6">
                    {text && (
                        <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-[15px]">{text}</p>
                    )}
                    {ad.clickUrl && (
                        <a
                            href={ad.clickUrl}
                            target={ad.openInNewTab ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-alteha-turquoise text-slate-900 font-black px-6 py-3 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg shadow-alteha-turquoise/20"
                        >
                            {ad.ctaText || 'Visitar'} <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </section>
            )}

            {/* Gallery */}
            {images.length > 1 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Images className="w-4 h-4 text-alteha-violet" /> Galería ({images.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setLightbox(i)}
                                className="group aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm cursor-zoom-in"
                            >
                                <img src={img.url} alt={img.caption || `Imagen ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox !== null && images[lightbox] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <button onClick={close} className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        {images.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); prev(); }}
                                className="absolute left-3 md:left-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        <motion.img
                            key={lightbox}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={images[lightbox].url}
                            alt=""
                            onClick={(e) => e.stopPropagation()}
                            className="max-h-[85vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
                        />

                        {images.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); next(); }}
                                className="absolute right-3 md:right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold">
                            {lightbox + 1} / {images.length}
                            {images[lightbox].caption ? ` · ${images[lightbox].caption}` : ''}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
