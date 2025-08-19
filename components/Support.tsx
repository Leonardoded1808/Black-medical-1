
import React, { useState } from 'react';
import type { SupportTicket, Client } from '../types';
import { SupportTicketStatus, SupportTicketPriority } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface SupportProps {
    tickets: SupportTicket[];
    clients: Client[];
    addTicket: (ticket: Omit<SupportTicket, 'id' | 'clientName' | 'createdDate'>) => void;
    updateTicket: (ticket: SupportTicket) => void;
    deleteTicket: (ticketId: string) => void;
}

const statusColors: Record<SupportTicketStatus, string> = {
    [SupportTicketStatus.ABIERTO]: 'bg-red-500/20 text-red-300',
    [SupportTicketStatus.EN_PROCESO]: 'bg-yellow-500/20 text-yellow-300',
    [SupportTicketStatus.CERRADO]: 'bg-green-500/20 text-green-300',
};

const priorityColors: Record<SupportTicketPriority, string> = {
    [SupportTicketPriority.BAJA]: 'border-green-500/50 bg-green-500/10 text-green-400',
    [SupportTicketPriority.MEDIA]: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    [SupportTicketPriority.ALTA]: 'border-red-500/50 bg-red-500/10 text-red-400',
};


const Support: React.FC<SupportProps> = ({ tickets, clients, addTicket, updateTicket, deleteTicket }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [ticketToDeleteId, setTicketToDeleteId] = useState<string | null>(null);

    const initialFormState: Omit<SupportTicket, 'id' | 'clientName' | 'createdDate'> = { clientId: '', issue: '', status: SupportTicketStatus.ABIERTO, priority: SupportTicketPriority.MEDIA, assignedTo: 'Soporte Técnico' };
    const [ticketFormData, setTicketFormData] = useState(initialFormState);

    const handleOpenModal = (ticket: SupportTicket | null) => {
        setEditingTicket(ticket);
        setTicketFormData(ticket ? { ...ticket } : initialFormState);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTicket(null);
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTicketFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!ticketFormData.clientId) return alert('Por favor, seleccione un cliente.');

        if (editingTicket) {
            updateTicket({ ...editingTicket, ...ticketFormData });
        } else {
            addTicket(ticketFormData);
        }
        handleCloseModal();
    };
    
    const handleDeleteClick = (ticketId: string) => {
        setTicketToDeleteId(ticketId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (ticketToDeleteId) {
            deleteTicket(ticketToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setTicketToDeleteId(null);
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Soporte Técnico</h1>
                    <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <span>+ Nuevo Ticket</span>
                    </button>
                </div>

                <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-700/50 text-slate-300 uppercase tracking-wider hidden md:table-header-group">
                                <tr>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Incidencia</th>
                                    <th className="p-4">Prioridad</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-slate-700/50 transition-colors block md:table-row mb-2 md:mb-0 bg-slate-800 md:bg-transparent rounded-lg md:rounded-none">
                                        <td className="p-4 font-medium text-slate-100 block md:table-cell" data-label="Cliente:">{ticket.clientName}</td>
                                        <td className="p-4 text-slate-300 max-w-sm truncate block md:table-cell" title={ticket.issue} data-label="Incidencia:">{ticket.issue}</td>
                                        <td className="p-4 block md:table-cell" data-label="Prioridad:">
                                            <span className={`px-2 py-1 text-xs font-semibold border rounded-full ${priorityColors[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="p-4 block md:table-cell" data-label="Estado:">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[ticket.status]}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="p-4 block md:table-cell">
                                             <div className="flex items-center space-x-2">
                                                <button onClick={() => handleOpenModal(ticket)} className="p-2 text-yellow-400 hover:text-yellow-300 rounded-md hover:bg-slate-700" title="Editar Ticket"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteClick(ticket.id)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-slate-700" title="Eliminar Ticket"><TrashIcon className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingTicket ? 'Editar' : 'Nuevo'} Ticket de Soporte</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <select name="clientId" value={ticketFormData.clientId} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required>
                                <option value="" disabled>Seleccione un Cliente</option>
                                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                            </select>
                            <textarea name="issue" value={ticketFormData.issue} onChange={handleInputChange} placeholder="Descripción de la incidencia" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 h-24" required />
                             <select name="priority" value={ticketFormData.priority} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {Object.values(SupportTicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                             <select name="status" value={ticketFormData.status} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {Object.values(SupportTicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                             <input type="text" name="assignedTo" value={ticketFormData.assignedTo} onChange={handleInputChange} placeholder="Asignado a" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">{editingTicket ? 'Actualizar' : 'Crear'} Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Ticket"
                message={
                    ticketToDeleteId ? (
                        <>
                           ¿Está seguro de que desea eliminar el ticket para "<strong>{tickets.find(t => t.id === ticketToDeleteId)?.clientName}</strong>"?
                        </>
                    ) : ''
                }
            />
        </>
    );
};

export default Support;
