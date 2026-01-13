
import React, { useState } from 'react';
import type { Product } from '../types';
import ConfirmationModal from './ConfirmationModal';
import CubeIcon from './icons/CubeIcon';
import UploadIcon from './icons/UploadIcon';
import TrashIcon from './icons/TrashIcon';
import SearchIcon from './icons/SearchIcon';

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
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState: Omit<Product, 'id'> = {
        name: '',
        category: '',
        price: 0,
        description: '',
        image: ''
    };
    
    const [productFormData, setProductFormData] = useState(initialFormState);

    const filteredProducts = products.filter(product => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            product.name.toLowerCase().includes(lowerTerm) ||
            product.category.toLowerCase().includes(lowerTerm) ||
            product.description.toLowerCase().includes(lowerTerm)
        );
    });

    const handleOpenModal = (product: Product | null) => {
        setEditingProduct(product);
        if (product) {
            setProductFormData(product);
        } else {
            setProductFormData(initialFormState);
        }
        setIsModalOpen(true);
        setIsProcessingImage(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setProductFormData(initialFormState);
        setIsProcessingImage(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Crear canvas para redimensionar
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800; // Limitar resolución para optimizar espacio en Backup y LocalStorage
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Comprimir a JPEG calidad 0.7
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    setProductFormData(prev => ({ ...prev, image: compressedDataUrl }));
                    setIsProcessingImage(false);
                };
                img.onerror = () => {
                    alert("Error al procesar la imagen.");
                    setIsProcessingImage(false);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setProductFormData(prev => ({ ...prev, image: '' }));
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
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        </div>
                        <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                            <span>+ Nuevo Producto</span>
                        </button>
                    </div>
                </div>
                
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl border border-slate-700">
                            <div className="relative h-48 w-full bg-slate-700 overflow-hidden group">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-500 bg-slate-700">
                                            <CubeIcon className="h-16 w-16 opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className="text-xs bg-slate-900/80 text-cyan-400 font-semibold px-2 py-1 rounded-full whitespace-nowrap backdrop-blur-sm border border-cyan-500/30">
                                            {product.category}
                                        </span>
                                    </div>
                            </div>
                            
                            <div className="p-5 flex flex-col flex-grow justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-100 mb-2">{product.name}</h2>
                                        <p className="text-slate-400 text-sm line-clamp-3 mb-4">{product.description}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xl font-bold text-green-400 text-right mb-4">
                                            €{product.price.toLocaleString('es-ES')}
                                        </p>
                                        <div className="pt-4 border-t border-slate-700/50 flex items-center justify-end space-x-3">
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center text-slate-400">
                        {searchTerm ? 'No se encontraron productos con ese criterio.' : 'No hay productos registrados.'}
                    </div>
                )}
            </div>
             {isModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <input type="text" name="name" value={productFormData.name} onChange={handleInputChange} placeholder="Nombre del Producto" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="text" name="category" value={productFormData.category} onChange={handleInputChange} placeholder="Categoría" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <input type="number" step="0.01" name="price" value={productFormData.price} onChange={handleInputChange} placeholder="Precio (€)" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                             <textarea name="description" value={productFormData.description} onChange={handleInputChange} placeholder="Descripción" className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 h-24" required />
                             
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Foto del Producto (Se guardará en Backup)</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className={`flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:border-cyan-500 transition-colors ${isProcessingImage ? 'opacity-50 cursor-wait' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <UploadIcon className="h-6 w-6 text-slate-400 mb-1" />
                                                <span className="text-xs text-slate-400">{isProcessingImage ? 'Procesando imagen...' : 'Click para subir imagen'}</span>
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isProcessingImage} />
                                        </label>
                                    </div>
                                    {productFormData.image && (
                                        <div className="relative group h-20 w-20 flex-shrink-0">
                                            <img src={productFormData.image} alt="Preview" className="h-full w-full object-cover rounded-lg border border-slate-600" />
                                            <button 
                                                type="button" 
                                                onClick={handleRemoveImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                title="Eliminar imagen"
                                            >
                                                <TrashIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                             </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                                <button type="submit" disabled={isProcessingImage} className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-wait rounded-md text-white font-semibold transition-colors">
                                    {isProcessingImage ? 'Procesando...' : (editingProduct ? 'Actualizar Producto' : 'Guardar Producto')}
                                </button>
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
