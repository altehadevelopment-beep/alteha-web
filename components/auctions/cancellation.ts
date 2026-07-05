/**
 * Regla de motivos de cancelación/retiro — espejo del catálogo del backend
 * (CancellationResource). Cada motivo lleva su explicación para que el usuario
 * entienda qué implica antes de confirmar.
 */

export type CancellationReason = { code: string; label: string; hint: string };

/** Motivos del SEGURO para cancelar una subasta. */
export const AUCTION_CANCEL_REASONS: CancellationReason[] = [
    { code: 'PACIENTE_DESISTIO', label: 'El paciente desistió', hint: 'El beneficiario ya no requiere o no desea el procedimiento.' },
    { code: 'ERROR_EN_DATOS', label: 'Error en los datos de la subasta', hint: 'Presupuestos, intervención o datos del paciente incorrectos. Podrás crear una nueva subasta corregida.' },
    { code: 'PROCEDIMIENTO_REPROGRAMADO', label: 'Procedimiento reprogramado', hint: 'La intervención cambió de fecha u condiciones; publica una nueva subasta cuando esté definido.' },
    { code: 'PRESUPUESTO_INSUFICIENTE', label: 'Presupuesto insuficiente', hint: 'Las ofertas superan lo aprobado para este caso.' },
    { code: 'RESUELTO_FUERA_DE_ALTEHA', label: 'Resuelto fuera de la plataforma', hint: 'El caso se gestionó por otro canal. El uso recurrente afecta tu confiabilidad en la red.' },
    { code: 'OTRO', label: 'Otro motivo', hint: 'Describe la razón (mínimo 10 caracteres). Quedará registrada en la auditoría.' },
];

/** Motivos del MÉDICO/CLÍNICA para retirar su oferta. */
export const BID_WITHDRAW_REASONS: CancellationReason[] = [
    { code: 'SIN_DISPONIBILIDAD_AGENDA', label: 'Sin disponibilidad de agenda', hint: 'No podrás atender el procedimiento en la fecha estimada.' },
    { code: 'ERROR_EN_MONTO', label: 'Error en el monto ofertado', hint: 'Te equivocaste al cargar la oferta. Podrás ofertar de nuevo mientras la subasta siga activa.' },
    { code: 'DESACUERDO_CON_SOCIO', label: 'Desacuerdo con el socio de la dupla', hint: 'No llegaron a acuerdo con la clínica/médico invitado. La dupla se anulará y tu socio será notificado.' },
    { code: 'CASO_CLINICO_NO_VIABLE', label: 'Caso clínico no viable', hint: 'Tras revisar el detalle médico, el caso no es apto para tu práctica/instalaciones.' },
    { code: 'OTRO', label: 'Otro motivo', hint: 'Describe la razón (mínimo 10 caracteres). Quedará registrada en la auditoría.' },
];

/** Explicación de consecuencias por estado, mostrada en el modal del SEGURO. */
export function cancelConsequences(status: string, bidsCount: number): { canCancel: boolean; needsReason: boolean; text: string } {
    switch (status) {
        case 'DRAFT':
            return { canCancel: true, needsReason: false, text: 'El borrador se cancelará. Nadie ha sido invitado ni notificado, así que no se enviará ninguna comunicación.' };
        case 'PUBLISHED':
        case 'ACTIVE':
            if (bidsCount === 0) {
                return { canCancel: true, needsReason: false, text: 'La subasta se cancelará y se notificará a los médicos y clínicas invitados. Como no hay ofertas, no hay más afectados.' };
            }
            return {
                canCancel: true,
                needsReason: true,
                text: `Esta subasta tiene ${bidsCount} oferta(s) activa(s). Al cancelar: todas las ofertas quedarán sin efecto, las duplas e invitaciones pendientes se anularán y cada oferente será notificado con tu motivo. La cancelación queda registrada en tu historial (cancelaciones repetidas afectan tu confiabilidad).`,
            };
        case 'AWARDED':
            return { canCancel: false, needsReason: false, text: 'La subasta ya fue adjudicada y la oferta ganadora es vinculante. Para cancelarla debes abrir una disputa y someterla al arbitraje de Alteha, que notificará al ganador y a su dupla.' };
        default:
            return { canCancel: false, needsReason: false, text: 'En este estado ya hay dinero comprometido: la cancelación directa no está permitida. Gestiona el reverso (reembolso o reasignación) por el módulo de Disputas.' };
    }
}

/** Explicación de consecuencias del retiro de oferta, mostrada al oferente. */
export function withdrawConsequences(auctionStatus: string, isDupla: boolean, isWinning: boolean): { canWithdraw: boolean; text: string } {
    if (isWinning || auctionStatus === 'AWARDED') {
        return { canWithdraw: false, text: 'Tu oferta fue adjudicada y es vinculante: retirarte ahora es un incumplimiento. Debes abrir una disputa para que Alteha arbitre (la subasta podría re-adjudicarse y tu reputación se verá afectada).' };
    }
    if (auctionStatus !== 'ACTIVE') {
        return { canWithdraw: false, text: 'La subasta ya no está activa: el retiro directo no aplica. Si hay dinero comprometido, gestiona el caso por el módulo de Disputas.' };
    }
    return {
        canWithdraw: true,
        text: isDupla
            ? 'Tu oferta se retirará de la subasta y la dupla quedará anulada: tu socio será notificado y su aceptación (u invitación pendiente) quedará sin efecto. La subasta sigue activa para los demás oferentes y podrás volver a ofertar mientras esté abierta.'
            : 'Tu oferta se retirará de la subasta. La subasta sigue activa para los demás oferentes y podrás volver a ofertar mientras esté abierta. El retiro queda registrado en tu historial.',
    };
}
