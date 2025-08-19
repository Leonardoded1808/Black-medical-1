
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Client, Opportunity, Salesperson } from '../types';
import { OpportunityStage } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
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
                    // Optional: remove hash from URL without reloading
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
                             {activeClients.length === 0 ? (
                                <tbody>
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-slate-400">
                                            No hay clientes con oportunidades ganadas.
                                        </td>
                                    </tr>
                                </tbody>
                            ) : (
                                <tbody className="divide-y divide-slate-700">
                                    {activeClients.map(client => {
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
                                                        <a href={`mailto:${client.email}`} className="text-cyan-400 hover:text-cyan-300 block">{client.email}</a>
                                                        <span>{client.phone}</span>
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
                     {activeClients.length === 0 ? (
                        <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center text-slate-400">
                            No hay clientes con oportunidades ganadas.
                        </div>
                     ) : (
                        activeClients.map(client => {
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
                                        <div className="mt-2 text-sm space-y-1 cursor-pointer" onClick={() => handleToggleHistory(client.id)}>
                                             <p className="text-cyan-400 truncate"><a href={`mailto:${client.email}`}>{client.email}</a></p>
                                             <p className="text-slate-300">{client.phone}</p>
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