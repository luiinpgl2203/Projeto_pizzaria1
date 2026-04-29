

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Ingredient, Recipe, Product, StockMovement, Order, RecipePart } from '../types';
import { predictInventoryNeeds } from '../services/geminiService';
import { Bot, RotateCcw, ArrowRight } from 'lucide-react';
import { convertUnits } from '../src/lib/units';

// --- CUSTOM UNIT SELECTOR COMPONENT ---
const UnitSelector: React.FC<{
    ingredient: Ingredient;
    onUnitChange: (id: number, unit: Ingredient['unit']) => void;
}> = ({ ingredient, onUnitChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    const units: {label: string; options: Ingredient['unit'][]}[] = [
        { label: "Peso", options: ["kg", "g"] },
        { label: "Volume", options: ["L", "ml"] },
        { label: "Unidade", options: ["un"] },
    ];

    const currentUnitType = units.find(group => group.options.includes(ingredient.unit))?.label;

    const handleSelect = (unit: Ingredient['unit']) => {
        onUnitChange(ingredient.id, unit);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-24 bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-2 py-2 text-left focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <span className="font-semibold text-gray-800">{ingredient.unit}</span>
                <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                <ul className="absolute z-10 mt-1 w-32 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {units.map(group => (
                        <div key={group.label}>
                            <li className="text-xs font-bold text-gray-500 px-3 py-1 bg-gray-50">{group.label}</li>
                            {group.options.map(unit => {
                                const isUnitGroup = group.label === "Unidade";
                                const currentIsUnit = currentUnitType === "Unidade";
                                const isDisabled = (currentIsUnit && !isUnitGroup) || (!currentIsUnit && isUnitGroup);

                                return (
                                <li 
                                    key={unit}
                                    onClick={() => !isDisabled && handleSelect(unit)}
                                    className={`
                                        cursor-pointer select-none relative py-2 pl-3 pr-9
                                        ${isDisabled ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-900 hover:bg-orange-50'}
                                    `}
                                >
                                    <span className={`font-normal block truncate ${ingredient.unit === unit ? 'font-semibold text-brand-orange' : ''}`}>
                                        {unit}
                                    </span>
                                </li>
                                )
                            })}
                        </div>
                    ))}
                </ul>
            )}
        </div>
    );
};


