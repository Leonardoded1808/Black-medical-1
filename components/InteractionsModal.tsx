import React, { useState, useMemo } from 'react';
import { Interaction, InteractionType, Salesperson } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

interface InteractionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    entityId: string;
    entityType: 'lead' | 'client' | 'opportunity';
    interactions: Interaction[];
    salespeople: Salesperson[];
    currentUserId: string;
    onAdd: (interaction: Omit<Interaction, 'id' | 'date'>) => void;
    onUpdate: (interaction: Interaction) => void;
    onDelete: (id: string) => void;
}

const InteractionsModal: React.FC<InteractionsModalProps> = ({
    isOpen,
    onClose,
    title,
    entityId,
    entityType,
    interactions,
    salespeople,
    currentUserId,
    onAdd,
    onUpdate,
    onDelete
}) => {
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<{ type: InteractionType; notes: string }>({
        type: InteractionType.LLAMADA,
        notes: ''
    });

    // Sort interactions by date descending
    const sortedInteractions = useMemo(() => {
        return [...interactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [interactions]);

    const handleEditClick = (interaction: Interaction) => {
        setIsEditing(interaction.id);
        setFormData({
            type: interaction.type,
            notes: interaction.notes
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setFormData({
            type: InteractionType.LLAMADA,
            notes: ''
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditing) {
            const interactionToUpdate = interactions.find(i => i.id === isEditing);
            if (interactionToUpdate) {
                onUpdate({
                    ...interactionToUpdate,
                    type: formData.type,
                    notes: formData.notes
                });
            }
            setIsEditing(null);
        } else {
            const newInteraction: Omit<Interaction, 'id' | 'date'> = {
                type: formData.type,
                notes: formData.notes,
                salespersonId: currentUserId,
                [entityType === 'lead' ? 'leadId' : entityType === 'client' ? 'clientId' : 'opportunityId']: entityId
            };
            onAdd(newInteraction);
        }
        
        // Reset form
        setFormData({
            type: InteractionType.LLAMADA,
            notes: ''
        });
    };

    const getSalespersonName = (id: string) => {
        return salespeople.find(sp => sp.id === id)?.name || 'Desconocido';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Form to add/edit */}
                    <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase">
                            {isEditing ? 'Editar Interacción' : 'Nueva Interacción'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InteractionType }))}
                                    className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none text-sm"
                                >
                                    {Object.values(InteractionType).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none text-sm h-20 resize-none"
                                    placeholder="Detalles de la interacción..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded hover:bg-slate-500 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-500 transition-colors"
                                >
                                    {isEditing ? 'Actualizar' : 'Agregar'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* List of interactions */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-300 uppercase border-b border-slate-700 pb-2">Historial</h3>
                        {sortedInteractions.length === 0 ? (
                            <p className="text-slate-500 text-center py-4 text-sm">No hay interacciones registradas.</p>
                        ) : (
                            sortedInteractions.map(interaction => (
                                <div key={interaction.id} className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                interaction.type === InteractionType.LLAMADA ? 'bg-blue-900/50 text-blue-300' :
                                                interaction.type === InteractionType.EMAIL ? 'bg-yellow-900/50 text-yellow-300' :
                                                interaction.type === InteractionType.REUNION ? 'bg-purple-900/50 text-purple-300' :
                                                'bg-green-900/50 text-green-300'
                                            }`}>
                                                {interaction.type}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatDate(interaction.date)}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEditClick(interaction)}
                                                className="text-slate-400 hover:text-yellow-400 transition-colors"
                                                title="Editar"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm('¿Eliminar esta interacción?')) {
                                                        onDelete(interaction.id);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-red-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{interaction.notes}</p>
                                    <p className="text-xs text-slate-500 mt-2 text-right">
                                        Por: {getSalespersonName(interaction.salespersonId)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractionsModal;
