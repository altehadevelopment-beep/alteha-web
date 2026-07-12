"use client";

import React from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

// Operadoras móviles de Venezuela.
export const OPERATORS = ['0412', '0414', '0416', '0422', '0424', '0426'];

/** Descompone un teléfono guardado (58 + operadora sin 0 + 7 dígitos) en combo + número. */
export function parsePhone(full?: string): { operator: string; number: string } {
    const digits = (full || '').replace(/\D/g, '');
    if (digits.startsWith('58') && digits.length >= 5) {
        const op = '0' + digits.substring(2, 5);
        const num = digits.substring(5, 12);
        return { operator: OPERATORS.includes(op) ? op : '0424', number: num };
    }
    return { operator: '0424', number: '' };
}

/** Arma el teléfono final: 58 + operadora (sin el 0) + número (máx. 7 dígitos). Ej: 0424 + 1934005 → 584241934005 */
export function buildPhone(operator: string, number: string): string {
    const op = operator.replace(/^0/, '');
    const num = (number || '').replace(/\D/g, '').slice(0, 7);
    return `58${op}${num}`;
}

interface PhoneFieldProps {
    /** Valor completo almacenado, p. ej. "584241934005". */
    value: string;
    /** Recibe el valor completo ya ensamblado. */
    onChange: (fullPhone: string) => void;
    disabled?: boolean;
    label?: string;
    className?: string;
    /** Se dispara al salir del campo de número (p. ej. para validar duplicados). */
    onBlur?: () => void;
}

/**
 * Campo de teléfono celular venezolano: combo para elegir la operadora
 * (0412, 0414, 0416, 0422, 0424, 0426) + campo para los 7 dígitos.
 * Guarda el número en el formato del backend: 58 + operadora(sin 0) + número.
 */
export function PhoneField({ value, onChange, disabled, label = 'Teléfono Celular', className, onBlur }: PhoneFieldProps) {
    const { operator, number } = parsePhone(value);

    return (
        <div className={cn('space-y-2', className)}>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-alteha-violet ml-1">
                {label}
            </label>
            <div className="flex gap-2">
                {/* Combo de operadora */}
                <div className="relative">
                    <select
                        value={operator}
                        disabled={disabled}
                        onChange={(e) => onChange(buildPhone(e.target.value, number))}
                        className={cn(
                            'appearance-none h-[60px] pl-11 pr-8 rounded-2xl border-2 bg-slate-50/50 font-bold text-slate-800 outline-none transition-all cursor-pointer',
                            'border-slate-100 focus:border-alteha-violet/40 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        {OPERATORS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                        ))}
                    </select>
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Número (7 dígitos) */}
                <div className="relative flex-1">
                    <input
                        value={number}
                        disabled={disabled}
                        inputMode="numeric"
                        placeholder="1234567"
                        maxLength={7}
                        onBlur={onBlur}
                        onChange={(e) => onChange(buildPhone(operator, e.target.value.replace(/\D/g, '').slice(0, 7)))}
                        className={cn(
                            'w-full h-[60px] px-4 rounded-2xl border-2 bg-slate-50/50 font-bold text-slate-800 tracking-tight outline-none transition-all',
                            'border-slate-100 focus:border-alteha-violet/40 focus:bg-white placeholder:text-slate-300 placeholder:font-medium disabled:opacity-50'
                        )}
                    />
                </div>
            </div>
            <p className="text-slate-400 text-xs ml-1">
                Selecciona tu operadora y escribe los <span className="font-semibold text-slate-600">7 dígitos</span>. Ej: <span className="font-semibold text-slate-600">0424</span> · 1934005
            </p>
        </div>
    );
}
