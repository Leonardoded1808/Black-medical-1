import React, { useState, useEffect } from 'react';
import { Salesperson, Task, TaskType, TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id'>) => void;
    initialData: {
        opportunityId: string;
        associatedName: string;
        clientId?: string;
        leadId?: string;
    };
    salespeople: Salesperson[];
    currentUserRole: string;
    currentUserId: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialData, salespeople, currentUserRole, currentUserId }) => {
    const [formData, setFormData] = useState<Omit<Task, 'id'>>({
        title: '',
        description: '',
        dueDate: '',
        priority: TaskPriority.MEDIA,
        status: TaskStatus.PENDIENTE,
        salespersonId: currentUserRole === 'salesperson' ? currentUserId : '',
        type: TaskType.LLAMADA,
        associatedName: initialData.associatedName,
        opportunityId: initialData.opportunityId,
        clientId: initialData.clientId,
        leadId: initialData.leadId,
        opportunityValue: 0
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                opportunityId: initialData.opportunityId,
                associatedName: initialData.associatedName,
                clientId: initialData.clientId,
                leadId: initialData.leadId,
                salespersonId: currentUserRole === 'salesperson' ? currentUserId : prev.salespersonId
            }));
        }
    }, [isOpen, initialData, currentUserRole, currentUserId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-6">Nueva Tarea</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Título</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 h-24"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Vencimiento</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Prioridad</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Asignado a</label>
                            <select
                                name="salespersonId"
                                value={formData.salespersonId}
                                onChange={handleChange}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                disabled={currentUserRole === 'salesperson'}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">Guardar Tarea</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
