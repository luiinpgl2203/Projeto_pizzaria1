import React, { useState, useMemo } from 'react';
import { Ingredient, FixedCost, AnalysisResult, ConfirmedUpdate } from '../types';

interface CostAnalysisConfirmationModalProps {
    analysisResult: AnalysisResult;
    ingredients: Ingredient[];
    fixedCosts: FixedCost[];
    onClose: () => void;
    onConfirm: (updates: ConfirmedUpdate) => void;
}

const CostAnalysisConfirmationModal: React.FC<CostAnalysisConfirmationModalProps> = ({ analysisResult, ingredients, fixedCosts, onClose, onConfirm }) => {

    const initialIngredientMapping = useMemo(() => {
        return analysisResult.parsedIngredients.map((item, index) => {
            // Simple fuzzy match
            const bestMatch = ingredients.find(ing => ing.name.toLowerCase().includes(item.detectedName.split(' ')[0].toLowerCase()));
            return {
                ...item,
                key: `${item.detectedName}-${index}`,
                selected: true,
                systemIngredientId: bestMatch ? bestMatch.id.toString() : '',
            };
        });
    }, [analysisResult.parsedIngredients, ingredients]);

    const initialFixedCostMapping = useMemo(() => {
        return analysisResult.parsedFixedCosts.map((item, index) => {
            const bestMatch = fixedCosts.find(fc => fc.name.toLowerCase() === item.costType.toLowerCase());
            return {
                ...item,
                key: `${item.costType}-${index}`,
                selected: true,
                systemCostId: bestMatch ? bestMatch.id.toString() : '',
            };
        });
    }, [analysisResult.parsedFixedCosts, fixedCosts]);

    const [ingredientMappings, setIngredientMappings] = useState(initialIngredientMapping);
    const [fixedCostMappings, setFixedCostMappings] = useState(initialFixedCostMapping);

    const handleIngredientChange = (key: string, field: 'selected' | 'systemIngredientId', value: boolean | string) => {
        setIngredientMappings(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
    };

    const handleFixedCostChange = (key: string, field: 'selected' | 'systemCostId', value: boolean | string) => {
        setFixedCostMappings(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
    };

    const handleSubmit = () => {
        const updates: ConfirmedUpdate = {
            ingredientUpdates: [],
            fixedCostUpdates: [],
        };

        ingredientMappings.forEach(item => {
            if (item.selected && item.systemIngredientId) {
                updates.ingredientUpdates.push({
                    systemIngredientId: parseInt(item.systemIngredientId),
                    newCost: item.pricePerUnit,
                    quantityToAdd: item.quantity,
                });
            }
        });

        fixedCostMappings.forEach(item => {
            if (item.selected && item.systemCostId) {
                updates.fixedCostUpdates.push({
                    systemCostId: parseInt(item.systemCostId),
                    newValue: item.value,
                });
            }
        });

        if(updates.ingredientUpdates.length === 0 && updates.fixedCostUpdates.length === 0) {
            alert("Nenhuma atualização válida foi selecionada ou mapeada. Por favor, revise os itens.");
            return;
        }

        onConfirm(updates);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl text-gray-800 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-gray-200 p-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">Confirmar Lançamentos do Arquivo</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Ingredients Section */}
                    {ingredientMappings.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-gray-700 mb-2">Matéria-Prima / Ingredientes</h4>
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50"><tr className="border-b"><th className="p-2">Lançar?</th><th className="p-2">Item Detectado (Nota Fiscal)</th><th className="p-2">Mapear para Ingrediente do Sistema</th><th className="p-2">Novo Custo/Un.</th><th className="p-2">Qtd. a Adicionar</th></tr></thead>
                                    <tbody>
                                        {ingredientMappings.map(item => (
                                            <tr key={item.key} className="border-b last:border-b-0 hover:bg-gray-50">
                                                <td className="p-2 text-center"><input type="checkbox" checked={item.selected} onChange={e => handleIngredientChange(item.key, 'selected', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" /></td>
                                                <td className="p-2">{item.detectedName}</td>
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <select
                                                            value={item.systemIngredientId}
                                                            onChange={e => handleIngredientChange(item.key, 'systemIngredientId', e.target.value)}
                                                            className="appearance-none block w-full p-1 pr-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                                                        >
                                                            <option value="">Selecione...</option>
                                                            {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-brand-orange font-semibold">R$ {item.pricePerUnit.toFixed(2)}</td>
                                                <td className="p-2">{item.quantity} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* Fixed Costs Section */}
                    {fixedCostMappings.length > 0 && (
                         <div>
                            <h4 className="text-md font-semibold text-gray-700 mb-2">Contas / Custos Fixos</h4>
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                                <table className="w-full text-left text-sm">
                                     <thead className="bg-gray-50"><tr className="border-b"><th className="p-2">Lançar?</th><th className="p-2">Tipo de Custo Detectado</th><th className="p-2">Mapear para Custo do Sistema</th><th className="p-2">Novo Valor (R$)</th></tr></thead>
                                     <tbody>
                                         {fixedCostMappings.map(item => (
                                            <tr key={item.key} className="border-b last:border-b-0 hover:bg-gray-50">
                                                <td className="p-2 text-center"><input type="checkbox" checked={item.selected} onChange={e => handleFixedCostChange(item.key, 'selected', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" /></td>
                                                <td className="p-2">{item.costType}</td>
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <select
                                                            value={item.systemCostId}
                                                            onChange={e => handleFixedCostChange(item.key, 'systemCostId', e.target.value)}
                                                            className="appearance-none block w-full p-1 pr-10 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                                                        >
                                                            <option value="">Selecione...</option>
                                                            {fixedCosts.map(fc => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-brand-orange font-semibold">R$ {item.value.toFixed(2)}</td>
                                            </tr>
                                         ))}
                                     </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg flex-shrink-0">
                    <p className="text-xs text-gray-500 flex-1 my-auto">Revise os mapeamentos e desmarque os itens que não deseja importar. Os custos e o estoque serão atualizados.</p>
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Aprovar e Lançar</button>
                </div>
            </div>
        </div>
    );
};

export default CostAnalysisConfirmationModal;