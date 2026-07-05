// ─── Clasificación comercial de paquetes ──────────────────────────────────────
// Tipos de paquete que un médico o clínica puede comercializar en la plataforma.
// Cada tipo lleva una explicación orientada al usuario que se muestra al seleccionarlo.

export interface PackageCategory {
    id: string;
    label: string;
    emoji: string;
    /** Explicación mostrada al médico/clínica al elegir el tipo. */
    description: string;
    /** Solo el tipo INTERVENCION exige especialidad → tipo de intervención (como en las subastas). */
    requiresProcedure: boolean;
}

export const PACKAGE_CATEGORIES: PackageCategory[] = [
    {
        id: 'CONSULTA',
        label: 'Consultas',
        emoji: '🩺',
        description: 'Citas de evaluación médica presencial. El seguro compra un lote de consultas (ej. "20 consultas de cardiología") y las va asignando a sus pacientes una a una.',
        requiresProcedure: false,
    },
    {
        id: 'INTERVENCION',
        label: 'Intervenciones',
        emoji: '🔪',
        description: 'Procedimientos quirúrgicos. Selecciona la especialidad y el tipo de intervención (igual que al crear una subasta). El seguro redime cada cirugía asociándola a un paciente y tú subes el finiquito al ejecutarla.',
        requiresProcedure: true,
    },
    {
        id: 'ESTUDIO',
        label: 'Estudios diagnósticos',
        emoji: '🔬',
        description: 'Exámenes con informe: imagenología, endoscopias, laboratorio (ej. "30 ecocardiogramas"). Es el gasto más frecuente de los seguros — ideal para vender por volumen.',
        requiresProcedure: false,
    },
    {
        id: 'TERAPIA',
        label: 'Terapias / Sesiones',
        emoji: '🔄',
        description: 'Sesiones de tratamientos repetitivos: fisioterapia, diálisis, quimioterapia (ej. "12 sesiones de fisioterapia"). El seguro va consumiendo las sesiones del mismo paciente una a una.',
        requiresProcedure: false,
    },
    {
        id: 'CHEQUEO',
        label: 'Chequeos preventivos',
        emoji: '✅',
        description: 'Chequeo completo de precio cerrado que combina varios componentes (consulta + estudios + laboratorio). Perfecto para colectivos empresariales del seguro.',
        requiresProcedure: false,
    },
    {
        id: 'EMERGENCIA',
        label: 'Emergencias',
        emoji: '🚨',
        description: 'Atenciones de urgencia prepagadas, con observación incluida (ej. "10 atenciones de emergencia con hasta 12h de observación"). Usualmente ofrecido por clínicas.',
        requiresProcedure: false,
    },
    {
        id: 'HOSPITALIZACION',
        label: 'Hospitalización',
        emoji: '🛏️',
        description: 'Días-cama y derechos de pabellón prepagados (ej. "10 derechos de quirófano categoría II"). Capacidad hospitalaria que el seguro reserva por adelantado.',
        requiresProcedure: false,
    },
    {
        id: 'TELECONSULTA',
        label: 'Teleconsultas',
        emoji: '💻',
        description: 'Citas virtuales de orientación médica (ej. "50 teleconsultas"). Bajo costo y alta rotación: el primer filtro de atención del seguro.',
        requiresProcedure: false,
    },
];

export const getPackageCategory = (id?: string | null): PackageCategory | null =>
    PACKAGE_CATEGORIES.find(c => c.id === id) || null;
