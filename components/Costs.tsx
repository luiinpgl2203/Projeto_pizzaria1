import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FixedCost, Ingredient, Product, Recipe, Order, AnalysisResult, ConfirmedUpdate, RecipePart } from '../types';
import StatCard from './StatCard';
import CostsIcon from './icons/CostsIcon';
import RevenueIcon from './icons/RevenueIcon'; 
import CostAnalysisConfirmationModal from './CostAnalysisConfirmationModal';
import CostBreakdownChart from './CostBreakdownChart';
import ProfitabilityReport from './ProfitabilityReport';
import { FileText, TrendingUp, Bot, Upload, RefreshCw } from 'lucide-react';

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

    const units: { label: string; options: Ingredient['unit'][] }[] = [
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
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
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
                                        onClick={(e) => { e.stopPropagation(); if (!isDisabled) handleSelect(unit); }}
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


// --- HELPER FUNCTIONS ---
const convertUnits = (quantity: number, fromUnit: 'g' | 'ml' | 'un' | 'kg' | 'L', toUnit: 'g' | 'ml' | 'un' | 'kg' | 'L'): number => {
    if (fromUnit === toUnit) return quantity;
    if (fromUnit === 'g' && toUnit === 'kg') return quantity / 1000;
    if (fromUnit === 'kg' && toUnit === 'g') return quantity * 1000;
    if (fromUnit === 'ml' && toUnit === 'L') return quantity / 1000;
    if (fromUnit === 'L' && toUnit === 'ml') return quantity * 1000;
    if (fromUnit === 'g' && toUnit === 'L') return quantity / 1000;
    if (fromUnit === 'ml' && toUnit === 'kg') return quantity / 1000;
    if (fromUnit === 'kg' && toUnit === 'ml') return quantity * 1000;
    if (fromUnit === 'L' && toUnit === 'g') return quantity * 1000;
    return quantity;
}

// --- MAIN COMPONENT ---
interface CostsProps {
    orders: Order[];
    ingredients: Ingredient[];
    setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
    onUpdateIngredient: (id: number, updatedData: Partial<Ingredient>) => void;
    onRemoveIngredient: (id: number) => void;
    fixedCosts: FixedCost[];
    setFixedCosts: React.Dispatch<React.SetStateAction<FixedCost[]>>;
    onAddFixedCost: (name: string, value: number) => void;
    onUpdateFixedCost: (id: number, name: string, value: number) => void;
    onRemoveFixedCost: (id: number) => void;
    products: Product[];
    recipes: Recipe;
    onUpdateProduct: (productId: number, updatedData: Partial<Product>) => void;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    onUpdateIngredientUnit: (id: number, newUnit: Ingredient['unit']) => void;
    isAnalyzing: boolean;
    analysisMessage: string;
    onAnalyzeCosts: (files: File[]) => void;
}

const Costs: React.FC<CostsProps> = ({ orders, ingredients, setIngredients, onUpdateIngredient, onRemoveIngredient, fixedCosts, setFixedCosts, onAddFixedCost, onUpdateFixedCost, onRemoveFixedCost, products, recipes, onUpdateProduct, showToast, onUpdateIngredientUnit, isAnalyzing, analysisMessage, onAnalyzeCosts }) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'lucratividade'>('geral');
    const [newFixedCost, setNewFixedCost] = useState({ name: '', value: '' });

    // State for inline editing
    const [editingFixedCostId, setEditingFixedCostId] = useState<number | null>(null);
    const [editingFixedCostValue, setEditingFixedCostValue] = useState('');
    const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null);
    const [editingIngredientCost, setEditingIngredientCost] = useState('');
    const [editingBeverageId, setEditingBeverageId] = useState<number | null>(null);
    const [editingBeverageCost, setEditingBeverageCost] = useState('');
    const [expandedPizzaId, setExpandedPizzaId] = useState<number | null>(null);


    // State for AI analysis
    const fileInputRef = useRef<HTMLInputElement>(null);

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


    const handleFixedCostBlur = (cost: FixedCost) => {
        const newValue = parseFloat(editingFixedCostValue);
        if (!isNaN(newValue) && newValue !== cost.value) {
            onUpdateFixedCost(cost.id, cost.name, newValue);
        }
        setEditingFixedCostId(null);
    };
    
    const handleIngredientCostBlur = (ingredient: Ingredient) => {
        const newCost = parseFloat(editingIngredientCost);
        if (!isNaN(newCost) && newCost !== ingredient.costPerUnit) {
            onUpdateIngredient(ingredient.id, { costPerUnit: newCost });
        }
        setEditingIngredientId(null);
    };
    
    const handleBeverageCostBlur = (product: Product) => {
        const newCost = parseFloat(editingBeverageCost);
        if (!isNaN(newCost) && newCost !== product.cost) {
            onUpdateProduct(product.id, { cost: newCost });
        }
        setEditingBeverageId(null);
    };

    const handleKeyDown = (event: React.KeyboardEvent, onBlur: () => void) => {
        if (event.key === 'Enter') {
            onBlur();
        }
    };


    const calculatePizzaCost = useMemo(() => (productId: number): number => {
        const recipe = recipes[productId];
        if (!recipe) return 0;

        return recipe.reduce((totalCost, recipePart) => {
            const ingredient = ingredients.find(i => i.id === recipePart.ingredientId);
            if (!ingredient) return totalCost;
            
            const quantityInPurchaseUnit = convertUnits(recipePart.quantity, recipePart.unit, ingredient.unit);
            return totalCost + (ingredient.costPerUnit * quantityInPurchaseUnit);
        }, 0);
    }, [ingredients, recipes]);

    // Determine the latest month with sales to make the component robust
    const latestMonthInOrders = useMemo(() => {
        if (orders.length === 0) {
            const now = new Date();
            return { year: now.getFullYear(), month: now.getMonth() };
        }
        const latestDate = new Date(Math.max(...orders.map(o => new Date(o.date).getTime())));
        return { year: latestDate.getFullYear(), month: latestDate.getMonth() };
    }, [orders]);


    // Monthly KPIs Calculation
    const monthlyCosts = useMemo(() => {
        const { year, month } = latestMonthInOrders;
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const ordersThisMonth = orders.filter(o => {
            const orderDate = new Date(o.date);
            return o.status === 'Concluído' && orderDate >= startOfMonth && orderDate <= endOfMonth;
        });

        const rawMaterialCost = ordersThisMonth.reduce((total, order) => {
            const orderCost = order.items.reduce((itemTotal, item) => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    if (product.category.includes('Pizza')) {
                        return itemTotal + (calculatePizzaCost(product.id) * item.quantity);
                    }
                    if (product.cost) {
                        return itemTotal + (product.cost * item.quantity);
                    }
                }
                return itemTotal;
            }, 0);
            return total + orderCost;
        }, 0);

        const totalFixedCosts = fixedCosts.reduce((acc, cost) => acc + cost.value, 0);
        const totalMonthlyCost = rawMaterialCost + totalFixedCosts;

        return { rawMaterialCost, totalFixedCosts, totalMonthlyCost };
    }, [orders, products, fixedCosts, calculatePizzaCost, latestMonthInOrders]);

    const handleAddFixedCost = () => {
        const value = parseFloat(newFixedCost.value);
        if (newFixedCost.name && !isNaN(value) && value > 0) {
            onAddFixedCost(newFixedCost.name, value);
            setNewFixedCost({ name: '', value: '' });
        } else {
            alert("Por favor, preencha o nome e um valor válido para o custo.");
        }
    };
    
    // --- AI ANALYSIS HANDLERS ---
    const handleFileChangeForAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (files.length > 0) {
            onAnalyzeCosts(files);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    // --- PROFITABILITY DATA ---
    const pizzaProfitabilityData = useMemo(() => {
        return products
            .filter(p => p.category.includes('Pizza'))
            .map(product => {
                const cost = calculatePizzaCost(product.id);
                const profit = product.price - cost;
                const margin = product.price > 0 ? (profit / product.price) * 100 : 0;
                return { ...product, cost, profit, margin };
            });
    }, [products, calculatePizzaCost]);

    const beverageProfitability = useMemo(() => {
        return products
            .filter(p => p.category === 'Bebidas' && p.cost !== undefined)
            .map(product => {
                const cost = product.cost || 0;
                const profit = product.price - cost;
                const margin = product.price > 0 ? (profit / product.price) * 100 : 0;
                return { ...product, cost, profit, margin };
            });
    }, [products]);
    
    // Cost breakdown for chart
    const monthlyCostBreakdownForChart = useMemo(() => {
        const rawMaterialBreakdown: { [key: string]: number } = {};
        const { year, month } = latestMonthInOrders;
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const ordersThisMonth = orders.filter(o => {
            const orderDate = new Date(o.date);
            return o.status === 'Concluído' && orderDate >= startOfMonth && orderDate <= endOfMonth;
        });

        ordersThisMonth.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if(product) {
                    if (product.category.includes('Pizza')) {
                        const recipe = recipes[product.id];
                        if (recipe) {
                            recipe.forEach(part => {
                                const ingredient = ingredients.find(i => i.id === part.ingredientId);
                                if (ingredient) {
                                    const cost = convertUnits(part.quantity, part.unit, ingredient.unit) * ingredient.costPerUnit * item.quantity;
                                    rawMaterialBreakdown[ingredient.name] = (rawMaterialBreakdown[ingredient.name] || 0) + cost;
                                }
                            });
                        }
                    } else if (product.cost) {
                        const costName = `Compra ${product.name}`;
                        rawMaterialBreakdown[costName] = (rawMaterialBreakdown[costName] || 0) + (product.cost * item.quantity);
                    }
                }
            });
        });
        
        return {
            rawMaterialCosts: Object.entries(rawMaterialBreakdown).map(([name, value]) => ({name, value})),
            fixedCosts: fixedCosts.map(fc => ({name: fc.name, value: fc.value}))
        }

    }, [orders, products, recipes, ingredients, fixedCosts, latestMonthInOrders]);

    const renderProfitabilityTable = (data: (Product & { cost: number; profit: number; margin: number })[], title: string, isEditable: boolean, isExpandable: boolean) => (
        <div>
            <h4 className="text-md font-semibold text-gray-700 mb-2">{title}</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="p-3 font-semibold text-sm text-gray-600">Produto</th>
                            <th className="p-3 font-semibold text-sm text-gray-600">Custo</th>
                            <th className="p-3 font-semibold text-sm text-gray-600">Preço Venda</th>
                            <th className="p-3 font-semibold text-sm text-gray-600">Lucro (R$)</th>
                            <th className="p-3 font-semibold text-sm text-gray-600">Margem (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => (
                            <React.Fragment key={item.id}>
                                <tr className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            {isExpandable && (
                                                <button
                                                    onClick={() => setExpandedPizzaId(expandedPizzaId === item.id ? null : item.id)}
                                                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                                    title="Detalhar Custo"
                                                >
                                                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedPizzaId === item.id ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="p-3 text-red-600 font-semibold" onClick={() => { if(isEditable) { setEditingBeverageId(item.id); setEditingBeverageCost(item.cost.toString()); } }}>
                                         {isEditable && editingBeverageId === item.id ? (
                                            <input
                                                type="number"
                                                value={editingBeverageCost}
                                                onChange={(e) => setEditingBeverageCost(e.target.value)}
                                                onBlur={() => handleBeverageCostBlur(item)}
                                                onKeyDown={(e) => handleKeyDown(e, () => handleBeverageCostBlur(item))}
                                                className="w-full p-1 border border-brand-orange rounded-md"
                                                autoFocus
                                            />
                                        ) : `R$ ${item.cost.toFixed(2)}`}
                                    </td>
                                    <td className="p-3 text-green-600 font-semibold">R$ {item.price.toFixed(2)}</td>
                                    <td className="p-3 text-brand-orange font-bold">R$ {item.profit.toFixed(2)}</td>
                                    <td className="p-3 font-bold text-p-d-olive">{item.margin.toFixed(1)}%</td>
                                </tr>
                                {isExpandable && expandedPizzaId === item.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan={5} className="p-2">
                                            <div className="p-3 bg-white border border-gray-200 rounded-md">
                                                <h5 className="font-semibold text-sm mb-2 text-gray-700">Detalhamento de Custo para {item.name}:</h5>
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="p-2 font-semibold text-gray-600">Ingrediente</th>
                                                            <th className="p-2 font-semibold text-gray-600">Qtd. na Receita</th>
                                                            <th className="p-2 font-semibold text-gray-600">Custo do Ingrediente</th>
                                                            <th className="p-2 font-semibold text-gray-600">Custo na Pizza</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {recipes[item.id]?.map(part => {
                                                            const ingredient = ingredients.find(i => i.id === part.ingredientId);
                                                            if (!ingredient) return null;
                                                            const quantityInCostUnit = convertUnits(part.quantity, part.unit, ingredient.unit);
                                                            const costInPizza = quantityInCostUnit * ingredient.costPerUnit;
                                                            return (
                                                                <tr key={part.ingredientId} className="border-t">
                                                                    <td className="p-2 text-gray-800">{ingredient.name}</td>
                                                                    <td className="p-2 text-gray-600">{part.quantity} {part.unit}</td>
                                                                    <td className="p-2 text-gray-600">R$ {ingredient.costPerUnit.toFixed(2)} / {ingredient.unit}</td>
                                                                    <td className="p-2 font-semibold text-red-600">R$ {costInPizza.toFixed(2)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                        <tr className="border-t-2 border-gray-300 bg-gray-100">
                                                            <td colSpan={3} className="p-2 font-bold text-right text-gray-800">Custo Total da Pizza:</td>
                                                            <td className="p-2 font-bold text-red-700">R$ {item.cost.toFixed(2)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                <button
                    onClick={() => setActiveTab('geral')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'geral' ? 'bg-brand-orange text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <FileText size={18} /> Gestão de Custos
                </button>
                <button
                    onClick={() => setActiveTab('lucratividade')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'lucratividade' ? 'bg-brand-orange text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <TrendingUp size={18} /> Relatórios de Lucratividade
                </button>
            </div>

            {activeTab === 'lucratividade' ? (
                <ProfitabilityReport 
                    products={products}
                    recipes={recipes}
                    ingredients={ingredients}
                    fixedCosts={fixedCosts}
                    orders={orders}
                />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Custos Fixos Mensais" value={`R$ ${monthlyCosts.totalFixedCosts.toFixed(2)}`} change="" changeType="decrease" icon={<CostsIcon />} />
                        <StatCard title="Custo com Matéria-Prima (Mês)" value={`R$ ${monthlyCosts.rawMaterialCost.toFixed(2)}`} change="" changeType="decrease" icon={<CostsIcon />} />
                        <StatCard title="Custo Total (Mês)" value={`R$ ${monthlyCosts.totalMonthlyCost.toFixed(2)}`} change="" changeType="decrease" icon={<CostsIcon />} />
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-brand-orange">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 line-clamp-1">
                                    <Bot className="text-brand-orange" /> Lançamento de Custos via IA
                                </h3>
                                <p className="text-sm text-gray-500">Envie suas notas fiscais e contas (PDF, JPG, PNG) para atualizar custos e estoque automaticamente.</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileChangeForAnalysis} className="hidden" multiple />
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={isAnalyzing} 
                                className="bg-brand-orange text-white px-8 py-3 rounded-xl font-black flex items-center gap-3 hover:bg-orange-600 transition-all disabled:bg-gray-400 shadow-lg shadow-orange-100 hover:shadow-orange-200"
                            >
                                {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Upload />}
                                {isAnalyzing ? analysisMessage : 'Carregar Documentos da Pizzaria'}
                            </button>
                        </div>
                    </div>
                
                {/* Costs Breakdown Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold text-p-taupe mb-4">Detalhamento de Gastos (Mês de Referência)</h3>
                    <CostBreakdownChart data={monthlyCostBreakdownForChart} />
                </div>


                {/* Monthly Costs Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Custos Fixos Mensais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Descrição do Custo</label>
                            <input type="text" placeholder="Ex: Aluguel, Internet..." value={newFixedCost.name} onChange={e => setNewFixedCost({ ...newFixedCost, name: e.target.value })} className="w-full p-2 mt-1 border border-gray-300 bg-gray-50 text-gray-800 rounded-md" />
                        </div>
                        <div>
                             <label className="text-sm font-medium">Valor Mensal (R$)</label>
                            <input type="number" placeholder="Ex: 150.00" value={newFixedCost.value} onChange={e => setNewFixedCost({ ...newFixedCost, value: e.target.value })} className="w-full p-2 mt-1 border border-gray-300 bg-gray-50 text-gray-800 rounded-md" />
                        </div>
                        <button onClick={handleAddFixedCost} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 h-fit">Adicionar Custo</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Descrição</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Valor (R$)</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fixedCosts.map(cost => (
                                    <tr key={cost.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{cost.name}</td>
                                        <td className="p-3 text-gray-700" onClick={() => { setEditingFixedCostId(cost.id); setEditingFixedCostValue(cost.value.toString()); }}>
                                            {editingFixedCostId === cost.id ? (
                                                <input
                                                    type="number"
                                                    value={editingFixedCostValue}
                                                    onChange={(e) => setEditingFixedCostValue(e.target.value)}
                                                    onBlur={() => handleFixedCostBlur(cost)}
                                                    onKeyDown={(e) => handleKeyDown(e, () => handleFixedCostBlur(cost))}
                                                    className="w-full p-1 border border-brand-orange rounded-md"
                                                    autoFocus
                                                />
                                            ) : `R$ ${cost.value.toFixed(2)}`}
                                        </td>
                                        <td className="p-3 space-x-3">
                                            <button onClick={() => onRemoveFixedCost(cost.id)} className="text-brand-red hover:underline text-xs font-semibold">Remover</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Variable Costs Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Custo de Ingredientes (Matéria-Prima)</h3>
                     <p className="text-sm text-gray-500 mb-4">A lista de ingredientes é baseada no seu cardápio. Atualize os preços de compra para recalcular o custo de cada pizza. Clique no valor para editar.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedIngredients.map(ingredient => (
                            <div key={ingredient.id} className="p-3 border border-gray-200 rounded-md">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">{ingredient.name}</p>
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            <span className="text-brand-orange cursor-pointer" onClick={() => { setEditingIngredientId(ingredient.id); setEditingIngredientCost(ingredient.costPerUnit.toString()); }}>
                                                {editingIngredientId === ingredient.id ? (
                                                    <input
                                                        type="number"
                                                        value={editingIngredientCost}
                                                        onChange={(e) => setEditingIngredientCost(e.target.value)}
                                                        onBlur={() => handleIngredientCostBlur(ingredient)}
                                                        onKeyDown={(e) => handleKeyDown(e, () => handleIngredientCostBlur(ingredient))}
                                                        className="w-24 p-1 border border-brand-orange rounded-md"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : `R$ ${ingredient.costPerUnit.toFixed(2)}`}
                                            </span>
                                            <span className="text-gray-500 font-normal"> / </span>
                                            <UnitSelector ingredient={ingredient} onUnitChange={onUpdateIngredientUnit} />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Estoque: {ingredient.stock.toFixed(ingredient.unit === 'un' ? 0 : 2)} {ingredient.unit}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Profitability Analysis Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Análise de Custo e Lucratividade</h3>
                    <div className="space-y-6">
                        {renderProfitabilityTable(pizzaProfitabilityData, "Pizzas", false, true)}
                        {beverageProfitability.length > 0 && renderProfitabilityTable(beverageProfitability, "Bebidas", true, false)}
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default Costs;