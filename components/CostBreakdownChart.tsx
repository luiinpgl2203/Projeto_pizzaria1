import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface CostItem {
    name: string;
    value: number;
}

interface CostBreakdownChartProps {
    data: {
        rawMaterialCosts: CostItem[];
        fixedCosts: CostItem[];
    };
}

const renderCustomizedLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  const formattedValue = `R$${value.toFixed(2)}`;

  // If bar is too small for text to fit inside, render label outside with dark color
  if (width < 65) {
    return (
      <text
        x={x + width + 5}
        y={y + height / 2}
        fill="#5C5246" // p-d-olive
        textAnchor="start"
        dominantBaseline="middle"
        className="text-xs font-semibold"
      >
        {formattedValue}
      </text>
    );
  }

  // Otherwise, render label inside with white color for better contrast
  return (
    <text
      x={x + width - 10}
      y={y + height / 2}
      fill="#fff"
      textAnchor="end"
      dominantBaseline="middle"
      className="text-xs font-semibold"
    >
      {formattedValue}
    </text>
  );
};


const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ data }) => {
    if (!data || (data.rawMaterialCosts.length === 0 && data.fixedCosts.length === 0)) {
        return (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
                Nenhum dado de detalhamento de custo para exibir.
            </div>
        );
    }
    
    const sortedRawMaterials = [...data.rawMaterialCosts].sort((a, b) => a.value - b.value);
    const sortedFixedCosts = [...data.fixedCosts].sort((a, b) => a.value - b.value);
    
    const chartHeight = (data.rawMaterialCosts.length + data.fixedCosts.length) * 35 + 80;

    return (
        <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer>
                <BarChart
                    layout="vertical"
                    data={[...sortedFixedCosts, ...sortedRawMaterials]}
                    margin={{ top: 5, right: 90, left: 80, bottom: 5 }} // Increased right margin for labels
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#5C5246" 
                        width={150} 
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(234, 29, 44, 0.1)' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']}
                    />
                    <Bar dataKey="value" fill="#EA1D2C" barSize={25} radius={[0, 4, 4, 0]}>
                       <LabelList dataKey="value" content={renderCustomizedLabel} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CostBreakdownChart;