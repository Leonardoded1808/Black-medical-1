
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Client, Opportunity, Salesperson } from '../types';
import { OpportunityStage } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import SearchIcon from './icons/SearchIcon';
import ConfirmationModal from './ConfirmationModal';

interface ClientsProps {
    clients: Client[];
    updateClient: (client: Client) => void;
    deleteClient: (clientId: string) => void;
    opportunities: Opportunity[];
    salespeople: Salesperson[];
}

const Clients: React.FC<ClientsProps> = ({ clients, updateClient, deleteClient, opportunities, salespeople }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'alpha' | 'recent'>('alpha');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);

    const initialFormState = { name: '', contactPerson: '', email: '', phone: '', address: '' };
    const [clientFormData, setClientFormData] = useState(initialFormState);
    
    const location = useLocation();
    const navigate = useNavigate();

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
    }, [location.hash, navigate, clients]);


    const activeClients = useMemo(() => {
        const wonOppClientIds = new Set(
            opportunities
                .filter(opp => opp.stage === OpportunityStage.GANADA && opp.clientId)
                .map(opp => opp.clientId!)
        );
        return clients.filter(client => wonOppClientIds.has(client.id));
    }, [clients, opportunities]);

    const sortedActiveClients = useMemo(() => {
        let list = [...activeClients];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            list = list.filter(client => 
                client.name.toLowerCase().includes(lowerTerm) ||
                client.contactPerson.toLowerCase().includes(lowerTerm) ||
                client.email.toLowerCase().includes(lowerTerm) ||
                client.phone.includes(lowerTerm) ||
                client.address.toLowerCase().includes(lowerTerm)
            );
        }

        if (sortBy === 'alpha') {
            return list.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            return list.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
        }
    }, [activeClients, sortBy, searchTerm]);

    const handleOpenModal = (client: Client) => {
        setEditingClient(client);
        setClientFormData(client ? { name: client.name, contactPerson: client.contactPerson, email: client.email, phone: client.phone, address: client.address } : initialFormState);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setClientFormData(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setClientFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClient) {
            updateClient({ ...editingClient, ...clientFormData });
        }
        handleCloseModal();
    };
    
    const handleDeleteClick = (clientId: string) => {
        setClientToDeleteId(clientId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (clientToDeleteId) {
            deleteClient(clientToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setClientToDeleteId(null);
    };

    const handleToggleHistory = (clientId: string) => {
        setExpandedClientId(prevId => (prevId === clientId ? null : clientId));
    };

    const getSalespersonName = (salespersonId: string) => {
        return salespeople.find(sp => sp.id === salespersonId)?.name || 'N/A';
    }

    const formatWhatsAppLink = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}`;
    };

    const renderPurchaseHistory = (clientId: string) => {
        const clientPurchases = opportunities
            .filter(opp => opp.clientId === clientId && opp.stage === OpportunityStage.GANADA)
            .sort((a, b) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime());

        return (
            <>
                <h4 className="text-md font-semibold text-white mb-3">Historial de Compras</h4>
                {clientPurchases.length > 0 ? (
                    <div className="space-y-4">
                        {clientPurchases.map(opp => {
                            const calculatedSubtotal = opp.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
                            const difference = opp.value - calculatedSubtotal;
                            
                            return (
                                <div key={opp.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <p className="font-semibold text-slate-200">
                                            Compra del {new Date(opp.closeDate).toLocaleDateString('es-ES')}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            Vendido por: {getSalespersonName(opp.salespersonId)}
                                        </p>
                                    </div>
                                    <div className="flow-root">
                                        <ul className="divide-y divide-slate-700">
                                            {opp.products.map(product => (
                                                <li key={product.productId} className="py-2 flex items-center justify-between text-sm">
                                                    <div className="flex-1 pr-2">
                                                        <p className="text-slate-300">{product.productName}</p>
                                                        <p className="text-slate-400">{product.quantity} x €{product.price.toLocaleString('es-ES')}</p>
                                                    </div>
                                                    <p className="text-slate-200 font-medium">
                                                        €{(product.quantity * product.price).toLocaleString('es-ES')}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-700 text-sm space-y-2">
                                        <div className="flex justify-between">
                                            <p className="text-slate-400">Subtotal</p>
                                            <p className="text-slate-300">€{calculatedSubtotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        {difference !== 0 && (
                                            <div className="flex justify-between">
                                                {difference < 0 ? (
                                                    <>
                                                        <p className="text-orange-400">Descuento</p>
                                                        <p className="text-orange-400">- €{Math.abs(difference).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-yellow-400">Aumento</p>
                                                        <p className="text-yellow-400">+ €{difference.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-base">
                                            <p className="text-white">Total Pagado</p>
                                            <p className="text-green-400">€{opp.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-4">No hay compras registradas para este cliente.</p>
                )}
            </>
        );
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Clientes</h1>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
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
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-700/50 text-slate-300 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 w-12"></th>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Contacto Principal</th>
                                    <th className="p-4">Email y Teléfono</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                             {sortedActiveClients.length === 0 ? (
                                <tbody>
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-slate-400">
                                            {searchTerm ? 'No se encontraron clientes con ese criterio.' : 'No hay clientes con oportunidades ganadas.'}
                                        </td>
                                    </tr>
                                </tbody>
                            ) : (
                                <tbody className="divide-y divide-slate-700">
                                    {sortedActiveClients.map(client => {
                                        const isExpanded = expandedClientId === client.id;
                                        return (
                                            <React.Fragment key={client.id}>
                                                <tr id={client.id} className="hover:bg-slate-700/50 transition-colors">
                                                    <td className="p-4 cursor-pointer" onClick={() => handleToggleHistory(client.id)}>
                                                        <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-100">{client.name}</td>
                                                    <td className="p-4 text-slate-300">{client.contactPerson}</td>
                                                    <td className="p-4 text-slate-300">
                                                        <a href={`mailto:${client.email}`} className="text-cyan-400 hover:text-cyan-300 block mb-1">{client.email}</a>
                                                        {client.phone && (
                                                            <a 
                                                                href={formatWhatsAppLink(client.phone)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="flex items-center gap-1.5 text-green-400 hover:text-green-300 group"
                                                            >
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                                <span className="group-hover:underline">{client.phone}</span>
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center space-x-2">
                                                            <button onClick={() => handleOpenModal(client)} className="p-2 text-yellow-400 hover:text-yellow-300 rounded-md hover:bg-slate-700" title="Editar Cliente"><PencilIcon className="h-4 w-4" /></button>
                                                            <button onClick={() => handleDeleteClick(client.id)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-slate-700" title="Eliminar Cliente"><TrashIcon className="h-4 w-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-slate-900/50">
                                                        <td colSpan={5} className="p-0">
                                                            <div className="p-4 sm:p-6">
                                                              {renderPurchaseHistory(client.id)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden space-y-4">
                     {sortedActiveClients.length === 0 ? (
                        <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center text-slate-400">
                            {searchTerm ? 'No se encontraron clientes con ese criterio.' : 'No hay clientes con oportunidades ganadas.'}
                        </div>
                     ) : (
                        sortedActiveClients.map(client => {
                            const isExpanded = expandedClientId === client.id;
                            return (
                                 <div key={client.id} id={client.id} className="bg-slate-800 rounded-lg shadow-lg">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 cursor-pointer" onClick={() => handleToggleHistory(client.id)}>
                                                <h3 className="font-bold text-slate-100">{client.name}</h3>
                                                <p className="text-sm text-slate-300">{client.contactPerson}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <button onClick={() => handleOpenModal(client)} className="p-2 text-yellow-400"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteClick(client.id)} className="p-2 text-red-400"><TrashIcon className="h-4 w-4" /></button>
                                                <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm space-y-2 cursor-pointer" onClick={() => handleToggleHistory(client.id)}>
                                             <p className="text-cyan-400 truncate"><a href={`mailto:${client.email}`}>{client.email}</a></p>
                                             {client.phone && (
                                                <a 
                                                    href={formatWhatsAppLink(client.phone)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-1.5 text-green-400 hover:text-green-300"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                    <span>{client.phone}</span>
                                                </a>
                                             )}
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="p-4 border-t border-slate-700">
                                            {renderPurchaseHistory(client.id)}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                     )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">Editar Cliente</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="name" value={clientFormData.name} onChange={handleInputChange} placeholder="Nombre de la Institución" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <input type="text" name="contactPerson" value={clientFormData.contactPerson} onChange={handleInputChange} placeholder="Persona de Contacto" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <input type="email" name="email" value={clientFormData.email} onChange={handleInputChange} placeholder="Email" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <input type="tel" name="phone" value={clientFormData.phone} onChange={handleInputChange} placeholder="Teléfono" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <input type="text" name="address" value={clientFormData.address} onChange={handleInputChange} placeholder="Dirección" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Cliente"
                message={
                    clientToDeleteId ? (
                        <>
                            <p>¿Está seguro de que desea eliminar a "<strong>{clients.find(c => c.id === clientToDeleteId)?.name}</strong>"?</p>
                            <br/>
                            <p className="font-bold text-yellow-300">Esta acción es irreversible y eliminará también TODAS las oportunidades, tareas, tickets y leads asociados a esta empresa.</p>
                        </>
                    ) : ''
                }
            />
        </>
    );
};

export default Clients;
