

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Task, Client, Salesperson, User, Lead, Opportunity } from '../types';
import { TaskStatus } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import ConfirmationModal from './ConfirmationModal';

interface AgendaProps {
    user: User;
    tasks: Task[];
    clients: Client[];
    leads: Lead[];
    opportunities: Opportunity[];
    salespeople: Salesperson[];
    addTask: (task: Omit<Task, 'id' | 'associatedName' | 'opportunityValue'>) => void;
    updateTask: (task: Task) => void;
    deleteTask: (taskId: string) => void;
}

const statusColors: Record<TaskStatus, string> = {
    [TaskStatus.PENDIENTE]: 'bg-yellow-500/20 text-yellow-300',
    [TaskStatus.EN_PROGRESO]: 'bg-blue-500/20 text-blue-300',
    [TaskStatus.COMPLETADA]: 'bg-green-500/20 text-green-300',
};

const Agenda: React.FC<AgendaProps> = ({ user, tasks, clients, leads, opportunities, salespeople, addTask, updateTask, deleteTask }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const initialFormState: Omit<Task, 'id' | 'associatedName' | 'opportunityValue'> = { title: '', description: '', dueDate: '', salespersonId: user.role === 'salesperson' ? user.id : '', status: TaskStatus.PENDIENTE, clientId: '', leadId: '', opportunityId: '' };
    const [taskFormData, setTaskFormData] = useState(initialFormState);
    const [associatedEntity, setAssociatedEntity] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1);
            const element = document.getElementById(id);
            if (element) {
                // Also need to select the date of the task to make it visible
                const task = tasks.find(t => t.id === id);
                if (task) {
                    setSelectedDate(new Date(task.dueDate + 'T00:00:00')); // Ensure correct date object without timezone issues
                }

                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-row');
                }, 100) // small delay to allow date selection to render

                setTimeout(() => {
                    element.classList.remove('highlight-row');
                    navigate(location.pathname, { replace: true });
                }, 2600);
            }
        }
    }, [location.hash, navigate, tasks]);


    const handleOpenModal = (task: Task | null) => {
        // Only block editing for tasks automatically generated from opportunities (which have a value)
        if (task?.opportunityId && task.opportunityValue != null) {
            alert("Esta es una tarea automática de oportunidad. Para cambiar la fecha o el valor, edite la oportunidad directamente en el módulo de Oportunidades.");
            return;
        }
        setEditingTask(task);
        if (task) {
            setTaskFormData({ ...task, clientId: task.clientId || '', leadId: task.leadId || '', opportunityId: task.opportunityId || '' });
            if (task.opportunityId) {
                setAssociatedEntity(`opportunity-${task.opportunityId}`);
            } else if (task.clientId) {
                setAssociatedEntity(`client-${task.clientId}`);
            } else if (task.leadId) {
                setAssociatedEntity(`lead-${task.leadId}`);
            } else {
                setAssociatedEntity('');
            }
        } else {
            const dateString = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
            setTaskFormData({ ...initialFormState, dueDate: dateString });
            setAssociatedEntity('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTaskFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAssociatedEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setAssociatedEntity(value);

        if (value.startsWith('client-')) {
            setTaskFormData(prev => ({ ...prev, clientId: value.replace('client-', ''), leadId: '', opportunityId: '' }));
        } else if (value.startsWith('lead-')) {
            setTaskFormData(prev => ({ ...prev, clientId: '', leadId: value.replace('lead-', ''), opportunityId: '' }));
        } else if (value.startsWith('opportunity-')) {
            setTaskFormData(prev => ({ ...prev, clientId: '', leadId: '', opportunityId: value.replace('opportunity-', '') }));
        } else {
            setTaskFormData(prev => ({ ...prev, clientId: '', leadId: '', opportunityId: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskFormData.salespersonId) {
            alert("Por favor, asigne la tarea a un vendedor.");
            return;
        }
        if (editingTask) {
            updateTask({ ...editingTask, ...taskFormData });
        } else {
            addTask(taskFormData);
        }
        handleCloseModal();
    };
    
    const handleDeleteClick = (task: Task) => {
        if (task.opportunityId && task.opportunityValue != null) {
            alert("No se puede eliminar una tarea de oportunidad desde la agenda. Por favor, elimine la oportunidad para que esta tarea se elimine automáticamente.");
            return;
        }
        setTaskToDelete(task);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setTaskToDelete(null);
    };

    const getSalespersonName = (salespersonId: string) => salespeople.find(sp => sp.id === salespersonId)?.name || 'No asignado';
    
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1); // Avoid issues with day numbers
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const { calendarGrid, monthName, year } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const grid: ({ day: number; date: Date; hasTasks: boolean; isToday: boolean, hasOpportunityTask: boolean } | null)[] = [];

        for (let i = 0; i < startDay; i++) {
            grid.push(null);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const dayTasks = tasks.filter(task => task.dueDate === dateString);
            grid.push({
                day,
                date,
                hasTasks: dayTasks.some(t => !t.opportunityId),
                hasOpportunityTask: dayTasks.some(t => !!t.opportunityId),
                isToday: date.getTime() === today.getTime(),
            });
        }
        
        return { calendarGrid: grid, monthName, year };
    }, [currentDate, tasks]);

    const filteredTasks = useMemo(() => {
        if (!selectedDate) {
            return [];
        }
        const selectedDateStr = selectedDate.toISOString().split('T')[0];
        return tasks.filter(task => task.dueDate === selectedDateStr).sort((a,b) => (a.opportunityId ? -1 : 1));
    }, [selectedDate, tasks]);


    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Agenda y Calendario</h1>
                    <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <span>+ Nueva Tarea Manual</span>
                    </button>
                </div>
                
                <div className="bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-700 transition-colors">&lt;</button>
                        <h2 className="text-xl font-bold text-white capitalize">{monthName} {year}</h2>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-700 transition-colors">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-2">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.map((dayInfo, index) => (
                            <div key={index} className="aspect-square">
                                {dayInfo && (
                                    <button 
                                        onClick={() => setSelectedDate(dayInfo.date)}
                                        className={`w-full h-full rounded-lg flex flex-col justify-center items-center transition-colors relative ${selectedDate && selectedDate.getTime() === dayInfo.date.getTime() ? 'bg-cyan-500 text-white shadow-lg' : 'hover:bg-slate-700/50'} ${dayInfo.isToday && !(selectedDate && selectedDate.getTime() === dayInfo.date.getTime()) ? 'border-2 border-cyan-400' : 'border border-transparent'}`}
                                    >
                                        <span className="text-sm">{dayInfo.day}</span>
                                        <div className="absolute bottom-1.5 flex gap-1">
                                            {dayInfo.hasTasks && <div className={`h-1.5 w-1.5 rounded-full ${selectedDate && selectedDate.getTime() === dayInfo.date.getTime() ? 'bg-white' : 'bg-cyan-400'}`}></div>}
                                            {dayInfo.hasOpportunityTask && <div className={`h-1.5 w-1.5 rounded-full ${selectedDate && selectedDate.getTime() === dayInfo.date.getTime() ? 'bg-yellow-300' : 'bg-purple-400'}`}></div>}
                                        </div>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                 <h3 className="text-xl font-bold text-slate-100 mb-4">
                    Tareas para: {selectedDate ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Ninguna fecha seleccionada'}
                </h3>
                <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-700/50 text-slate-300 uppercase tracking-wider hidden md:table-header-group">
                                <tr>
                                    <th className="p-4">Título</th>
                                    <th className="p-4">Asociado a</th>
                                    <th className="p-4">Asignado a</th>
                                    <th className="p-4">Estado / Valor</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                    <tr key={task.id} id={task.id} className={`${task.opportunityId ? 'bg-purple-500/10' : ''} hover:bg-slate-700/50 transition-colors block md:table-row mb-2 md:mb-0 bg-slate-800 md:bg-transparent rounded-lg md:rounded-none`}>
                                        <td className="p-4 font-medium text-slate-100 block md:table-cell" data-label="Título:">
                                           <div className="flex items-center gap-2">
                                                {task.opportunityId && <BriefcaseIcon className="h-4 w-4 text-purple-400" />}
                                                <span>{task.title}</span>
                                           </div>
                                        </td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Asociado a:">{task.associatedName || 'N/A'}</td>
                                        <td className="p-4 text-slate-300 block md:table-cell" data-label="Asignado a:">{getSalespersonName(task.salespersonId)}</td>
                                        <td className="p-4 block md:table-cell" data-label="Estado/Valor:">
                                            {task.opportunityValue != null ? (
                                                <span className="font-semibold text-green-400">€{task.opportunityValue.toLocaleString('es-ES')}</span>
                                            ) : (
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>
                                                    {task.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 block md:table-cell">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleOpenModal(task)} className={`p-2 text-yellow-400 rounded-md ${task.opportunityId && task.opportunityValue != null ? 'opacity-50 cursor-not-allowed' : 'hover:text-yellow-300 hover:bg-slate-700'}`} title="Editar Tarea"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteClick(task)} className={`p-2 text-red-400 rounded-md ${task.opportunityId && task.opportunityValue != null ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-300 hover:bg-slate-700'}`} title="Eliminar Tarea"><TrashIcon className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-slate-400">
                                            No hay tareas para la fecha seleccionada.
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
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingTask ? 'Editar Tarea': 'Nueva Tarea'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="title" value={taskFormData.title} onChange={handleInputChange} placeholder="Título de la tarea" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <textarea name="description" value={taskFormData.description} onChange={handleInputChange} placeholder="Descripción" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 h-24" />
                            <select
                                name="associatedEntity"
                                value={associatedEntity}
                                onChange={handleAssociatedEntityChange}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Sin asociar</option>
                                <optgroup label="Clientes">
                                    {clients.map(client => (
                                        <option key={`client-${client.id}`} value={`client-${client.id}`}>{client.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Prospectos">
                                    {leads.map(lead => (
                                        <option key={`lead-${lead.id}`} value={`lead-${lead.id}`}>{lead.name} ({lead.company})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Oportunidades">
                                    {opportunities.map(opp => (
                                        <option key={`opportunity-${opp.id}`} value={`opportunity-${opp.id}`}>{opp.clientName} - €{opp.value.toLocaleString('es-ES')}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <input type="date" name="dueDate" value={taskFormData.dueDate} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            <select 
                                name="salespersonId" 
                                value={taskFormData.salespersonId} 
                                onChange={handleInputChange} 
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                required
                                disabled={user.role === 'salesperson'}
                            >
                                <option value="" disabled>Asignar a Vendedor...</option>
                                {salespeople.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                            <select name="status" value={taskFormData.status} onChange={handleInputChange} className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {Object.values(TaskStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">{editingTask ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Tarea"
                message={
                    taskToDelete ? (
                        <>
                           ¿Está seguro de que desea eliminar la tarea "<strong>{taskToDelete.title}</strong>"?
                        </>
                    ) : ''
                }
            />
        </>
    );
};

export default Agenda;
