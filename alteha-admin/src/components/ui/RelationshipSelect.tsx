import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface RelationshipSelectProps {
    fieldName: string;
    value: any;
    onChange: (value: any) => void;
}

export default function RelationshipSelect({ fieldName, value, onChange }: RelationshipSelectProps) {
    const [options, setOptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Infere entity name from field name (e.g., 'clinicId' -> 'clinics')
    const getEntityName = (name: string) => {
        let base = name.replace(/Id$/, '').toLowerCase();
        
        // Manual mapping for Alteha entities
        const mapping: Record<string, string> = {
            'especialidad': 'especialidades',
            'farmacia': 'farmacias',
            'clinica': 'clinicas',
            'aseguradora': 'aseguradoras',
            'medico': 'medicos',
            'paciente': 'pacientes',
            'condicion': 'condiciones',
            'alergia': 'alergias',
            'experiencia': 'experiencias',
            'pais': 'paises',
            'estado': 'estados',
            'ciudad': 'ciudades',
            'municipio': 'municipios',
            'parroquia': 'parroquias',
            'user': 'users',
            'usuario': 'users',
            'entity': 'entities',
            'entidad': 'entities'
        };

        if (mapping[base]) return mapping[base];

        // Advanced pluralization
        if (base.endsWith('y')) return base.slice(0, -1) + 'ies';
        if (base.endsWith('z')) return base.slice(0, -1) + 'ces';
        if (base.endsWith('s') || base.endsWith('x')) return base + 'es';
        // Spanish consonant plurals (d, l, r, n, etc)
        if (/[dlrn]$/.test(base)) return base + 'es';
        
        return base + 's';
    };

    const entityName = getEntityName(fieldName);

    useEffect(() => {
        const fetchOptions = async () => {
            setIsLoading(true);
            try {
                const result = await API.findMany(entityName);
                const items = Array.isArray(result.data) ? result.data : result.data?.content || [];
                setOptions(items);
            } catch (err) {
                console.error(`Error fetching options for ${entityName}:`, err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOptions();
    }, [entityName]);

    if (isLoading) return (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-2 opacity-50">
            <Loader2 className="w-4 h-4 animate-spin text-alteha-turquoise" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando {entityName}...</span>
        </div>
    );

    if (error) return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-500 uppercase">Error cargando {entityName}</span>
                <button 
                    onClick={() => { setError(false); setIsLoading(true); }}
                    className="text-[10px] font-bold text-alteha-blue underline"
                >
                    Reintentar
                </button>
            </div>
            <input 
                type="text"
                placeholder="Ingresar ID manualmente..."
                className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl p-4 text-slate-700 font-medium outline-none focus:border-rose-300 transition-all"
                value={value || ''}
                onChange={(e) => {
                    const val = e.target.value;
                    const num = parseInt(val, 10);
                    onChange(isNaN(num) ? val : num);
                }}
            />
        </div>
    );

    return (
        <select
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:border-alteha-turquoise focus:ring-4 focus:ring-alteha-turquoise/10 outline-none transition-all cursor-pointer"
            value={value || ''}
            onChange={(e) => {
                const val = e.target.value;
                const numericVal = parseInt(val, 10);
                onChange(isNaN(numericVal) ? val : numericVal);
            }}
        >
            <option value="">Seleccione {fieldName.replace(/Id$/, '')}...</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                    {opt.name || opt.nombre || opt.title || opt.titulo || opt.label || `ID: ${opt.id}`}
                </option>
            ))}
        </select>
    );
}
