"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ChevronRight, RotateCcw, Check, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PuzzleCaptchaProps {
    onVerify: (verified: boolean) => void;
    className?: string;
}

const PUZZLE_SIZE = 45;
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 150;
const IMAGES = [
    "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504813184591-01592fd03cfd?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559839734-2b71f1536783?q=80&w=800&auto=format&fit=crop"
];

export function PuzzleCaptcha({ onVerify, className }: PuzzleCaptchaProps) {
    const [isVerified, setIsVerified] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [puzzleX, setPuzzleX] = useState(0);
    const [puzzleY, setPuzzleY] = useState(0);
    const [bgImage, setBgImage] = useState("");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pieceRef = useRef<HTMLCanvasElement>(null);

    const x = useMotionValue(0);
    const controls = useAnimation();

    const generatePuzzle = useCallback(() => {
        setIsLoading(true);
        const randomX = Math.floor(Math.random() * (CANVAS_WIDTH - PUZZLE_SIZE * 2)) + PUZZLE_SIZE;
        const randomY = Math.floor(Math.random() * (CANVAS_HEIGHT - PUZZLE_SIZE - 20)) + 10;
        const randomImg = `${IMAGES[Math.floor(Math.random() * IMAGES.length)]}&sig=${Math.random()}`;

        setPuzzleX(randomX);
        setPuzzleY(randomY);
        setBgImage(randomImg);
        setIsError(false);
        setIsVerified(false);
        x.set(0);
        onVerify(false);
    }, [x, onVerify]);

    useEffect(() => {
        generatePuzzle();
    }, [generatePuzzle]);

    useEffect(() => {
        if (!bgImage) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = bgImage;

        img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
            const pieceCtx = pieceRef.current?.getContext('2d', { willReadFrequently: true });

            if (!ctx || !pieceCtx) return;

            // Draw Background
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Create Puzzle Path
            const drawPuzzleShape = (c: CanvasRenderingContext2D, xPos: number, yPos: number) => {
                c.beginPath();
                c.moveTo(xPos, yPos);
                c.lineTo(xPos + PUZZLE_SIZE / 2, yPos);
                c.arc(xPos + PUZZLE_SIZE / 2, yPos, 8, 0, Math.PI, true);
                c.lineTo(xPos + PUZZLE_SIZE, yPos);
                c.lineTo(xPos + PUZZLE_SIZE, yPos + PUZZLE_SIZE / 2);
                c.arc(xPos + PUZZLE_SIZE, yPos + PUZZLE_SIZE / 2, 8, 1.5 * Math.PI, 0.5 * Math.PI, false);
                c.lineTo(xPos + PUZZLE_SIZE, yPos + PUZZLE_SIZE);
                c.lineTo(xPos, yPos + PUZZLE_SIZE);
                c.lineTo(xPos, yPos);
                c.closePath();
            };

            // Draw Hole in main canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            drawPuzzleShape(ctx, puzzleX, puzzleY);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw Piece
            pieceCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            pieceCtx.save();
            drawPuzzleShape(pieceCtx, 0, puzzleY); // Draw at start X
            pieceCtx.clip();
            pieceCtx.drawImage(img, -puzzleX, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Offset image
            pieceCtx.restore();

            // Piece border
            pieceCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            pieceCtx.lineWidth = 2;
            drawPuzzleShape(pieceCtx, 0, puzzleY);
            pieceCtx.stroke();

            setIsLoading(false);
        };

        img.onerror = () => {
            console.error("Failed to load captcha image, retrying...");
            generatePuzzle();
        };
    }, [bgImage, puzzleX, puzzleY, generatePuzzle]);

    const handleDragEnd = () => {
        const currentX = x.get();
        const tolerance = 7; // Slightly more forgiving than before

        if (Math.abs(currentX - puzzleX) < tolerance) {
            setIsVerified(true);
            setIsError(false);
            onVerify(true);
        } else {
            setIsError(true);
            setTimeout(() => {
                controls.start({ x: 0 });
                x.set(0);
                setIsError(false);
            }, 500);
        }
    };

    return (
        <div className={cn("p-4 bg-white rounded-3xl shadow-xl border border-slate-100 w-fit select-none", className)}>
            <div className="relative mb-4 overflow-hidden rounded-2xl bg-slate-100" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-20">
                        <RotateCcw className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                )}
                <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className={cn("block transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")} />
                <motion.canvas
                    ref={pieceRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    style={{ x }}
                    className={cn("absolute top-0 left-0 drop-shadow-xl z-10 transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100 pointer-events-none")}
                />

                {isError && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-red-500/10 flex items-center justify-center z-30 pointer-events-none"
                    >
                        <div className="bg-white/90 p-2 rounded-full text-red-500 shadow-sm border border-red-100">
                            <X className="w-6 h-6" />
                        </div>
                    </motion.div>
                )}

                {isVerified && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center z-30 pointer-events-none"
                    >
                        <div className="bg-white/90 p-2 rounded-full text-emerald-500 shadow-sm border border-emerald-100">
                            <Check className="w-6 h-6" />
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="relative h-12 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    {isVerified ? "Verificado con éxito" : isLoading ? "Cargando desafío..." : "Desliza para encajar"}
                </div>

                <motion.div
                    style={{ width: x }}
                    className={cn(
                        "absolute top-0 left-0 h-full bg-alteha-turquoise/20 transition-colors",
                        isError && "bg-red-500/20",
                        isVerified && "bg-emerald-500/20"
                    )}
                />

                <motion.div
                    drag={isVerified || isLoading ? false : "x"}
                    dragConstraints={{ left: 0, right: CANVAS_WIDTH - 50 }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    style={{ x }}
                    className={cn(
                        "absolute top-1 left-1 w-10 h-10 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-10 transition-colors",
                        isVerified ? "text-emerald-500 cursor-default" : "text-slate-400 hover:text-alteha-violet",
                        isError && "text-red-500",
                        isLoading && "cursor-wait opacity-50"
                    )}
                >
                    {isVerified ? <Check className="w-5 h-5" /> : isError ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </motion.div>

                <button
                    onClick={generatePuzzle}
                    disabled={isVerified || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-30"
                    title="Actualizar desafío"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
