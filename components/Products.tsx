
import React, { useState } from 'react';
import type { Product } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface ProductsProps {
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
}

const Products: React.FC<ProductsProps> = ({ products, addProduct, updateProduct, deleteProduct }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

    const initialFormState = {
        name: '',
        category: '',
        price: 0,
        description: ''
    };
    
    const [productFormData, setProductFormData] = useState(initialFormState);

    const handleOpenModal = (product: Product | null) => {
        setEditingProduct(product);
        if (product) {
            setProductFormData(product);
        } else {
            setProductFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setProductFormData(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateProduct({ ...editingProduct, ...productFormData });
        } else {
            addProduct(productFormData);
        }
        handleCloseModal();
    };

    const handleDeleteClick = (productId: string) => {
        setProductToDeleteId(productId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (productToDeleteId) {
            deleteProduct(productToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setProductToDeleteId(null);
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8 text-white">
                 <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Equipos Médicos</h1>
                     <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <span>+ Nuevo Producto</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col justify-between transition-all duration-300">
                           <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-lg font-bold text-slate-100 flex-1 pr-2">{product.name}</h2>
                                    <span className="text-xs bg-cyan-500/20 text-cyan-400 font-semibold px-2 py-1 rounded-full whitespace-nowrap">{product.category}</span>
                                </div>
                                <p className="text-slate-400 mt-2 text-sm min-h-[40px]">{product.description}</p>
                            </div>
                            <div className="mt-4">
                                <p className="text-xl font-semibold text-green-400 text-right">
                                    €{product.price.toLocaleString('es-ES')}
                                </p>
                                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-end space-x-3">
                                    <button
                                        onClick={() => handleOpenModal(product)}
                                        className="text-yellow-400 hover:text-yellow-300 font-semibold py-1 px-3 text-sm rounded-md hover:bg-slate-700 transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(product.id)}
                                        className="text-red-400 hover:text-red-300 font-semibold py-1 px-3 text-sm rounded-md hover:bg-slate-700 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             {isModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <input type="text" name="name" value={productFormData.name} onChange={handleInputChange} placeholder="Nombre del Producto" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="text" name="category" value={productFormData.category} onChange={handleInputChange} placeholder="Categoría" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="number" step="0.01" name="price" value={productFormData.price} onChange={handleInputChange} placeholder="Precio (€)" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <textarea name="description" value={productFormData.description} onChange={handleInputChange} placeholder="Descripción" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 h-24" required />
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">{editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Producto"
                message={
                    productToDeleteId ? (
                        <>
                           ¿Está seguro de que desea eliminar el producto "<strong>{products.find(p => p.id === productToDeleteId)?.name}</strong>"?
                           <br/><br/>
                           <span className="font-bold">Esta acción no se puede deshacer.</span>
                        </>
                    ) : ''
                }
            />
        </>
    );
};

export default Products;
