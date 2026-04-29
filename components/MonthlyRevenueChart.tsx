import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyRevenueChartProps {
    data: { name: string; Faturamento: number }[];
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#5C5246" />
                    <YAxis stroke="#5C5246" tickFormatter={(value: number) => `R$${value / 1000}k`} />
                    <Tooltip 
                         contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }} 
                         formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Faturamento" stroke="#FF7300" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyRevenueChart;
