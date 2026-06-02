"use client";

import React, { useState, useEffect } from 'react';
import { 
    FileCheck, 
    Upload, 
    ShieldCheck, 
    CreditCard, 
    Building2, 
    Loader2, 
    AlertCircle, 
    CheckCircle2,
    Clock,
    DollarSign,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { completeAuction, getWinnerPaymentMethods, getStoredToken, type PaymentMethod } from '@/lib/api';

interface WinnerSettlementSectionProps {
    auction: any;
    role: 'DOCTOR' | 'CLINIC';
}

export const WinnerSettlementSection: React.FC<WinnerSettlementSectionProps> = ({ auction, role }) => {
    const METHOD_NAMES: Record<string, string> = {
        'BS_PAGO_MOVIL': 'Pago Móvil (BS)',
        'BS_BANK_TRANSFER': 'Transferencia BS',
        'USD_ACH': 'ACH / Zelle (USD)',
        'USD_WIRE_SWIFT': 'SWIFT (USD)',
        'USD_IBAN': 'IBAN (EUR/USD)',
        'BINANCE_PAY': 'Binance Pay',
        'CRYPTO_WALLET': 'Crypto Wallet'
    };

    const [settlementFile, setSettlementFile] = useState<File | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoadingMethods, setIsLoadingMethods] = useState(false);
    const [methodsError, setMethodsError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const loadMethods = async () => {
            if (auction.status === 'PAID' || auction.status === 'COMPLETED' || auction.status === 'AWARDED') {
                setIsLoadingMethods(true);
                setMethodsError(null);
                try {
                    const methods = await getWinnerPaymentMethods(auction.auctionNumber, role);
                    setPaymentMethods(methods);
                } catch (err: any) {
                    console.error('Error loading winner methods:', err);
                    setMethodsError(err.message || 'Error al cargar métodos de pago');
                    setPaymentMethods([]);
                } finally {
                    setIsLoadingMethods(false);
                }
            }
        };
        loadMethods();
    }, [auction.auctionNumber, auction.status, role]);

    const handleComplete = async () => {
        if (!settlementFile) return;
        
        setIsCompleting(true);
        setError(null);
        try {
            const res = await completeAuction(auction.auctionNumber, settlementFile);
            if (res.code === '00' || (res as any).id) {
                setIsSuccess(true);
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setError(res.message || 'Error al completar la subasta');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsCompleting(false);
        }
    };

    if (auction.status === 'COMPLETED') {
        return (
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black">Intervención Finalizada</h3>
                        <p className="text-slate-400 text-sm font-medium mt-2">La subasta ha sido cerrada y el acta de finiquito ha sido registrada exitosamente.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Methods Section */}
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 space-y-8">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-alteha-turquoise/10 text-alteha-turquoise rounded-full text-[10px] font-black uppercase tracking-widest">
                        <CreditCard className="w-3 h-3" /> Liquidación
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Mis Métodos de Pago</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Cuentas configuradas para recibir el desembolso de esta subasta.</p>
                </div>

                <div className="space-y-4">
                    {isLoadingMethods ? (
                        <div className="flex items-center gap-3 py-8">
                            <Loader2 className="w-5 h-5 text-alteha-turquoise animate-spin" />
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Cargando cuentas...</span>
                        </div>
                    ) : paymentMethods.length > 0 ? (
                        paymentMethods.map((method) => (
                            <div key={method.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-alteha-turquoise/30 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-alteha-turquoise transition-colors">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-alteha-turquoise uppercase tracking-widest mb-1">{method.displayName}</p>
                                        <p className="text-sm font-black text-slate-900">{method.bankAccount?.bankName}</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 truncate">{method.bankAccount?.accountNumber}</p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-2 italic">{method.bankAccount?.holderFullName}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 text-center space-y-3">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                            <p className="text-sm font-bold text-amber-700 leading-tight">
                                {methodsError || 'No tienes cuentas de pago activas para este rol.'}
                            </p>
                            {auction?.allowedPaymentMethods && auction.allowedPaymentMethods.length > 0 && (
                                <p className="text-xs font-medium text-amber-600 mt-2 bg-amber-100/50 p-3 rounded-xl">
                                    Esta subasta requiere configurar al menos uno de los siguientes métodos de pago: <br/>
                                    <strong className="text-amber-800 tracking-wider">
                                        {auction.allowedPaymentMethods.map((m: string) => METHOD_NAMES[m] || m).join(', ')}
                                    </strong>.
                                </p>
                            )}
                            
                            {methodsError && (
                                <div className="mt-4 p-4 bg-slate-900 rounded-xl text-left overflow-x-auto border border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Info de depuración para backend:
                                    </p>
                                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
{`curl -X GET "https://qaback.alteha.com:3232/api/auctions/${auction.auctionNumber}/winner-payment-methods?role=${role}" \\
  -H "Accept: application/json" \\
  -H "X-Alteha-Token: ${getStoredToken() || '<TU_TOKEN_AQUI>'}"`}
                                    </pre>
                                </div>
                            )}

                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    const baseUrl = `/dashboard/${role.toLowerCase() === 'doctor' ? 'specialist' : 'clinic'}/payment-methods`;
                                    const redirectUrl = (auction?.allowedPaymentMethods && auction.allowedPaymentMethods.length > 0)
                                        ? `${baseUrl}?addMethod=${auction.allowedPaymentMethods[0]}`
                                        : baseUrl;
                                    window.location.href = redirectUrl;
                                }}
                                className="text-[10px] h-8 rounded-full border-amber-200 text-amber-600 hover:bg-amber-100"
                            >
                                Configurar ahora
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Completion / Settlement Upload Section */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-alteha-turquoise/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/70 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <FileCheck className="w-3 h-3" /> Cierre de Intervención
                    </div>
                    <h3 className="text-2xl font-black">Reportar Finiquito</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Una vez realizada la intervención, suba el acta de finiquito firmada para solicitar la liberación de los fondos.
                    </p>
                </div>

                {auction.status === 'PAID' ? (
                    <div className="space-y-6">
                        {paymentMethods.length === 0 || methodsError ? (
                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center space-y-3">
                                <AlertCircle className="w-8 h-8 text-amber-500/80 mx-auto" />
                                <p className="text-sm font-medium text-slate-300">
                                    Debes tener configurado al menos un método de pago válido para la subasta antes de poder subir el acta de finiquito.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 text-center transition-all hover:bg-white/[0.07] group relative">
                                <input 
                                    type="file" 
                                    onChange={(e) => setSettlementFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                {settlementFile ? (
                                    <div className="space-y-3">
                                        <div className="w-16 h-16 bg-alteha-turquoise/20 text-alteha-turquoise rounded-2xl flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white truncate">{settlementFile.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Listo para subir</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="w-16 h-16 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400">Seleccionar Acta de Finiquito (PDF/IMG)</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <Button 
                            disabled={!settlementFile || isCompleting}
                            onClick={handleComplete}
                            className={`w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                                isSuccess ? 'bg-emerald-500 text-white' : 'bg-alteha-turquoise text-slate-900 hover:bg-alteha-turquoise/90'
                            }`}
                        >
                            {isCompleting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isSuccess ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <ShieldCheck className="w-5 h-5" />
                            )}
                            {isSuccess ? '¡PROCESADO!' : isCompleting ? 'SUBIENDO...' : 'FINALIZAR INTERVENCIÓN'}
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center space-y-4">
                        <Clock className="w-12 h-12 text-slate-600 mx-auto" />
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Esperando Pago</p>
                            <p className="text-xs font-medium text-slate-500">
                                Podrá subir el finiquito una vez que la compañía de seguros confirme el pago de la subasta.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
