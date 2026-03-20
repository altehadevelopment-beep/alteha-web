"use client";

import React, { useState } from 'react';
import { 
    AlertCircle, 
    FileText, 
    MessageSquare, 
    Clock, 
    CheckCircle2,
    ShieldAlert,
    ChevronRight,
    Search,
    Filter,
    UploadCloud,
    Building2,
    Shield,
    FileSignature,
    Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data based on realistic insurance/medical disputes
const dummyDisputes = [
    {
        id: 'DSP-8921',
        auctionId: '882',
        auctionTitle: 'Colecistectomía Laparoscópica',
        insuranceCompany: 'Seguros Mercantil',
        insuranceIcon: Building2,
        insuranceColor: 'from-blue-600 to-blue-800',
        type: 'Gastos Adicionales No Cubiertos',
        status: 'action_required', // action_required, reviewing, resolved
        amountInDispute: '$1,250.00',
        date: '18 Mar 2026',
        description: 'La aseguradora rechazó el pago de un (1) día adicional de hospitalización debido a complicaciones postoperatorias (fiebre prolongada).',
        updates: [
            { id: 1, date: '18 Mar, 09:30 AM', sender: 'Alteha', text: 'Disputa abierta por Seguros Mercantil sobre la factura final.' },
            { id: 2, date: '19 Mar, 02:15 PM', sender: 'Seguros Mercantil', text: 'Requerimos un informe médico detallado que justifique el día adicional de estancia en la clínica para proceder con el pago excedente.' }
        ]
    },
    {
        id: 'DSP-7743',
        auctionId: '901',
        auctionTitle: 'Artroscopia de Rodilla',
        insuranceCompany: 'Banesco Seguros',
        insuranceIcon: Shield,
        insuranceColor: 'from-emerald-600 to-emerald-800',
        type: 'Retraso en Liquidación',
        status: 'reviewing',
        amountInDispute: '$3,500.00',
        date: '15 Mar 2026',
        description: 'Han pasado 30 días desde la consignación de recaudos y el pago del honorario médico aún no se ha hecho efectivo.',
        updates: [
            { id: 1, date: '15 Mar, 10:00 AM', sender: 'Usted', text: 'Reporte de retraso en pago generado automáticamente tras 30 días.' },
            { id: 2, date: '17 Mar, 11:45 AM', sender: 'Alteha Legal', text: 'Hemos escalado el caso al departamento de tesorería de Banesco Seguros. Esperando respuesta (SLA: 48 horas).' }
        ]
    },
    {
        id: 'DSP-6102',
        auctionId: '775',
        auctionTitle: 'Hernia Inguinal Directa',
        insuranceCompany: 'Seguros Caracas',
        insuranceIcon: Building2,
        insuranceColor: 'from-red-600 to-red-800',
        type: 'Rechazo de Factura (Formato)',
        status: 'resolved',
        amountInDispute: '$1,800.00',
        date: '10 Mar 2026',
        description: 'La factura N° 4592 fue regresada por discrepancia en el código de diagnóstico.',
        updates: [
            { id: 1, date: '10 Mar, 08:00 AM', sender: 'Seguros Caracas', text: 'Factura rechazada. El código ICD-10 documentado no corresponde con el presupuesto aprobado en la subasta.' },
            { id: 2, date: '11 Mar, 04:30 PM', sender: 'Usted', text: 'Se adjuntó la factura corregida con el código exacto de la carta aval.' },
            { id: 3, date: '12 Mar, 09:00 AM', sender: 'Alteha', text: 'Factura aceptada por Seguros Caracas. Disputa cerrada.' }
        ]
    }
];

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'action_required':
            return { label: 'Requiere su Acción', bg: 'bg-rose-100', text: 'text-rose-600', icon: AlertCircle };
        case 'reviewing':
            return { label: 'En Revisión (Alteha)', bg: 'bg-amber-100', text: 'text-amber-600', icon: Clock };
        case 'resolved':
            return { label: 'Resuelto', bg: 'bg-emerald-100', text: 'text-emerald-600', icon: CheckCircle2 };
        default:
            return { label: 'Desconocido', bg: 'bg-slate-100', text: 'text-slate-600', icon: FileText };
    }
};

