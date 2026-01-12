
import React, { useState } from 'react';
import type { WhatsAppTemplate } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface WhatsAppTemplatesProps {
    templates: WhatsAppTemplate[];
    addTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => void;
    updateTemplate: (template: WhatsAppTemplate) => void;
    deleteTemplate: (templateId: string) => void;
}

const WhatsAppTemplates: React.FC<WhatsAppTemplatesProps> = ({ templates, addTemplate, updateTemplate, deleteTemplate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [templateToDeleteId, setTemplateToDeleteId] = useState<string | null>(null);

    const initialFormState = { name: '', content: '' };
    const [formData, setFormData] = useState(initialFormState);

    const handleOpenModal = (template: WhatsAppTemplate | null) => {
        setEditingTemplate(template);
        setFormData(template ? { name: template.name, content: template.content } : initialFormState);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
        setFormData(initialFormState);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            updateTemplate({ ...editingTemplate, ...formData });
        } else {
            addTemplate(formData);
        }
        handleCloseModal();
    };

    const handleDeleteClick = (id: string) => {
        setTemplateToDeleteId(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (templateToDeleteId) {
            deleteTemplate(templateToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setTemplateToDeleteId(null);
    };

    const insertVariable = (variable: string) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content + variable
        }));
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">WhatsApp Prompts</h1>
                    <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <span>+ Nueva Plantilla</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div key={template.id} className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-5 flex flex-col hover:bg-slate-750 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-white">{template.name}</h3>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleOpenModal(template)} className="text-yellow-400 hover:text-yellow-300"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDeleteClick(template.id)} className="text-red-400 hover:text-red-300"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-900/50 p-3 rounded-md border border-slate-700 mb-2 overflow-hidden">
                                <p className="text-slate-300 text-sm whitespace-pre-wrap font-mono">{template.content}</p>
                            </div>
                            <p className="text-xs text-slate-500 text-right mt-2">ID: {template.id}</p>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-400 bg-slate-800/50 rounded-lg border border-dashed border-slate-600">
                            <p>No hay plantillas creadas. Crea una para agilizar tus envíos de WhatsApp.</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingTemplate ? 'Editar' : 'Nueva'} Plantilla WhatsApp</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de la Plantilla</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} 
                                    placeholder="Ej: Presentación Ecógrafo" 
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Contenido del Mensaje</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <span className="text-xs text-slate-400 mr-2 self-center">Variables disponibles:</span>
                                    <button type="button" onClick={() => insertVariable('{NOMBRE_CLIENTE}')} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-cyan-300 border border-slate-500">Nombre Cliente</button>
                                    <button type="button" onClick={() => insertVariable('{EMPRESA_CLIENTE}')} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-cyan-300 border border-slate-500">Empresa</button>
                                    <button type="button" onClick={() => insertVariable('{NOMBRE_PRODUCTO}')} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-green-300 border border-slate-500">Producto</button>
                                    <button type="button" onClick={() => insertVariable('{PRECIO_PRODUCTO}')} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-green-300 border border-slate-500">Precio</button>
                                    <button type="button" onClick={() => insertVariable('{DESCRIPCION_PRODUCTO}')} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-green-300 border border-slate-500">Descripción</button>
                                </div>
                                <textarea 
                                    value={formData.content} 
                                    onChange={e => setFormData(prev => ({...prev, content: e.target.value}))} 
                                    placeholder="Escribe el mensaje aquí..." 
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 h-48 font-mono text-sm" 
                                    required 
                                />
                                <p className="text-xs text-slate-400 mt-1">Usa las variables de arriba para personalizar el mensaje automáticamente al seleccionar un producto.</p>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">{editingTemplate ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Plantilla"
                message="¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer."
            />
        </>
    );
};

export default WhatsAppTemplates;
