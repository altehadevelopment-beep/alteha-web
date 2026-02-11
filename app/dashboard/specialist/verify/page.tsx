"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Upload,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Shield,
    User,
    FileText,
    Eye,
    RefreshCcw,
    X,
    Star
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

type VerificationStep = 'selection' | 'document' | 'liveness' | 'success';

export default function SpecialistVerifyPage() {
    const router = useRouter();
    const [step, setStep] = useState<VerificationStep>('selection');
    const [docType, setDocType] = useState<'cedula' | 'pasaporte'>('cedula');
    const [docImage, setDocImage] = useState<string | null>(null);
    const [livenessCaptured, setLivenessCaptured] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [motionAccumulator, setMotionAccumulator] = useState(0);
    const [faceDetected, setFaceDetected] = useState(false);

    // Camera Refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const loadingModelsRef = useRef(false);

    const setVideoRef = React.useCallback((el: HTMLVideoElement | null) => {
        videoRef.current = el;
        if (el && stream) {
            el.srcObject = stream;
            el.play().catch(err => console.error("Video play error:", err));
        }
    }, [stream]);

    // Load Models
    useEffect(() => {
        if (modelsLoaded || loadingModelsRef.current) return;

        const loadModels = async () => {
            loadingModelsRef.current = true;
            const MODEL_URL = '/models';
            try {
                console.log("Loading face-api models...");
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ]);
                console.log("Face-api models loaded successfully");
                setModelsLoaded(true);
            } catch (err) {
                console.error("Error loading face-api models:", err);
            } finally {
                loadingModelsRef.current = false;
            }
        };
        loadModels();
    }, [modelsLoaded]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setStream(mediaStream);
            setIsCameraActive(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    // Manual Linking - Handled by setVideoRef callback now

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Use actual video dimensions
                const video = videoRef.current;
                canvasRef.current.width = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
                context.drawImage(video, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
                setDocImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleNext = () => {
        if (step === 'selection') setStep('document');
        else if (step === 'document') setStep('liveness');
        else if (step === 'liveness') setStep('success');
    };

    const handleBack = () => {
        if (step === 'document') setStep('selection');
        else if (step === 'liveness') setStep('document');
    };

    const renderSelection = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="text-center">
                <div className="w-20 h-20 bg-alteha-violet/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-alteha-violet">
                    <FileText className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Selecciona tu Documento</h2>
                <p className="text-slate-500 font-medium">Elige el tipo de identificación que deseas verificar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setDocType('cedula')}
                    className={`p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${docType === 'cedula' ? 'border-alteha-turquoise bg-alteha-turquoise/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                    <div className={`p-4 rounded-2xl ${docType === 'cedula' ? 'bg-alteha-turquoise text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <User className="w-8 h-8" />
                    </div>
                    <span className="font-black text-slate-900">Cédula de Identidad</span>
                </button>
                <button
                    onClick={() => setDocType('pasaporte')}
                    className={`p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${docType === 'pasaporte' ? 'border-alteha-violet bg-alteha-violet/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                    <div className={`p-4 rounded-2xl ${docType === 'pasaporte' ? 'bg-alteha-violet text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <FileText className="w-8 h-8" />
                    </div>
                    <span className="font-black text-slate-900">Pasaporte</span>
                </button>
            </div>

            <Button onClick={handleNext} className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl text-lg shadow-xl hover:scale-[1.02] transition-all">
                Continuar
            </Button>
        </motion.div>
    );

    const renderDocumentCapture = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Captura tu {docType === 'cedula' ? 'Cédula' : 'Pasaporte'}</h2>
                <p className="text-slate-500 font-medium mb-4">Asegúrate que el documento sea legible y esté bien iluminado.</p>
                <div className="bg-alteha-turquoise/10 border border-alteha-turquoise/20 py-3 px-6 rounded-2xl inline-block">
                    <p className="text-alteha-turquoise font-black text-sm uppercase tracking-wider">
                        Encuadra tu documento dentro del recuadro
                    </p>
                </div>
            </div>

            <div className="relative aspect-[3/2] bg-slate-100 rounded-[3rem] overflow-hidden border-4 border-dashed border-slate-200 flex items-center justify-center">
                {isCameraActive ? (
                    <>
                        <video
                            ref={setVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                        />
                        {/* Box Overlay for Document */}
                        <div className="absolute inset-0 border-[4rem] border-slate-900/40 pointer-events-none flex items-center justify-center">
                            <div className="w-[85%] h-[75%] border-4 border-dashed border-white/60 rounded-2xl" />
                        </div>
                        <button
                            onClick={capturePhoto}
                            className="absolute bottom-6 p-6 bg-alteha-turquoise text-slate-900 rounded-full shadow-2xl hover:scale-110 transition-all z-20"
                        >
                            <Camera className="w-8 h-8" />
                        </button>
                    </>
                ) : docImage ? (
                    <>
                        <img src={docImage} className="w-full h-full object-cover" alt="Documento capturado" />
                        <button
                            onClick={() => { setDocImage(null); startCamera(); }}
                            className="absolute bottom-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 font-bold flex items-center gap-2 shadow-xl"
                        >
                            <RefreshCcw className="w-5 h-5" /> Reintentar
                        </button>
                    </>
                ) : (
                    <div className="text-center space-y-4">
                        <Camera className="w-16 h-16 text-slate-300 mx-auto" />
                        <Button onClick={startCamera} className="bg-alteha-violet text-white px-8 py-3 rounded-2xl font-bold">
                            Activar Cámara
                        </Button>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-4">
                <Button onClick={handleBack} className="flex-1 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl transition-all">
                    Volver
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!docImage}
                    className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl disabled:opacity-50 shadow-lg hover:scale-[1.02] transition-all"
                >
                    Confirmar y Siguiente
                </Button>
            </div>
        </motion.div>
    );

    const [livenessInstruction, setLivenessInstruction] = useState('Centra tu rostro');
    const [currentGestureIdx, setCurrentGestureIdx] = useState(0);
    const isPausedRef = useRef(false);

    const instructions = [
        'Centra tu rostro',
        'Gira la cabeza a la derecha',
        'Gira la cabeza a la izquierda',
        'Mueve la cabeza arriba y abajo',
        'Sonríe para la cámara',
        '¡Listo! Verificación completada'
    ];

    const advanceGesture = () => {
        setCurrentGestureIdx(prev => {
            if (prev < instructions.length - 1) {
                const nextIdx = prev + 1;
                setLivenessInstruction(instructions[nextIdx]);
                setMotionAccumulator(0);

                if (nextIdx === instructions.length - 1) {
                    setLivenessCaptured(true);
                    setTimeout(() => stopCamera(), 2000);
                }
                return nextIdx;
            }
            return prev;
        });
    };

    // Base reference for head movement tracking
    const basePositionRef = useRef<{ x: number, y: number } | null>(null);

    // Automatic Motion Detection Logic with face-api.js
    useEffect(() => {
        let animationId: number;
        let lastDetectionTime = 0;

        const runDetection = async () => {
            const video = videoRef.current;
            if (!video || step !== 'liveness' || !isCameraActive || livenessCaptured || isPausedRef.current || !modelsLoaded) {
                animationId = requestAnimationFrame(runDetection);
                return;
            }

            // Ensure video is ready and playing
            if (video.readyState < 2 || video.videoWidth === 0 || video.paused) {
                if (video.paused && video.readyState >= 2) {
                    video.play().catch(e => console.error("Auto-play failed:", e));
                }
                animationId = requestAnimationFrame(runDetection);
                return;
            }

            const now = Date.now();
            if (now - lastDetectionTime < 100) {
                animationId = requestAnimationFrame(runDetection);
                return;
            }
            lastDetectionTime = now;

            try {
                const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 });
                const detection = await faceapi.detectSingleFace(video, options)
                    .withFaceLandmarks()
                    .withFaceExpressions();

                if (detection) {
                    setFaceDetected(true);
                    const { expressions, landmarks } = detection;
                    const nose = landmarks.getNose()[3];

                    if (currentGestureIdx === 0) {
                        setMotionAccumulator(prev => {
                            const next = Math.min(100, prev + 25);
                            if (next >= 90) {
                                basePositionRef.current = { x: nose.x, y: nose.y };
                                setTimeout(() => advanceGesture(), 0);
                            }
                            return next;
                        });
                    }
                    else if (currentGestureIdx === 1) { // Right
                        if (basePositionRef.current) {
                            const dx = nose.x - basePositionRef.current.x;
                            if (dx > 25) {
                                setMotionAccumulator(prev => {
                                    const next = Math.min(100, prev + 35);
                                    if (next >= 95) setTimeout(() => advanceGesture(), 0);
                                    return next;
                                });
                            }
                        }
                    }
                    else if (currentGestureIdx === 2) { // Left
                        if (basePositionRef.current) {
                            const dx = basePositionRef.current.x - nose.x;
                            if (dx > 25) {
                                setMotionAccumulator(prev => {
                                    const next = Math.min(100, prev + 35);
                                    if (next >= 95) setTimeout(() => advanceGesture(), 0);
                                    return next;
                                });
                            }
                        }
                    }
                    else if (currentGestureIdx === 3) { // Vertical Move
                        if (basePositionRef.current) {
                            const dy = Math.abs(nose.y - basePositionRef.current.y);
                            if (dy > 15) {
                                setMotionAccumulator(prev => {
                                    const next = Math.min(100, prev + 35);
                                    if (next >= 95) setTimeout(() => advanceGesture(), 0);
                                    return next;
                                });
                            }
                        }
                    }
                    else if (currentGestureIdx === 4) { // Smile
                        if (expressions.happy > 0.4) {
                            setMotionAccumulator(prev => {
                                const next = Math.min(100, prev + 45);
                                if (next >= 95) setTimeout(() => advanceGesture(), 0);
                                return next;
                            });
                        }
                    }
                    else if (currentGestureIdx === 5) {
                        advanceGesture();
                    }
                } else {
                    setFaceDetected(false);
                    setMotionAccumulator(prev => Math.max(0, prev - 2));
                }
            } catch (err) {
                console.error("Detection error:", err);
            }

            animationId = requestAnimationFrame(runDetection);
        };

        if (isCameraActive && step === 'liveness' && !livenessCaptured && modelsLoaded) {
            animationId = requestAnimationFrame(runDetection);
        }

        return () => cancelAnimationFrame(animationId);
    }, [isCameraActive, step, currentGestureIdx, livenessCaptured, modelsLoaded]);

    const renderLiveness = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Prueba de Vida</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Mueve el rostro siguiendo las instrucciones. El sistema detectará tu movimiento automáticamente.
                </p>
                <div className="mt-4 flex flex-col items-center gap-2">
                    {!modelsLoaded && step === 'liveness' ? (
                        <div className="flex items-center gap-2 text-alteha-violet font-bold animate-pulse">
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                            Cargando motores de IA...
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="px-6 py-2 bg-alteha-violet/10 rounded-full inline-block">
                                <span className="text-alteha-violet font-black animate-pulse">{livenessInstruction}</span>
                            </div>
                            {faceDetected && !livenessCaptured && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    Rostro Detectado
                                </div>
                            )}
                        </div>
                    )}
                    {isCameraActive && !livenessCaptured && modelsLoaded && (
                        <div className="w-56 h-2 bg-slate-100 rounded-full overflow-hidden mt-3 relative">
                            <motion.div
                                className={`h-full ${motionAccumulator > 80 ? 'bg-emerald-400' : 'bg-alteha-turquoise'}`}
                                animate={{ width: `${motionAccumulator}%` }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            />
                            {motionAccumulator > 0 && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={`relative w-80 h-80 md:w-[28rem] md:h-[28rem] bg-slate-100 rounded-full overflow-hidden border-8 transition-colors duration-500 flex items-center justify-center mx-auto ${faceDetected && !livenessCaptured ? 'border-alteha-turquoise/40' : 'border-alteha-violet/20'}`}>
                {isCameraActive ? (
                    <>
                        <video
                            ref={setVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                        />
                        {/* Face Mask Guide Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <svg className="w-full h-full text-white/40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 30C75 30 55 55 55 85C55 115 75 145 100 145C125 145 145 115 145 85C145 55 125 30 100 30Z" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                <rect x="0" y="0" width="200" height="200" fill="currentColor" fillOpacity="0.3" fillRule="evenodd" clipRule="evenodd" d="M0 0H200V200H0V0ZM100 30C75 30 55 55 55 85C55 115 75 145 100 145C125 145 145 115 145 85C145 55 125 30 100 30Z" />
                            </svg>
                        </div>
                        <div className="absolute inset-0 border-4 border-dashed border-alteha-turquoise rounded-full animate-[spin_15s_linear_infinite]" />

                        {/* Detection Feedback Overlay */}
                        {motionAccumulator > 50 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-6 right-6 bg-emerald-500 text-white p-3 rounded-full shadow-lg"
                            >
                                <CheckCircle className="w-8 h-8" />
                            </motion.div>
                        )}
                    </>
                ) : livenessCaptured ? (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-4"
                    >
                        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto" />
                        <p className="font-bold text-emerald-600">¡Identidad Confirmada!</p>
                    </motion.div>
                ) : (
                    <Button onClick={startCamera} className="bg-alteha-violet text-white px-8 py-3 rounded-2xl font-bold">
                        Iniciar Cámara
                    </Button>
                )}
            </div>


            {/* Manual scan completion is now automated via motion detection */}

            <div className="flex gap-4">
                <Button onClick={handleBack} className="flex-1 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl transition-all">
                    Volver
                </Button>
                <div className="flex-[2] flex flex-col gap-2">
                    <Button
                        onClick={handleNext}
                        disabled={!livenessCaptured}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl disabled:opacity-50 shadow-lg hover:scale-[1.02] transition-all"
                    >
                        Finalizar Verificación
                    </Button>
                    {!livenessCaptured && (
                        <button
                            onClick={() => setLivenessCaptured(true)}
                            className="text-[10px] text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
                        >
                            ¿Problemas con la detección? Saltarme
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );

    const renderSuccess = () => (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8 py-10"
        >
            <div className="relative">
                <div className="w-32 h-32 bg-emerald-100 rounded-[3rem] flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle className="w-16 h-16" />
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute top-0 right-1/4 w-12 h-12 bg-alteha-turquoise rounded-2xl flex items-center justify-center text-white shadow-lg"
                >
                    <Star className="w-6 h-6 fill-white" />
                </motion.div>
            </div>

            <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">¡Verificación Enviada!</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    Tu información está siendo procesada. Pronto recibirás los beneficios completos de la plataforma Alteha.
                </p>
            </div>

            <Button
                onClick={() => router.push('/dashboard/specialist')}
                className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl text-lg shadow-xl hover:translate-y-[-4px] transition-all"
            >
                Volver al Dashboard
            </Button>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-outfit p-4 md:p-10 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-alteha-turquoise rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-alteha-violet rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-10">
                    <Link href="/dashboard/specialist" className="flex items-center gap-2 p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold hidden md:block">Salir</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="px-5 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                            <Shield className="w-5 h-5 text-alteha-turquoise" />
                            <span className="font-black text-slate-900">Verificación de Cuenta</span>
                        </div>
                        <Link href="/dashboard/specialist" className="hover:scale-105 transition-transform">
                            <Logo className="w-10 h-10" />
                        </Link>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[4rem] shadow-2xl border border-white p-8 md:p-16 min-h-[600px] flex flex-col justify-center">
                    {/* Progress indicator */}
                    {step !== 'success' && (
                        <div className="flex justify-center gap-3 mb-16">
                            {(['selection', 'document', 'liveness'] as const).map((s, idx) => (
                                <div key={s} className="flex items-center gap-3">
                                    <div className={`w-12 h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-20 bg-alteha-violet' :
                                        ((idx === 0 && step !== 'selection') || (idx === 1 && step === 'liveness')) ? 'bg-emerald-400' : 'bg-slate-100'
                                        }`} />
                                </div>
                            ))}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 'selection' && renderSelection()}
                        {step === 'document' && renderDocumentCapture()}
                        {step === 'liveness' && renderLiveness()}
                        {step === 'success' && renderSuccess()}
                    </AnimatePresence>
                </div>
            </div>

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}
