

import React, { useState } from 'react';
import type { Salesperson, Lead, Task } from '../types';
import { LeadStatus, TaskStatus } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TagIcon from './TagIcon';
import CalendarIcon from './icons/CalendarIcon';

interface SalespeopleProps {
    salespeople: Salesperson[];
    leads: Lead[];
    tasks: Task[];
    addSalesperson: (salesperson: Omit<Salesperson, 'id'>, password_DO_NOT_USE: string) => void;
    updateSalesperson: (salesperson: Salesperson, password_DO_NOT_USE?: string) => void;
    deleteSalesperson: (salespersonId: string) => void;
}

const leadStatusColors: Record<LeadStatus, string> = {
    [LeadStatus.NUEVO]: 'bg-blue-500/20 text-blue-300',
    [LeadStatus.CONTACTADO]: 'bg-yellow-500/20 text-yellow-300',
    [LeadStatus.CALIFICADO]: 'bg-green-500/20 text-green-300',
    [LeadStatus.PERDIDO]: 'bg-red-500/20 text-red-300',
};

const taskStatusColors: Record<TaskStatus, string> = {
    [TaskStatus.PENDIENTE]: 'bg-yellow-500/20 text-yellow-300',
    [TaskStatus.EN_PROGRESO]: 'bg-blue-500/20 text-blue-300',
    [TaskStatus.COMPLETADA]: 'bg-green-500/20 text-green-300',
};

