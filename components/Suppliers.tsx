import React, { useState, useMemo, useCallback } from 'react';
import { findSuppliers, SupplierInfo } from '../services/geminiService';
import { Ingredient, Supplier } from '../types';
import { Phone, Building, MapPin, Globe, MessageCircle, Search, Tag, Plus, Trash2, Mail, User } from 'lucide-react';

const SupplierCard: React.FC<{ supplier: SupplierInfo }> = ({ supplier }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 transition-shadow hover:shadow-lg flex flex-col animate-slide-in-right">
        <h4 className="text-lg font-bold text-gray-800">{supplier.name}</h4>
        <div className="mt-2 space-y-2 text-sm text-gray-600 flex-grow">
            <p className="flex items-center gap-2"><Building className="text-p-taupe" /> <strong>{supplier.specialty}</strong></p>
            <p className="flex items-center gap-2"><MapPin className="text-p-taupe" /> {supplier.city}</p>
            {supplier.price_info && (
                <p className="flex items-start gap-2 text-brand-lime font-semibold"><Tag className="text-p-taupe mt-1 flex-shrink-0" /> <span>{supplier.price_info}</span></p>
            )}
            {supplier.website && (
                <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline break-all">
                    <Globe className="text-p-taupe" /> {supplier.website}
                </a>
            )}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
             {supplier.phone && (
                <a href={`tel:${supplier.phone.replace(/\D/g, '')}`} className="flex-1 bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-md hover:bg-gray-300 transition-colors text-center flex items-center justify-center gap-2 text-sm">
                    <Phone className="w-4 h-4" /> Ligar
                </a>
             )}
            {supplier.whatsapp && (
                <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-brand-lime text-green-900 font-bold px-3 py-2 rounded-md hover:bg-green-500 transition-colors text-center flex items-center justify-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
            )}
        </div>
    </div>
);


