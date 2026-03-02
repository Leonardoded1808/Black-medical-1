
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Opportunity, Client, Product, Salesperson, OpportunityProduct, User, Interaction, Lead, Task } from '../types';
import { OpportunityStage, InteractionType } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import InteractionsModal from './InteractionsModal';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import SearchIcon from './icons/SearchIcon';
import CalendarIcon from './icons/CalendarIcon';
import { TaskModal } from './TaskModal';

interface OpportunitiesProps {
    user: User;
    opportunities: Opportunity[];
    clients: Client[];
    leads: Lead[];
    products: Product[];
    salespeople: Salesperson[];
    interactions: Interaction[];
    addOpportunity: (opportunity: Omit<Opportunity, 'id' | 'clientName'>, explicitClientName?: string) => Opportunity | null;
    updateOpportunity: (opportunity: Opportunity) => void;
    deleteOpportunity: (opportunityId: string) => void;
    addInteraction: (interaction: Omit<Interaction, 'id' | 'date'>) => void;
    updateInteraction: (interaction: Interaction) => void;
    deleteInteraction: (interactionId: string) => void;
    addTask: (task: Omit<Task, 'id' | 'associatedName' | 'opportunityValue'>) => void;
}

const stageColors: Record<OpportunityStage, string> = {
    [OpportunityStage.PROSPECCION]: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    [OpportunityStage.PROPUESTA]: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    [OpportunityStage.NEGOCIACION]: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    [OpportunityStage.GANADA]: 'border-green-500/50 bg-green-500/10 text-green-400',
    [OpportunityStage.PERDIDA]: 'border-red-500/50 bg-red-500/10 text-red-400',
};

