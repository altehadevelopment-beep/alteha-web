"use client";

import React, { useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, Trash2, X } from 'lucide-react';

interface FileUploadProps {
    label: string;
    accept?: Record<string, string[]>;
    value?: File | null;
    onChange: (file: File | null) => void;
    preview?: boolean;
}

export const FileUpload = ({ label, accept, value, onChange, preview }: FileUploadProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            if (preview) {
                setPreviewUrl(URL.createObjectURL(file));
            }
            onChange(file);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: accept || {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
    });

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onChange(null);
    };

    return (
        <div className="w-full mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

            <div
                {...getRootProps()}
                className={`
          relative w-full border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer
          flex flex-col items-center justify-center min-h-[160px]
          ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}
        `}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {value ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex flex-col items-center text-center w-full"
                        >
                            {preview && previewUrl ? (
                                <div className="relative group mb-3">
                                    <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg" />
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Trash2 className="text-white w-6 h-6" onClick={clearFile} />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            )}

                            <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{value.name}</p>
                            <p className="text-xs text-slate-500">{(value.size / 1024 / 1024).toFixed(2)} MB</p>

                            <button
                                type="button"
                                onClick={clearFile}
                                className="mt-3 text-xs text-red-500 hover:text-red-700 underline z-10"
                            >
                                Eliminar
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400 group-hover:text-primary transition-colors">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium">
                                <span className="text-primary font-bold">Clic para subir</span> o arrastra y suelta
                            </p>
                            <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG o PDF (max. 10MB)</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
