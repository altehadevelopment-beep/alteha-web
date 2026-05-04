"use client";

import React from 'react';
import PaymentMethodsManager from '@/components/dashboard/PaymentMethodsManager';

export default function InsurancePaymentsPage() {
    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Pagos</h1>
                <p className="text-slate-500 font-medium">Administra las cuentas y métodos desde donde se procesarán los pagos de las subastas adjudicadas.</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                <PaymentMethodsManager role="INSURANCE_COMPANY" />
            </div>
        </div>
    );
}
