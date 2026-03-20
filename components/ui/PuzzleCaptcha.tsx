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
const CANVAS_HEIGHT = 140;
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
        <div className={cn("p-4 bg-white/40 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-white/60 w-fit select-none mx-auto", className)}>
            <div className="relative mb-4 overflow-hidden rounded-xl bg-slate-200/50 shadow-inner" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm z-20">
                        <RotateCcw className="w-8 h-8 animate-spin text-alteha-violet/60" />
                    </div>
                )}
                <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className={cn("block transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100")} />
                <motion.canvas
                    ref={pieceRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    style={{ x }}
                    className={cn("absolute top-0 left-0 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] z-10 transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100 pointer-events-none")}
                />

                {isError && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-red-500/10 flex items-center justify-center z-30 pointer-events-none backdrop-blur-[2px]"
                    >
                        <div className="bg-white p-3 rounded-full text-red-500 shadow-xl border border-red-100">
                            <X className="w-8 h-8" />
                        </div>
                    </motion.div>
                )}

                {isVerified && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center z-30 pointer-events-none backdrop-blur-[2px]"
                    >
                        <div className="bg-white p-3 rounded-full text-emerald-500 shadow-xl border border-emerald-100">
                            <Check className="w-8 h-8" />
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="relative h-12 bg-slate-100/80 backdrop-blur-md rounded-xl border border-slate-200/50 shadow-inner overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] ml-8">
                    {isVerified ? "Verificado" : isLoading ? "Cargando..." : "Deslizar para verificar"}
                </div>

                <motion.div
                    style={{ width: x }}
                    className={cn(
                        "absolute top-0 left-0 h-full transition-colors",
                        isError ? "bg-red-500/20" : 
                        isVerified ? "bg-emerald-500/20" : 
                        "bg-alteha-turquoise/20"
                    )}
                />

                <motion.div
                    drag={isVerified || isLoading ? false : "x"}
                    dragConstraints={{ left: 0, right: CANVAS_WIDTH - 46 }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    style={{ x }}
                    className={cn(
                        "absolute top-1 left-1 w-10 h-10 bg-white rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.1)] cursor-grab active:cursor-grabbing flex items-center justify-center z-10 transition-all duration-300",
                        isVerified ? "text-emerald-500 cursor-default shadow-none border border-emerald-100" : "text-slate-400 hover:text-alteha-violet border border-slate-100 hover:scale-105",
                        isError && "text-red-500 border-red-100 shadow-red-100",
                        isLoading && "cursor-wait opacity-50"
                    )}
                >
                    {isVerified ? <Check className="w-6 h-6" /> : isError ? <X className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </motion.div>

                <button
                    onClick={generatePuzzle}
                    disabled={isVerified || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-alteha-violet transition-all p-2 disabled:opacity-30 hover:rotate-180 duration-500"
                    title="Actualizar"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
