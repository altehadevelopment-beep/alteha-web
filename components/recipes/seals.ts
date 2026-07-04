// ─── Sellos del recetario ─────────────────────────────────────────────────────
// 10 presets generados por el sistema (forma + color + estilo de borde).
// El HTML se genera como string para poder usarse igual en la vista previa de la
// configuración (dangerouslySetInnerHTML) y en la ventana de impresión del recipe.

export interface SealPreset {
    id: string;
    name: string;
    color: string;      // color principal (borde + texto)
    shape: 'circle' | 'oval' | 'rect';
    border: 'double' | 'solid' | 'dashed';
}

export const SEAL_PRESETS: SealPreset[] = [
    { id: 'classic-teal', name: 'Clásico Turquesa', color: '#0d9488', shape: 'circle', border: 'double' },
    { id: 'classic-navy', name: 'Clásico Azul', color: '#1e3a8a', shape: 'circle', border: 'double' },
    { id: 'classic-burgundy', name: 'Clásico Vinotinto', color: '#7f1d1d', shape: 'circle', border: 'double' },
    { id: 'modern-emerald', name: 'Moderno Esmeralda', color: '#047857', shape: 'rect', border: 'solid' },
    { id: 'modern-slate', name: 'Moderno Grafito', color: '#334155', shape: 'rect', border: 'solid' },
    { id: 'elegant-violet', name: 'Elegante Violeta', color: '#6d28d9', shape: 'oval', border: 'double' },
    { id: 'elegant-gold', name: 'Elegante Dorado', color: '#b45309', shape: 'circle', border: 'solid' },
    { id: 'minimal-black', name: 'Minimalista Negro', color: '#0f172a', shape: 'rect', border: 'solid' },
    { id: 'stamp-teal', name: 'Timbre Turquesa', color: '#0d9488', shape: 'circle', border: 'dashed' },
    { id: 'stamp-indigo', name: 'Timbre Índigo', color: '#4338ca', shape: 'oval', border: 'dashed' },
];

export function getSealPreset(id?: string | null): SealPreset | null {
    if (!id) return null;
    return SEAL_PRESETS.find(s => s.id === id) || null;
}

/**
 * Genera el HTML inline del sello (sin clases, para que funcione en cualquier documento).
 * @param sizePx alto base del sello en píxeles.
 */
export function buildSealHTML(
    presetId: string | null | undefined,
    doctorName: string,
    license: string,
    specialty: string,
    sizePx: number = 110
): string {
    const preset = getSealPreset(presetId);
    if (!preset) return '';

    const width = preset.shape === 'circle' ? sizePx : Math.round(sizePx * 1.45);
    const radius = preset.shape === 'rect' ? '10px' : '50%';
    const borderCss =
        preset.border === 'double' ? `4px double ${preset.color}` :
        preset.border === 'dashed' ? `2px dashed ${preset.color}` :
        `2.5px solid ${preset.color}`;

    const nameSize = Math.max(7, Math.round(sizePx * 0.085));
    const smallSize = Math.max(5.5, Math.round(sizePx * 0.062));

    const shortSpec = (specialty || 'MÉDICO').split(',')[0].trim().toUpperCase().slice(0, 26);

    return `
    <div style="
        width:${width}px; height:${sizePx}px;
        border:${borderCss}; border-radius:${radius};
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        gap:1px; padding:6px 10px; box-sizing:border-box;
        color:${preset.color}; transform:rotate(-6deg);
        font-family:Georgia, serif; text-align:center; line-height:1.25;
        background:transparent; opacity:0.92;
        -webkit-print-color-adjust:exact; print-color-adjust:exact;">
        <div style="font-size:${smallSize + 2}px;">⚕</div>
        <div style="font-size:${nameSize}px; font-weight:900; letter-spacing:0.04em; text-transform:uppercase; max-width:100%; overflow:hidden;">${doctorName}</div>
        <div style="font-size:${smallSize}px; font-weight:700; letter-spacing:0.08em;">${shortSpec}</div>
        ${license ? `<div style="font-size:${smallSize}px; font-weight:900; letter-spacing:0.06em;">LIC. ${license}</div>` : ''}
    </div>`;
}
