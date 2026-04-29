import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#FF7300', '#A2FF00', '#FF0014', '#FBBF24', '#4B5563'];

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        // FIX: Explicitly convert `percent` to a number to prevent type errors during arithmetic operations.
                        label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#374151' }} 
                        itemStyle={{ color: '#374151' }}
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`} 
                    />
                    <Legend wrapperStyle={{ color: '#374151' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;