interface SuppliersProps {
    ingredients: Ingredient[];
    suppliers: Supplier[];
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    onRemoveSupplier: (id: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ ingredients, suppliers, onAddSupplier, onRemoveSupplier }) => {
    const [activeTab, setActiveTab] = useState<'meus' | 'busca'>('meus');
    const [isSearching, setIsSearching] = useState(false);
    const [foundSuppliers, setFoundSuppliers] = useState<SupplierInfo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchTriggered, setSearchTriggered] = useState(false);
    
    // Form state for new supplier
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id' | 'pizzeriaId'>>({
        name: '',
        contactName: '',
        phone: '',
        email: '',
        category: 'Alimentos'
    });

    const lowStockItems = useMemo(() =>
        ingredients.filter(ing => ing.stock <= ing.minStock),
    [ingredients]);

    const handleSearch = useCallback(async () => {
        if (lowStockItems.length === 0) {
            setError("Não há itens com estoque baixo para buscar fornecedores.");
            setSearchTriggered(true);
            return;
        }

        setIsSearching(true);
        setError(null);
        setFoundSuppliers([]);
        setSearchTriggered(true);

        const lowStockNames = lowStockItems.map(item => item.name);
        const result = await findSuppliers(lowStockNames);

        if (result.success && result.data) {
            setFoundSuppliers(result.data);
        } else {
            setError(result.message || 'Ocorreu um erro desconhecido.');
        }
        setIsSearching(false);
    }, [lowStockItems]);

    const handleAddSupplier = () => {
        if (!newSupplier.name) return;
        onAddSupplier(newSupplier as any);
        setShowAddModal(false);
        setNewSupplier({ name: '', contactName: '', phone: '', email: '', category: 'Alimentos' });
    };

    return (
        <div className="space-y-6">
            {/* Tab Header */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('meus')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'meus' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Meus Fornecedores ({suppliers.length})
                </button>
                <button
                    onClick={() => setActiveTab('busca')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'busca' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Busca Inteligente (IA)
                </button>
            </div>

            {activeTab === 'meus' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800">Lista Permanente</h3>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-brand-orange text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-orange-600 transition-colors font-bold shadow-sm"
                        >
                            <Plus /> Novo Fornecedor
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suppliers.map(s => (
                            <div key={s.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all group relative">
                                <button 
                                    onClick={() => onRemoveSupplier(s.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remover"
                                >
                                    <Trash2 />
                                </button>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-full flex items-center justify-center text-xl font-bold">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{s.name}</h4>
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s.category}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {s.contactName && <p className="flex items-center gap-2"><User className="text-gray-400 w-4" /> {s.contactName}</p>}
                                    {s.phone && <p className="flex items-center gap-2"><Phone className="text-gray-400 w-4" /> {s.phone}</p>}
                                    {s.email && <p className="flex items-center gap-2 break-all"><Mail className="text-gray-400 w-4" /> {s.email}</p>}
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                                    {s.phone && (
                                        <a href={`https://wa.me/${s.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-center text-xs font-bold hover:bg-green-100 transition-colors">
                                            WhatsApp
                                        </a>
                                    )}
                                    <button className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg text-center text-xs font-bold hover:bg-gray-100 transition-colors">
                                        Histórico
                                    </button>
                                </div>
                            </div>
                        ))}
                        {suppliers.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                                <p>Nenhum fornecedor cadastrado. Use a Busca Inteligente para encontrar parceiros ou cadastre manualmente.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'busca' && (
                <div className="animate-fade-in space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-brand-orange">
                        <h3 className="text-xl font-semibold text-gray-800">Busca Inteligente de Fornecedores</h3>
                        <p className="text-gray-600 mt-1 text-sm">A IA buscará novos fornecedores com base nos itens qeu estão com o estoque baixo.</p>
                        
                        <div className="mt-4 p-4 bg-orange-50 rounded-lg flex items-center gap-4">
                            <div className="flex-1">
                                <h4 className="font-bold text-orange-800 text-sm">Itens Críticos:</h4>
                                <p className="text-orange-700 text-xs">
                                    {lowStockItems.length > 0 
                                        ? lowStockItems.map(i => i.name).join(', ')
                                        : "Tudo sob controle! Nenhum item crítico no momento."}
                                </p>
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || lowStockItems.length === 0}
                                className="bg-brand-orange text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap shadow-md text-sm"
                            >
                                {isSearching ? 'Buscando...' : 'Pesquisar Parceiros'}
                            </button>
                        </div>
                    </div>

                    {isSearching && (
                        <div className="text-center p-12 bg-white rounded-xl shadow-sm">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange mb-4"></div>
                            <p className="text-gray-500 font-medium">Consultando rede de fornecedores próxima...</p>
                        </div>
                    )}

                    {!isSearching && foundSuppliers.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Resultados Encontrados:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {foundSuppliers.map((supplier) => (
                                    <SupplierCard key={supplier.name + supplier.phone} supplier={supplier} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Cadastro Simples */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
                        <div className="bg-brand-orange p-6 text-white text-center">
                            <h3 className="text-2xl font-bold">Novo Fornecedor</h3>
                            <p className="text-orange-100 text-sm">Cadastre parceiros para compras manuais</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Empresa</label>
                                <input 
                                    type="text" 
                                    value={newSupplier.name} 
                                    onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                                    placeholder="Ex: Atacadão S/A"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contato</label>
                                    <input 
                                        type="text" 
                                        value={newSupplier.contactName} 
                                        onChange={e => setNewSupplier({...newSupplier, contactName: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border rounded-xl outline-none"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                                    <select 
                                        value={newSupplier.category} 
                                        onChange={e => setNewSupplier({...newSupplier, category: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border rounded-xl outline-none"
                                    >
                                        <option>Alimentos</option>
                                        <option>Bebidas</option>
                                        <option>Embalagens</option>
                                        <option>Limpeza</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp / Telefone</label>
                                <input 
                                    type="text" 
                                    value={newSupplier.phone} 
                                    onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border rounded-xl outline-none"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handleAddSupplier} className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-md transition-colors">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;