const Salespeople: React.FC<SalespeopleProps> = ({ salespeople, leads, tasks, addSalesperson, updateSalesperson, deleteSalesperson }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
    const initialFormState = { name: '', email: '', phone: '', address: '', title: '' };
    const [salespersonFormData, setSalespersonFormData] = useState(initialFormState);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [salespersonToDeleteId, setSalespersonToDeleteId] = useState<string | null>(null);

    const [expandedSalespersonId, setExpandedSalespersonId] = useState<string | null>(null);

    const handleToggleDetails = (id: string) => {
        setExpandedSalespersonId(prevId => (prevId === id ? null : id));
    };

    const handleOpenModal = (sp: Salesperson | null) => {
        setEditingSalesperson(sp);
        setSalespersonFormData(sp ? { name: sp.name, email: sp.email, phone: sp.phone, address: sp.address, title: sp.title } : initialFormState);
        setPassword('');
        setConfirmPassword('');
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSalesperson(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSalespersonFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingSalesperson) {
            if (password && password !== confirmPassword) {
                alert("Las contraseñas no coinciden.");
                return;
            }
            updateSalesperson({ ...editingSalesperson, ...salespersonFormData }, password || undefined);
        } else {
            addSalesperson(salespersonFormData, '123');
        }
        handleCloseModal();
    };

    const handleDeleteClick = (spId: string) => {
        setSalespersonToDeleteId(spId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (salespersonToDeleteId) {
            deleteSalesperson(salespersonToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setSalespersonToDeleteId(null);
    };

    const renderDetailsView = (salespersonId: string) => {
        const salespersonLeads = leads.filter(l => l.salespersonId === salespersonId);
        const salespersonTasks = tasks.filter(t => t.salespersonId === salespersonId);
        return (
            <div className="bg-slate-900/50 p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2"><TagIcon className="h-5 w-5 text-cyan-400" />Prospectos Asignados ({salespersonLeads.length})</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {salespersonLeads.length > 0 ? salespersonLeads.map(lead => (
                            <div key={lead.id} className="bg-slate-800/70 p-3 rounded-lg text-sm">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-slate-300">{lead.name}</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${leadStatusColors[lead.status]}`}>{lead.status}</span>
                                </div>
                                <p className="text-slate-400 text-xs">{lead.company}</p>
                            </div>
                        )) : <p className="text-slate-400 text-sm">No hay prospectos asignados.</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-cyan-400"/>Tareas Asignadas ({salespersonTasks.length})</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                         {salespersonTasks.length > 0 ? salespersonTasks.map(task => (
                            <div key={task.id} className="bg-slate-800/70 p-3 rounded-lg text-sm">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-slate-300 truncate pr-2" title={task.title}>{task.title}</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${taskStatusColors[task.status]}`}>{task.status}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                     <p className="text-slate-400 text-xs">{task.associatedName || 'Sin asociar'}</p>
                                     <p className="text-slate-500 text-xs">{new Date(task.dueDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : <p className="text-slate-400 text-sm">No hay tareas asignadas.</p>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Vendedores</h1>
                    <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <span>+ Nuevo Vendedor</span>
                    </button>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-700/50 text-slate-300 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 w-12"></th>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Cargo</th>
                                    <th className="p-4">Prospectos</th>
                                    <th className="p-4">Tareas</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {salespeople.map(sp => {
                                    const isExpanded = expandedSalespersonId === sp.id;
                                    return (
                                        <React.Fragment key={sp.id}>
                                            <tr className="hover:bg-slate-700/50 transition-colors" onClick={() => handleToggleDetails(sp.id)}>
                                                <td className="p-4 cursor-pointer">
                                                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </td>
                                                <td className="p-4 font-medium text-slate-100 cursor-pointer">
                                                    <p>{sp.name}</p>
                                                    <a href={`mailto:${sp.email}`} onClick={e => e.stopPropagation()} className="text-cyan-400 hover:text-cyan-300 text-xs font-normal">{sp.email}</a>
                                                </td>
                                                <td className="p-4 text-slate-300 cursor-pointer">{sp.title}</td>
                                                <td className="p-4 text-slate-300 cursor-pointer">{leads.filter(l => l.salespersonId === sp.id).length}</td>
                                                <td className="p-4 text-slate-300 cursor-pointer">{tasks.filter(t => t.salespersonId === sp.id).length}</td>
                                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center space-x-1 whitespace-nowrap">
                                                        <button onClick={() => handleOpenModal(sp)} className="p-2 text-yellow-400 hover:text-yellow-300 rounded-md hover:bg-slate-700" title="Editar"><PencilIcon className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDeleteClick(sp.id)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-slate-700" title="Eliminar"><TrashIcon className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="p-0">
                                                        {renderDetailsView(sp.id)}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden space-y-4">
                    {salespeople.map(sp => {
                        const isExpanded = expandedSalespersonId === sp.id;
                        return (
                             <div key={sp.id} className="bg-slate-800 rounded-lg shadow-lg">
                                <div className="p-4" onClick={() => handleToggleDetails(sp.id)}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 cursor-pointer">
                                            <h3 className="font-bold text-slate-100">{sp.name}</h3>
                                            <p className="text-sm text-slate-300">{sp.title}</p>
                                            <a href={`mailto:${sp.email}`} onClick={e => e.stopPropagation()} className="text-cyan-400 hover:text-cyan-300 text-xs font-normal">{sp.email}</a>
                                        </div>
                                        <div className="flex items-center" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleOpenModal(sp)} className="p-2 text-yellow-400"><PencilIcon className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeleteClick(sp.id)} className="p-2 text-red-400"><TrashIcon className="h-4 w-4" /></button>
                                            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-slate-700">
                                        {renderDetailsView(sp.id)}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 overflow-y-auto max-h-full">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingSalesperson ? 'Editar' : 'Nuevo'} Vendedor</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="name" value={salespersonFormData.name} onChange={handleInputChange} placeholder="Nombre Completo" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <input type="text" name="title" value={salespersonFormData.title} onChange={handleInputChange} placeholder="Cargo" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <input type="email" name="email" value={salespersonFormData.email} onChange={handleInputChange} placeholder="Email" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <input type="tel" name="phone" value={salespersonFormData.phone} onChange={handleInputChange} placeholder="Teléfono" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <input type="text" name="address" value={salespersonFormData.address} onChange={handleInputChange} placeholder="Dirección" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            
                            {editingSalesperson ? (
                                <div className="pt-2">
                                    <h3 className="text-lg font-semibold text-slate-300 mb-2 border-b border-slate-700 pb-2">Restablecer Contraseña</h3>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        placeholder="Nueva contraseña (dejar en blanco para no cambiar)"
                                        className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 mt-2"
                                        autoComplete="new-password"
                                    />
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        placeholder="Confirmar nueva contraseña"
                                        className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 mt-2"
                                        autoComplete="new-password"
                                        required={!!password}
                                    />
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <h3 className="text-lg font-semibold text-slate-300 mb-2 border-b border-slate-700 pb-2">Credenciales de Acceso</h3>
                                    <p className="text-sm text-slate-400 bg-slate-700/50 p-3 rounded-md">
                                        La contraseña inicial se establecerá en "<strong>123</strong>". El vendedor deberá cambiarla en su primer inicio de sesión por seguridad.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">{editingSalesperson ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Vendedor"
                message={
                    salespersonToDeleteId ? (
                        <>
                            ¿Está seguro de que desea eliminar a "<strong>{salespeople.find(sp => sp.id === salespersonToDeleteId)?.name}</strong>"?
                            <br/><br/>
                            <span className="font-bold text-yellow-300">Esta acción también eliminará su cuenta de usuario y reasignará sus prospectos y tareas al administrador.</span>
                        </>
                    ) : ''
                }
            />
        </>
    );
};

export default Salespeople;