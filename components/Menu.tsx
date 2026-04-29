import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Product } from '../types';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import EditProductModal from './EditProductModal';
import AddProductModal from './AddProductModal';
import { Addon, AddonRecipe, RecipePart, Ingredient } from '../types';
import { Soup, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface MenuProps {
    products: Product[];
    onAddProduct: (newProducts: Omit<Product, 'id'>[]) => void;
    onUpdateProduct: (productId: number, updatedData: Partial<Product>) => void;
    onRemoveProduct: (productId: number) => void;
    isAnalyzing: boolean;
    analysisMessage: string;
    onAnalyzeMenu: (files: File[]) => void;
    addons: Addon[];
    addonRecipes: AddonRecipe;
    onUpdateAddon: (addonId: number, updatedData: Partial<Addon>) => void;
    onUpdateAddonRecipe: (addonId: number, parts: RecipePart[]) => void;
    ingredients: Ingredient[];
}

const Menu: React.FC<MenuProps> = ({ products, onAddProduct, onUpdateProduct, onRemoveProduct, isAnalyzing, analysisMessage, onAnalyzeMenu, addons, addonRecipes, onUpdateAddon, onUpdateAddonRecipe, ingredients }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedAddonId, setExpandedAddonId] = useState<number | null>(null);

    const categorizedProducts = useMemo(() => {
        return products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [products]);

    const dynamicCategories = useMemo(() => {
        return Object.keys(categorizedProducts).sort((a, b) => {
            const aIsPizza = a.toLowerCase().includes('pizza');
            const bIsPizza = b.toLowerCase().includes('pizza');
            const aIsBebida = a.toLowerCase().includes('bebida');
            const bIsBebida = b.toLowerCase().includes('bebida');

            if (aIsPizza && !bIsPizza) return -1;
            if (!aIsPizza && bIsPizza) return 1;
            if (aIsBebida && !bIsBebida) return 1;
            if (!aIsBebida && bIsBebida) return -1;
            return a.localeCompare(b);
        });
    }, [categorizedProducts]);

    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        if (dynamicCategories.length > 0 && (!activeTab || !dynamicCategories.includes(activeTab))) {
            setActiveTab(dynamicCategories[0]);
        } else if (dynamicCategories.length === 0) {
            setActiveTab('');
        }
    }, [dynamicCategories, activeTab]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (files.length > 0) {
            onAnalyzeMenu(files);
        }
        if (fileInputRef.current) fileInputRef.current.value = ""; 
    };
    
    const handleDeleteProduct = (product: Product) => {
        if (window.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
            onRemoveProduct(product.id);
        }
    };

    const handleSaveNewProduct = (newProductData: Omit<Product, 'id' | 'imageUrl' | 'cost' | 'alcoholic'>) => {
        const newProductWithImage = {
            ...newProductData,
            imageUrl: '' // Image URL is removed as per request
        };
        onAddProduct([newProductWithImage]);
        setIsAddModalOpen(false);
    };

    return (
        <>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerenciamento de Cardápio</h3>
                     <div className="flex flex-col md:flex-row md:items-end gap-6">
                        <div>
                             <h4 className="font-semibold text-gray-700 text-sm mb-1">Atualizar via Arquivo (PDF, JPG)</h4>
                             <p className="text-xs text-gray-500 mb-2">Envie seu cardápio para adicionar os itens automaticamente.</p>
                            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={isAnalyzing} 
                                className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 flex items-center justify-center min-w-[220px]"
                            >
                                {isAnalyzing && (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isAnalyzing ? analysisMessage : 'Carregar Arquivo(s)'}
                            </button>
                        </div>
                         <div className="border-l border-gray-200 pl-6">
                            <h4 className="font-semibold text-gray-700 text-sm mb-1">Adicionar Item Manualmente</h4>
                            <p className="text-xs text-gray-500 mb-2">Insira um novo produto no cardápio.</p>
                            <button onClick={() => setIsAddModalOpen(true)} className="bg-p-d-olive text-white px-4 py-2 rounded-md hover:bg-p-taupe transition-colors">
                                Adicionar Produto
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Cardápio Atual</h3>
                    
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            {dynamicCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveTab(category)}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                                        activeTab === category
                                            ? 'border-brand-orange text-brand-orange'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-6">
                        {dynamicCategories.length > 0 && activeTab ? (
                            categorizedProducts[activeTab]?.length > 0 ? (
                                <div key={activeTab} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-right">
                                    {categorizedProducts[activeTab].map(item => (
                                        <div key={item.id} className="border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm flex flex-col transition-shadow hover:shadow-lg relative group">
                                            <div className="p-4 flex-grow flex flex-col">
                                                <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                                                {item.description && (
                                                    <p className="text-xs text-gray-500 mt-1 flex-grow">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <p className="font-semibold text-brand-orange text-xl mt-2">R$ {item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button onClick={() => setEditingProduct(item)} className="p-2 bg-white/80 rounded-full shadow-md hover:bg-blue-100 text-blue-600" title="Editar Produto">
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => handleDeleteProduct(item)} className="p-2 bg-white/80 rounded-full shadow-md hover:bg-red-100 text-red-600" title="Excluir Produto">
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Nenhum item encontrado nesta categoria.</p>
                            )
                        ) : (
                            <p className="text-center text-gray-500 py-8">Seu cardápio está vazio. Adicione itens usando o carregador de arquivos ou manualmente.</p>
                        )}
                    </div>
                </div>

                {/* Seção de Adicionais e Complementos */}
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-brand-orange">
                    <div className="flex items-center gap-3 mb-4">
                        <Soup className="text-2xl text-brand-orange" />
                        <h3 className="text-xl font-semibold text-gray-800">Adicionais e Complementos</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Configure os preços e as fichas técnicas de bordas, extras e ingredientes opcionais.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addons.map(addon => {
                            const recipe = addonRecipes[addon.id] || [];
                            const isExpanded = expandedAddonId === addon.id;

                            return (
                                <div key={addon.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50 hover:border-brand-orange/30 transition-all shadow-sm">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    value={addon.name} 
                                                    onChange={(e) => onUpdateAddon(addon.id, { name: e.target.value })}
                                                    className="bg-transparent font-bold text-gray-800 focus:bg-white border-none rounded px-1 transition-colors w-full"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-brand-orange font-bold mt-1">
                                                <span>R$</span>
                                                <input 
                                                    type="number" 
                                                    value={addon.price}
                                                    onChange={(e) => onUpdateAddon(addon.id, { price: parseFloat(e.target.value) })}
                                                    className="bg-transparent focus:bg-white border-none rounded px-1 w-20"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setExpandedAddonId(isExpanded ? null : addon.id)}
                                            className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-brand-orange'}`}
                                            title="Configurar Receita (Ficha Técnica)"
                                        >
                                            {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 bg-white border-t border-gray-100 animate-slide-in-right">
                                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Plus className="text-[10px]" size={10} /> Ficha Técnica
                                            </h5>
                                            <div className="space-y-3">
                                                {recipe.map((part, index) => {
                                                    const ing = ingredients.find(i => i.id === part.ingredientId);
                                                    return (
                                                        <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg group border border-gray-100">
                                                            <select 
                                                                value={part.ingredientId}
                                                                onChange={(e) => {
                                                                    const newId = parseInt(e.target.value);
                                                                    const selectedIng = ingredients.find(i => i.id === newId);
                                                                    const newParts = [...recipe];
                                                                    newParts[index] = { ...part, ingredientId: newId, unit: selectedIng?.unit || 'g' };
                                                                    onUpdateAddonRecipe(addon.id, newParts);
                                                                }}
                                                                className="flex-grow bg-transparent border-none text-gray-700 font-medium focus:ring-0 truncate max-w-[150px]"
                                                            >
                                                                {ingredients.map(i => (
                                                                    <option key={i.id} value={i.id}>{i.name}</option>
                                                                ))}
                                                            </select>
                                                            <input 
                                                                type="number" 
                                                                value={part.quantity}
                                                                onChange={(e) => {
                                                                    const newParts = [...recipe];
                                                                    newParts[index] = { ...part, quantity: parseFloat(e.target.value) };
                                                                    onUpdateAddonRecipe(addon.id, newParts);
                                                                }}
                                                                className="w-16 p-1 border rounded bg-white text-center font-bold"
                                                            />
                                                            <span className="text-gray-400 w-6 text-xs font-bold">{part.unit}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    const newParts = recipe.filter((_, i) => i !== index);
                                                                    onUpdateAddonRecipe(addon.id, newParts);
                                                                }}
                                                                className="text-gray-300 hover:text-brand-red transition-colors p-1"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                <button 
                                                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-black text-gray-400 hover:border-brand-orange hover:text-brand-orange hover:bg-orange-50 transition-all flex items-center justify-center gap-2 mt-4"
                                                    onClick={() => {
                                                        const firstIngId = ingredients[0]?.id || 0;
                                                        const firstIngUnit = ingredients[0]?.unit || 'g';
                                                        const newParts = [...recipe, { ingredientId: firstIngId, quantity: 1, unit: firstIngUnit }];
                                                        onUpdateAddonRecipe(addon.id, newParts as RecipePart[]);
                                                    }}
                                                >
                                                    <Plus size={14} /> Adicionar Ingrediente à Receita
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSave={(updatedProduct) => {
                        onUpdateProduct(updatedProduct.id, updatedProduct);
                        setEditingProduct(null);
                    }}
                />
            )}
            {isAddModalOpen && (
                <AddProductModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleSaveNewProduct}
                />
            )}
        </>
    );
};

export default Menu;
