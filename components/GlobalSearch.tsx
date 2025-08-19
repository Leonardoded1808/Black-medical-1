
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client, Lead, Opportunity, Task } from '../types';
import SearchIcon from './icons/SearchIcon';
import XIcon from './icons/XIcon';

interface SearchResult {
    id: string;
    type: string;
    name: string;
    context: string;
    link: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    leads: Lead[];
    opportunities: Opportunity[];
    tasks: Task[];
}

// A simple debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, clients, leads, opportunities, tasks }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if(!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (debouncedSearchTerm.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        const term = debouncedSearchTerm.toLowerCase();
        const foundResults: SearchResult[] = [];

        // Search Clients
        clients.forEach(c => {
            if (c.name.toLowerCase().includes(term) || c.contactPerson.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)) {
                foundResults.push({
                    id: c.id,
                    type: 'Cliente',
                    name: c.name,
                    context: c.contactPerson,
                    link: `/clients#${c.id}`
                });
            }
        });

        // Search Leads
        leads.forEach(l => {
            if (l.name.toLowerCase().includes(term) || l.company.toLowerCase().includes(term) || l.email.toLowerCase().includes(term)) {
                foundResults.push({
                    id: l.id,
                    type: 'Prospecto',
                    name: l.name,
                    context: l.company,
                    link: `/listado#${l.id}`
                });
            }
        });

        // Search Opportunities
        opportunities.forEach(o => {
            if (o.clientName.toLowerCase().includes(term)) {
                foundResults.push({
                    id: o.id,
                    type: 'Oportunidad',
                    name: `Oportunidad para ${o.clientName}`,
                    context: `Valor: €${o.value.toLocaleString('es-ES')}`,
                    link: `/opportunities#${o.id}`
                });
            }
        });

        // Search Tasks (only manual ones as per request)
        tasks.forEach(t => {
            if (!t.opportunityId && (t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term))) {
                foundResults.push({
                    id: t.id,
                    type: 'Tarea',
                    name: t.title,
                    context: `Fecha: ${new Date(t.dueDate).toLocaleDateString('es-ES')}`,
                    link: `/agenda#${t.id}`
                });
            }
        });

        setResults(foundResults);
        setIsLoading(false);
    }, [debouncedSearchTerm, clients, leads, opportunities, tasks]);

    const handleResultClick = (link: string) => {
        navigate(link);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-16 sm:pt-24" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-xl border border-slate-700 flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 flex items-center space-x-3">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar cliente, prospecto, oportunidad, tarea..."
                        className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <XIcon className="h-5 w-5 text-slate-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading && <p className="p-4 text-center text-slate-400">Buscando...</p>}
                    {!isLoading && debouncedSearchTerm.length > 1 && results.length === 0 && (
                        <p className="p-4 text-center text-slate-400">No se encontraron resultados para "{debouncedSearchTerm}".</p>
                    )}
                     {!isLoading && results.length > 0 && (
                        <ul>
                            {results.map(result => (
                                <li key={result.link}>
                                    <button
                                        onClick={() => handleResultClick(result.link)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="text-slate-100 font-medium">{result.name}</p>
                                            <p className="text-slate-400 text-sm">{result.context}</p>
                                        </div>
                                        <span className="text-xs bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-1 rounded-full">{result.type}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!debouncedSearchTerm && (
                         <div className="p-8 text-center text-slate-500">
                            <p>Busque en todo el CRM desde un solo lugar.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;