export default function SpecialistDisputes() {
    const [selectedDisputeId, setSelectedDisputeId] = useState(dummyDisputes[0].id);
    const selectedDispute = dummyDisputes.find(d => d.id === selectedDisputeId) || dummyDisputes[0];

    const currentStatus = getStatusConfig(selectedDispute.status);

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Left Sidebar - Disputes List */}
            <div className="w-[450px] border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Disputas</h2>
                            <p className="text-sm font-bold text-slate-400 mt-1">Gestión de conflictos de subastas</p>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                            <Scale className="w-6 h-6 text-alteha-turquoise" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input 
                                type="text" 
                                placeholder="Buscar por ID, Subasta..." 
                                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-alteha-turquoise/10 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                            />
                        </div>
                        <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-alteha-turquoise transition-colors shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
                    {dummyDisputes.map((dispute) => {
                        const statusConf = getStatusConfig(dispute.status);
                        const isSelected = selectedDisputeId === dispute.id;
                        return (
                            <button
                                key={dispute.id}
                                onClick={() => setSelectedDisputeId(dispute.id)}
                                className={cn(
                                    "w-full text-left p-5 rounded-[2rem] transition-all duration-300 border",
                                    isSelected 
                                        ? "bg-white shadow-xl shadow-slate-200/50 border-slate-100 scale-[1.02]" 
                                        : "bg-white/50 border-transparent hover:bg-white hover:border-slate-100/50 hover:shadow-md"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white bg-gradient-to-br", dispute.insuranceColor)}>
                                            <dispute.insuranceIcon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm">{dispute.id}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dispute.date}</span>
                                </div>
                                
                                <h4 className="font-black text-slate-800 text-base leading-tight mb-1 truncate">{dispute.type}</h4>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase">
                                        Subasta #{dispute.auctionId}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 truncate">{dispute.auctionTitle}</span>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full", statusConf.bg)}>
                                        <statusConf.icon className={cn("w-3 h-3", statusConf.text)} />
                                        <span className={cn("text-[9px] font-black uppercase tracking-wider", statusConf.text)}>
                                            {statusConf.label}
                                        </span>
                                    </div>
                                    <span className="font-black text-slate-800 text-sm">{dispute.amountInDispute}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Main Content - Dispute Details */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                {/* Header Profile Style */}
                <div className="h-48 bg-slate-900 border-b border-slate-100 relative overflow-hidden shrink-0 flex items-center px-10">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-alteha-turquoise/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
                    
                    <div className="relative z-10 flex items-center gap-8 w-full">
                        <div className={cn(
                            "w-28 h-28 rounded-[2rem] flex items-center justify-center text-white shadow-2xl border-4 border-white/10 bg-gradient-to-br transform -rotate-3", 
                            selectedDispute.insuranceColor
                        )}>
                            <selectedDispute.insuranceIcon className="w-12 h-12 drop-shadow-lg" />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-white/20">
                                    Disputa {selectedDispute.id}
                                </span>
                                <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 shadow-sm")}>
                                    <currentStatus.icon className={cn("w-3 h-3", currentStatus.text)} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-wider", currentStatus.text)}>
                                        {currentStatus.label}
                                    </span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">{selectedDispute.type}</h2>
                            <div className="flex items-center gap-4 text-white/70 font-bold text-sm">
                                <span>{selectedDispute.insuranceCompany}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-alteha-turquoise" />
                                <span>Subasta #{selectedDispute.auctionId}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-alteha-turquoise" />
                                <span>Monto en Disputa: <strong className="text-white text-lg">{selectedDispute.amountInDispute}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <div className="max-w-4xl mx-auto p-10 space-y-8">
                        
                        {/* Summary Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                                <ShieldAlert className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg mb-2">Descripción del Conflicto</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    {selectedDispute.description}
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-alteha-turquoise" />
                                Historial de Eventos
                            </h3>
                            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                
                                {selectedDispute.updates.map((update, idx) => {
                                    const isMe = update.sender === 'Usted';
                                    const isAlteha = update.sender === 'Alteha' || update.sender === 'Alteha Legal';
                                    
                                    return (
                                        <div key={update.id} className={cn("relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active")}>
                                            <div className={cn("flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-50 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10", 
                                                isMe ? "text-alteha-blue" : isAlteha ? "text-alteha-turquoise" : "text-slate-500"
                                            )}>
                                                {isMe ? <FileSignature className="w-4 h-4" /> : isAlteha ? <Scale className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                                            </div>
                                            
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transform transition-transform hover:-translate-y-1 hover:shadow-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={cn("font-black text-sm uppercase tracking-wider",
                                                        isMe ? "text-alteha-blue" : isAlteha ? "text-alteha-turquoise" : "text-slate-800"
                                                    )}>{update.sender}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{update.date}</span>
                                                </div>
                                                <p className="text-slate-600 font-medium text-sm leading-relaxed">{update.text}</p>
                                            </div>
                                        </div>
                                    );
                                })}

                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Action Area */}
                {selectedDispute.status === 'action_required' && (
                    <div className="p-8 bg-white border-t border-slate-100 shrink-0">
                        <div className="max-w-4xl mx-auto">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h4 className="font-black text-slate-800 mb-1">Se requiere su respuesta</h4>
                                    <p className="text-sm text-slate-500 font-medium">Por favor, adjunte el informe médico detallado para continuar el proceso.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100">
                                        Escribir Mensaje
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-alteha-turquoise text-white font-black text-sm rounded-xl hover:bg-alteha-turquoise/90 transition-colors shadow-lg shadow-alteha-turquoise/30 focus:outline-none focus:ring-4 focus:ring-alteha-turquoise/20">
                                        <UploadCloud className="w-4 h-4 stroke-[3]" />
                                        Subir Informe Médico
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
