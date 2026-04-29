import React, { useMemo, useState } from 'react';
import { Order, User, Motoboy } from '../types';
import LogoutIcon from './icons/LogoutIcon';
import { FaMapMarkedAlt } from 'react-icons/fa';

interface MotoboyDashboardProps {
    orders: Order[];
    motoboy: Motoboy | undefined;
    onConfirmDelivery: (orderId: string, motoboyId: number) => void;
    onUpdateMotoboy: (motoboyId: number, updates: Partial<Motoboy>) => void;
    currentUser: User;
    onLogout: () => void;
}

const PIZZERIA_ADDRESS_URL = "Pizzaria+Funchal,+S%C3%A3o+Paulo";

const MotoboyDashboard: React.FC<MotoboyDashboardProps> = ({ orders, motoboy, onConfirmDelivery, onUpdateMotoboy, currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [historyStartDate, setHistoryStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyEndDate, setHistoryEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const assignedOrders = useMemo(() => 
        motoboy ? motoboy.assignedOrderIds.map(id => orders.find(o => o.id === id)).filter(Boolean) as Order[] : [],
    [orders, motoboy]);

    const historyDeliveries = useMemo(() => {
        if (!motoboy || !historyStartDate || !historyEndDate) return [];
        const start = new Date(historyStartDate + 'T00:00:00');
        const end = new Date(historyEndDate + 'T23:59:59');
        
        return orders.filter(o => {
            const orderDate = new Date(o.date);
            return o.deliveredByMotoboyId === motoboy.id &&
                   orderDate >= start && orderDate <= end;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, motoboy, historyStartDate, historyEndDate]);


    const handleNavigate = (order: Order) => {
        if (order.address) {
            const destination = encodeURIComponent(order.address);
            const url = `https://www.google.com/maps/dir/?api=1&origin=${PIZZERIA_ADDRESS_URL}&destination=${destination}&travelmode=motorcycle`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleConfirmDelivery = (orderId: string) => {
        if (motoboy) {
            onConfirmDelivery(orderId, motoboy.id);
            const remainingOrderIds = motoboy.assignedOrderIds.filter(id => id !== orderId);
            onUpdateMotoboy(motoboy.id, { 
                assignedOrderIds: remainingOrderIds,
                // If this was the last delivery, start returning
                status: remainingOrderIds.length > 0 ? 'Em Entrega' : 'Retornando'
            });
        }
    };

    if (!motoboy) {
        return (
             <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
                <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200 flex-shrink-0">
                    <h1 className="text-xl font-bold text-gray-800">Painel do Entregador</h1>
                     <div className="flex items-center">
                        <div className="text-right mr-4">
                            <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{currentUser.role}</p>
                        </div>
                        <button onClick={onLogout} className="text-gray-500 hover:text-brand-red" title="Sair">
                            <LogoutIcon />
                        </button>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-red-500">Erro: Dados do motoboy não encontrados.</p>
                </main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
             <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200 flex-shrink-0">
                <div>
                     <h1 className="text-xl font-bold text-gray-800">Painel do Entregador</h1>
                     <p className="text-sm text-gray-500">Bem-vindo, {currentUser.name}!</p>
                </div>
                 <div className="flex items-center">
                    <div className="text-right mr-4">
                        <p className="text-sm font-semibold text-gray-800">{motoboy.name}</p>
                        <p className={`text-xs font-bold ${motoboy.status === 'Livre' ? 'text-green-600' : 'text-orange-600'}`}>{motoboy.status}</p>
                    </div>
                    <button onClick={onLogout} className="text-gray-500 hover:text-brand-red" title="Sair">
                        <LogoutIcon />
                    </button>
                 </div>
            </header>
            
            <div className="border-b border-gray-200 flex-shrink-0 bg-white">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`px-4 py-3 font-semibold text-sm focus:outline-none transition-colors duration-200 ${
                        activeTab === 'current'
                            ? 'border-b-2 border-brand-orange text-brand-orange'
                            : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    Entregas Atuais ({assignedOrders.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-3 font-semibold text-sm focus:outline-none transition-colors duration-200 ${
                        activeTab === 'history'
                            ? 'border-b-2 border-brand-orange text-brand-orange'
                            : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    Histórico
                </button>
            </div>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {activeTab === 'current' ? (
                     assignedOrders.length > 0 ? (
                        <div className="space-y-4">
                            {assignedOrders.map(order => (
                                <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-brand-orange">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-lg font-bold">Pedido #{order.id}</h2>
                                            <p className="text-gray-600">{order.address}</p>
                                        </div>
                                        <button onClick={() => handleNavigate(order)} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600">
                                            <FaMapMarkedAlt /> Navegar
                                        </button>
                                    </div>
                                    <div className="mt-3 pt-3 border-t">
                                         <p><strong>Cliente:</strong> {order.customerName}</p>
                                         <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                                         <p><strong>Pagamento:</strong> {order.paymentMethod}</p>
                                         {order.changeFor && <p className="text-red-600 font-bold">Levar troco para R$ {order.changeFor.toFixed(2)}</p>}
                                    </div>
                                     <div className="mt-4">
                                        <button 
                                            onClick={() => handleConfirmDelivery(order.id)}
                                            className="w-full bg-brand-lime text-green-900 font-bold py-2 rounded-md hover:bg-green-500"
                                        >
                                            Confirmar Entrega
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 pt-16">
                            <h2 className="text-2xl font-semibold">Nenhuma entrega no momento!</h2>
                            <p>Aguarde novos pedidos serem atribuídos a você.</p>
                        </div>
                    )
                ) : (
                    <>
                         <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex justify-between items-center flex-wrap gap-4">
                            <h3 className="text-lg font-semibold text-gray-700">Filtrar Histórico por Data</h3>
                            <div className="flex items-center gap-4">
                                <div>
                                    <label htmlFor="history-start-date" className="text-sm font-medium text-gray-700 mr-2">De:</label>
                                    <input
                                        type="date"
                                        id="history-start-date"
                                        value={historyStartDate}
                                        onChange={(e) => setHistoryStartDate(e.target.value)}
                                        className="p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="history-end-date" className="text-sm font-medium text-gray-700 mr-2">Até:</label>
                                    <input
                                        type="date"
                                        id="history-end-date"
                                        value={historyEndDate}
                                        onChange={(e) => setHistoryEndDate(e.target.value)}
                                        className="p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                                    />
                                </div>
                            </div>
                        </div>

                         {historyDeliveries.length > 0 ? (
                            <div className="space-y-3">
                                {historyDeliveries.map(order => (
                                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-green-500 opacity-80">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">Pedido #{order.id}</p>
                                                <p className="text-xs text-gray-500">{order.address}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">R$ {order.total.toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 pt-16">
                                <h2 className="text-xl font-semibold">Nenhuma entrega encontrada.</h2>
                                <p>Não há entregas finalizadas para o período selecionado.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default MotoboyDashboard;