const Opportunities: React.FC<OpportunitiesProps> = ({ user, opportunities, clients, leads, products, salespeople, interactions, addOpportunity, updateOpportunity, deleteOpportunity, addInteraction, updateInteraction, deleteInteraction, addTask }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskOpp, setTaskOpp] = useState<Opportunity | null>(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [oppToDeleteId, setOppToDeleteId] = useState<string | null>(null);

    const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

    const initialFormState = { clientId: '', salespersonId: user.role === 'salesperson' ? user.id : '', stage: OpportunityStage.PROSPECCION, closeDate: '', value: 0 };
    const [oppFormData, setOppFormData] = useState(initialFormState);
    const [oppProducts, setOppProducts] = useState<OpportunityProduct[]>([]);
    const [sortBy, setSortBy] = useState<'alpha' | 'recent'>('alpha');
    const [searchTerm, setSearchTerm] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate();

    const handleOpenTaskModal = (opp: Opportunity) => {
        setTaskOpp(opp);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setTaskOpp(null);
        setIsTaskModalOpen(false);
    };

    const handleSaveTask = (taskData: Omit<Task, 'id'>) => {
        addTask(taskData);
        handleCloseTaskModal();
    };

    const sortedOpportunities = useMemo(() => {
        let list = [...opportunities];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            list = list.filter(opp => {
                const clientMatch = opp.clientName.toLowerCase().includes(lowerTerm);
                const productMatch = opp.products.some(p => p.productName.toLowerCase().includes(lowerTerm));
                const salespersonMatch = salespeople.find(sp => sp.id === opp.salespersonId)?.name.toLowerCase().includes(lowerTerm);
                return clientMatch || productMatch || salespersonMatch;
            });
        }

        if (sortBy === 'alpha') {
            return list.sort((a, b) => a.clientName.localeCompare(b.clientName));
        } else {
            return list.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
        }
    }, [opportunities, sortBy, searchTerm, salespeople]);

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
    }, [location.hash, navigate, opportunities]);

    useEffect(() => {
        if (isModalOpen) {
            if (editingOpp) {
                setOppFormData({
                    clientId: editingOpp.clientId || '',
                    salespersonId: editingOpp.salespersonId,
                    stage: editingOpp.stage,
                    closeDate: editingOpp.closeDate,
                    value: editingOpp.value,
                });
                setOppProducts(editingOpp.products);
            } else {
                setOppFormData(initialFormState);
                setOppProducts([]);
            }
        }
    }, [isModalOpen, editingOpp]);

    const handleOpenModal = (opp: Opportunity | null) => {
        setEditingOpp(opp);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOpp(null);
    };

    const handleOpenInteractionModal = (opp: Opportunity) => {
        setSelectedOpp(opp);
        setIsInteractionModalOpen(true);
    };

    const handleCloseInteractionModal = () => {
        setSelectedOpp(null);
        setIsInteractionModalOpen(false);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setOppFormData(prev => ({ ...prev, [name]: name === 'value' ? parseFloat(value) || 0 : value }));
    };

    const handleAddProduct = () => {
        const select = document.getElementById('product-select-modal') as HTMLSelectElement;
        const quantityInput = document.getElementById('product-quantity-modal') as HTMLInputElement;
        const product = products.find(p => p.id === select.value);
        if (product && !oppProducts.find(p => p.productId === product.id)) {
            const quantity = parseInt(quantityInput.value) || 1;
            setOppProducts(current => [...current, { productId: product.id, productName: product.name, quantity, price: product.price }]);
        }
    };
    
    const handleRemoveProduct = (productId: string) => {
        setOppProducts(current => current.filter(p => p.productId !== productId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const submissionData = {
            ...oppFormData,
            products: oppProducts,
        };

        if (editingOpp) {
            updateOpportunity({ ...editingOpp, ...submissionData });
        } else {
             if (!oppFormData.clientId || !oppFormData.salespersonId || oppProducts.length === 0) {
                alert("Por favor, complete todos los campos y añada al menos un producto.");
                return;
            }
            addOpportunity(submissionData);
        }
        handleCloseModal();
    };
    
    const handleDeleteClick = (oppId: string) => {
        setOppToDeleteId(oppId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (oppToDeleteId) {
            deleteOpportunity(oppToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setOppToDeleteId(null);
    };
    
    const getSalespersonName = (salespersonId: string) => salespeople.find(sp => sp.id === salespersonId)?.name || 'No asignado';
    
    const getOppInteractions = (opp: Opportunity) => {
        return interactions
            .filter(i => i.opportunityId === opp.id || (opp.originalLeadId && i.leadId === opp.originalLeadId))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Oportunidades</h1>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Buscar oportunidad..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        </div>

                        <div className="flex items-center gap-3 bg-slate-800 p-1.5 rounded-lg border border-slate-700 w-full sm:w-auto justify-center">
                            <span className="text-sm text-slate-400 ml-2 hidden sm:inline">Ordenar por:</span>
                            <button 
                                onClick={() => setSortBy('alpha')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sortBy === 'alpha' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                A-Z
                            </button>
                            <button 
                                onClick={() => setSortBy('recent')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sortBy === 'recent' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Recientes
                            </button>
                        </div>
                        <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                            <span>+ Nueva Oportunidad</span>
                        </button>
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-700/50 text-slate-300 uppercase tracking-wider hidden md:table-header-group">
                                <tr>
                                    <th className="p-4">Cliente / Prospecto</th>
                                    <th className="p-4">Teléfono</th>
                                    <th className="p-4">Productos</th>
                                    <th className="p-4">Valor</th>
                                    <th className="p-4">Etapa</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {sortedOpportunities.length > 0 ? sortedOpportunities.map(opp => {
                                    const client = opp.clientId ? clients.find(c => c.id === opp.clientId) : null;
                                    const originalLead = opp.originalLeadId ? leads.find(l => l.id === opp.originalLeadId) : null;
            
                                    const clientPhone = client?.phone || originalLead?.phone || 'N/A';
                                    const contactPerson = client?.contactPerson || originalLead?.name || 'N/A';
                                    
                                    const originalValue = opp.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
                                    const hasDiscountOrIncrease = originalValue.toFixed(2) !== opp.value.toFixed(2);
                                    
                                    return (
                                    <tr key={opp.id} id={opp.id} className="hover:bg-slate-700/50 transition-colors block md:table-row mb-2 md:mb-0 bg-slate-800 md:bg-transparent rounded-lg md:rounded-none">
                                        <td className="p-4 font-medium text-slate-100 block md:table-cell" data-label="Cliente:">
                                            <div>
                                                {opp.clientName}
                                                {contactPerson !== 'N/A' && <p className="text-sm text-slate-400 font-normal">{contactPerson}</p>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Teléfono:">
                                            {clientPhone !== 'N/A' ? (
                                                <a href={`tel:${clientPhone}`} className="text-cyan-400 hover:text-cyan-300">{clientPhone}</a>
                                            ) : (
                                                <span className="text-slate-500">N/A</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Productos:">
                                            <ul className="list-disc list-inside">
                                               {opp.products.map(p => <li key={p.productId}>{p.productName} (x{p.quantity})</li>)}
                                            </ul>
                                        </td>
                                        <td className="p-4 font-medium block md:table-cell" data-label="Valor:">
                                            {hasDiscountOrIncrease ? (
                                                <div>
                                                    <span className="line-through text-slate-500 text-xs">
                                                        €{originalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <p className={`font-bold ${opp.value < originalValue ? 'text-orange-400' : 'text-yellow-400'}`}>
                                                        €{opp.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-green-400">
                                                    €{opp.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 block md:table-cell" data-label="Etapa:">
                                            <span className={`px-2 py-1 text-xs font-semibold border rounded-full ${stageColors[opp.stage]}`}>
                                                {opp.stage}
                                            </span>
                                        </td>
                                        <td className="p-4 block md:table-cell">
                                            <div className="flex items-center space-x-2">
                                                 {clientPhone !== 'N/A' && (
                                                    <a 
                                                        href={`https://wa.me/${clientPhone.replace(/\D/g, '')}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-green-400 hover:text-green-300 rounded-md hover:bg-slate-700" 
                                                        title="Abrir WhatsApp Directo"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                    </a>
                                                 )}
                                                 <button onClick={() => handleOpenTaskModal(opp)} className="p-2 text-purple-400 hover:text-purple-300 rounded-md hover:bg-slate-700" title="Agendar Tarea">
                                                    <CalendarIcon className="h-4 w-4" />
                                                 </button>
                                                 <button onClick={() => handleOpenInteractionModal(opp)} className="p-2 text-cyan-400 hover:text-cyan-300 rounded-md hover:bg-slate-700" title="Ver/Añadir Interacciones"><ChatBubbleLeftRightIcon className="h-4 w-4" /></button>
                                                 <button onClick={() => handleOpenModal(opp)} className="p-2 text-yellow-400 hover:text-yellow-300 rounded-md hover:bg-slate-700" title="Editar"><PencilIcon className="h-4 w-4" /></button>
                                                 <button onClick={() => handleDeleteClick(opp.id)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-slate-700" title="Eliminar"><TrashIcon className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8 text-slate-400">
                                            {searchTerm ? 'No se encontraron oportunidades con ese criterio.' : 'No hay oportunidades registradas.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingOpp ? 'Editar' : 'Nueva'} Oportunidad</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {editingOpp ? (
                                    <div>
                                        <label htmlFor="clientName-display" className="text-sm font-medium text-slate-300 mb-1 block">Cliente / Prospecto</label>
                                        <input
                                            id="clientName-display"
                                            type="text"
                                            value={editingOpp.clientName}
                                            className="w-full bg-slate-900/50 text-slate-300 p-3 rounded-md cursor-not-allowed border border-slate-700"
                                            disabled
                                        />
                                    </div>
                                ) : (
                                    <select name="clientId" value={oppFormData.clientId} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required>
                                        <option value="" disabled>Seleccione un Cliente</option>
                                        {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                                    </select>
                                )}
                                <select 
                                    name="salespersonId" 
                                    value={oppFormData.salespersonId} 
                                    onChange={handleInputChange} 
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                    required
                                    disabled={user.role === 'salesperson'}
                                >
                                    <option value="" disabled>Seleccione un Vendedor</option>
                                    {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                                </select>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="date" name="closeDate" value={oppFormData.closeDate} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                <select name="stage" value={oppFormData.stage} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    {Object.values(OpportunityStage).map(stage => <option key={stage} value={stage}>{stage}</option>)}
                                </select>
                            </div>

                             <div>
                                <label htmlFor="opp-value" className="text-sm font-medium text-slate-300 mb-1 block">Valor Total Manual (€)</label>
                                <input 
                                    id="opp-value"
                                    type="number"
                                    step="0.01"
                                    name="value"
                                    value={oppFormData.value || ''}
                                    onChange={handleInputChange}
                                    placeholder="Valor Total (€)" 
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    required 
                                />
                                <p className="text-xs text-slate-400 mt-1">Este valor anula el cálculo automático de los productos. Ajústelo para reflejar descuentos o costes adicionales.</p>
                            </div>

                             <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-white mb-3">Productos</h3>
                                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                                    {oppProducts.map(p => (
                                        <div key={p.productId} className="flex items-center justify-between bg-slate-800 p-2 rounded">
                                            <span className="text-sm text-slate-200">{p.productName} (x{p.quantity})</span>
                                            <button type="button" onClick={() => handleRemoveProduct(p.productId)} className="text-red-400 hover:text-red-300 font-bold">&times;</button>
                                        </div>
                                    ))}
                                    {oppProducts.length === 0 && <p className="text-slate-400 text-sm text-center">Añada productos a la oportunidad.</p>}
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <label htmlFor="product-select-modal" className="text-xs text-slate-400">Producto</label>
                                        <select id="product-select-modal" className="w-full bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="product-quantity-modal" className="text-xs text-slate-400">Cant.</label>
                                        <input id="product-quantity-modal" type="number" defaultValue="1" min="1" className="w-20 bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                                    </div>
                                    <button type="button" onClick={handleAddProduct} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm whitespace-nowrap">Añadir</button>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">{editingOpp ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Oportunidad"
                message={
                    oppToDeleteId ? (
                        <>
                            ¿Está seguro de que desea eliminar la oportunidad para "<strong>{opportunities.find(o => o.id === oppToDeleteId)?.clientName}</strong>"?
                            <br/><br/>
                            <span className="font-bold">La tarea asociada en el calendario y las interacciones de esta oportunidad también se eliminarán.</span>
                        </>
                    ) : ''
                }
            />
            {isInteractionModalOpen && selectedOpp && (
                <InteractionsModal
                    isOpen={isInteractionModalOpen}
                    onClose={handleCloseInteractionModal}
                    title={`Interacciones con ${selectedOpp.clientName}`}
                    entityId={selectedOpp.id}
                    entityType="opportunity"
                    interactions={getOppInteractions(selectedOpp)}
                    salespeople={salespeople}
                    currentUserId={user.id}
                    onAdd={addInteraction}
                    onUpdate={updateInteraction}
                    onDelete={deleteInteraction}
                />
            )}

            {isTaskModalOpen && taskOpp && (
                <TaskModal
                    isOpen={isTaskModalOpen}
                    onClose={handleCloseTaskModal}
                    onSave={handleSaveTask}
                    initialData={{
                        opportunityId: taskOpp.id,
                        associatedName: taskOpp.clientName,
                        clientId: taskOpp.clientId,
                        leadId: taskOpp.originalLeadId,
                    }}
                    salespeople={salespeople}
                    currentUserRole={user.role}
                    currentUserId={user.id}
                />
            )}
        </>
    );
};

export default Opportunities;
