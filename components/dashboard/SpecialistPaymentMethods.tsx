"use client";

import React from 'react';
import PaymentMethodsManager from './PaymentMethodsManager';

export default function SpecialistPaymentMethods() {
    return (
        <div className="bg-slate-50/50 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 min-h-[calc(100vh-140px)]">
            <PaymentMethodsManager role="DOCTOR" />
        </div>
    );
}
