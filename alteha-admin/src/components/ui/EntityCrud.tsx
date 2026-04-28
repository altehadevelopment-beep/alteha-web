"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import DynamicFormModal from '@/components/ui/DynamicFormModal';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { useSearchStore } from '@/lib/store';

interface EntityCrudProps {
    entityName: string;
    title?: string;
    schemaKeys?: string[];
    enumOptions?: Record<string, string[]>;
}

export default function EntityCrud({ entityName, title, schemaKeys, enumOptions }: EntityCrudProps) {
    const { searchQuery } = useSearchStore();
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    // Live filtering logic
    const filteredData = React.useMemo(() => {
        if (!searchQuery) return data;
        const lowQuery = searchQuery.toLowerCase();
        return data.filter(item => 
            Object.values(item).some(val => 
                String(val).toLowerCase().includes(lowQuery)
            )
        );
    }, [data, searchQuery]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await API.findMany(entityName);
            setData(Array.isArray(result.data) ? result.data : result.data?.content || []);
        } catch (err: any) {
            console.error('Fetch error:', err);
            if (err.response?.status === 404) {
                setError(`El endpoint /${entityName} no fue encontrado en el servidor.`);
            } else if (err.response?.status === 500) {
                setError(`El servidor (backend) ha devuelto un Error 500. Esto suele indicar un problema interno en la base de datos o el servicio de Alteha.`);
            } else {
                setError(`Error al cargar datos remotos: ${err.message || 'Error desconocido'}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [entityName]);

    const extractKeys = (items: any[]) => {
        const found = items.length > 0 ? Object.keys(items[0]) : (schemaKeys || []);
        const allKeys = found.filter(k => k !== 'id' && (items.length === 0 || typeof items[0][k] !== 'object' || k.endsWith('Id')));

        // Sort keys to prioritize visual features (images, logos) and names
        const prioritized = allKeys.sort((a, b) => {
            const getPriority = (k: string) => {
                const low = k.toLowerCase();
                if (low.includes('logo')) return 1;
                if (low.includes('image') || low.includes('photo') || low.includes('foto') || low.includes('avatar')) return 2;
                if (low === 'name' || low === 'nombre' || low === 'title' || low === 'titulo') return 3;
                if (low.startsWith('first') || low.startsWith('last')) return 4;
                if (low.includes('url') || low.includes('link') || low.includes('file') || low.includes('archivo')) return 5;
                if (low.endsWith('id')) return 80; // Relationships near the end but before others
                return 100;
            };
            return getPriority(a) - getPriority(b);
        });

        return prioritized.slice(0, 15); // Show more columns for better visibility
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (confirm('¿Eliminar este registro?')) {
            try {
                await API.remove(entityName, id);
                fetchData();
            } catch (err) {
                alert('No se pudo eliminar.');
            }
        }
    };

    const handleSave = async (formData: any) => {
        if (formData.id) {
            await API.update(entityName, formData.id, formData);
        } else {
            await API.create(entityName, formData);
        }
        fetchData();
    };

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start gap-3 mt-6">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-600 font-medium text-sm">{error}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-48 flex flex-col items-center justify-center opacity-50 mt-6 bg-white rounded-3xl border border-slate-100">
                <Loader2 className="w-8 h-8 animate-spin text-alteha-turquoise mb-3" />
                <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Sincronizando tabla...</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                {title ? (
                    <div>
                        <h3 className="text-xl font-black font-outfit text-slate-800 uppercase tracking-tight">{title}</h3>
                        <div className="h-1 w-12 bg-alteha-turquoise rounded-full mt-1 opacity-50 shadow-[0_0_8px_rgba(46,207,191,0.5)]" />
                    </div>
                ) : <div />}
                
                <button 
                    onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-alteha-dark text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg hover:shadow-alteha-teal/20 active:scale-95 group"
                    style={{ background: 'linear-gradient(135deg, #2ECFBF, #7B5BFF)' }}
                >
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    Nuevo Registro
                </button>
            </div>
            <DataTable 
                data={filteredData} 
                keys={extractKeys(data)} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
            />

            <DynamicFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={selectedItem}
                title={`Gestión de ${entityName}`}
                allowedKeys={extractKeys(data)}
                enumOptions={enumOptions}
            />
        </div>
    );
}
