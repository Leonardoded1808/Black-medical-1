
import React, { useState, useEffect } from 'react';
import type { Product, Lead, WhatsAppTemplate } from '../types';
import EnvelopeIcon from './icons/EnvelopeIcon';

interface EmailProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    products: Product[];
    templates: WhatsAppTemplate[];
    onSend: (productId: string, subject: string, message: string) => void;
}

export const EmailProductModal: React.FC<EmailProductModalProps> = ({ isOpen, onClose, lead, products, templates, onSend }) => {
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [imageCopied, setImageCopied] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedProductId('');
            setSelectedTemplateId('');
            setSubject('');
            setMessage('');
            setImageCopied(false);
            setIsCopying(false);
        }
    }, [isOpen]);

    // Function to generate message based on template and product
    const generateMessage = (prodId: string, tempId: string) => {
        const product = products.find(p => p.id === prodId);
        const template = templates.find(t => t.id === tempId);

        if (!product) {
            setMessage('');
            setSubject('');
            return;
        }

        // Helper seguro para formatear precio
        const formatPrice = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? '0' : num.toLocaleString('es-ES');
        };

        // Set Default Subject
        setSubject(`Información sobre ${product.name} - Black Medical`);

        let content = '';

        if (template) {
            content = template.content || '';
            // Replace variables safely
            content = content.replace(/{NOMBRE_CLIENTE}/g, lead.name || 'Cliente');
            content = content.replace(/{EMPRESA_CLIENTE}/g, lead.company || '');
            content = content.replace(/{NOMBRE_PRODUCTO}/g, product.name || 'Producto');
            content = content.replace(/{PRECIO_PRODUCTO}/g, formatPrice(product.price));
            content = content.replace(/{DESCRIPCION_PRODUCTO}/g, product.description || '');
        } else {
            // Default email template (slightly more formal than WhatsApp)
            content = `Estimado/a ${lead.name || 'Cliente'},\n\nEs un gusto saludarle.\n\nAdjunto le comparto la información del equipo médico que podría ser de su interés para ${lead.company || 'su clínica'}:\n\nEquipo: ${product.name || 'Producto'}\n\nDescripción:\n${product.description || ''}\n\nPrecio: €${formatPrice(product.price)}\n\nQuedo a su entera disposición para cualquier consulta o para agendar una demostración.\n\nAtentamente,\n\nEquipo de Ventas\nBlack Medical`;
        }

        setMessage(content);
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        setSelectedProductId(productId);
        generateMessage(productId, selectedTemplateId);
        setImageCopied(false);
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        setSelectedTemplateId(templateId);
        generateMessage(selectedProductId, templateId);
    };

    const copyImageToClipboard = async () => {
        const product = products.find(p => p.id === selectedProductId);
        if (product && product.image) {
            setIsCopying(true);
            try {
                const img = new Image();
                
                // CRUCIAL: Solo establecer crossOrigin si NO es base64 (data:image...)
                if (!product.image.startsWith('data:')) {
                    img.crossOrigin = "anonymous"; 
                }
                
                img.src = product.image;
                
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error("No se pudo cargar la imagen fuente."));
                });

                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Error de contexto Canvas");
                
                // Rellenar fondo blanco (importante para emails también)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, 0, 0);

                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));

                if (!blob) throw new Error("Error al generar el archivo de imagen");
                
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                
                setImageCopied(true);
                setTimeout(() => setImageCopied(false), 3000);

            } catch (err) {
                console.error("Error al copiar imagen:", err);
                alert("No se pudo copiar la imagen al portapapeles. Intenta descargarla.");
            } finally {
                setIsCopying(false);
            }
        }
    };

    const handleSend = () => {
        try {
            if (!lead.email) return alert("Este prospecto no tiene dirección de email.");
            
            const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            
            // Open Email Client
            window.location.href = mailtoLink;
            
            // Log interaction in CRM
            onSend(selectedProductId, subject, message);
            onClose();
        } catch (error) {
            console.error("Error al procesar el envío:", error);
            alert("Ocurrió un error al intentar abrir el cliente de correo.");
        }
    };

    const selectedProduct = products.find(p => p.id === selectedProductId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <EnvelopeIcon className="w-6 h-6 text-blue-500" />
                        Enviar Correo
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Seleccionar Producto</label>
                            <select 
                                value={selectedProductId} 
                                onChange={handleProductChange}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Elige un equipo --</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Usar Plantilla</label>
                            <select 
                                value={selectedTemplateId} 
                                onChange={handleTemplateChange}
                                disabled={!selectedProductId}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Por defecto (Formal)</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedProduct && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Asunto del Correo</label>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="bg-slate-700/50 p-4 rounded-lg flex flex-col sm:flex-row gap-4">
                                {selectedProduct.image ? (
                                    <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-800 rounded-md overflow-hidden relative group">
                                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-white font-bold">Vista Previa</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-800 rounded-md flex items-center justify-center text-slate-500">
                                        <span className="text-xs text-center p-2">Sin imagen</span>
                                    </div>
                                )}
                                
                                <div className="flex-1 space-y-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">Mensaje (Editable)</label>
                                    <textarea 
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full h-32 bg-slate-800 text-slate-200 p-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-md">
                        <p className="text-blue-200 text-xs flex items-start gap-2">
                            <span className="font-bold text-lg leading-none">ℹ️</span>
                            <span>
                                <strong>Nota:</strong> Los enlaces 'mailto' no pueden adjuntar imágenes automáticamente por seguridad.
                                <br/>Use el botón <strong>"1. Copiar Foto"</strong> y luego pegue la imagen (Ctrl+V) en el cuerpo de su correo.
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {selectedProduct?.image && (
                            <button 
                                onClick={copyImageToClipboard}
                                disabled={isCopying}
                                className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${imageCopied ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'} ${isCopying ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {isCopying ? 'Procesando...' : (imageCopied ? '¡Foto Copiada!' : (
                                    <>
                                        <span>1. Copiar Foto</span>
                                    </>
                                ))}
                            </button>
                        )}
                        
                        <button 
                            onClick={handleSend}
                            disabled={!selectedProductId}
                            className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <EnvelopeIcon className="w-5 h-5" />
                            {selectedProduct?.image ? '2. Abrir Correo y Pegar' : 'Abrir Cliente de Correo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
