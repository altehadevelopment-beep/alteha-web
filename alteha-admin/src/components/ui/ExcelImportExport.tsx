"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, CheckCircle2, XCircle, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export interface FieldDef {
    key: string;         // API field name
    label: string;       // Column header shown in Excel
    example: string;     // Example value to put in template row
    required?: boolean;
}

interface Props {
    title: string;
    entityPath: string;   // e.g. 'preload-doctors'
    fields: FieldDef[];
    description?: string;
}

interface RowResult { row: number; status: 'success' | 'error'; message: string; }

export default function ExcelImportExport({ title, entityPath, fields, description }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<RowResult[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const [isDone, setIsDone] = useState(false);

    // ── Download template ──────────────────────────────────────────
    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            fields.map(f => `${f.label}${f.required ? ' *' : ''}`),
            fields.map(f => f.example),
        ]);

        // Style header row width
        ws['!cols'] = fields.map(() => ({ wch: 22 }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
        XLSX.writeFile(wb, `plantilla_${entityPath}.xlsx`);
    };

    // ── Import file ────────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setResults([]);
        setIsDone(false);

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Skip header row
            const dataRows = rows.slice(1).filter(r => r.some(c => c !== undefined && c !== ''));
            setTotalRows(dataRows.length);

            const newResults: RowResult[] = [];

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                // Map columns by index to field keys
                const payload: Record<string, any> = {};
                fields.forEach((f, idx) => {
                    const val = row[idx];
                    if (val !== undefined && val !== '') {
                        payload[f.key] = val;
                    }
                });

                try {
                    await api.post(`/${entityPath}`, payload);
                    newResults.push({ row: i + 2, status: 'success', message: 'Registrado exitosamente' });
                } catch (err: any) {
                    const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Error desconocido';
                    newResults.push({ row: i + 2, status: 'error', message: detail });
                }

                setProgress(i + 1);
                setResults([...newResults]);
            }

            setIsDone(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-3xl font-black tracking-tight font-outfit" style={{ color: '#0F1128' }}>{title}</h1>
                {description && <p className="mt-1 font-medium" style={{ color: '#9CA3AF' }}>{description}</p>}
            </header>

            {/* Two action cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Download template */}
                <div className="bg-white rounded-3xl p-8 flex flex-col gap-5"
                    style={{ border: '1.5px solid rgba(46,207,191,0.15)', boxShadow: '0 4px 24px rgba(46,207,191,0.06)' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(46,207,191,0.1)' }}>
                        <FileSpreadsheet className="w-7 h-7" style={{ color: '#2ECFBF' }} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black font-outfit" style={{ color: '#0F1128' }}>Descargar Plantilla</h2>
                        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                            Descarga el archivo Excel con los {fields.length} campos requeridos y un ejemplo para guiarte.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Columnas del archivo</p>
                        <div className="flex flex-wrap gap-1.5">
                            {fields.map(f => (
                                <span key={f.key} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        background: f.required ? 'rgba(46,207,191,0.1)' : 'rgba(123,91,255,0.06)',
                                        color: f.required ? '#2ECFBF' : '#7B5BFF',
                                        border: `1px solid ${f.required ? 'rgba(46,207,191,0.2)' : 'rgba(123,91,255,0.12)'}`,
                                    }}>
                                    {f.label}{f.required ? ' *' : ''}
                                </span>
                            ))}
                        </div>
                        <p className="text-[10px] mt-2" style={{ color: '#C0CADB' }}>* Campo requerido</p>
                    </div>

                    <button onClick={handleDownloadTemplate}
                        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-white transition-all hover:opacity-90 hover:scale-[1.01]"
                        style={{ background: 'linear-gradient(90deg, #2ECFBF, #7B5BFF)', boxShadow: '0 8px 24px rgba(123,91,255,0.25)' }}>
                        <Download className="w-5 h-5" />
                        Descargar Plantilla Excel
                    </button>
                </div>

                {/* Upload file */}
                <div className="bg-white rounded-3xl p-8 flex flex-col gap-5"
                    style={{ border: '1.5px solid rgba(123,91,255,0.15)', boxShadow: '0 4px 24px rgba(123,91,255,0.06)' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(123,91,255,0.1)' }}>
                        <Upload className="w-7 h-7" style={{ color: '#7B5BFF' }} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black font-outfit" style={{ color: '#0F1128' }}>Importar Datos</h2>
                        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                            Sube el archivo Excel completado. Se cargará cada fila automáticamente en el sistema.
                        </p>
                    </div>

                    {/* Drop zone */}
                    <label className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl cursor-pointer transition-all"
                        style={{ border: '2px dashed rgba(123,91,255,0.2)', background: 'rgba(123,91,255,0.02)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(123,91,255,0.05)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(123,91,255,0.02)'}>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} disabled={isImporting} />
                        <FileSpreadsheet className="w-10 h-10" style={{ color: '#7B5BFF', opacity: 0.6 }} />
                        <div className="text-center">
                            <p className="font-bold text-sm" style={{ color: '#7B5BFF' }}>
                                {isImporting ? 'Importando...' : 'Haz clic para seleccionar archivo'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#C0CADB' }}>Formatos: .xlsx, .xls</p>
                        </div>
                    </label>

                    {/* Progress bar */}
                    <AnimatePresence>
                        {isImporting && totalRows > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold" style={{ color: '#9CA3AF' }}>
                                    <span>Procesando filas...</span>
                                    <span>{progress}/{totalRows}</span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(123,91,255,0.08)' }}>
                                    <div className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(progress / totalRows) * 100}%`,
                                            background: 'linear-gradient(90deg, #2ECFBF, #7B5BFF)',
                                        }} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Results panel */}
            <AnimatePresence>
                {results.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-white rounded-3xl overflow-hidden"
                        style={{ border: '1.5px solid rgba(123,91,255,0.08)' }}>

                        {/* Stats bar */}
                        <div className="flex items-center gap-6 px-8 py-5 border-b" style={{ borderColor: 'rgba(123,91,255,0.06)' }}>
                            <h3 className="text-base font-black font-outfit mr-auto" style={{ color: '#0F1128' }}>
                                Resultados de Importación
                            </h3>
                            {isDone && (
                                <span className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full"
                                    style={{ background: 'rgba(46,207,191,0.1)', color: '#2ECFBF' }}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    {successCount} exitosos
                                </span>
                            )}
                            {errorCount > 0 && (
                                <span className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                                    <XCircle className="w-4 h-4" />
                                    {errorCount} errores
                                </span>
                            )}
                            {isImporting && (
                                <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7B5BFF' }} />
                            )}
                        </div>

                        {/* Row results list */}
                        <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y" style={{ borderColor: 'rgba(123,91,255,0.04)' }}>
                            {results.map(r => (
                                <div key={r.row} className="flex items-center gap-4 px-8 py-3.5">
                                    {r.status === 'success'
                                        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#2ECFBF' }} />
                                        : <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#EF4444' }} />
                                    }
                                    <span className="text-xs font-bold w-14 flex-shrink-0" style={{ color: '#C0CADB' }}>Fila {r.row}</span>
                                    <span className={`text-sm font-medium truncate`}
                                        style={{ color: r.status === 'success' ? '#0F1128' : '#EF4444' }}>
                                        {r.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
