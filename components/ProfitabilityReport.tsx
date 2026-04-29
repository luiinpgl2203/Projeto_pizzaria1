import React, { useMemo } from 'react';
import { Product, Recipe, Ingredient, FixedCost, Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface ProfitabilityReportProps {
    products: Product[];
    recipes: Recipe;
    ingredients: Ingredient[];
    fixedCosts: FixedCost[];
    orders: Order[];
}

const ProfitabilityReport: React.FC<ProfitabilityReportProps> = ({ products, recipes, ingredients, fixedCosts, orders }) => {
    
    const calculateProductUnitCost = (productId: number) => {
        const recipe = recipes[productId];
        if (!recipe) return 0;
        
        return recipe.reduce((total, part) => {
            const ingredient = ingredients.find(i => i.id === part.ingredientId);
            if (!ingredient) return total;
            
            // Basic conversion logic (simplified for report)
            let cost = ingredient.costPerUnit * part.quantity;
            return total + cost;
        }, 0);
    };

    const profitabilityData = useMemo(() => {
        return products.map(product => {
            const unitCost = calculateProductUnitCost(product.id);
            const price = product.price;
            const margin = price - unitCost;
            const marginPercentage = price > 0 ? (margin / price) * 100 : 0;
            
            // Calculate total sales for this product
            const unitsSold = orders.reduce((total, order) => {
                if (order.status === 'Cancelado') return total;
                const productItems = order.items.filter(item => item.productId === product.id);
                return total + productItems.length;
            }, 0);

            return {
                name: product.name,
                cost: unitCost,
                price: price,
                margin: margin,
                marginPercentage: marginPercentage,
                unitsSold: unitsSold,
                totalProfit: margin * unitsSold
            };
        }).sort((a, b) => b.totalProfit - a.totalProfit);
    }, [products, recipes, ingredients, orders]);

    const totalRevenue = useMemo(() => orders.reduce((sum, o) => o.status !== 'Cancelado' ? sum + o.total : sum, 0), [orders]);
    const totalFixedCosts = useMemo(() => fixedCosts.reduce((sum, c) => sum + c.value, 0), [fixedCosts]);

    return (
        <div className="space-y-8 pb-12 animate-fade-in">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Produto Mais Lucrativo (Total)</p>
                    <h4 className="text-2xl font-black text-gray-800 mt-1">{profitabilityData[0]?.name || '---'}</h4>
                    <p className="text-sm text-green-600 font-bold">R$ {profitabilityData[0]?.totalProfit.toLocaleString('pt-BR') || '0,00'} acumulado</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Melhor Margem Unitária (%)</p>
                    <h4 className="text-2xl font-black text-gray-800 mt-1">
                        {[...profitabilityData].sort((a,b) => b.marginPercentage - a.marginPercentage)[0]?.name || '---'}
                    </h4>
                    <p className="text-sm text-blue-600 font-bold">
                        {[...profitabilityData].sort((a,b) => b.marginPercentage - a.marginPercentage)[0]?.marginPercentage.toFixed(1) || '0'}% de margem
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ponto de Equilíbrio (Mensal)</p>
                    <h4 className="text-2xl font-black text-gray-800 mt-1">R$ {totalFixedCosts.toLocaleString('pt-BR')}</h4>
                    <p className="text-sm text-gray-500">Custo fixo base para operação</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Lucro Total por Produto (Ranking)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profitabilityData.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Bar dataKey="totalProfit" fill="#f97316" radius={[0, 4, 4, 0]}>
                                    {profitabilityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#ea580c' : '#f97316'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Composição de Preço: Custo vs Margem</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profitabilityData.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="cost" name="Custo Produção" stackId="a" fill="#94a3b8" />
                                <Bar dataKey="margin" name="Margem Bruta" stackId="a" fill="#22c55e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Table Detail */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">Detalhamento de Rentabilidade</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Produto</th>
                                <th className="p-4">Preço Venda</th>
                                <th className="p-4">Custo Unit.</th>
                                <th className="p-4">Margem R$</th>
                                <th className="p-4">Margem %</th>
                                <th className="p-4">Vendidos</th>
                                <th className="p-4 text-right">Lucro Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {profitabilityData.map((item, index) => (
                                <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-bold text-gray-700">{item.name}</td>
                                    <td className="p-4 text-gray-600">R$ {item.price.toFixed(2)}</td>
                                    <td className="p-4 text-red-500 font-medium">R$ {item.cost.toFixed(2)}</td>
                                    <td className="p-4 text-green-600 font-bold">R$ {item.margin.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-black ${
                                            item.marginPercentage > 50 ? 'bg-green-100 text-green-700' :
                                            item.marginPercentage > 30 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {item.marginPercentage.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-center">{item.unitsSold}</td>
                                    <td className="p-4 text-right text-brand-orange font-black text-lg">R$ {item.totalProfit.toLocaleString('pt-BR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProfitabilityReport;
