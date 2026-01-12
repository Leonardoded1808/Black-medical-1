
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client, Lead, Opportunity, Task, Product, SupportTicket, Interaction, Salesperson } from '../types';
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
    products: Product[];
    supportTickets: SupportTicket[];
    interactions: Interaction[];
    salespeople: Salesperson[];
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

const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
    isOpen, 
    onClose, 
    clients, 
    leads, 
    opportunities, 
    tasks,
    products,
    supportTickets,
    interactions,
    salespeople
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Map for quick salesperson lookup by ID
    const salespersonMap = useMemo(() => {
        return salespeople.reduce((acc, sp) => {
            acc[sp.id] = sp.name;
            return acc;
        }, {} as Record<string, string>);
    }, [salespeople]);

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

        const includesTerm = (text: string | undefined | null) => text && text.toLowerCase().includes(term);

        // --- CLIENTS ---
        clients.forEach(c => {
            if (includesTerm(c.name) || includesTerm(c.contactPerson) || includesTerm(c.email)) {
                foundResults.push({
                    id: c.id,
                    type: 'Cliente',
                    name: c.name,
                    context: c.contactPerson || c.email,
                    link: `/clients#${c.id}`
                });
            } else if (includesTerm(c.phone)) {
                foundResults.push({
                    id: c.id,
                    type: 'Cliente',
                    name: c.name,
                    context: `Tel: ${c.phone}`,
                    link: `/clients#${c.id}`
                });
            } else if (includesTerm(c.address)) {
                foundResults.push({
                    id: c.id,
                    type: 'Cliente',
                    name: c.name,
                    context: `Dir: ${c.address}`,
                    link: `/clients#${c.id}`
                });
            }
        });

        // --- LEADS ---
        leads.forEach(l => {
            const salespersonName = salespersonMap[l.salespersonId] || '';
            
            if (includesTerm(l.name) || includesTerm(l.company) || includesTerm(l.email)) {
                foundResults.push({
                    id: l.id,
                    type: 'Prospecto',
                    name: l.name,
                    context: l.company,
                    link: `/listado#${l.id}`
                });
            } else if (includesTerm(l.phone)) {
                foundResults.push({
                    id: l.id,
                    type: 'Prospecto',
                    name: l.name,
                    context: `Tel: ${l.phone}`,
                    link: `/listado#${l.id}`
                });
            } else if (includesTerm(l.source)) {
                foundResults.push({
                    id: l.id,
                    type: 'Prospecto',
                    name: l.name,
                    context: `Interés: ${l.source}`,
                    link: `/listado#${l.id}`
                });
            } else if (includesTerm(l.origin)) {
                foundResults.push({
                    id: l.id,
                    type: 'Prospecto',
                    name: l.name,
                    context: `Origen: ${l.origin}`,
                    link: `/listado#${l.id}`
                });
            } else if (includesTerm(salespersonName)) {
                foundResults.push({
                    id: l.id,
                    type: 'Prospecto',
                    name: l.name,
                    context: `Vendedor: ${salespersonName}`,
                    link: `/listado#${l.id}`
                });
            }
        });

        // --- OPPORTUNITIES ---
        opportunities.forEach(o => {
            const salespersonName = salespersonMap[o.salespersonId] || '';
            
            if (includesTerm(o.clientName)) {
                foundResults.push({
                    id: o.id,
                    type: 'Oportunidad',
                    name: `Oportunidad: ${o.clientName}`,
                    context: `Valor: €${o.value.toLocaleString('es-ES')}`,
                    link: `/opportunities#${o.id}`
                });
            } else if (includesTerm(salespersonName)) {
                foundResults.push({
                    id: o.id,
                    type: 'Oportunidad',
                    name: `Oportunidad: ${o.clientName}`,
                    context: `Vendedor: ${salespersonName}`,
                    link: `/opportunities#${o.id}`
                });
            } else {
                // Check products within opportunity
                const matchingProduct = o.products.find(p => includesTerm(p.productName));
                if (matchingProduct) {
                    foundResults.push({
                        id: o.id,
                        type: 'Oportunidad',
                        name: `Oportunidad: ${o.clientName}`,
                        context: `Producto: ${matchingProduct.productName}`,
                        link: `/opportunities#${o.id}`
                    });
                }
            }
        });

        // --- TASKS ---
        tasks.forEach(t => {
            if (!t.opportunityId) { // Only manual tasks usually
                const salespersonName = salespersonMap[t.salespersonId] || '';
                
                if (includesTerm(t.title) || includesTerm(t.description)) {
                    foundResults.push({
                        id: t.id,
                        type: 'Tarea',
                        name: t.title,
                        context: `Fecha: ${new Date(t.dueDate).toLocaleDateString('es-ES')}`,
                        link: `/agenda#${t.id}`
                    });
                } else if (includesTerm(t.associatedName)) {
                    foundResults.push({
                        id: t.id,
                        type: 'Tarea',
                        name: t.title,
                        context: `Asociado a: ${t.associatedName}`,
                        link: `/agenda#${t.id}`
                    });
                } else if (includesTerm(salespersonName)) {
                    foundResults.push({
                        id: t.id,
                        type: 'Tarea',
                        name: t.title,
                        context: `Asignado a: ${salespersonName}`,
                        link: `/agenda#${t.id}`
                    });
                }
            }
        });

        // --- PRODUCTS ---
        products.forEach(p => {
            if (includesTerm(p.name) || includesTerm(p.description) || includesTerm(p.category)) {
                foundResults.push({
                    id: p.id,
                    type: 'Producto',
                    name: p.name,
                    context: `Categoría: ${p.category} - €${p.price}`,
                    link: `/products` // Products page doesn't usually use hash for scrolling, but could be added
                });
            }
        });

        // --- SUPPORT TICKETS ---
        supportTickets.forEach(t => {
            if (includesTerm(t.issue) || includesTerm(t.clientName)) {
                foundResults.push({
                    id: t.id,
                    type: 'Soporte',
                    name: `Ticket: ${t.clientName}`,
                    context: t.issue,
                    link: `/support`
                });
            } else if (includesTerm(t.assignedTo)) {
                foundResults.push({
                    id: t.id,
                    type: 'Soporte',
                    name: `Ticket: ${t.clientName}`,
                    context: `Asignado a: ${t.assignedTo}`,
                    link: `/support`
                });
            }
        });

        // --- INTERACTIONS ---
        interactions.forEach(i => {
            if (includesTerm(i.notes)) {
                // Find associated name
                let link = '';
                let name = 'Interacción';
                
                if (i.leadId) {
                    const lead = leads.find(l => l.id === i.leadId);
                    name = lead ? `Lead: ${lead.name}` : 'Lead desconocido';
                    link = `/listado#${i.leadId}`;
                } else if (i.opportunityId) {
                    const opp = opportunities.find(o => o.id === i.opportunityId);
                    name = opp ? `Oportunidad: ${opp.clientName}` : 'Oportunidad desconocida';
                    link = `/opportunities#${i.opportunityId}`;
                }

                foundResults.push({
                    id: i.id,
                    type: 'Nota',
                    name: name,
                    context: i.notes.substring(0, 50) + '...',
                    link: link || '/panel'
                });
            }
        });
        
        // --- SALESPEOPLE ---
        salespeople.forEach(sp => {
            if (includesTerm(sp.name) || includesTerm(sp.email) || includesTerm(sp.phone)) {
                foundResults.push({
                    id: sp.id,
                    type: 'Vendedor',
                    name: sp.name,
                    context: sp.title,
                    link: `/salespeople`
                });
            }
        });

        setResults(foundResults);
        setIsLoading(false);
    }, [debouncedSearchTerm, clients, leads, opportunities, tasks, products, supportTickets, interactions, salespeople, salespersonMap]);

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
                        placeholder="Buscar por nombre, teléfono, interés, lugar, vendedor..."
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
                            {results.map((result, index) => (
                                <li key={`${result.id}-${index}`}>
                                    <button
                                        onClick={() => handleResultClick(result.link)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors flex justify-between items-center group"
                                    >
                                        <div className="overflow-hidden">
                                            <p className="text-slate-100 font-medium truncate">{result.name}</p>
                                            <p className="text-slate-400 text-sm truncate group-hover:text-cyan-400 transition-colors">{result.context}</p>
                                        </div>
                                        <span className="text-xs bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2 border border-slate-600">{result.type}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!debouncedSearchTerm && (
                         <div className="p-8 text-center text-slate-500">
                            <p className="mb-2 font-semibold text-slate-400">Búsqueda Global</p>
                            <p className="text-sm">Encuentre clientes, prospectos, productos, tickets, notas y tareas buscando por cualquier palabra clave.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
