"use client";

import React, { useMemo, useState } from 'react';
import { Building2, MapPin, Search, Check, X, CheckCheck } from 'lucide-react';

interface ClinicLite {
    id: number;
    name: string;
    logoUrl?: string | null;
    stateProvinceName?: string | null;
    cityName?: string | null;
    status?: string;
}

interface ClinicLocationPickerProps {
    clinics: ClinicLite[];
    selected: number[];
    onChange: (ids: number[]) => void;
}

const NO_LOCATION = '__none__';

/**
 * Clinic picker with a location filter (state/province + city) on top of a name search.
 * Shows ALL clinics by default; the filters narrow the list so the doctor can find and
 * select the clinics where they work by region. Selected clinics are always shown as
 * removable chips, even when the current filter would hide them.
 */
export function ClinicLocationPicker({ clinics, selected, onChange }: ClinicLocationPickerProps) {
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    // Distinct states present in the data (+ whether any clinic has no location at all).
    const { states, hasNoLocation } = useMemo(() => {
        const set = new Set<string>();
        let none = false;
        clinics.forEach(c => {
            if (c.stateProvinceName) set.add(c.stateProvinceName);
            else none = true;
        });
        return { states: Array.from(set).sort((a, b) => a.localeCompare(b)), hasNoLocation: none };
    }, [clinics]);

    // Cities available for the currently selected state.
    const cities = useMemo(() => {
        const set = new Set<string>();
        clinics.forEach(c => {
            if (stateFilter === NO_LOCATION) return;
            if (stateFilter && c.stateProvinceName !== stateFilter) return;
            if (c.cityName) set.add(c.cityName);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [clinics, stateFilter]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return clinics.filter(c => {
            const matchesSearch = !q || c.name.toLowerCase().includes(q);
            let matchesState = true;
            if (stateFilter === NO_LOCATION) matchesState = !c.stateProvinceName;
            else if (stateFilter) matchesState = c.stateProvinceName === stateFilter;
            const matchesCity = !cityFilter || c.cityName === cityFilter;
            return matchesSearch && matchesState && matchesCity;
        });
    }, [clinics, search, stateFilter, cityFilter]);

    const selectedSet = useMemo(() => new Set(selected), [selected]);
    const selectedClinics = useMemo(() => clinics.filter(c => selectedSet.has(c.id)), [clinics, selectedSet]);

    const toggle = (id: number) => {
        if (selectedSet.has(id)) onChange(selected.filter(i => i !== id));
        else onChange([...selected, id]);
    };

    const allFilteredSelected = filtered.length > 0 && filtered.every(c => selectedSet.has(c.id));
    const toggleAllFiltered = () => {
        const filteredIds = new Set(filtered.map(c => c.id));
        if (allFilteredSelected) {
            onChange(selected.filter(id => !filteredIds.has(id)));
        } else {
            const merged = new Set(selected);
            filtered.forEach(c => merged.add(c.id));
            onChange(Array.from(merged));
        }
    };

    const clearFilters = () => { setSearch(''); setStateFilter(''); setCityFilter(''); };
    const hasActiveFilter = !!search || !!stateFilter || !!cityFilter;

    const locationLabel = (c: ClinicLite) => {
        if (c.cityName && c.stateProvinceName) return `${c.cityName}, ${c.stateProvinceName}`;
        return c.stateProvinceName || c.cityName || 'Sin ubicación';
    };

    const selectClass =
        "w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-alteha-violet focus:ring-2 focus:ring-alteha-violet/20 cursor-pointer";

    return (
        <div className="space-y-4">
            {/* Selected chips — always visible, even if the current filter hides them */}
            {selectedClinics.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                        {selectedClinics.length} seleccionada{selectedClinics.length !== 1 ? 's' : ''}
                    </span>
                    {selectedClinics.map(c => (
                        <span
                            key={c.id}
                            className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-gradient-to-r from-alteha-turquoise/10 to-alteha-violet/10 border border-alteha-violet/20 rounded-full text-sm text-alteha-violet font-medium"
                        >
                            {c.logoUrl
                                ? <img src={c.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                                : <Building2 className="w-3.5 h-3.5" />}
                            <span className="max-w-[180px] truncate">{c.name}</span>
                            <button
                                type="button"
                                onClick={() => toggle(c.id)}
                                className="p-0.5 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                                aria-label={`Quitar ${c.name}`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="p-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 space-y-3">
                {/* Filter row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-alteha-violet focus:ring-2 focus:ring-alteha-violet/20"
                        />
                    </div>
                    <select
                        value={stateFilter}
                        onChange={e => { setStateFilter(e.target.value); setCityFilter(''); }}
                        className={selectClass}
                        aria-label="Filtrar por estado o provincia"
                    >
                        <option value="">Todas las ubicaciones</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                        {hasNoLocation && <option value={NO_LOCATION}>Sin ubicación</option>}
                    </select>
                    <select
                        value={cityFilter}
                        onChange={e => setCityFilter(e.target.value)}
                        disabled={stateFilter === NO_LOCATION || cities.length === 0}
                        className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Filtrar por ciudad"
                    >
                        <option value="">Todas las ciudades</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-slate-400 font-medium">
                        Mostrando {filtered.length} de {clinics.length} clínicas
                    </span>
                    <div className="flex items-center gap-1">
                        {hasActiveFilter && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        )}
                        {filtered.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleAllFiltered}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-alteha-violet hover:text-alteha-violet/80 px-3 py-1.5 rounded-lg hover:bg-alteha-violet/5 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                {allFilteredSelected ? 'Quitar todas' : `Seleccionar todas (${filtered.length})`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Clinic list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {filtered.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-sm text-slate-400">
                            No se encontraron clínicas con esos filtros.
                        </div>
                    ) : filtered.map(c => {
                        const isSel = selectedSet.has(c.id);
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => toggle(c.id)}
                                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${isSel
                                    ? 'bg-alteha-turquoise/10 border-alteha-turquoise shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-alteha-violet/40 hover:bg-slate-50'}`}
                            >
                                {c.logoUrl ? (
                                    <img src={c.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-5 h-5 text-slate-400" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-bold truncate ${isSel ? 'text-slate-900' : 'text-slate-700'}`}>{c.name}</p>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{locationLabel(c)}</span>
                                    </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-alteha-turquoise text-white' : 'border-2 border-slate-200'}`}>
                                    {isSel && <Check className="w-3 h-3" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
