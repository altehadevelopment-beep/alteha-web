"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import DynamicFormModal from '@/components/ui/DynamicFormModal';
import { Plus, Database, Loader2, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useSearchStore } from '@/lib/store';

export default function GenericEntityPage() {
    const params = useParams();
    const entityName = params.entity as string; 

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
            // Result is expected to be an array, or an object with paginated entries depending on the backend config.
            // Spring Boot standard lists often return an array directly if not strictly paginated by Pageable.
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
        if (!items || items.length === 0) return [];
        // Extract basic primitive keys from the first item
        const allKeys = Object.keys(items[0]).filter(k => 
            typeof items[0][k] !== 'object' && k !== 'password'
        );

        // Sort keys to prioritize visual features (images, logos) and names
        const prioritized = allKeys.sort((a, b) => {
            const getPriority = (k: string) => {
                const low = k.toLowerCase();
                const val = items[0][k];
                const isUrl = typeof val === 'string' && (val.startsWith('http') || val.startsWith('/api/files'));

                if (low.includes('logo')) return 1;
                if (low.includes('image') || low.includes('photo') || low.includes('foto') || low.includes('avatar')) return 2;
                if (low === 'name' || low === 'nombre' || low === 'title' || low === 'titulo') return 3;
                if (low.startsWith('first') || low.startsWith('last')) return 4;
                if (isUrl || low.includes('url') || low.includes('link') || low.includes('file') || low.includes('archivo')) return 5;
                return 100;
            };
            return getPriority(a) - getPriority(b);
        });

        return prioritized.slice(0, 7); 
    };

    const handleCreateNew = () => {
        // We synthesize a blank model from the existing data keys for the dynamic modal
        const blankModel = extractKeys(data).reduce((acc: any, key: string) => {
            acc[key] = typeof data[0]?.[key] === 'boolean' ? false : (typeof data[0]?.[key] === 'number' ? 0 : '');
            return acc;
        }, {});
        setSelectedItem(blankModel);
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (confirm('¿Estás seguro de eliminar este registro de forma permanente?')) {
            try {
                await API.remove(entityName, id);
                fetchData();
            } catch (err) {
                console.error(err);
                alert('No se pudo eliminar el registro.');
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

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.25rem] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-alteha-blue">
                        <Database className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight font-outfit uppercase">
                            {entityName.replace(/-/g, ' ')}
                        </h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                            Administración de Entidad Alteha
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-7 py-3 text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg hover:shadow-alteha-teal/25 active:scale-95 group"
                    style={{ background: 'linear-gradient(135deg, #2ECFBF, #7B5BFF)' }}
                >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    Nuevo Registro
                </button>
            </header>

            {error ? (
                <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-rose-800 text-lg mb-1">Error al conectar con la Entidad</h4>
                        <p className="text-rose-600 font-medium">{error}</p>
                    </div>
                </div>
            ) : isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center opacity-50">
                    <Loader2 className="w-10 h-10 animate-spin text-alteha-turquoise mb-4" />
                    <p className="font-bold tracking-widest uppercase text-xs">Cargando datos remotos...</p>
                </div>
            ) : (
                <DataTable 
                    data={filteredData} 
                    keys={extractKeys(data)} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                />
            )}

            <DynamicFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={selectedItem}
                title={`Tabla /${entityName}`}
                allowedKeys={extractKeys(data)}
            />
        </div>
    );
}