const AdjustStockModal: React.FC<{
    ingredient: Ingredient;
    onClose: () => void;
    onSave: (id: number, newStock: number) => void;
}> = ({ ingredient, onClose, onSave }) => {
    const [newStock, setNewStock] = useState(ingredient.stock.toString());

    const handleSave = () => {
        const stockValue = parseFloat(newStock);
        if (!isNaN(stockValue)) {
            onSave(ingredient.id, stockValue);
            onClose();
        } else {
            alert("Por favor, insira um valor numérico válido.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-gray-800">
                <h3 className="text-xl font-bold">Ajustar Estoque: {ingredient.name}</h3>
                <div className="my-4">
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-600">Nova quantidade em estoque ({ingredient.unit})</label>
                    <input
                        type="number"
                        id="stock"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                    />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const AdjustMinStockModal: React.FC<{
    ingredient: Ingredient;
    onClose: () => void;
    onSave: (id: number, newMinStock: number) => void;
}> = ({ ingredient, onClose, onSave }) => {
    const [newMinStock, setNewMinStock] = useState(ingredient.minStock.toString());

    const handleSave = () => {
        const stockValue = parseFloat(newMinStock);
        if (!isNaN(stockValue) && stockValue >= 0) {
            onSave(ingredient.id, stockValue);
            onClose();
        } else {
            alert("Por favor, insira um valor numérico válido.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-gray-800">
                <h3 className="text-xl font-bold">Ajustar Estoque Mínimo: {ingredient.name}</h3>
                <div className="my-4">
                    <label htmlFor="min-stock" className="block text-sm font-medium text-gray-600">Novo estoque mínimo de alerta ({ingredient.unit})</label>
                    <input
                        type="number"
                        id="min-stock"
                        value={newMinStock}
                        onChange={(e) => setNewMinStock(e.target.value)}
                        className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                    />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const AdjustYieldModal: React.FC<{
    ingredient: Ingredient;
    onClose: () => void;
    onSave: (id: number, newYield: number) => void;
}> = ({ ingredient, onClose, onSave }) => {
    const [newYield, setNewYield] = useState((ingredient.yieldFactor || 1).toString());

    const handleSave = () => {
        const yieldValue = parseFloat(newYield);
        if (!isNaN(yieldValue) && yieldValue > 0 && yieldValue <= 1) {
            onSave(ingredient.id, yieldValue);
            onClose();
        } else {
            alert("Por favor, insira um valor entre 0.01 e 1 (ex: 0.9 para 90% de aproveitamento).");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-gray-800">
                <h3 className="text-xl font-bold">Fator de Aproveitamento: {ingredient.name}</h3>
                <div className="my-4">
                    <label htmlFor="yield" className="block text-sm font-medium text-gray-600">Representa quanto do ingrediente é realmente usado (0.1 a 1.0)</label>
                    <input
                        type="number"
                        id="yield"
                        step="0.05"
                        min="0.1"
                        max="1"
                        value={newYield}
                        onChange={(e) => setNewYield(e.target.value)}
                        className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                    />
                    <p className="mt-2 text-xs text-gray-500">Ex: Cebola (0.90) significa que 10% é desperdiçado em cascas.</p>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Salvar</button>
                </div>
            </div>
        </div>
    );
};


interface InventoryProps {
    ingredients: Ingredient[];
    setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
    onRemoveIngredient: (id: number) => void;
    onUpdateIngredientMinStock: (id: number, minStock: number) => void;
    onUpdateIngredientUnit: (id: number, newUnit: Ingredient['unit']) => void;
    onUpdateIngredientYield: (id: number, yieldFactor: number) => void;
    onAdjustStock: (id: number, newStock: number) => void;
    recipes: Recipe;
    products: Product[];
    stockMovements: StockMovement[];
    orders: Order[];
}

const Inventory: React.FC<InventoryProps> = ({ 
    ingredients, 
    setIngredients, 
    onRemoveIngredient, 
    onUpdateIngredientMinStock, 
    onUpdateIngredientUnit, 
    onUpdateIngredientYield,
    onAdjustStock,
    recipes, 
    products,
    stockMovements,
    orders
}) => {
    const [activeTab, setActiveTab] = useState<'estoque' | 'historico' | 'analise' | 'previsao'>('estoque');
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictionData, setPredictionData] = useState<any[]>([]);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [editingMinStock, setEditingMinStock] = useState<Ingredient | null>(null);
    const [editingYield, setEditingYield] = useState<Ingredient | null>(null);
    const [isForecastExpanded, setIsForecastExpanded] = useState(false);

    const usedIngredientIds = useMemo(() => {
        const ids = new Set<number>();
        (Object.values(recipes) as RecipePart[][]).forEach(recipeParts => {
            recipeParts.forEach(part => ids.add(part.ingredientId));
        });
        return ids;
    }, [recipes]);

    const displayedIngredients = useMemo(() => {
        return ingredients.filter(ingredient => usedIngredientIds.has(ingredient.id))
                          .sort((a, b) => a.name.localeCompare(b.name));
    }, [ingredients, usedIngredientIds]);

    const getStockLevelClass = (stock: number, minStock: number) => {
        if (stock <= 0) return 'bg-gray-300';
        if (stock <= minStock) return 'bg-brand-red';
        const percentage = (stock / (minStock * 2)) * 100;
        if (percentage < 75) return 'bg-yellow-400';
        return 'bg-brand-lime';
    };

    const handleUpdateStock = (id: number, newStock: number) => {
        onAdjustStock(id, newStock);
    };

    const pizzasWithRecipes = useMemo(() => {
        return products.filter(p => p.category.toLowerCase().includes('pizza') && recipes[p.id]);
    }, [products, recipes]);

    const productionForecastForAllPizzas = useMemo(() => {
    return pizzasWithRecipes.map(pizza => {
        const recipe = recipes[pizza.id];
        if (!recipe) return null;

        let minYield = Infinity;
        let bottleneckIngredientName = 'N/A';

        for (const recipePart of recipe) {
            const ingredient = ingredients.find(i => i.id === recipePart.ingredientId);
            if (!ingredient) {
                minYield = 0;
                bottleneckIngredientName = `Ingrediente (ID: ${recipePart.ingredientId}) não encontrado`;
                break;
            }

            let stockInBaseUnit = ingredient.stock;
            let usageInBaseUnit = recipePart.quantity;

            if (ingredient.unit !== 'un') {
                const isWeight = ['g', 'kg'].includes(ingredient.unit);
                const baseUnit = isWeight ? 'g' : 'ml';
                stockInBaseUnit = convertUnits(ingredient.stock, ingredient.unit, baseUnit);
                usageInBaseUnit = convertUnits(recipePart.quantity, recipePart.unit, baseUnit);
            }

            if (usageInBaseUnit > 0) {
                const currentYield = Math.floor(stockInBaseUnit / usageInBaseUnit);
                if (currentYield < minYield) {
                    minYield = currentYield;
                    bottleneckIngredientName = ingredient.name;
                }
            }
        }

        if (minYield === Infinity) {
            minYield = 0;
            bottleneckIngredientName = 'Receita inválida';
        }

        return {
            pizzaId: pizza.id,
            pizzaName: pizza.name,
            yield: minYield,
            bottleneck: bottleneckIngredientName,
        };
    }).filter((p): p is { pizzaId: number; pizzaName: string; yield: number; bottleneck: string; } => p !== null)
      .sort((a, b) => a.yield - b.yield);
}, [pizzasWithRecipes, ingredients, recipes]);

    const displayedForecasts = isForecastExpanded ? productionForecastForAllPizzas : productionForecastForAllPizzas.slice(0, 5);


    return (
        <div className="space-y-6">
            {/* Tab Header */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('estoque')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'estoque' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Controle de Estoque
                </button>
                <button
                    onClick={() => setActiveTab('historico')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'historico' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Histórico de Movimentações
                </button>
                <button
                    onClick={() => setActiveTab('analise')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'analise' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Análise de Capacidade
                </button>
                <button
                    onClick={() => setActiveTab('previsao')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'previsao' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Previsão AI (Beta)
                </button>
            </div>

            {activeTab === 'estoque' && (
                <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Matérias-Primas</h3>
                            <p className="text-sm text-gray-500">Gerencie saldos, mínimos e fatores de perda.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Ingrediente</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Estoque Atual</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Nível</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Aproveitamento (%)</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Estoque Mínimo</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedIngredients.map(ingredient => (
                                    <tr key={ingredient.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-medium text-gray-800">{ingredient.name}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{ingredient.stock.toFixed(ingredient.unit === 'un' ? 0 : 3)}</span>
                                                <UnitSelector ingredient={ingredient} onUnitChange={onUpdateIngredientUnit} />
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                                <div 
                                                    className={`h-2 rounded-full ${getStockLevelClass(ingredient.stock, ingredient.minStock)}`} 
                                                    style={{ width: `${Math.min(100, (ingredient.stock / (ingredient.minStock * 2)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number"
                                                    value={(ingredient.yieldFactor || 1) * 100}
                                                    onChange={(e) => onUpdateIngredientYield(ingredient.id, parseFloat(e.target.value) / 100)}
                                                    className="w-16 p-1 border rounded text-sm text-center focus:ring-brand-orange"
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="text-xs text-gray-500">%</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-600 text-sm">{ingredient.minStock} {ingredient.unit}</td>
                                        <td className="p-3 text-right space-x-2">
                                            <button onClick={() => setEditingIngredient(ingredient)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-semibold text-xs transition-colors">Ajustar</button>
                                            <button onClick={() => setEditingMinStock(ingredient)} className="bg-orange-50 text-orange-600 px-3 py-1 rounded hover:bg-orange-100 font-semibold text-xs transition-colors">Mínimo</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'historico' && (
                <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Movimentações</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-3 font-semibold text-gray-600">Data/Hora</th>
                                    <th className="p-3 font-semibold text-gray-600">Ingrediente</th>
                                    <th className="p-3 font-semibold text-gray-600">Tipo</th>
                                    <th className="p-3 font-semibold text-gray-600">Quantidade</th>
                                    <th className="p-3 font-semibold text-gray-600">Motivo</th>
                                    <th className="p-3 font-semibold text-gray-600">Usuário</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stockMovements.map(move => (
                                    <tr key={move.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-500">{new Date(move.timestamp).toLocaleString('pt-BR')}</td>
                                        <td className="p-3 font-medium text-gray-800">{move.ingredientName}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                move.type === 'Entrada' ? 'bg-green-100 text-green-700' :
                                                move.type === 'Saída' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {move.type}
                                            </span>
                                        </td>
                                        <td className={`p-3 font-bold ${move.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                            {move.type === 'Entrada' ? '+' : '-'}{move.quantity.toFixed(3)} {move.unit}
                                        </td>
                                        <td className="p-3 text-gray-600 max-w-xs truncate">{move.reason}</td>
                                        <td className="p-3 text-gray-500">{move.userName}</td>
                                    </tr>
                                ))}
                                {stockMovements.length === 0 && (
                                    <tr><td colSpan={6} className="text-center p-8 text-gray-500 italic">Nenhuma movimentação registrada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'analise' && (
                // ... existing analise content
                <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Principais Gargalos de Produção</h3>
                    <p className="text-sm text-gray-600 mb-6">Capacidade máxima baseada no estoque e fatores de perda atuais.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productionForecastForAllPizzas.map(forecast => (
                            <div key={forecast.pizzaId} className="border border-gray-200 rounded-xl p-5 hover:border-brand-orange transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-gray-800 group-hover:text-brand-orange">{forecast.pizzaName}</h4>
                                    <span className="text-2xl font-black text-brand-orange">{forecast.yield}</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Limitação Técnica:</div>
                                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    {forecast.bottleneck}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'previsao' && (
                <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Bot className="text-brand-orange" /> Previsão Inteligente de Compras
                            </h3>
                            <p className="text-sm text-gray-500">Análise preditiva baseada em vendas, estoque e sazonalidade.</p>
                        </div>
                        <button 
                            onClick={async () => {
                                setIsPredicting(true);
                                const result = await predictInventoryNeeds(ingredients, orders, stockMovements);
                                if (result.success) setPredictionData(result.data || []);
                                setIsPredicting(false);
                            }}
                            disabled={isPredicting}
                            className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-600 disabled:bg-gray-300 shadow-lg transition-transform active:scale-95"
                        >
                            {isPredicting ? <RotateCcw className="animate-spin" /> : <Bot />} 
                            {isPredicting ? 'Analisando dados...' : 'Gerar Previsão de 7 Dias'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {predictionData.map((item, idx) => (
                            <div key={idx} className={`p-5 rounded-2xl border-2 ${
                                item.urgency === 'alta' ? 'border-red-100 bg-red-50/30' : 
                                item.urgency === 'media' ? 'border-orange-100 bg-orange-50/30' : 'border-blue-100 bg-blue-50/30'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <h4 className="text-lg font-black text-gray-800">{item.ingredientName}</h4>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                                        item.urgency === 'alta' ? 'bg-red-500 text-white animate-pulse' : 
                                        item.urgency === 'media' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                    }`}>
                                        {item.urgency}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Sugestão de Compra</p>
                                        <p className="text-2xl font-black text-gray-900">{item.predictedNeed} <span className="text-sm text-gray-500">un/kg</span></p>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <RotateCcw className="text-brand-orange" />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 italic text-sm text-gray-600 leading-snug">
                                    "{item.reason}"
                                </div>
                            </div>
                        ))}
                        {predictionData.length === 0 && !isPredicting && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                    <Bot className="text-gray-300 text-3xl" />
                                </div>
                                <p className="text-gray-500 font-medium">Os dados de inteligência estão prontos para processamento.</p>
                                <p className="text-xs text-gray-400 mt-1">Gere a previsão para ver as sugestões da IA.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {editingIngredient && (
                <AdjustStockModal
                    ingredient={editingIngredient}
                    onClose={() => setEditingIngredient(null)}
                    onSave={handleUpdateStock}
                />
            )}
            {editingMinStock && (
                <AdjustMinStockModal
                    ingredient={editingMinStock}
                    onClose={() => setEditingMinStock(null)}
                    onSave={onUpdateIngredientMinStock}
                />
            )}
        </div>
    );
};

export default Inventory;