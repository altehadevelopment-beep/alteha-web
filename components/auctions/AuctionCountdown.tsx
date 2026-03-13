"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface AuctionCountdownProps {
    endDate: string;
    onEnd?: () => void;
    className?: string;
}

export default function AuctionCountdown({ endDate, onEnd, className = "" }: AuctionCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isExpired: boolean;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(endDate) - +new Date();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                    isExpired: false
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
                if (onEnd) onEnd();
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Initial call

        return () => clearInterval(timer);
    }, [endDate, onEnd]);

    if (timeLeft.isExpired) {
        return (
            <div className={`flex items-center gap-1.5 text-red-500 font-black uppercase tracking-widest text-[10px] ${className}`}>
                <Clock className="w-3.5 h-3.5" />
                Finalizada
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Clock className="w-4 h-4 text-alteha-violet animate-pulse" />
            <div className="flex gap-1.5">
                {timeLeft.days > 0 && (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-slate-900 leading-none">{timeLeft.days}d</span>
                    </div>
                )}
                <div className="flex flex-col items-center border-l border-slate-200 pl-1.5 ml-1.5">
                    <span className="text-sm font-black text-slate-900 leading-none">
                        {String(timeLeft.hours).padStart(2, '0')}:
                        {String(timeLeft.minutes).padStart(2, '0')}:
                        {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>
    );
}
