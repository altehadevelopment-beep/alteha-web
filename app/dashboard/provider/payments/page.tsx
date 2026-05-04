"use client";

import React from 'react';
import PaymentMethodsManager from '@/components/dashboard/PaymentMethodsManager';

export default function ProviderPaymentsPage() {
    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión Financiera</h1>
                <p className="text-slate-500 font-medium">Configura tus métodos para recibir pagos por suministros e insumos.</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                <PaymentMethodsManager role="PHARMACY" />
            </div>
        </div>
    );
}
