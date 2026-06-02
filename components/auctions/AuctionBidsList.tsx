"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, User, AlertCircle, RefreshCw, Phone, Mail,
    DollarSign, Stethoscope, Building2, Clock, Trophy, ChevronDown, ChevronUp,
    Calendar, Timer, ShieldCheck, Info, ExternalLink, Medal, X, MapPin, MessageSquare
} from 'lucide-react';
import { getAuctionBids, getTopOffers, getDoctorById, type BidDetailed, type TopOffer } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useUnreadCount } from '@/hooks/useChat';

interface AuctionBidsListProps {
    auctionId: number;
    auctionNumber: string;
    auctionStatus?: string;
    mode?: 'insurance' | 'doctor'; // insurance = full details, doctor = own bids only
    insuranceId?: number;
    insuranceName?: string;
    onActionSuccess?: () => void;
}

const ChatButtonWithBadge: React.FC<{
    auctionId: string;
    currentUserId: string;
    participantId: string;
    onClick: (e: React.MouseEvent) => void;
    title: string;
}> = ({ auctionId, currentUserId, participantId, onClick, title }) => {
    const unreadCount = useUnreadCount(auctionId, currentUserId, participantId);
    
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 rounded-xl bg-alteha-violet/10 text-alteha-violet flex items-center justify-center hover:bg-alteha-violet hover:text-white transition-all border border-alteha-violet/10 shadow-sm group/chat relative"
            title={title}
        >
            <MessageSquare className="w-5 h-5 group-hover/chat:scale-110 transition-transform" />
            {unreadCount > 0 && (
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                    {unreadCount}
                </motion.span>
            )}
        </button>
    );
};

