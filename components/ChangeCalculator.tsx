import React, { useState, useEffect, useMemo } from 'react';

interface ChangeCalculatorProps {
    totalAmount: number;
    onReceivedAmountChange: (amount: number) => void;
}

const ChangeCalculator: React.FC<ChangeCalculatorProps> = ({ totalAmount, onReceivedAmountChange }) => {
    // State for the direct input field
    const [receivedAmountStr, setReceivedAmountStr] = useState('');

    // When the input string changes, update the parent component
    useEffect(() => {
        const amount = parseFloat(receivedAmountStr);
        onReceivedAmountChange(isNaN(amount) ? 0 : amount);
    }, [receivedAmountStr, onReceivedAmountChange]);

    // If the total amount changes (e.g., order is modified), clear the input
    useEffect(() => {
        setReceivedAmountStr('');
    }, [totalAmount]);

    // Calculate change due
    const receivedAmount = parseFloat(receivedAmountStr) || 0;
    const changeDue = receivedAmount - totalAmount;

    // Generate practical quick value suggestions
    const quickValues = useMemo(() => {
        const values = new Set<number>();
        
        // 1. Exact amount
        if (totalAmount > 0) {
            values.add(parseFloat(totalAmount.toFixed(2)));
        }

        // 2. Next round numbers based on bills
        if (totalAmount > 0 && totalAmount < 50) values.add(50);
        if (totalAmount > 0 && totalAmount < 100) values.add(100);
        if (totalAmount > 0 && totalAmount < 200) values.add(200);

        // 3. Next logical multiple of 10
        const nextTen = Math.ceil(totalAmount / 10) * 10;
        if (nextTen > totalAmount) {
            values.add(nextTen);
        }

        // Return a sorted array of unique values
        return Array.from(values).sort((a, b) => a - b).slice(0, 5); // Limit to 5 suggestions
    }, [totalAmount]);

    const handleQuickSet = (value: number) => {
        setReceivedAmountStr(value.toFixed(2));
    };

    return (
        <div className="p-3 border border-gray-200 rounded-md bg-gray-50/50 space-y-3">
            {/* Display Area */}
            <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                <div>
                    <span className="text-xs text-gray-500">Total a Pagar</span>
                    <p className="font-bold text-lg text-gray-800">R$ {totalAmount.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-500">Troco</span>
                    <p className={`font-bold text-lg ${changeDue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        R$ {changeDue > 0 ? changeDue.toFixed(2) : '0.00'}
                    </p>
                </div>
            </div>

            {/* Input and Quick Buttons */}
            <div>
                <label htmlFor="received-amount-input" className="block text-sm font-medium text-gray-700 mb-1">Valor Recebido (R$)</label>
                <div className="flex items-center gap-2">
                    <input
                        id="received-amount-input"
                        type="number"
                        value={receivedAmountStr}
                        onChange={e => setReceivedAmountStr(e.target.value)}
                        placeholder="0.00"
                        className="flex-grow p-2 text-lg font-semibold bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                        aria-label="Valor Recebido"
                    />
                     <button
                        type="button"
                        onClick={() => setReceivedAmountStr('')}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-300"
                        aria-label="Limpar valor recebido"
                    >
                        Limpar
                    </button>
                </div>
            </div>
            
            {/* Quick value suggestions */}
            {totalAmount > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-500 self-center mr-2">Sugestões:</span>
                    {quickValues.map(value => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleQuickSet(value)}
                            className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-colors"
                        >
                        R$ {value.toFixed(2)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChangeCalculator;
