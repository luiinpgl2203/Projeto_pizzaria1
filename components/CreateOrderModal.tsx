





import React, { useState, useEffect } from 'react';
import { Product, OrderItem, PaymentMethod, NewOrderData, Addon } from '../types';

interface CreateOrderModalProps {
    products: Product[];
    addons: Addon[];
    onClose: () => void;
    onCreateOrder: (orderData: NewOrderData) => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ products, addons, onClose, onCreateOrder }) => {
    const [orderType, setOrderType] = useState<'Entrega' | 'Mesa' | 'Retirada'>('Entrega');
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [items, setItems] = useState<OrderItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id.toString() || '');
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro');
    const [observation, setObservation] = useState('');
    const [changeFor, setChangeFor] = useState('');

    useEffect(() => {
        if (paymentMethod !== 'Dinheiro') {
            setChangeFor('');
        }
    }, [paymentMethod]);

    const handleAddItem = () => {
        const product = products.find(p => p.id.toString() === selectedProductId);
        if (!product || quantity <= 0) return;

        const newItem: OrderItem = {
            productId: product.id,
            name: product.name,
            quantity: quantity,
            price: product.price,
            addons: [],
        };
        setItems([...items, newItem]);
        setQuantity(1);
    };

    const handleRemoveItem = (itemIndex: number) => {
        setItems(items.filter((_, index) => index !== itemIndex));
    };

    const handleAddonToItem = (itemIndex: number, addon: Addon) => {
        const updatedItems = [...items];
        const currentItem = updatedItems[itemIndex];
        if (!currentItem.addons) {
            currentItem.addons = [];
        }
        if (!currentItem.addons.some(a => a.id === addon.id)) {
            currentItem.addons.push(addon);
            setItems(updatedItems);
        }
    };

    const handleRemoveAddonFromItem = (itemIndex: number, addonId: number) => {
        const updatedItems = [...items];
        const currentItem = updatedItems[itemIndex];
        if (currentItem.addons) {
            currentItem.addons = currentItem.addons.filter(a => a.id !== addonId);
            setItems(updatedItems);
        }
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const itemPrice = item.price;
            const addonsPrice = (item.addons || []).reduce((addonAcc, addon) => addonAcc + addon.price, 0);
            return acc + (itemPrice + addonsPrice) * item.quantity;
        }, 0);
    };

    const handleSubmit = () => {
        if (orderType === 'Entrega' && (!customerName || !address)) {
            alert("Para entrega, o nome do cliente e o endereço são obrigatórios.");
            return;
        }
        if (orderType === 'Mesa' && !tableNumber) {
            alert("Para pedido na mesa, o número da mesa/comanda é obrigatório.");
            return;
        }
         if (orderType === 'Retirada' && !customerName) {
            alert("Para retirada, o nome do cliente é obrigatório.");
            return;
        }
        if (items.length === 0) {
            alert("Adicione pelo menos um item ao pedido.");
            return;
        }

        const orderData: NewOrderData = {
            customerName: orderType === 'Mesa' ? `Mesa ${tableNumber}` : customerName,
            items,
            paymentMethod: orderType !== 'Mesa' ? paymentMethod : undefined,
            observation,
            orderType,
            address: orderType === 'Entrega' ? address : undefined,
            postalCode: orderType === 'Entrega' ? postalCode : undefined,
            tableNumber: orderType === 'Mesa' ? tableNumber : undefined,
            changeFor: (orderType !== 'Mesa' && changeFor) ? parseFloat(changeFor) : undefined,
        };

        onCreateOrder(orderData);
        onClose();
    };
    
    const totalAmount = calculateTotal();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 text-gray-800 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3 flex-shrink-0">
                    <h3 className="text-xl font-bold">Criar Novo Pedido</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>

                <div className="mt-4 space-y-4 overflow-y-auto pr-2">
                    {/* Order Type Selector */}
                    <div className="flex border border-gray-300 rounded-md overflow-hidden">
                        <button 
                            onClick={() => setOrderType('Entrega')} 
                            className={`flex-1 p-2 text-sm font-semibold transition-colors ${orderType === 'Entrega' ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            🛵 Entrega
                        </button>
                        <button 
                            onClick={() => setOrderType('Retirada')}
                            className={`flex-1 p-2 text-sm font-semibold transition-colors ${orderType === 'Retirada' ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            🛍️ Retirada
                        </button>
                        <button 
                            onClick={() => setOrderType('Mesa')}
                            className={`flex-1 p-2 text-sm font-semibold transition-colors ${orderType === 'Mesa' ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            🍽️ Mesa / Comanda
                        </button>
                    </div>

                    {/* Conditional Fields */}
                    {orderType === 'Entrega' && (
                        <div className="space-y-4 p-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
                                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Endereço Completo</label>
                                <input type="text" placeholder="Rua, Número, Bairro" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">CEP</label>
                                <input type="text" placeholder="00000-000" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange" />
                            </div>
                        </div>
                    )}

                    {orderType === 'Retirada' && (
                         <div className="p-1">
                            <label className="block text-sm font-medium text-gray-700">Nome do Cliente para Retirada</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange" />
                        </div>
                    )}
                    
                    {orderType === 'Mesa' && (
                        <div className="p-1">
                            <label className="block text-sm font-medium text-gray-700">Número da Mesa / Comanda</label>
                            <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange" />
                        </div>
                    )}

                    {/* Common Fields */}
                    {orderType !== 'Mesa' && (
                        <div className="space-y-4">
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
                                            onChange={e => setChangeFor(e.target.value)}
                                            placeholder="Ex: 100"
                                            className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                                        />
                                    </div>
                                    {parseFloat(changeFor) > 0 && parseFloat(changeFor) >= totalAmount && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center animate-pulse-bg">
                                            <span className="text-sm text-green-700">Troco a devolver:</span>
                                            <p className="font-bold text-lg text-green-800">
                                                R$ {(parseFloat(changeFor) - totalAmount).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}


                    <div className="border border-gray-200 p-4 rounded-md">
                        <h4 className="font-semibold mb-2">Adicionar Itens</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Produto</label>
                                <div className="relative mt-1">
                                    <select
                                        value={selectedProductId}
                                        onChange={e => setSelectedProductId(e.target.value)}
                                        className="appearance-none block w-full p-2 pr-10 bg-gray-50 border border-gray-300 text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                                    >
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Qtd.</label>
                                <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
                            </div>
                            <button onClick={handleAddItem} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 h-fit">Adicionar</button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mt-2 mb-2">Itens do Pedido</h4>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                             <table className="w-full text-left">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr><th className="p-2 font-semibold text-sm text-gray-600">Produto</th><th className="p-2 font-semibold text-sm text-gray-600">Qtd.</th><th className="p-2 font-semibold text-sm text-gray-600">Subtotal</th><th className="p-2 font-semibold text-sm text-gray-600">Ação</th></tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={`${item.productId}-${index}`} className="border-b border-gray-200 align-top">
                                            <td className="p-2 text-gray-800">
                                                {item.name}
                                                {item.addons && item.addons.length > 0 && (
                                                    <ul className="mt-1 text-xs text-blue-600 pl-1">
                                                        {item.addons.map(addon => (
                                                            <li key={addon.id} className="flex justify-between items-center">
                                                                <span>+ {addon.name}</span>
                                                                <button type="button" onClick={() => handleRemoveAddonFromItem(index, addon.id)} className="text-red-500 hover:text-red-700 font-bold ml-2 text-lg leading-none">&times;</button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </td>
                                            <td className="p-2 text-gray-800 text-center">{item.quantity}</td>
                                            <td className="p-2 text-gray-800">R$ {((item.price + (item.addons || []).reduce((a,c) => a + c.price, 0)) * item.quantity).toFixed(2)}</td>
                                            <td className="p-2">
                                                <div className="relative group inline-block">
                                                    <button type="button" className="text-brand-orange text-xs hover:underline font-semibold">Acréscimo</button>
                                                    <div className="absolute z-10 hidden group-hover:block bg-white shadow-lg rounded-md border w-48 right-0 mt-1">
                                                        {addons.map(addon => (
                                                            <a key={addon.id} onClick={() => handleAddonToItem(index, addon)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">{addon.name} (+ R$ {addon.price.toFixed(2)})</a>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-brand-red text-xs hover:underline font-semibold ml-2">Remover</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (<tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum item adicionado.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Observação</label>
                        <textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={2} placeholder="Ex: Sem cebola, ponto da carne, etc." className="mt-1 block w-full p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"></textarea>
                    </div>
                </div>

                <div className="flex-shrink-0 pt-4">
                     <div className="text-right font-bold text-xl text-brand-orange border-t border-gray-200 pt-2">
                        Total: R$ {totalAmount.toFixed(2)}
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSubmit} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Criar Pedido</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateOrderModal;