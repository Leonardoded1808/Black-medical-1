
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Lead, Salesperson, Interaction, Product, OpportunityProduct, User, Opportunity, WhatsAppTemplate } from '../types';
import { LeadStatus, InteractionType, OpportunityStage } from '../types';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import SearchIcon from './icons/SearchIcon';
import ConfirmationModal from './ConfirmationModal';
import { WhatsAppProductModal } from './WhatsAppProductModal';
import { EmailProductModal } from './EmailProductModal';
import EnvelopeIcon from './icons/EnvelopeIcon';

interface ListadoProps {
    user: User;
    leads: Lead[];
    salespeople: Salesperson[];
    interactions: Interaction[];
    products: Product[];
    opportunities: Opportunity[];
    whatsappTemplates: WhatsAppTemplate[];
    addLead: (lead: Omit<Lead, 'id'>) => void;
    updateLead: (lead: Lead) => void;
    deleteLead: (leadId: string) => void;
    addInteraction: (interaction: Omit<Interaction, 'id' | 'date'>) => void;
    updateInteraction: (interaction: Interaction) => void;
    deleteInteraction: (interactionId: string) => void;
    convertLeadToOpportunity: (leadId: string, opportunityData: { products: OpportunityProduct[], closeDate: string, stage: OpportunityStage, salespersonId: string }) => Opportunity | null;
}

const statusColors: Record<LeadStatus, string> = {
    [LeadStatus.NUEVO]: 'bg-blue-500/20 text-blue-300',
    [LeadStatus.CONTACTADO]: 'bg-yellow-500/20 text-yellow-300',
    [LeadStatus.CALIFICADO]: 'bg-green-500/20 text-green-300',
    [LeadStatus.PERDIDO]: 'bg-red-500/20 text-red-300',
};

const Listado: React.FC<ListadoProps> = ({ user, leads, salespeople, interactions, products, opportunities, whatsappTemplates, addLead, updateLead, deleteLead, addInteraction, updateInteraction, deleteInteraction, convertLeadToOpportunity }) => {
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    
    const [leadToDeleteId, setLeadToDeleteId] = useState<string | null>(null);
    
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
    const [emailLead, setEmailLead] = useState<Lead | null>(null);
    
    const initialLeadState: Omit<Lead, 'id'> = { 
        name: '', 
        company: '', 
        email: '', 
        phone: '', 
        source: '', 
        origin: 'Instagram', 
        status: LeadStatus.NUEVO, 
        salespersonId: user.role === 'salesperson' ? user.id : 'ADM' 
    };
    const [leadFormData, setLeadFormData] = useState<Omit<Lead, 'id'>>(initialLeadState);

    const initialInteractionState = { type: InteractionType.LLAMADA, notes: '', salespersonId: '' };
    const [newInteraction, setNewInteraction] = useState<{type: InteractionType, notes: string, salespersonId: string}>(initialInteractionState);
    const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
    const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);
    const [isInteractionConfirmModalOpen, setIsInteractionConfirmModalOpen] = useState(false);


    const [opportunityProducts, setOpportunityProducts] = useState<OpportunityProduct[]>([]);
    const [oppDetails, setOppDetails] = useState({ closeDate: '', stage: OpportunityStage.PROSPECCION });
    
    const [newOppProduct, setNewOppProduct] = useState({ productId: '', quantity: 1 });

    const [sortBy, setSortBy] = useState<'alpha' | 'recent'>('recent'); // Default to recent to show new leads first
    const [searchTerm, setSearchTerm] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate();

    const formatWhatsAppLink = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}`;
    };

    const markAsReadIfNeeded = (lead: Lead) => {
        if (lead.isUnread) {
            updateLead({ ...lead, isUnread: false });
        }
    };

    const sortedLeads = useMemo(() => {
        let list = [...leads];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            list = list.filter(lead => 
                lead.name.toLowerCase().includes(lowerTerm) ||
                lead.company.toLowerCase().includes(lowerTerm) ||
                lead.email.toLowerCase().includes(lowerTerm) ||
                lead.phone.includes(lowerTerm) ||
                lead.source.toLowerCase().includes(lowerTerm)
            );
        }

        // Sort by unread first, then by the selected criteria
        return list.sort((a, b) => {
            // Unread items always come first
            if (a.isUnread && !b.isUnread) return -1;
            if (!a.isUnread && b.isUnread) return 1;

            if (sortBy === 'alpha') {
                return a.name.localeCompare(b.name);
            } else {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }
        });
    }, [leads, sortBy, searchTerm]);

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
        if (lead) markAsReadIfNeeded(lead);
        setEditingLead(lead);
        setLeadFormData(lead ? { ...lead } : initialLeadState);
        setIsLeadModalOpen(true);
    };
    const handleCloseLeadModal = () => {
        setIsLeadModalOpen(false);
        setEditingLead(null);
    };

    const handleOpenInteractionModal = (lead: Lead) => {
        markAsReadIfNeeded(lead);
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
        markAsReadIfNeeded(lead);
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

    const handleOpenWhatsAppModal = (lead: Lead) => {
        markAsReadIfNeeded(lead);
        setWhatsappLead(lead);
        setIsWhatsAppModalOpen(true);
    };

    const handleCloseWhatsAppModal = () => {
        setWhatsappLead(null);
        setIsWhatsAppModalOpen(false);
    };

    const handleOpenEmailModal = (lead: Lead) => {
        markAsReadIfNeeded(lead);
        setEmailLead(lead);
        setIsEmailModalOpen(true);
    };

    const handleCloseEmailModal = () => {
        setEmailLead(null);
        setIsEmailModalOpen(false);
    };

    const handleWhatsAppSent = (productId: string, message: string) => {
        if (whatsappLead) {
            const product = products.find(p => p.id === productId);
            addInteraction({
                leadId: whatsappLead.id,
                salespersonId: whatsappLead.salespersonId,
                type: InteractionType.MENSAJE,
                notes: `Enviado WhatsApp con información del producto: ${product?.name}. \n\nContenido: ${message.substring(0, 50)}...`,
            });
        }
    };

    const handleEmailSent = (productId: string, subject: string, message: string) => {
        if (emailLead) {
            const product = products.find(p => p.id === productId);
            addInteraction({
                leadId: emailLead.id,
                salespersonId: emailLead.salespersonId,
                type: InteractionType.EMAIL,
                notes: `Enviado Email con información del producto: ${product?.name}. \nAsunto: ${subject}\n\nContenido: ${message.substring(0, 50)}...`,
            });
        }
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
        const newOpportunity = convertLeadToOpportunity(selectedLead.id, {
            ...oppDetails,
            products: [...opportunityProducts],
            salespersonId: selectedLead.salespersonId
        });
        handleCloseConvertModal();
        if (newOpportunity) {
            navigate(`/opportunities#${newOpportunity.id}`);
        } else {
            alert("Error al convertir el prospecto. Por favor, inténtelo de nuevo.");
        }
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

    const getSalespersonName = (salespersonId: string) => {
        if (salespersonId === 'ADM') return 'Administrador';
        return salespeople.find(sp => sp.id === salespersonId)?.name || 'No asignado';
    };
    
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
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Buscar prospecto..."
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
                        <button onClick={() => handleOpenLeadModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                            <span>+ Nuevo Prospecto</span>
                        </button>
                    </div>
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
                                {sortedLeads.length > 0 ? sortedLeads.map(lead => (
                                    <tr 
                                        key={lead.id} 
                                        id={lead.id} 
                                        className={`transition-colors block md:table-row mb-2 md:mb-0 rounded-lg md:rounded-none ${lead.isUnread ? 'bg-blue-900/40 hover:bg-blue-900/50' : 'bg-slate-800 hover:bg-slate-700/50 md:bg-transparent'}`}
                                    >
                                        <td className="p-4 font-medium text-slate-100 block md:table-cell" data-label="Nombre: ">
                                            <div className="flex items-center gap-2">
                                                {lead.isUnread && (
                                                    <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">NUEVO</span>
                                                )}
                                                <p>{lead.name}</p>
                                            </div>
                                            <a href={`mailto:${lead.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs">{lead.email}</a>
                                        </td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Empresa: ">{lead.company || <span className="text-slate-500 italic">No registrada</span>}</td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Teléfono: ">
                                          {lead.phone ? (
                                             <a 
                                                href={formatWhatsAppLink(lead.phone)} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 text-green-400 hover:text-green-300 group"
                                                onClick={(e) => {
                                                    // Optional: mark as read when clicking phone if desired, currently only handled on modals to be safer
                                                    e.stopPropagation();
                                                }}
                                             >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                <span className="group-hover:underline">{lead.phone}</span>
                                             </a>
                                          ) : <span className="text-slate-500 italic">No registrado</span>}
                                        </td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Asignado a: ">{getSalespersonName(lead.salespersonId)}</td>
                                        <td className="p-4 block md:table-cell" data-label="Estado: ">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[lead.status]}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="p-4 block md:table-cell">
                                            <div className="flex items-center space-x-2">
                                                {lead.phone && (
                                                   <button onClick={() => handleOpenWhatsAppModal(lead)} className="p-2 text-green-400 hover:text-green-300 rounded-md hover:bg-slate-700" title="Enviar WhatsApp">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                   </button> 
                                                )}
                                                {lead.email && (
                                                    <button onClick={() => handleOpenEmailModal(lead)} className="p-2 text-blue-400 hover:text-blue-300 rounded-md hover:bg-slate-700" title="Enviar Correo">
                                                        <EnvelopeIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleOpenConvertModal(lead)} className="p-2 text-green-400 hover:text-green-300 rounded-md hover:bg-slate-700" title="Convertir a Oportunidad"><CurrencyDollarIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleOpenInteractionModal(lead)} className="p-2 text-cyan-400 hover:text-cyan-300 rounded-md hover:bg-slate-700" title="Ver/Añadir Interacciones"><ChatBubbleLeftRightIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleOpenLeadModal(lead)} className="p-2 text-yellow-400 hover:text-yellow-300 rounded-md hover:bg-slate-700" title="Editar Prospecto"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleDeleteClick(lead.id)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-slate-700" title="Eliminar Prospecto"><TrashIcon className="h-5 w-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">
                                            {searchTerm ? 'No se encontraron prospectos con ese criterio de búsqueda.' : 'No hay prospectos registrados.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}
            
            {isWhatsAppModalOpen && whatsappLead && (
                <WhatsAppProductModal
                    isOpen={isWhatsAppModalOpen}
                    onClose={handleCloseWhatsAppModal}
                    lead={whatsappLead}
                    products={products}
                    templates={whatsappTemplates}
                    onSend={handleWhatsAppSent}
                />
            )}

            {isEmailModalOpen && emailLead && (
                <EmailProductModal
                    isOpen={isEmailModalOpen}
                    onClose={handleCloseEmailModal}
                    lead={emailLead}
                    products={products}
                    templates={whatsappTemplates}
                    onSend={handleEmailSent}
                />
            )}

            {isLeadModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingLead ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h2>
                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                             <input type="text" name="name" value={leadFormData.name} onChange={(e) => setLeadFormData(p => ({...p, name: e.target.value}))} placeholder="Nombre del Contacto *" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="text" name="company" value={leadFormData.company} onChange={(e) => setLeadFormData(p => ({...p, company: e.target.value}))} placeholder="Empresa (Opcional)" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                             <input type="email" name="email" value={leadFormData.email} onChange={(e) => setLeadFormData(p => ({...p, email: e.target.value}))} placeholder="Email (Opcional)" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                             <input type="tel" name="phone" value={leadFormData.phone} onChange={(e) => setLeadFormData(p => ({...p, phone: e.target.value}))} placeholder="Teléfono *" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select 
                                    name="source" 
                                    value={leadFormData.source} 
                                    onChange={(e) => setLeadFormData(p => ({...p, source: e.target.value}))} 
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">-- Seleccione Interés --</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.name}>{product.name}</option>
                                    ))}
                                </select>
                                <select name="origin" value={leadFormData.origin} onChange={(e) => setLeadFormData(p => ({...p, origin: e.target.value}))} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    <option value="" disabled>Seleccione Origen</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Referido">Referido</option>
                                    <option value="Tiktok">Tiktok</option>
                                    <option value="Local">Local</option>
                                    <option value="Web">Web</option>
                                    <option value="Otro">Otro</option>
                                </select>
                             </div>

                             <select 
                                name="salespersonId" 
                                value={leadFormData.salespersonId} 
                                onChange={(e) => setLeadFormData(p => ({...p, salespersonId: e.target.value}))} 
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                required
                                disabled={user.role === 'salesperson'}
                            >
                                <option value="ADM">Administrador</option>
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
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
                         <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Interacciones: {selectedLead.name}</h2>
                            <button onClick={handleCloseInteractionModal} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                        </div>
                        
                        <div className="mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                             <h3 className="text-lg font-semibold text-cyan-400 mb-3">{editingInteraction ? 'Editar Interacción' : 'Nueva Interacción'}</h3>
                             <form onSubmit={handleInteractionSubmit} className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     <select
                                        value={newInteraction.type}
                                        onChange={(e) => setNewInteraction({...newInteraction, type: e.target.value as InteractionType})}
                                        className="w-full bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    >
                                        {Object.values(InteractionType).map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <select 
                                        value={newInteraction.salespersonId} 
                                        onChange={(e) => setNewInteraction({...newInteraction, salespersonId: e.target.value})} 
                                        className="w-full bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                        required
                                        disabled={user.role === 'salesperson'}
                                    >
                                        <option value="" disabled>Vendedor...</option>
                                        {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                                    </select>
                                </div>
                                <textarea
                                    value={newInteraction.notes}
                                    onChange={(e) => setNewInteraction({...newInteraction, notes: e.target.value})}
                                    placeholder="Notas de la interacción..."
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm h-20"
                                    required
                                />
                                <div className="flex justify-end gap-2">
                                    {editingInteraction && (
                                        <button type="button" onClick={handleCancelEdit} className="py-1.5 px-3 bg-slate-600 hover:bg-slate-500 rounded-md text-white text-xs font-semibold transition-colors">
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="submit" className="py-1.5 px-3 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white text-xs font-semibold transition-colors">
                                        {editingInteraction ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                             </form>
                        </div>

                        <div className="space-y-3">
                            {getLeadInteractions(selectedLead.id).length > 0 ? (
                                getLeadInteractions(selectedLead.id).map(interaction => (
                                    <div key={interaction.id} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    interaction.type === InteractionType.LLAMADA ? 'bg-blue-500/20 text-blue-300' :
                                                    interaction.type === InteractionType.EMAIL ? 'bg-purple-500/20 text-purple-300' :
                                                    interaction.type === InteractionType.REUNION ? 'bg-orange-500/20 text-orange-300' :
                                                    'bg-green-500/20 text-green-300' // MENSAJE
                                                }`}>
                                                    {interaction.type}
                                                </span>
                                                <span className="text-xs text-slate-400">{new Date(interaction.date).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                 <button onClick={() => handleEditInteraction(interaction)} className="text-yellow-400 hover:text-yellow-300 p-1"><PencilIcon className="h-3 w-3" /></button>
                                                 <button onClick={() => handleDeleteInteractionClick(interaction)} className="text-red-400 hover:text-red-300 p-1"><TrashIcon className="h-3 w-3" /></button>
                                            </div>
                                        </div>
                                        <p className="text-slate-200 text-sm whitespace-pre-wrap">{interaction.notes}</p>
                                        <p className="text-xs text-slate-500 mt-2 text-right">Por: {getSalespersonName(interaction.salespersonId)}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-400 text-sm py-4">No hay interacciones registradas.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isConvertModalOpen && selectedLead && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-4">Convertir a Oportunidad</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Estás convirtiendo al prospecto <strong>{selectedLead.name}</strong> en una oportunidad de venta. 
                            Por favor, define los productos de interés y el cierre estimado.
                        </p>
                        
                        <form onSubmit={handleConvertSubmit} className="space-y-4">
                            
                             <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold text-white mb-3">Productos de Interés</h3>
                                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                                    {opportunityProducts.map(p => (
                                        <div key={p.productId} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-600">
                                            <span className="text-sm text-slate-200">{p.productName} (x{p.quantity})</span>
                                            <button type="button" onClick={() => setOpportunityProducts(prev => prev.filter(item => item.productId !== p.productId))} className="text-red-400 hover:text-red-300 font-bold">&times;</button>
                                        </div>
                                    ))}
                                    {opportunityProducts.length === 0 && <p className="text-slate-400 text-xs text-center italic">Añade productos a la oportunidad.</p>}
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <label className="text-xs text-slate-400">Producto</label>
                                        <select 
                                            value={newOppProduct.productId}
                                            onChange={(e) => handleProductInputChange('productId', e.target.value)}
                                            className="w-full bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-20">
                                        <label className="text-xs text-slate-400">Cant.</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={newOppProduct.quantity}
                                            onChange={(e) => handleProductInputChange('quantity', e.target.value)}
                                            className="w-full bg-slate-700 text-white p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm" 
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleAddProduct} 
                                        disabled={!newOppProduct.productId}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-md text-sm whitespace-nowrap text-white"
                                    >
                                        Añadir
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Cierre Estimada</label>
                                <input 
                                    type="date" 
                                    value={oppDetails.closeDate}
                                    onChange={(e) => setOppDetails({...oppDetails, closeDate: e.target.value})}
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Etapa Inicial</label>
                                <select 
                                    value={oppDetails.stage}
                                    onChange={(e) => setOppDetails({...oppDetails, stage: e.target.value as OpportunityStage})}
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    {Object.values(OpportunityStage).map(stage => <option key={stage} value={stage}>{stage}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseConvertModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-green-500 hover:bg-green-600 rounded-md text-white font-semibold transition-colors">Convertir</button>
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
                           <span className="font-bold">Esta acción también eliminará todas las interacciones asociadas.</span>
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
