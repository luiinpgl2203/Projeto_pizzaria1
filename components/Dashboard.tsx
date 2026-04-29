

import React, { useState, useMemo } from 'react';
import StatCard from './StatCard';
import SalesChart from './SalesChart';
import PaymentMethodsChart from './PaymentMethodsChart';
import TopProducts from './TopProducts';
import LeastSoldProducts from './LeastSoldProducts';
import MonthlyRevenueChart from './MonthlyRevenueChart';
import RevenueIcon from './icons/RevenueIcon';
import TotalOrdersIcon from './icons/TotalOrdersIcon';
import NewOrdersIcon from './icons/NewOrdersIcon';
import CostsIcon from './icons/CostsIcon';
import { Order, FixedCost, Ingredient, Product, Recipe } from '../types';
import { Page } from '../App';
import CostBreakdownChart from './CostBreakdownChart';
import PizzaSalesChart from './PizzaSalesChart';

interface DashboardProps {
    orders: Order[];
    fixedCosts: FixedCost[];
    ingredients: Ingredient[];
    products: Product[];
    recipes: Recipe;
    setCurrentPage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, fixedCosts, ingredients, products, recipes, setCurrentPage }) => {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);

    const [startDate, setStartDate] = useState(oneWeekAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const filteredOrders = useMemo(() => {
        if (!startDate || !endDate) return orders;
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= start && orderDate <= end;
        });
    }, [startDate, endDate, orders]);
    
    const completedOrders = useMemo(() => 
        filteredOrders.filter(o => o.status === 'Concluído'), 
    [filteredOrders]);

    const totalRevenue = completedOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = filteredOrders.length;
    const newOrders = filteredOrders.filter(o => o.status === 'Pendente').length;
    
    const productSalesData = useMemo(() => {
        const sales: { [productName: string]: { sales: number, totalValue: number } } = {};
        
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                if (!sales[item.name]) {
                    sales[item.name] = { sales: 0, totalValue: 0 };
                }
                sales[item.name].sales += item.quantity;
                sales[item.name].totalValue += item.quantity * item.price;
            });
        });

        return Object.entries(sales).map(([name, data]) => ({ name, ...data }));

    }, [completedOrders]);


    const categorySales = useMemo(() => {
        const categoryTotals: { [category: string]: number } = {};
        // This is a mock implementation as category is not on the order item.
        // A real implementation would require product details on order items.
        return [
            { name: 'Pizza Salgada', value: totalRevenue * 0.7 },
            { name: 'Bebida', value: totalRevenue * 0.2 },
            { name: 'Pizza Doce', value: totalRevenue * 0.1 },
        ];
    }, [totalRevenue]);

    
    // Aggregate by payment method
    const paymentMethodSales = completedOrders
        .reduce((acc, order) => {
            if (order.paymentMethod) {
                if (!acc[order.paymentMethod]) {
                    acc[order.paymentMethod] = 0;
                }
                acc[order.paymentMethod] += order.total;
            }
            return acc;
        }, {} as Record<string, number>);

    const paymentChartData = Object.keys(paymentMethodSales).map(key => ({
        name: key,
        value: paymentMethodSales[key]
    }));

    // Data for monthly revenue chart
    const monthlyRevenueData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }),
            Faturamento: 0,
        }));

        orders
            .filter(o => new Date(o.date).getFullYear() === currentYear && o.status === 'Concluído')
            .forEach(o => {
                const monthIndex = new Date(o.date).getMonth();
                months[monthIndex].Faturamento += o.total;
            });
        
        // Capitalize month names and remove period
        months.forEach(m => {
            m.name = m.name.charAt(0).toUpperCase() + m.name.slice(1).replace('.', '');
        });

        return months;
    }, [orders]);


    // --- NEW COST CALCULATION LOGIC ---
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

    const costsForPeriod = useMemo(() => {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        const numberOfDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const avgDaysInMonth = 30.44;

        // 1. Calculate Raw Material Costs for the period with breakdown
        const rawMaterialCostBreakdown: { [key: string]: number } = {};
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    if (product.category.includes('Pizza')) {
                        const recipe = recipes[product.id];
                        if (recipe) {
                            recipe.forEach(recipePart => {
                                const ingredient = ingredients.find(i => i.id === recipePart.ingredientId);
                                if (ingredient) {
                                    const quantityInPurchaseUnit = convertUnits(recipePart.quantity, recipePart.unit, ingredient.unit);
                                    const cost = (ingredient.costPerUnit * quantityInPurchaseUnit) * item.quantity;
                                    rawMaterialCostBreakdown[ingredient.name] = (rawMaterialCostBreakdown[ingredient.name] || 0) + cost;
                                }
                            });
                        }
                    }
                    if (product.cost) { // For items like beverages
                        const costName = `Compra ${product.name}`;
                        rawMaterialCostBreakdown[costName] = (rawMaterialCostBreakdown[costName] || 0) + (product.cost * item.quantity);
                    }
                }
            });
        });

        const rawMaterialCost = Object.values(rawMaterialCostBreakdown).reduce((acc, val) => acc + val, 0);

        // 2. Pro-rate Fixed Costs for the period
        const fixedCostBreakdown = fixedCosts.map(cost => ({
            name: cost.name,
            value: (cost.value / avgDaysInMonth) * numberOfDays,
        }));
        
        const totalFixedCost = fixedCostBreakdown.reduce((acc, cost) => acc + cost.value, 0);

        // 3. Total Costs
        const totalCost = rawMaterialCost + totalFixedCost;
        
        const breakdownForChart = {
            rawMaterialCosts: Object.entries(rawMaterialCostBreakdown).map(([name, value]) => ({ name, value })),
            fixedCosts: fixedCostBreakdown
        };

        return {
            rawMaterialCost,
            fixedCostBreakdown,
            totalFixedCost,
            totalCost,
            breakdownForChart,
        };
    }, [completedOrders, fixedCosts, products, ingredients, recipes, startDate, endDate]);

    // --- NET PROFIT CALCULATION ---
    const netProfit = totalRevenue - costsForPeriod.totalCost;

    // --- TOP AND LEAST SOLD PRODUCTS LOGIC ---
    const topProductsData = useMemo(() => 
        [...productSalesData].sort((a, b) => b.sales - a.sales).slice(0, 5), 
    [productSalesData]);

    const leastSoldProductsData = useMemo(() => {
        const topProductNames = new Set(topProductsData.map(p => p.name));
        const sortedByLeast = [...productSalesData].sort((a, b) => a.sales - b.sales);
        return sortedByLeast.filter(p => !topProductNames.has(p.name)).slice(0, 5);
    }, [productSalesData, topProductsData]);

    const pizzaSalesData = useMemo(() => {
        const sales: { [productName: string]: number } = {};
        
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && product.category.toLowerCase().includes('pizza')) {
                     if (!sales[item.name]) {
                        sales[item.name] = 0;
                    }
                    sales[item.name] += item.quantity;
                }
            });
        });
    
        return Object.entries(sales)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity);
    
    }, [completedOrders, products]);


    const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
    const dateRangeString = `${formatDate(startDate)} - ${formatDate(endDate)}`;

    return (
        <div className="space-y-8">
            <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-p-taupe">Análise de Período</h3>
                <div className="flex items-center gap-4">
                    <div>
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-700 mr-2">De:</label>
                        <input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="text-sm font-medium text-gray-700 mr-2">Até:</label>
                        <input
                            type="date"
                            id="end-date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                        />
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={`Faturamento Bruto (${dateRangeString})`} value={`R$ ${totalRevenue.toFixed(2)}`} change="" changeType="increase" icon={<RevenueIcon />} />
                <div onClick={() => setCurrentPage('Custos')} className="cursor-pointer" title="Clique para ver detalhes">
                    <StatCard title={`Custos Totais (${dateRangeString})`} value={`R$ ${costsForPeriod.totalCost.toFixed(2)}`} change="" changeType="decrease" icon={<CostsIcon />} />
                </div>
                <StatCard title={`Lucro Líquido (${dateRangeString})`} value={`R$ ${netProfit.toFixed(2)}`} change="" changeType={netProfit > 0 ? 'increase' : 'decrease'} icon={<RevenueIcon />} />
                <StatCard title={`Total de Pedidos (${dateRangeString})`} value={totalOrders.toString()} change="" changeType="increase" icon={<TotalOrdersIcon />} />
                <StatCard title="Novos Pedidos" value={newOrders.toString()} change="" changeType="decrease" icon={<NewOrdersIcon />} />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Side: Chart */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <h3 className="text-xl font-semibold text-p-taupe mb-4">Vendas por Categoria</h3>
                     <SalesChart data={categorySales} />
                </div>
                {/* Right Side: Top/Least Products & Payment Methods */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 space-y-8">
                     <TopProducts data={topProductsData} />
                     
                     <div className="pt-6 border-t border-gray-200">
                        <LeastSoldProducts data={leastSoldProductsData} />
                     </div>

                     <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-xl font-semibold text-p-taupe mb-4">Formas de Pagamento</h3>
                        <PaymentMethodsChart data={paymentChartData} />
                    </div>
                </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-p-taupe mb-4">Faturamento Mensal (Ano Atual)</h3>
                <MonthlyRevenueChart data={monthlyRevenueData} />
            </div>
            
             {/* Pizza Sales Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-p-taupe mb-4">Vendas de Pizzas por Sabor ({dateRangeString})</h3>
                <PizzaSalesChart data={pizzaSalesData} />
            </div>

            {/* Costs Breakdown Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-p-taupe mb-4">Detalhamento de Gastos no Período</h3>
                <CostBreakdownChart data={costsForPeriod.breakdownForChart} />
            </div>

        </div>
    );
}

export default Dashboard;