export default function AuctionBidsList({ auctionId, auctionNumber, auctionStatus, mode = 'insurance', insuranceId, insuranceName, onActionSuccess }: AuctionBidsListProps) {
    const { userProfile } = useAuth();
    const [bids, setBids] = useState<BidDetailed[]>([]);
    const [topOffers, setTopOffers] = useState<TopOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedBid, setExpandedBid] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'top'>('top');
    const [doctorProfiles, setDoctorProfiles] = useState<Record<number, any>>({});
    const [loadingProfiles, setLoadingProfiles] = useState<Record<number, boolean>>({});
    const [isAwarding, setIsAwarding] = useState<number | null>(null);
    const [awardModalOpen, setAwardModalOpen] = useState(false);
    const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<{
        participantId: string;
        participantName: string;
        participantPhoto?: string;
    } | null>(null);

    const handleAward = (bidId: number) => {
        setSelectedBidId(bidId);
        setAwardModalOpen(true);
    };

    const confirmAward = async () => {
        if (!selectedBidId) return;
        
        setIsAwarding(selectedBidId);
        try {
            const { awardAuction } = await import('@/lib/api');
            const res = await awardAuction(auctionNumber, selectedBidId);
            if (res.code === '00' || (res as any).id) {
                setAwardModalOpen(false);
                if (onActionSuccess) {
                    onActionSuccess();
                } else {
                    window.location.reload();
                }
            } else {
                alert(res.message || 'Error al adjudicar subasta');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setIsAwarding(null);
        }
    };

    const handleViewDoctor = (doctorId: number) => {
        setSelectedDoctorId(doctorId);
        setIsDoctorModalOpen(true);
        fetchDoctorProfile(doctorId);
    };

    const fetchDoctorProfile = async (doctorId: number) => {
        if (doctorProfiles[doctorId] || loadingProfiles[doctorId]) return;
        
        setLoadingProfiles(prev => ({ ...prev, [doctorId]: true }));
        try {
            const res = await getDoctorById(doctorId);
            const data = (res as any).id ? res : (res.code === '00' ? res.data : null);
            
            if (data) {
                setDoctorProfiles(prev => ({ ...prev, [doctorId]: data }));
            }
        } catch (err) {
            console.error('Error fetching doctor profile:', err);
        } finally {
            setLoadingProfiles(prev => ({ ...prev, [doctorId]: false }));
        }
    };

    useEffect(() => {
        if (expandedBid) {
            const bid = bids.find(b => b.id === expandedBid);
            if (!bid) return;

            // Log for debugging
            console.log('Expanding bid:', bid);

            let doctorId = null;
            if (typeof bid.doctor === 'object' && bid.doctor !== null) {
                doctorId = bid.doctor.id;
            } else if (bid.doctor) {
                doctorId = bid.doctor;
            } else if ((bid as any).doctorId) {
                doctorId = (bid as any).doctorId;
            }

            console.log('Detected doctorId:', doctorId);

            if (doctorId) {
                fetchDoctorProfile(Number(doctorId));
            }
        }
    }, [expandedBid]);

    const loadBids = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Load both in parallel
            const [bidsRes, topRes] = await Promise.all([
                getAuctionBids(auctionId),
                getTopOffers(auctionId)
            ]);

            // Handle bids list
            let bidsData: BidDetailed[] = [];
            if (Array.isArray(bidsRes)) {
                bidsData = bidsRes;
            } else if (bidsRes.code === '00' && bidsRes.data) {
                bidsData = bidsRes.data;
            } else if ((bidsRes as any).content) {
                bidsData = (bidsRes as any).content;
            }

            // Sort by amount ascending (Inverse auction: lower is better)
            setBids([...bidsData].sort((a, b) => a.bidAmount - b.bidAmount));

            // Handle top offers
            if (Array.isArray(topRes)) {
                setTopOffers(topRes);
            } else if (topRes.code === '00' && topRes.data) {
                setTopOffers(Array.isArray(topRes.data) ? topRes.data : []);
            } else {
                setTopOffers([]);
            }

            // Handle deep link to chat
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                if (params.get('openChat') === 'true') {
                    const pId = params.get('participantId');
                    if (pId) {
                        // Find if it's a doctor in the bids
                        const bidWithDoctor = bidsData.find(b => String(b.doctor?.id) === pId);
                        if (bidWithDoctor) {
                            setActiveChat({
                                participantId: String(pId),
                                participantName: bidWithDoctor.doctor?.fullName || 'Médico',
                                participantPhoto: bidWithDoctor.doctor?.profileImageUrl || (bidWithDoctor as any).doctorPhoto || (bidWithDoctor.doctor as any)?.imageUrl
                            });
                        } else if (mode === 'doctor' && String(insuranceId) === pId) {
                            setActiveChat({
                                participantId: String(pId),
                                participantName: insuranceName || 'Compañía de Seguros',
                                participantPhoto: (bidsData[0] as any)?.auction?.insuranceCompany?.logoUrl || (bidsData[0] as any)?.insuranceCompany?.logoUrl
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading bids:', err);
            setError('No se pudieron cargar las ofertas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBids();
    }, [auctionId]);

    // Pre-fetch doctor profiles for all bids as soon as they are loaded
    useEffect(() => {
        const doctorsToFetch = new Set<number>();
        
        // From all bids
        bids.forEach(bid => {
            const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
            if (dId) doctorsToFetch.add(Number(dId));
        });

        // From top offers
        topOffers.forEach(offer => {
            const dId = (offer as any).doctorId || (offer as any).doctor?.id;
            if (dId) doctorsToFetch.add(Number(dId));
        });

        // Trigger fetches
        doctorsToFetch.forEach(id => fetchDoctorProfile(id));
    }, [bids, topOffers]);

    const totalBids = bids.length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 text-alteha-violet animate-spin" />
                <span className="text-slate-400 font-bold text-sm">Cargando ofertas...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-slate-500 font-bold text-sm">{error}</p>
                <button
                    onClick={loadBids}
                    className="flex items-center gap-2 text-alteha-violet font-black text-xs uppercase tracking-widest hover:underline"
                >
                    <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-alteha-violet/10 rounded-xl">
                        <Trophy className="w-5 h-5 text-alteha-violet" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Ofertas Recibidas</h3>
                        <p className="text-xs font-bold text-slate-400">
                            {totalBids} {totalBids === 1 ? 'oferta' : 'ofertas'} en esta subasta
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadBids}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-alteha-violet"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            {topOffers.length > 0 && totalBids > 0 && (
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
                    {(['top', 'all'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab
                                    ? 'bg-white text-alteha-violet shadow-md'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab === 'top' ? '🏆 Top Ofertas' : `Todas (${totalBids})`}
                        </button>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {totalBids === 0 && topOffers.length === 0 && (
                <div className="py-16 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <DollarSign className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Aún no hay ofertas para esta subasta</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* TOP OFFERS TAB */}
                {activeTab === 'top' && topOffers.length > 0 && (
                    <motion.div
                        key="top"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {topOffers.map((offer, i) => (
                            <motion.div
                                key={offer.bidId || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-6 rounded-[2.5rem] border-2 relative overflow-hidden transition-all hover:scale-[1.02] ${
                                    i === 0
                                        ? 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-100/50'
                                        : i === 1
                                        ? 'bg-slate-50 border-slate-200 shadow-lg shadow-slate-100'
                                        : i === 2
                                        ? 'bg-orange-50/30 border-orange-100 shadow-md'
                                        : 'bg-white border-slate-100'
                                }`}
                            >
                                {/* Ranking Ribbon */}
                                {i < 3 && (
                                    <div className={`absolute top-0 right-10 px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm z-20 ${
                                        i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-orange-600'
                                    }`}>
                                        {i === 0 ? '🏆 Mejor Oferta' : i === 1 ? '🥈 2da Mejor' : '🥉 3ra Mejor'}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 relative z-10">
                                    {/* Rank Circle */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 ${
                                        i === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' :
                                        i === 1 ? 'bg-slate-300 text-slate-700' :
                                        i === 2 ? 'bg-orange-300 text-white' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {i + 1}
                                    </div>

                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                                    {(() => {
                                        const dId = (offer as any).doctorId || (offer as any).doctor?.id;
                                        const profile = dId ? doctorProfiles[dId] : null;
                                        const imageUrl = profile?.profileImageUrl || offer.doctorProfileImageUrl || (offer as any).doctor?.profileImageUrl;
                                        
                                        return imageUrl ? (
                                            <img src={imageUrl} className="w-full h-full object-cover" alt="Doctor" />
                                        ) : (
                                            <User className="w-6 h-6 text-slate-300" />
                                        );
                                    })()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 truncate">{offer.doctorName || (offer as any).doctorFirstName || 'Médico'}</p>
                                    {offer.clinicName && (
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> {offer.clinicName}
                                        </p>
                                    )}
                                    {offer.specialties && offer.specialties.length > 0 && (
                                        <p className="text-[10px] text-alteha-violet font-black uppercase tracking-widest truncate">
                                            {offer.specialties.join(', ')}
                                        </p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oferta</p>
                                    <p className={`text-xl font-black ${i === 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                                        ${(offer.bidAmount || offer.totalAmount || 0).toLocaleString()}
                                    </p>
                                    {offer.createdAt && (
                                        <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 justify-end mt-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {new Date(offer.createdAt).toLocaleDateString('es-ES')}
                                        </p>
                                    )}
                                    
                                    {/* Chat Button (Insurance only) */}
                                    {mode === 'insurance' && auctionStatus === 'ACTIVE' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const dId = (offer as any).doctorId || (offer as any).doctor?.id;
                                                const dName = offer.doctorName || (offer as any).doctorFirstName || 'Médico';
                                                setActiveChat({
                                                    participantId: String(dId),
                                                    participantName: dName
                                                });
                                            }}
                                            className="mt-3 w-full py-2 bg-alteha-violet/10 text-alteha-violet rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-alteha-violet hover:text-white transition-all border border-alteha-violet/20"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Chat con Médico
                                        </button>
                                    )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* ALL BIDS TAB */}
                {(activeTab === 'all' || topOffers.length === 0) && bids.length > 0 && (
                    <motion.div
                        key="all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {bids.map((bid, i) => (
                            <motion.div
                                key={bid.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden hover:border-alteha-violet/20 transition-all"
                            >
                                <div
                                    className={`p-5 flex items-center gap-4 cursor-pointer relative ${
                                        expandedBid === bid.id ? 'bg-slate-50' : ''
                                    }`}
                                    onClick={() => setExpandedBid(expandedBid === bid.id ? null : bid.id)}
                                >
                                    {/* "Me" Badge */}
                                    {(() => {
                                        const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
                                        const isMe = userProfile?.id && dId === userProfile.id;
                                        
                                        return isMe ? (
                                            <div className="absolute top-0 left-8 px-3 py-1 rounded-b-lg bg-alteha-violet text-white text-[8px] font-black uppercase tracking-widest shadow-sm z-20">
                                                Yo
                                            </div>
                                        ) : null;
                                    })()}
                                    {/* Ranking Badge */}
                                    {i < 3 && (
                                        <div className={`absolute top-0 right-10 px-4 py-1 rounded-b-xl text-[9px] font-black uppercase tracking-widest text-white shadow-sm z-20 ${
                                            i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-slate-400'
                                        }`}>
                                            {i === 0 ? 'Mejor Opción' : i === 1 ? '2da Mejor' : '3ra Mejor'}
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div 
                                        className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-alteha-violet/30 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
                                            if (dId) handleViewDoctor(Number(dId));
                                        }}
                                    >
                                        {(() => {
                                            const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
                                            const profile = dId ? doctorProfiles[dId] : null;
                                            const imageUrl = profile?.profileImageUrl || bid.doctor?.profileImageUrl;
                                            
                                            return imageUrl ? (
                                                <img src={imageUrl} className="w-full h-full object-cover" alt="Doctor" />
                                            ) : (
                                                <User className="w-6 h-6 text-slate-300" />
                                            );
                                        })()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p 
                                                className="font-black text-slate-900 truncate cursor-pointer hover:text-alteha-violet transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
                                                    if (dId) handleViewDoctor(Number(dId));
                                                }}
                                            >
                                                {(() => {
                                                    const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
                                                    return bid.doctor?.fullName || 
                                                           (bid.doctor?.firstName ? `${bid.doctor.firstName} ${bid.doctor.lastName}` : null) || 
                                                           doctorProfiles[dId]?.fullName || 
                                                           (bid as any).doctorName || 
                                                           (bid as any).doctorFirstName || 
                                                           'Médico';
                                                })()}
                                            </p>
                                            {bid.bidType && (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-500">
                                                    {bid.bidType}
                                                </span>
                                            )}
                                        </div>
                                        {bid.clinic?.name && (
                                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" /> {bid.clinic.name}
                                            </p>
                                        )}
                                        {bid.doctor?.specialties && bid.doctor.specialties.length > 0 && (
                                            <p className="text-[10px] text-alteha-violet font-black uppercase tracking-widest truncate">
                                                <Stethoscope className="w-2.5 h-2.5 inline mr-1" />
                                                {bid.doctor.specialties.map(s => s.name || s.code).join(', ')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Amount + expand */}
                                    <div className="text-right flex items-center gap-3 flex-shrink-0">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                            <p className="text-xl font-black text-slate-900">
                                                ${(bid.bidAmount || bid.totalAmount || 0).toLocaleString()}
                                            </p>
                                            {bid.createdAt && (
                                                <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 justify-end mt-0.5">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(bid.createdAt).toLocaleDateString('es-ES')}
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* Direct Chat Icon */}
                                        {auctionStatus === 'ACTIVE' && (
                                            <ChatButtonWithBadge
                                                auctionId={String(auctionId)}
                                                currentUserId={String(userProfile?.id || 'guest')}
                                                participantId={String(mode === 'insurance' 
                                                    ? (bid.doctor?.id || (typeof bid.doctor === 'number' ? bid.doctor : null) || (bid as any).doctorId || (bid as any).doctor?.id)
                                                    : (insuranceId || (bid as any).auction?.insuranceCompany?.id || (bid as any).insuranceCompany?.id)
                                                )}
                                                title={mode === 'insurance' ? "Chat con médico" : "Chat con seguro"}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (mode === 'insurance') {
                                                        const dId = bid.doctor?.id || (typeof bid.doctor === 'number' ? bid.doctor : null) || (bid as any).doctorId || (bid as any).doctor?.id;
                                                        const dName = bid.doctor?.fullName || (bid.doctor?.firstName ? `${bid.doctor.firstName} ${bid.doctor.lastName}` : (bid as any).doctorName || 'Médico');
                                                        
                                                        if (!dId) {
                                                            alert('No se pudo encontrar el ID del médico para iniciar el chat.');
                                                            return;
                                                        }

                                                        setActiveChat({
                                                            participantId: String(dId),
                                                            participantName: dName,
                                                            participantPhoto: bid.doctor?.profileImageUrl || (bid as any).doctorPhoto || (bid.doctor as any)?.imageUrl
                                                        });
                                                    } else if (mode === 'doctor') {
                                                        const iId = insuranceId || (bid as any).auction?.insuranceCompany?.id || (bid as any).insuranceCompany?.id;
                                                        const iName = insuranceName || (bid as any).auction?.insuranceCompany?.name || (bid as any).auction?.insuranceCompany?.name || 'Compañía de Seguros';
                                                        if (iId) {
                                                            setActiveChat({
                                                                participantId: String(iId),
                                                                participantName: iName,
                                                                participantPhoto: (bid as any).auction?.insuranceCompany?.logoUrl || (bid as any).insuranceCompany?.logoUrl || (bid as any).insuranceCompany?.logo
                                                            });
                                                        } else {
                                                            alert('No se pudo identificar a la compañía de seguros.');
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                        
                                        <div className="text-slate-300">
                                            {expandedBid === bid.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                <AnimatePresence>
                                    {expandedBid === bid.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                                                {/* Doctor Info Card */}
                                                {(() => {
                                                    const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
                                                    if (!dId) return null;

                                                    const profile = doctorProfiles[dId];
                                                    return (
                                                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4 shadow-xl shadow-slate-200">
                                                            <div className="flex items-start gap-5">
                                                                <div 
                                                                    className="w-20 h-20 rounded-[1.5rem] bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5 cursor-pointer hover:ring-2 hover:ring-alteha-turquoise/30 transition-all"
                                                                    onClick={() => handleViewDoctor(Number(dId))}
                                                                >
                                                                    {(profile?.profileImageUrl || bid.doctor?.profileImageUrl) ? (
                                                                        <img src={profile?.profileImageUrl || bid.doctor?.profileImageUrl} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <User className="w-10 h-10 text-white/20" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0 pt-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 
                                                                            className="font-black text-lg leading-tight truncate cursor-pointer hover:text-alteha-turquoise transition-colors"
                                                                            onClick={() => handleViewDoctor(Number(dId))}
                                                                        >
                                                                            {profile?.fullName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (loadingProfiles[dId] ? 'Cargando médico...' : 'Información no disponible'))}
                                                                        </h4>
                                                                        {profile?.licenseNumber && (
                                                                            <span className="px-2 py-0.5 rounded-full bg-alteha-turquoise/20 text-alteha-turquoise text-[9px] font-black uppercase tracking-widest border border-alteha-turquoise/30">
                                                                                MPPS: {profile.licenseNumber}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {profile?.specialties && profile.specialties.length > 0 && (
                                                                        <p className="text-xs font-bold text-alteha-turquoise mb-3">
                                                                            {profile.specialties.map((s: any) => s.name || s.code).join(' • ')}
                                                                        </p>
                                                                    )}

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                                                        {profile?.phone && (
                                                                            <p className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                                                                                <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                                                                    <Phone className="w-3 h-3 text-alteha-turquoise" />
                                                                                </div>
                                                                                {profile.phone}
                                                                            </p>
                                                                        )}
                                                                        {profile?.email && (
                                                                            <p className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                                                                                <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                                                                    <Mail className="w-3 h-3 text-alteha-turquoise" />
                                                                                </div>
                                                                                {profile.email}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {profile?.bio && (
                                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                                        <Info className="w-3 h-3" /> Perfil Profesional
                                                                    </p>
                                                                    <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                                                                        "{profile.bio}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {(profile?.affiliatedClinics || profile?.clinics || profile?.preferredClinics) && (
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                        <Building2 className="w-3 h-3" /> Clínicas Afiliadas
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {(profile.affiliatedClinics || profile.clinics || profile.preferredClinics).map((clinic: any) => (
                                                                            <div key={clinic.id} className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                                                                                {clinic.logoUrl && <img src={clinic.logoUrl} className="w-4 h-4 rounded-md object-cover" />}
                                                                                <span className="text-[11px] font-bold text-slate-200">{clinic.name}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {loadingProfiles[dId] && (
                                                                <div className="flex items-center gap-2 justify-center py-2">
                                                                    <Loader2 className="w-4 h-4 animate-spin text-alteha-turquoise" />
                                                                    <span className="text-[10px] font-black text-alteha-turquoise uppercase tracking-widest">Actualizando información...</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Bid Logistics */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-alteha-violet/10 flex items-center justify-center">
                                                            <Calendar className="w-5 h-5 text-alteha-violet" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Propuesta</p>
                                                            <p className="font-black text-slate-900">
                                                                {bid.proposedStartDate ? new Date(bid.proposedStartDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : 'No especificada'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                                            <Timer className="w-5 h-5 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duración Estimada</p>
                                                            <p className="font-black text-slate-900">
                                                                {bid.estimatedDurationDays ? `${bid.estimatedDurationDays} días` : 'No especificada'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Budget breakdown */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {bid.doctorFee != null && (
                                                        <div className="bg-slate-50 p-3 rounded-xl">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hon. Médicos</p>
                                                            <p className="font-black text-slate-900">${(bid.doctorFee || 0).toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                    {bid.clinicFee != null && (
                                                        <div className="bg-slate-50 p-3 rounded-xl">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Gastos Clínica</p>
                                                            <p className="font-black text-slate-900">${(bid.clinicFee || 0).toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Notes */}
                                                {bid.notes && (
                                                    <div className="bg-alteha-violet/5 p-3 rounded-xl border-l-4 border-alteha-violet">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas del Médico</p>
                                                        <p className="text-sm font-medium text-slate-700">{bid.notes}</p>
                                                    </div>
                                                )}

                                                {/* Bid items */}
                                                {bid.bidItems && bid.bidItems.length > 0 && (
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ítems de la Oferta</p>
                                                        {bid.bidItems.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl text-xs">
                                                                <span className="font-bold text-slate-700">{item.itemName}</span>
                                                                <span className="font-black text-alteha-violet">{item.quantity} × ${(item.unitPrice || 0).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                {auctionStatus === 'ACTIVE' && (
                                                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                                                        <Button
                                                            onClick={() => {
                                                                if (mode === 'insurance') {
                                                                    const dId = typeof bid.doctor === 'object' ? bid.doctor?.id : (typeof bid.doctor === 'number' ? bid.doctor : (bid as any).doctorId);
                                                                    const dName = (bid.doctor as any)?.fullName || ((bid.doctor as any)?.firstName ? `${(bid.doctor as any).firstName} ${(bid.doctor as any).lastName}` : 'Médico');
                                                                    setActiveChat({
                                                                        participantId: String(dId),
                                                                        participantName: dName
                                                                    });
                                                                } else if (mode === 'doctor') {
                                                                    // Chat with insurance company
                                                                    const iId = insuranceId || (bid as any).auction?.insuranceCompany?.id || (bid as any).insuranceCompany?.id;
                                                                    const iName = insuranceName || (bid as any).auction?.insuranceCompany?.name || (bid as any).insuranceCompany?.name || 'Compañía de Seguros';
                                                                    if (iId) {
                                                                        setActiveChat({
                                                                            participantId: String(iId),
                                                                            participantName: iName
                                                                        });
                                                                    } else {
                                                                        alert('No se pudo identificar a la compañía de seguros para iniciar el chat.');
                                                                    }
                                                                }
                                                            }}
                                                            className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            {mode === 'insurance' ? 'Chat con Médico' : 'Chat con Seguro'}
                                                        </Button>
                                                        
                                                        {mode === 'insurance' && (
                                                            <Button
                                                                onClick={() => handleAward(bid.id)}
                                                                disabled={isAwarding !== null}
                                                                className="flex-[2] bg-alteha-violet text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-violet-100 hover:scale-[1.02] transition-all disabled:opacity-50"
                                                            >
                                                                {isAwarding === bid.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Trophy className="w-4 h-4" />
                                                                        Adjudicar
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Award Confirmation Modal */}
            <Modal
                isOpen={awardModalOpen}
                onClose={() => !isAwarding && setAwardModalOpen(false)}
                title="Adjudicar Subasta"
                maxWidth="max-w-md"
            >
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Trophy className="w-10 h-10 text-alteha-violet" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Confirmar Adjudicación?</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            ¿Estás seguro de que deseas adjudicar la subasta a este médico? <br/>
                            <span className="text-amber-600 font-bold block mt-2">Esta acción cerrará la subasta permanentemente.</span>
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={confirmAward}
                            disabled={!!isAwarding}
                            className="bg-alteha-violet text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-violet-100 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                        >
                            {isAwarding ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="w-6 h-6" />
                                    Sí, Adjudicar Médico
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => setAwardModalOpen(false)}
                            disabled={!!isAwarding}
                            className="bg-slate-50 text-slate-400 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Doctor Detail Modal */}
            <Modal
                isOpen={isDoctorModalOpen}
                onClose={() => setIsDoctorModalOpen(false)}
                title="Perfil del Médico"
                maxWidth="max-w-2xl"
            >
                {selectedDoctorId && doctorProfiles[selectedDoctorId] ? (
                    <div className="space-y-8 py-4">
                        {/* Header Profile */}
                        <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                            <div className="w-32 h-32 rounded-[2rem] bg-white border-4 border-white shadow-xl overflow-hidden shrink-0">
                                {doctorProfiles[selectedDoctorId].profileImageUrl ? (
                                    <img src={doctorProfiles[selectedDoctorId].profileImageUrl} alt="Doctor" className="w-full h-full object-cover" />
                                ) : <User className="w-full h-full p-6 text-slate-200" />}
                            </div>
                            <div className="text-center md:text-left">
                                <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {doctorProfiles[selectedDoctorId].firstName} {doctorProfiles[selectedDoctorId].lastName}
                                </h4>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                    <span className="px-4 py-1 bg-alteha-violet text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                        Especialista
                                    </span>
                                    <span className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                                        <Medal className="w-4 h-4 fill-amber-500" /> Verificado
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Stethoscope className="w-3 h-3" /> Especialidades
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {doctorProfiles[selectedDoctorId].specialties?.map((s: any) => (
                                            <span key={s.id} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                                {s.name}
                                            </span>
                                        )) || <span className="text-sm font-bold text-slate-900">Cirujano General</span>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Ubicación
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {doctorProfiles[selectedDoctorId].location || 'Caracas, Venezuela'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Contacto
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        {doctorProfiles[selectedDoctorId].email || 'dr.contacto@alteha.com'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Phone className="w-3 h-3" /> Teléfono
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {doctorProfiles[selectedDoctorId].phone || '+58 412 000 0000'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bio / About */}
                        <div className="px-4 space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acerca del Especialista</p>
                            <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                {doctorProfiles[selectedDoctorId].bio || 'Este especialista está certificado por la red Alteha y cuenta con amplia experiencia en procedimientos quirúrgicos complejos. Su trayectoria profesional destaca por la excelencia en el cuidado del paciente y resultados quirúrgicos superiores.'}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end px-4">
                            <Button
                                onClick={() => setIsDoctorModalOpen(false)}
                                className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black"
                            >
                                Cerrar Perfil
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-alteha-violet animate-spin mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando perfil médico...</p>
                    </div>
                )}
            </Modal>

            {/* Chat Modal */}
            <Modal
                isOpen={!!activeChat}
                onClose={() => setActiveChat(null)}
                title="Mensajería Directa"
                maxWidth="max-w-xl"
            >
                <div className="h-[600px] -m-6">
                    {activeChat && (
                        <ChatWindow 
                            auctionId={String(auctionId)}
                            auctionNumber={auctionNumber}
                            participantId={activeChat.participantId}
                            participantName={activeChat.participantName}
                            participantPhoto={activeChat.participantPhoto}
                            currentUserId={String(userProfile?.id || 'guest')}
                            currentUserName={userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : (userProfile?.name || 'Usuario')}
                            currentUserPhoto={userProfile?.profileImageUrl || userProfile?.logoUrl || (userProfile as any)?.imageUrl || (userProfile as any)?.avatarUrl}
                            onClose={() => setActiveChat(null)}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
