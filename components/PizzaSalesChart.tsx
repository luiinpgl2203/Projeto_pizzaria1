import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface PizzaSalesChartProps {
    data: { name: string; quantity: number }[];
}

const PizzaSalesChart: React.FC<PizzaSalesChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
                Nenhum dado de venda de pizza disponível para o período selecionado.
            </div>
        );
    }
    
    // Altura dinâmica baseada na quantidade de itens para evitar sobreposição
    const chartHeight = data.length * 40 + 60;

    return (
        <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer>
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 5, right: 60, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#8A817C" allowDecimals={false} />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#5C5246" 
                        width={150} 
                        tick={{ fontSize: 12 }}
                        interval={0}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255, 115, 0, 0.1)' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                        formatter={(value: number) => [value, 'Unidades Vendidas']}
                    />
                    <Bar dataKey="quantity" fill="#EA1D2C" barSize={25} radius={[0, 4, 4, 0]}>
                         <LabelList dataKey="quantity" position="right" style={{ fill: '#333', fontSize: 12, fontWeight: 'bold' }} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PizzaSalesChart;
