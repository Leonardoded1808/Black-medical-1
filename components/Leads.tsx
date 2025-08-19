
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Lead, Salesperson, Interaction, Product, OpportunityProduct, User, Opportunity } from '../types';
import { LeadStatus, InteractionType, OpportunityStage } from '../types';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import ConfirmationModal from './ConfirmationModal';

interface ListadoProps {
    user: User;
    leads: Lead[];
    salespeople: Salesperson[];
    interactions: Interaction[];
    products: Product[];
    opportunities: Opportunity[];
    addLead: (lead: Omit<Lead, 'id'>) => void;
    updateLead: (lead: Lead) => void;
    deleteLead: (leadId: string) => void;
    addInteraction: (interaction: Omit<Interaction, 'id' | 'date'>) => void;
    updateInteraction: (interaction: Interaction) => void;
    deleteInteraction: (interactionId: string) => void;
    convertLeadToOpportunity: (leadId: string, opportunityData: { products: OpportunityProduct[], closeDate: string, stage: OpportunityStage, salespersonId: string }) => void;
}

const statusColors: Record<LeadStatus, string> = {
    [LeadStatus.NUEVO]: 'bg-blue-500/20 text-blue-300',
    [LeadStatus.CONTACTADO]: 'bg-yellow-500/20 text-yellow-300',
    [LeadStatus.CALIFICADO]: 'bg-green-500/20 text-green-300',
    [LeadStatus.PERDIDO]: 'bg-red-500/20 text-red-300',
};

