"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gavel,
    Calendar,
    Clock,
    FileText,
    AlertCircle,
    CheckCircle2,
    Loader2,
    DollarSign,
    Plus,
    Trash2,
    Info,
    ChevronDown,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { placeAdvancedBid, type Auction, type BidPayload, type BidItem } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    auction: Auction;
    onSuccess?: () => void;
    hideHeader?: boolean;
}

export default function AdvancedBidForm({ auction, onSuccess, hideHeader = false }: Props) {
    const { userProfile } = useAuth();
    const pathname = usePathname();

    const role = useMemo(() => {
        if (pathname.includes('/specialist/')) return 'DOCTOR';
        if (pathname.includes('/clinic/')) return 'CLINIC';
        if (pathname.includes('/provider/')) return 'PHARMACY';
        return userProfile?.roles?.[0] || '';
    }, [pathname, userProfile]);

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // Form state
    const [bidAmount, setBidAmount] = useState<string>('');
    const [bidType, setBidType] = useState<any>('');
    const [modality, setModality] = useState<'SOLO_MEDICO' | 'PAQUETE_COMPLETO'>('SOLO_MEDICO');
    const [proposedStartDate, setProposedStartDate] = useState('');
    const [estimatedDurationDays, setEstimatedDurationDays] = useState('1');
    const [notes, setNotes] = useState('');
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

    const priceGuidance = useMemo(() => {
        const amount = parseFloat(bidAmount);
        if (!amount || isNaN(amount) || !bidType) return null;

        let target = 0;
        if (role === 'DOCTOR') target = modality === 'PAQUETE_COMPLETO' ? (auction.maxBudget || 0) : (auction.doctorBudget || 0);
        else if (bidType === 'DOCTOR_ONLY') target = auction.doctorBudget || 0;
        else if (bidType === 'CLINIC_ONLY') target = auction.clinicBudget || 0;
        else if (bidType === 'BOTH') target = auction.maxBudget || 0;

        if (target === 0) return null;

        if (amount <= target * 0.85) return { color: 'text-emerald-500', bg: 'bg-emerald-50', message: '¡Excelente oferta! Tu propuesta es muy competitiva.', icon: CheckCircle2 };
        if (amount <= target) return { color: 'text-blue-500', bg: 'bg-blue-50', message: 'Oferta competitiva. Estás dentro del presupuesto sugerido.', icon: CheckCircle2 };
        if (amount <= target * 1.15) return { color: 'text-amber-500', bg: 'bg-amber-50', message: 'Tu oferta está ligeramente por encima del presupuesto sugerido.', icon: AlertCircle };
        return { color: 'text-red-500', bg: 'bg-red-50', message: 'Tu oferta está por encima del presupuesto. Considera revisarla para ser más competitivo.', icon: AlertCircle };
    }, [bidAmount, bidType, auction, modality, role]);

    const explanations: Record<string, string> = {
        'DOCTOR_ONLY': 'En esta modalidad, tú solo ofertas por tus honorarios médicos profesionales. La aseguradora deberá buscar una clínica por separado o el paciente ya tiene una seleccionada.',
        'CLINIC_ONLY': 'La clínica oferta únicamente por los gastos hospitalarios, quirófano e insumos. Los honorarios del médico se manejan de forma independiente.',
        'BOTH': 'Esta es una oferta integral que incluye tanto tus honorarios como los gastos de la clínica. Debes seleccionar la clínica con la que estás coordinando esta propuesta.',
        'PHARMACY': 'Oferta para el suministro de medicamentos e insumos médicos requeridos para el procedimiento.'
    };

    // Initialize bidType when role is determined
    useEffect(() => {
        if (role === 'DOCTOR') setBidType('DOCTOR_ONLY');
        else if (role === 'CLINIC') setBidType('CLINIC_ONLY');
        else if (role === 'PHARMACY') setBidType('PHARMACY');
    }, [role]);

    // Items for Pharmacy / Supplies
    const [bidItems, setBidItems] = useState<BidItem[]>(
        (auction.requiredSupplies || []).map(s => ({
            auctionSupply: { id: s.id! },
            itemName: s.itemName,
            quantity: s.quantity,
            unitPrice: s.referenceAmount || 0,
            totalPrice: (s.quantity || 1) * (s.referenceAmount || 0)
        }))
    );

    const handleItemPriceChange = (index: number, price: number) => {
        const newItems = [...bidItems];
        newItems[index].unitPrice = price;
        newItems[index].totalPrice = price * newItems[index].quantity;
        setBidItems(newItems);

        // Update total bid amount if pharmacy
        if (role === 'PHARMACY' || role === 'PROVIDER') {
            const total = newItems.reduce((acc, item) => acc + item.totalPrice, 0);
            setBidAmount(total.toString());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');

        try {
            const payload: BidPayload = {
                auction: { id: auction.id },
                bidType: bidType,
                notes: notes || (role === 'PHARMACY' ? 'Oferta de suministros médicos.' : 'Oferta de servicios profesionales.'),
                bidAmount: parseFloat(bidAmount) || 0,
            };

            if (role === 'DOCTOR') {
                payload.bidType = 'DOCTOR_ONLY';
                payload.modality = modality;
                if (userProfile?.id) {
                    payload.doctor = { id: userProfile.id };
                    payload.doctorId = userProfile.id;
                }

                if (!selectedClinicId) {
                    setStatus('error');
                    setMessage(modality === 'SOLO_MEDICO'
                        ? 'Selecciona la clínica a invitar'
                        : 'Selecciona la clínica donde se realizará el procedimiento');
                    setIsLoading(false);
                    return;
                }
                const cId = parseInt(selectedClinicId);
                payload.clinic = { id: cId };
                payload.clinicId = cId;
            }

            if (role === 'CLINIC') {
                if (userProfile?.id) {
                    payload.clinic = { id: userProfile.id };
                    payload.clinicId = userProfile.id;
                }
                
                if (bidType === 'BOTH' || bidType === 'CLINIC_ONLY') {
                    if (!selectedDoctorId) {
                        setStatus('error');
                        setMessage('Por favor selecciona el médico asociado a tu propuesta');
                        setIsLoading(false);
                        return;
                    }
                    const dId = parseInt(selectedDoctorId);
                    payload.doctor = { id: dId };
                    payload.doctorId = dId;
                }
            }

            if (role !== 'PHARMACY') {
                payload.proposedStartDate = proposedStartDate || new Date().toISOString().split('T')[0];
                payload.estimatedDurationDays = parseInt(estimatedDurationDays);
            } else {
                payload.bidItems = bidItems.map(item => ({
                    auctionSupply: item.auctionSupply,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                }));
            }

            console.log('[AdvancedBidForm] Sending payload:', JSON.stringify(payload, null, 2));
            const response = await placeAdvancedBid(payload);

            if (response.code === '00' || (response as any).id) {
                setStatus('success');
                setMessage('¡Oferta enviada con éxito!');
                if (onSuccess) setTimeout(onSuccess, 2000);
            } else {
                setStatus('error');
                setMessage(response.message || 'Error al enviar la oferta');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-10 text-center space-y-4"
            >
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-200">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{message}</h3>
                <p className="text-emerald-700 font-medium pb-4">Tu propuesta ha sido registrada y notificada a la aseguradora.</p>
                <Button onClick={() => setStatus('idle')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black">
                    Realizar otra oferta
                </Button>
            </motion.div>
        );
    }

    if (!['ACTIVE', 'PUBLISHED'].includes(auction.status)) {
        return (
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-100 p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Subasta No Disponible</h3>
                <p className="text-slate-500 font-medium">
                    Esta subasta se encuentra en estado <span className="font-bold text-slate-900">&quot;{auction.status}&quot;</span>.
                    Para poder enviar una oferta, la subasta debe estar <span className="font-bold text-emerald-600">&quot;ACTIVA&quot;</span> o <span className="font-bold text-blue-600">&quot;PUBLICADA&quot;</span>.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`${hideHeader ? '' : 'bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100'} overflow-hidden font-outfit`}>
            {/* Header */}
            {!hideHeader && (
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute right-6 top-6 opacity-10">
                        <Gavel className="w-20 h-20" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-alteha-turquoise mb-1">Subasta #{auction.auctionNumber}</p>
                    <h2 className="text-2xl font-black tracking-tight">Enviar Propuesta</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Completa los campos para participar en la subasta.</p>
                </div>
            )}

            <div className={`${hideHeader ? 'p-2' : 'p-8'} space-y-6`}>
                {/* Role Specific Selection */}
                {(role === 'DOCTOR' || role === 'CLINIC') && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" />
                            Tipo de Cobertura
                        </p>
                        {role === 'DOCTOR' ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { id: 'SOLO_MEDICO', label: 'Solo Médico', icon: Gavel, desc: 'Tus honorarios · invitas a la clínica' },
                                        { id: 'PAQUETE_COMPLETO', label: 'Paquete Completo', icon: CheckCircle2, desc: 'Paquete total · tú le pagas a la clínica' },
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => { setModality(m.id as any); setBidType('DOCTOR_ONLY'); }}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all group ${modality === m.id
                                                ? 'border-alteha-violet bg-violet-50'
                                                : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                                                }`}
                                        >
                                            <m.icon className={`w-5 h-5 mb-2 ${modality === m.id ? 'text-alteha-violet' : 'text-slate-400'}`} />
                                            <p className={`text-sm font-black ${modality === m.id ? 'text-alteha-violet' : 'text-slate-700'}`}>{m.label}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{m.desc}</p>
                                        </button>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start"
                                >
                                    <Info className="w-4 h-4 text-alteha-violet mt-0.5 shrink-0" />
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {modality === 'SOLO_MEDICO'
                                            ? 'Ofertas solo tus honorarios profesionales. La clínica que elijas recibirá una invitación; si la acepta y define sus honorarios, se arma la dupla médico + clínica visible para el seguro.'
                                            : 'Ofertas el paquete completo y te responsabilizas de pagarle a la clínica. La clínica no recibe invitación y tu oferta llega directa a la aseguradora.'}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-3 pt-2"
                                >
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                        {modality === 'SOLO_MEDICO' ? 'Clínica a invitar' : 'Clínica (sede del procedimiento)'}
                                    </label>
                                    <div className="relative group">
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none transition-colors" />
                                        <select
                                            required
                                            value={selectedClinicId}
                                            onChange={(e) => setSelectedClinicId(e.target.value)}
                                            className="w-full pl-4 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-black text-slate-900 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Selecciona una clínica --</option>
                                            {(userProfile?.preferredClinics || []).map((clinic: any) => (
                                                <option key={clinic.id} value={clinic.id}>
                                                    {clinic.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-amber-600 font-bold italic ml-1">
                                        {modality === 'SOLO_MEDICO'
                                            ? '* Se le enviará una invitación a esta clínica para que confirme y defina sus honorarios.'
                                            : '* Indica la clínica donde se realizará el procedimiento (no recibirá invitación).'}
                                    </p>
                                </motion.div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { id: 'CLINIC_ONLY', label: 'Solo Clínica', icon: Clock, desc: 'Gastos hospitalarios' },
                                        { id: 'BOTH', label: 'Paquete Completo', icon: CheckCircle2, desc: 'Clínica + Médico' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setBidType(type.id)}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all group ${bidType === type.id
                                                ? 'border-alteha-violet bg-violet-50'
                                                : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                                                }`}
                                        >
                                            <type.icon className={`w-5 h-5 mb-2 ${bidType === type.id ? 'text-alteha-violet' : 'text-slate-400'}`} />
                                            <p className={`text-sm font-black ${bidType === type.id ? 'text-alteha-violet' : 'text-slate-700'}`}>{type.label}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{type.desc}</p>
                                        </button>
                                    ))}
                                </div>

                                {bidType && explanations[bidType] && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start"
                                    >
                                        <Info className="w-4 h-4 text-alteha-violet mt-0.5 shrink-0" />
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {explanations[bidType]}
                                        </p>
                                    </motion.div>
                                )}

                                {(bidType === 'BOTH' || bidType === 'CLINIC_ONLY') && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-3 pt-2"
                                    >
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                            Selecciona el Médico Asociado
                                        </label>
                                        <div className="relative group">
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none transition-colors" />
                                            <select
                                                required
                                                value={selectedDoctorId}
                                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                                className="w-full pl-4 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-black text-slate-900 transition-all outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">-- Selecciona un médico --</option>
                                                {(userProfile?.preferredDoctors || []).map((doctor: any) => (
                                                    <option key={doctor.id} value={doctor.id}>
                                                        {doctor.fullName || doctor.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-amber-600 font-bold italic ml-1">
                                            * Es obligatorio indicar el médico que realizará el procedimiento para este tipo de oferta.
                                        </p>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Amount and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Monto de la Oferta (USD)
                        </label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-alteha-violet transition-colors" />
                            <input
                                type="number"
                                required
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                disabled={role === 'PHARMACY'}
                                placeholder="0.00"
                                className={`w-full pl-12 pr-4 py-4 rounded-2xl font-black text-lg transition-all outline-none border-2 ${role === 'PHARMACY' ? 'bg-slate-100 border-transparent text-slate-500' : 'bg-slate-50 border-transparent focus:border-alteha-violet focus:bg-white text-slate-900'
                                    }`}
                            />
                        </div>
                        {priceGuidance && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex items-center gap-2 p-3 rounded-xl border ${priceGuidance.bg} ${priceGuidance.color.replace('text-', 'border-').replace('500', '100')}`}
                            >
                                <priceGuidance.icon className={`w-4 h-4 ${priceGuidance.color}`} />
                                <p className={`text-[10px] font-bold ${priceGuidance.color}`}>{priceGuidance.message}</p>
                            </motion.div>
                        )}
                        {role === 'PHARMACY' && <p className="text-[10px] text-slate-400 font-bold italic">Calculado automáticamente de los sumistros.</p>}
                    </div>

                    {role !== 'PHARMACY' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Fecha Propuesta de Inicio
                            </label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-alteha-violet transition-colors" />
                                <input
                                    type="date"
                                    required
                                    value={proposedStartDate}
                                    onChange={(e) => setProposedStartDate(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-black text-slate-900 transition-all outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Pharmacy Supplies Table */}
                {role === 'PHARMACY' && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5" />
                            Detalle de Suministros
                        </p>
                        <div className="space-y-3">
                            {bidItems.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-black text-slate-900">{item.itemName}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Cantidad: {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">$</span>
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                                                className="w-32 pl-7 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-black text-slate-900 outline-none focus:border-alteha-turquoise"
                                            />
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</p>
                                            <p className="font-black text-slate-900">${item.totalPrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center justify-between">
                        Observaciones y Notas
                        <span className="text-slate-300 font-medium">Opcional</span>
                    </label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Describe detalles adicionales de tu oferta..."
                        className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-alteha-violet focus:bg-white rounded-2xl font-medium text-slate-900 transition-all outline-none resize-none"
                    />
                </div>

                {/* Info Alert */}
                <div className="flex gap-4 p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                    <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                        Al enviar esta oferta, te comprometes a mantener los precios y condiciones por la duración de la subasta. Una vez adjudicada, la oferta es vinculante.
                    </p>
                </div>

                {/* Status Message */}
                <AnimatePresence>
                    {status === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm"
                        >
                            <AlertCircle className="w-5 h-5" />
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-alteha-violet hover:bg-violet-700 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl shadow-violet-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Enviando propuesta...
                        </>
                    ) : (
                        <>
                            <Gavel className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            Confirmar y Enviar Oferta
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
