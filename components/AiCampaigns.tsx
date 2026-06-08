import React, { useState } from 'react';
import type { Product } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface AiCampaignsProps {
    products: Product[];
}

const AiCampaigns: React.FC<AiCampaignsProps> = ({ products }) => {
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [count, setCount] = useState<number>(1);
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const toggleProduct = (pid: string) => {
        setSelectedProducts(prev => 
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    const handleGenerate = async () => {
        if (selectedProducts.length === 0) {
            alert('Selecciona al menos un producto.');
            return;
        }

        setLoading(true);
        try {
            const selectedProdData = products.filter(p => selectedProducts.includes(p.id));
            const response = await fetch("/api/gemini/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: selectedProdData, count, instructions }),
            });
            if (!response.ok) throw new Error("Error fetching campaigns");
            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error generando las campañas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 text-white space-y-6 max-w-5xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
                <SparklesIcon className="h-8 w-8 text-cyan-400" />
                <span>Generador de Campañas IA</span>
            </h1>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-200">1. Selecciona Productos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto mb-6 p-2 bg-slate-900 rounded border border-slate-700">
                    {products.map(p => (
                        <label key={p.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded hover:bg-slate-800 transition">
                            <input 
                                type="checkbox" 
                                checked={selectedProducts.includes(p.id)}
                                onChange={() => toggleProduct(p.id)}
                                className="mt-1 h-4 w-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                            />
                            <div>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-xs text-slate-400 truncate">{p.category}</p>
                            </div>
                        </label>
                    ))}
                    {products.length === 0 && <p className="text-slate-400 p-2">No hay productos disponibles.</p>}
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2 font-medium">Instrucciones Personales (Objetivo, tono, público, etc.)</label>
                    <textarea 
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Ej. Quiero que esta campaña suene más urgente porque es fin de mes, dirigida a pediatras..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 h-24 resize-none"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Cantidad de Opciones a Generar</label>
                        <select 
                            value={count} 
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="bg-slate-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="1">1 Campaña</option>
                            <option value="2">2 Campañas</option>
                            <option value="3">3 Campañas</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={loading || selectedProducts.length === 0}
                        className="flex items-center space-x-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition"
                    >
                        {loading ? (
                            <div className="flex space-x-2 items-center">
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                <span>Generando...</span>
                            </div>
                        ) : (
                            <>
                                <SparklesIcon className="h-5 w-5" />
                                <span>Crear con IA</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {campaigns.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-100">Resultados Generados</h2>
                    {campaigns.map((camp, idx) => (
                        <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
                            <h3 className="text-xl font-bold text-cyan-400">{camp.title}</h3>
                            
                            <div className="bg-slate-900 p-4 rounded-md border border-green-900 border-l-4 border-l-green-500">
                                <p className="text-xs text-green-400 font-bold mb-2 uppercase tracking-wider">Mensaje WhatsApp</p>
                                <p className="whitespace-pre-wrap text-slate-300">{camp.whatsappMessage}</p>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-md border border-blue-900 border-l-4 border-l-blue-500">
                                <p className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-wider">Campaña de Correo</p>
                                <p className="font-semibold text-slate-100 mb-2">Asunto: {camp.emailSubject}</p>
                                <div className="h-px bg-slate-700 mb-2"></div>
                                <p className="whitespace-pre-wrap text-slate-300">{camp.emailBody}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AiCampaigns;