const Listado: React.FC<ListadoProps> = ({ user, leads, salespeople, interactions, products, opportunities, addLead, updateLead, deleteLead, addInteraction, updateInteraction, deleteInteraction, convertLeadToOpportunity }) => {
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [leadToDeleteId, setLeadToDeleteId] = useState<string | null>(null);
    
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    
    const initialLeadState: Omit<Lead, 'id'> = { name: '', company: '', email: '', phone: '', source: '', status: LeadStatus.NUEVO, salespersonId: user.role === 'salesperson' ? user.id : '' };
    const [leadFormData, setLeadFormData] = useState<Omit<Lead, 'id'>>(initialLeadState);

    const initialInteractionState = { type: InteractionType.LLAMADA, notes: '', salespersonId: '' };
    const [newInteraction, setNewInteraction] = useState<{type: InteractionType, notes: string, salespersonId: string}>(initialInteractionState);
    const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
    const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);
    const [isInteractionConfirmModalOpen, setIsInteractionConfirmModalOpen] = useState(false);


    const [opportunityProducts, setOpportunityProducts] = useState<OpportunityProduct[]>([]);
    const [oppDetails, setOppDetails] = useState({ closeDate: '', stage: OpportunityStage.PROSPECCION });
    
    const [newOppProduct, setNewOppProduct] = useState({ productId: '', quantity: 1 });

    const [interactionFilter, setInteractionFilter] = useState('all');
    
    const location = useLocation();
    const navigate = useNavigate();

    const filteredLeads = useMemo(() => {
        if (interactionFilter === 'all') {
            return leads;
        }
        const now = new Date();
        const daysToSubtract = parseInt(interactionFilter, 10);
        const filterDate = new Date();
        filterDate.setDate(now.getDate() - daysToSubtract);
        filterDate.setHours(0, 0, 0, 0);

        return leads.filter(lead => 
            lead.lastInteractionDate && new Date(lead.lastInteractionDate) >= filterDate
        );
    }, [leads, interactionFilter]);

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1);
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-row');
                setTimeout(() => {
                    element.classList.remove('highlight-row');
                    navigate(location.pathname, { replace: true });
                }, 2500);
            }
        }
    }, [location.hash, navigate, leads]);

    const handleProductInputChange = (field: 'productId' | 'quantity', value: string) => {
        if (field === 'quantity') {
            const numValue = parseInt(value, 10);
            setNewOppProduct(prev => ({ ...prev, [field]: numValue >= 1 ? numValue : 1 }));
        } else {
            setNewOppProduct(prev => ({ ...prev, [field]: value }));
        }
    };
    
    const handleAddProduct = () => {
        const product = products.find(p => p.id === newOppProduct.productId);
        if (product && newOppProduct.quantity > 0) {
            setOpportunityProducts(current => [...current, { 
                productId: product.id, 
                productName: product.name, 
                quantity: newOppProduct.quantity, 
                price: product.price 
            }]);
            setNewOppProduct({ productId: '', quantity: 1 }); // Reset for next entry
        }
    };

    const handleOpenLeadModal = (lead: Lead | null) => {
        setEditingLead(lead);
        setLeadFormData(lead ? { ...lead } : initialLeadState);
        setIsLeadModalOpen(true);
    };
    const handleCloseLeadModal = () => {
        setIsLeadModalOpen(false);
        setEditingLead(null);
    };

    const handleOpenInteractionModal = (lead: Lead) => {
        setSelectedLead(lead);
        setIsInteractionModalOpen(true);
        setNewInteraction({ ...initialInteractionState, salespersonId: lead.salespersonId });
    };
    const handleCloseInteractionModal = () => {
        setSelectedLead(null);
        setIsInteractionModalOpen(false);
        setNewInteraction(initialInteractionState);
        setEditingInteraction(null);
    };
    
    const handleOpenConvertModal = (lead: Lead) => {
        setSelectedLead(lead);
        setIsConvertModalOpen(true);
        setOpportunityProducts([]);
        setOppDetails({ closeDate: '', stage: OpportunityStage.PROSPECCION });
        setNewOppProduct({ productId: '', quantity: 1 });
    };

    const handleCloseConvertModal = () => {
        setSelectedLead(null);
        setIsConvertModalOpen(false);
        setOpportunityProducts([]);
        setOppDetails({ closeDate: '', stage: OpportunityStage.PROSPECCION });
    };

    const handleLeadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadFormData.salespersonId) return alert("Por favor, asigne el prospecto a un vendedor.");
        if (editingLead) {
            updateLead({ ...editingLead, ...leadFormData });
        } else {
            addLead(leadFormData);
        }
        handleCloseLeadModal();
    };

    const handleInteractionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead || !newInteraction.salespersonId) return;

        if(editingInteraction) {
            updateInteraction({ ...editingInteraction, ...newInteraction });
        } else {
            addInteraction({ ...newInteraction, leadId: selectedLead.id });
        }

        setNewInteraction(initialInteractionState); 
        setEditingInteraction(null);
    };

    const handleConvertSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead || opportunityProducts.length === 0 || !oppDetails.closeDate) {
            return alert("Por favor, complete todos los campos de la oportunidad.");
        }
        convertLeadToOpportunity(selectedLead.id, {
            ...oppDetails,
            products: [...opportunityProducts],
            salespersonId: selectedLead.salespersonId
        });
        handleCloseConvertModal();
    };

    const handleDeleteClick = (leadId: string) => {
        setLeadToDeleteId(leadId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (leadToDeleteId) {
            deleteLead(leadToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setLeadToDeleteId(null);
    };
    
    const handleEditInteraction = (interaction: Interaction) => {
        setEditingInteraction(interaction);
        setNewInteraction({
            type: interaction.type,
            notes: interaction.notes,
            salespersonId: interaction.salespersonId,
        });
    };

    const handleDeleteInteractionClick = (interaction: Interaction) => {
        setInteractionToDelete(interaction);
        setIsInteractionConfirmModalOpen(true);
    };

    const handleConfirmInteractionDelete = () => {
        if (interactionToDelete) {
            deleteInteraction(interactionToDelete.id);
        }
        setIsInteractionConfirmModalOpen(false);
        setInteractionToDelete(null);
    };

    const handleCancelEdit = () => {
        setEditingInteraction(null);
        setNewInteraction(initialInteractionState);
    };

    const getSalespersonName = (salespersonId: string) => salespeople.find(sp => sp.id === salespersonId)?.name || 'No asignado';
    
    const getLeadInteractions = (leadId: string) => {
        const correspondingOpportunity = opportunities.find(o => o.originalLeadId === leadId);

        return interactions
            .filter(i =>
                i.leadId === leadId ||
                (correspondingOpportunity && i.opportunityId === correspondingOpportunity.id)
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Listado de Prospectos</h1>
                    <button onClick={() => handleOpenLeadModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <span>+ Nuevo Prospecto</span>
                    </button>
                </div>
                 
                 <div className="flex flex-wrap items-center justify-start gap-2 mb-6">
                    {
                      [
                        {key: 'all', label: 'Todos'},
                        {key: '7', label: 'Interactuado en 7 Días'},
                        {key: '30', label: 'Interactuado en 30 Días'},
                        {key: '90', label: 'Interactuado en 90 Días'},
                      ].map(({key, label}) => (
                      <button
                        key={key}
                        onClick={() => setInteractionFilter(key)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          interactionFilter === key
                            ? 'bg-cyan-500 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                 <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-700/50 text-slate-300 uppercase tracking-wider hidden md:table-header-group">
                                <tr>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Empresa</th>
                                    <th className="p-4">Teléfono</th>
                                    <th className="p-4">Asignado a</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredLeads.map(lead => (
                                    <tr key={lead.id} id={lead.id} className="hover:bg-slate-700/50 transition-colors block md:table-row mb-2 md:mb-0 bg-slate-800 md:bg-transparent rounded-lg md:rounded-none">
                                        <td className="p-4 font-medium text-slate-100 block md:table-cell" data-label="Nombre: ">
                                            <p>{lead.name}</p>
                                            <a href={`mailto:${lead.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs">{lead.email}</a>
                                        </td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Empresa: ">{lead.company}</td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Teléfono: ">
                                          {lead.phone ? (
                                             <a href={`tel:${lead.phone}`} className="text-cyan-400 hover:text-cyan-300">{lead.phone}</a>
                                          ) : (
                                            <span>N/A</span>
                                          )}
                                        </td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Asignado a: ">{getSalespersonName(lead.salespersonId)}</td>
                                        <td className="p-4 block md:table-cell" data-label="Estado: ">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[lead.status]}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="p-4 block md:table-cell">
                                            <div className="flex items-center space-x-1">
                                                <button onClick={() => handleOpenConvertModal(lead)} className="p-2 text-green-400 hover:text-green-300 rounded-md hover:bg-slate-700" title="Convertir a Oportunidad"><CurrencyDollarIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleOpenInteractionModal(lead)} className="p-2 text-cyan-400 hover:text-cyan-300 rounded-md hover:bg-slate-700" title="Ver/Añadir Interacciones"><ChatBubbleLeftRightIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleOpenLeadModal(lead)} className="p-2 text-yellow-400 hover:text-yellow-300 rounded-md hover:bg-slate-700" title="Editar Prospecto"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleDeleteClick(lead.id)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-slate-700" title="Eliminar Prospecto"><TrashIcon className="h-5 w-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}
            
            {isLeadModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingLead ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h2>
                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                             <input type="text" name="name" value={leadFormData.name} onChange={(e) => setLeadFormData(p => ({...p, name: e.target.value}))} placeholder="Nombre del Contacto" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="text" name="company" value={leadFormData.company} onChange={(e) => setLeadFormData(p => ({...p, company: e.target.value}))} placeholder="Empresa" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="email" name="email" value={leadFormData.email} onChange={(e) => setLeadFormData(p => ({...p, email: e.target.value}))} placeholder="Email" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="tel" name="phone" value={leadFormData.phone} onChange={(e) => setLeadFormData(p => ({...p, phone: e.target.value}))} placeholder="Teléfono" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                             <input type="text" name="source" value={leadFormData.source} onChange={(e) => setLeadFormData(p => ({...p, source: e.target.value}))} placeholder="Origen del Prospecto (ej. Web, Referido)" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                             <select 
                                name="salespersonId" 
                                value={leadFormData.salespersonId} 
                                onChange={(e) => setLeadFormData(p => ({...p, salespersonId: e.target.value}))} 
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                required
                                disabled={user.role === 'salesperson'}
                            >
                                <option value="" disabled>Asignar a Vendedor...</option>
                                {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                            </select>
                             <select name="status" value={leadFormData.status} onChange={(e) => setLeadFormData(p => ({...p, status: e.target.value as LeadStatus}))} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {Object.values(LeadStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseLeadModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">{editingLead ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isInteractionModalOpen && selectedLead && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-10 sm:pt-16">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Interacciones: {selectedLead.name}</h2>
                            <button onClick={handleCloseInteractionModal} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                        </div>
                        
                        <form onSubmit={handleInteractionSubmit} className="space-y-4 bg-slate-700/50 p-4 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-white">{editingInteraction ? 'Editar Interacción' : 'Añadir Nueva Interacción'}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select name="type" value={newInteraction.type} onChange={e => setNewInteraction(p => ({...p, type: e.target.value as InteractionType}))} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    {Object.values(InteractionType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <select 
                                    name="salespersonId" 
                                    value={newInteraction.salespersonId} 
                                    onChange={e => setNewInteraction(p => ({...p, salespersonId: e.target.value}))} 
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                    required
                                    disabled={user.role === 'salesperson'}
                                >
                                    <option value="" disabled>Realizada por...</option>
                                    {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                                </select>
                            </div>
                            <textarea name="notes" value={newInteraction.notes} onChange={e => setNewInteraction(p => ({...p, notes: e.target.value}))} placeholder="Notas de la interacción..." className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 h-20" required />
                            <div className="flex justify-end items-center gap-4">
                                {editingInteraction && (
                                    <button type="button" onClick={handleCancelEdit} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar Edición</button>
                                )}
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">
                                    {editingInteraction ? 'Actualizar' : 'Guardar'} Interacción
                                </button>
                            </div>
                        </form>

                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                           {getLeadInteractions(selectedLead.id).map(interaction => (
                               <div key={interaction.id} className="bg-slate-900/50 p-4 rounded-lg group">
                                   <div className="flex justify-between items-start text-sm mb-2">
                                       <div>
                                            <span className="font-bold text-cyan-400">{interaction.type}</span>
                                            <span className="text-slate-400 ml-4">{new Date(interaction.date).toLocaleString()}</span>
                                       </div>
                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => handleEditInteraction(interaction)} className="p-1 text-yellow-400 hover:text-yellow-300 rounded-md hover:bg-slate-700" title="Editar Interacción"><PencilIcon className="h-4 w-4" /></button>
                                           <button onClick={() => handleDeleteInteractionClick(interaction)} className="p-1 text-red-400 hover:text-red-300 rounded-md hover:bg-slate-700" title="Eliminar Interacción"><TrashIcon className="h-4 w-4" /></button>
                                       </div>
                                   </div>
                                   <p className="text-slate-200 whitespace-pre-wrap">{interaction.notes}</p>
                                   <p className="text-right text-xs text-slate-500 mt-2">por {getSalespersonName(interaction.salespersonId)}</p>
                               </div>
                           ))}
                           {getLeadInteractions(selectedLead.id).length === 0 && <p className="text-slate-400 text-center py-4">No hay interacciones registradas.</p>}
                        </div>
                    </div>
                </div>
            )}
             {isConvertModalOpen && selectedLead && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">Convertir Prospecto: {selectedLead.name}</h2>
                        <form onSubmit={handleConvertSubmit} className="space-y-4">
                            <p className="text-slate-300">Creando una oportunidad para la empresa <span className="font-semibold text-cyan-400">{selectedLead.company}</span>.</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="date" name="closeDate" value={oppDetails.closeDate} onChange={e => setOppDetails(p => ({...p, closeDate: e.target.value}))} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                <select name="stage" value={oppDetails.stage} onChange={e => setOppDetails(p => ({...p, stage: e.target.value as OpportunityStage}))} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    {Object.values(OpportunityStage).map(stage => <option key={stage} value={stage}>{stage}</option>)}
                                </select>
                            </div>
                            <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-white mb-3">Productos</h3>
                                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto pr-2">
                                    {opportunityProducts.map((p) => (
                                        <div key={p.productId} className="flex items-center justify-between bg-slate-800 p-2 rounded">
                                            <span className="text-sm text-slate-200">{p.productName} (x{p.quantity})</span>
                                            <button type="button" onClick={() => setOpportunityProducts(current => current.filter((item) => item.productId !== p.productId))} className="text-red-400 hover:text-red-300 font-bold">&times;</button>
                                        </div>
                                    ))}
                                    {opportunityProducts.length === 0 && <p className="text-sm text-center text-slate-400">Añada productos a la oportunidad.</p>}
                                </div>
                                <div className="flex items-end gap-2">
                                     <div className="flex-grow">
                                        <label htmlFor="product-select" className="text-xs text-slate-400">Producto</label>
                                        <select 
                                            id="product-select"
                                            value={newOppProduct.productId}
                                            onChange={(e) => handleProductInputChange('productId', e.target.value)}
                                            className="w-full bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                            <option value="">Seleccionar producto...</option>
                                            {products
                                                .filter(p => !opportunityProducts.some(op => op.productId === p.id))
                                                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="product-quantity" className="text-xs text-slate-400">Cant.</label>
                                        <input 
                                            id="product-quantity"
                                            type="number" 
                                            value={newOppProduct.quantity}
                                            onChange={(e) => handleProductInputChange('quantity', e.target.value)}
                                            min="1" 
                                            className="w-20 bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleAddProduct}
                                        disabled={!newOppProduct.productId}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm whitespace-nowrap disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        Añadir
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseConvertModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-green-500 hover:bg-green-600 rounded-md text-white font-semibold transition-colors">Convertir a Oportunidad</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Prospecto"
                message={
                    leadToDeleteId ? (
                        <>
                            ¿Está seguro de que desea eliminar al prospecto "<strong>{leads.find(l => l.id === leadToDeleteId)?.name}</strong>"? 
                            <br/><br/>
                            <span className="font-bold">También se eliminarán todas sus interacciones asociadas.</span>
                        </>
                    ) : ''
                }
            />
            <ConfirmationModal
                isOpen={isInteractionConfirmModalOpen}
                onClose={() => setIsInteractionConfirmModalOpen(false)}
                onConfirm={handleConfirmInteractionDelete}
                title="Confirmar Eliminación de Interacción"
                message="¿Está seguro de que desea eliminar esta interacción? Esta acción no se puede deshacer."
            />
        </>
    );
};

export default Listado;