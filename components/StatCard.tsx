import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon }) => {
    const isIncrease = changeType === 'increase';
    const changeColor = isIncrease ? 'text-brand-lime' : 'text-brand-red';
    
    return (
        <div className="bg-white p-5 rounded-2xl shadow-lg transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300 flex items-center space-x-4">
            <div className="bg-brand-orange/10 p-3 rounded-full">
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-medium text-gray-500 truncate">{title}</h4>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                {change && (
                    <div className="flex items-center mt-1">
                        <span className={`text-xs font-semibold ${changeColor}`}>{change}</span>
                        <span className="text-xs text-gray-500 ml-1.5">vs ontem</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StatCard;