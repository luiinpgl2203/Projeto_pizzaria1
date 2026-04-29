import React, { useState } from 'react';
import { Product } from '../types';

type NewProductData = Omit<Product, 'id' | 'imageUrl' | 'cost' | 'alcoholic'>;

interface AddProductModalProps {
    onClose: () => void;
    onSave: (product: NewProductData) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<NewProductData>({
        name: '',
        category: 'Pizzas Salgadas',
        price: 0,
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.category || formData.price <= 0) {
            alert('Nome, categoria e um preço válido são obrigatórios.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-lg text-gray-800">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-lg font-bold">Adicionar Novo Produto</h3>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categoria</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                            <input
                                type="number"
                                name="price"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição / Ingredientes</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description || ''}
                            onChange={handleChange}
                            className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md"
                            placeholder="Ex: Molho de tomate, mussarela, calabresa fatiada, cebola."
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Salvar Produto</button>
                </div>
            </form>
        </div>
    );
};

export default AddProductModal;
