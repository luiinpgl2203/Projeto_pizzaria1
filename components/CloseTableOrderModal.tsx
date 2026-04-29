


import React, { useState } from 'react';
import { Order, PaymentMethod } from '../types';

interface CloseTableOrderModalProps {
    order: Order;
    onClose: () => void;
    onConfirmClose: (orderId: string, paymentMethod: PaymentMethod, changeFor?: number) => void;
}

const CloseTableOrderModal: React.FC<CloseTableOrderModalProps> = ({ order, onClose, onConfirmClose }) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro');
    const [changeFor, setChangeFor] = useState('');

    const handleSubmit = () => {
        const changeValue = parseFloat(changeFor);
        if (paymentMethod === 'Dinheiro' && changeFor && changeValue < order.total) {
            alert("O valor do troco deve ser maior ou igual ao total do pedido.");
            return;
        }
        onConfirmClose(order.id, paymentMethod, changeFor ? changeValue : undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md text-gray-800">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-lg font-bold">Fechar Conta: {order.customerName}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-center">
                        <p className="text-gray-600">Total a Pagar</p>
                        <p className="text-4xl font-bold text-brand-orange">R$ {order.total.toFixed(2)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <div className="relative mt-1">
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="appearance-none block w-full p-2 pr-10 bg-gray-50 border border-gray-300 text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                            >
                                <option>Dinheiro</option>
                                <option>Cartão de Crédito</option>
                                <option>Cartão de Débito</option>
                                <option>Pix</option>
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    {paymentMethod === 'Dinheiro' && (
                        <div className="space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Troco para (R$)</label>
                                <input
                                    type="number"
                                    value={changeFor}
                                    onChange={(e) => setChangeFor(e.target.value)}
                                    placeholder={`Ex: ${Math.ceil(order.total)}`}
                                    className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                                />
                            </div>
                            {parseFloat(changeFor) > 0 && parseFloat(changeFor) >= order.total && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center animate-pulse-bg">
                                    <span className="text-sm text-green-700">Troco a devolver:</span>
                                    <p className="font-bold text-lg text-green-800">
                                        R$ {(parseFloat(changeFor) - order.total).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-brand-lime text-green-900 font-bold px-4 py-2 rounded-md hover:bg-green-500 transition-colors">
                        Confirmar Pagamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloseTableOrderModal;