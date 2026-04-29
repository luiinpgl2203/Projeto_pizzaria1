import React, { useMemo, useState } from 'react';
import { Order, User } from '../types';
import LogoutIcon from './icons/LogoutIcon';
import { Check, Bell } from 'lucide-react';

interface KDSProps {
    orders: Order[];
    onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
    currentUser?: User;
    onLogout?: () => void;
}

const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'Em Preparo': return 'border-yellow-500';
      case 'Pendente': return 'border-orange-500';
      case 'Pronto para Entrega': return 'border-green-500';
      default: return 'border-gray-300';
    }
};

const getOrderTypeDisplay = (order: Order) => {
    switch (order.orderType) {
        case 'Mesa': return `Mesa ${order.tableNumber}`;
        case 'Entrega': return 'Entrega';
        case 'Retirada': return 'Retirada';
        default: return 'Pedido';
    }
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; count: number }> = ({ label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm focus:outline-none transition-colors duration-200 relative ${
            isActive
                ? 'border-b-2 border-brand-orange text-brand-orange'
                : 'text-gray-500 hover:bg-gray-100'
        }`}
    >
        {label}
        {count > 0 && (
            <span className={`flex items-center justify-center rounded-full text-xs font-bold w-6 h-6 bg-gray-200 text-gray-700`}>
                {count}
            </span>
        )}
    </button>
);


const KDS: React.FC<KDSProps> = ({ orders, onUpdateOrderStatus, currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'producing' | 'ready' | 'history'>('producing');
    const [dismissedReadyOrders, setDismissedReadyOrders] = useState<string[]>([]);
    const [historyStartDate, setHistoryStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyEndDate, setHistoryEndDate] = useState(new Date().toISOString().split('T')[0]);


    const activeOrders = useMemo(() => 
        orders.filter(o => o.status === 'Pendente' || o.status === 'Em Preparo')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [orders]);

    const readyOrders = useMemo(() =>
        orders.filter(o =>
            o.status === 'Pronto para Entrega' &&
            !dismissedReadyOrders.includes(o.id)
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [orders, dismissedReadyOrders]);
    
    const historyOrders = useMemo(() => {
        if (!historyStartDate || !historyEndDate) return [];
        const start = new Date(historyStartDate + 'T00:00:00');
        const end = new Date(historyEndDate + 'T23:59:59');
        return orders.filter(o => {
            const orderDate = new Date(o.date);
            return (o.status === 'Concluído' || o.status === 'Cancelado') &&
                   orderDate >= start && orderDate <= end;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, historyStartDate, historyEndDate]);


    const handleUpdateStatus = (order: Order) => {
        const nextStatus = order.status === 'Pendente' ? 'Em Preparo' : 'Pronto para Entrega';
        onUpdateOrderStatus(order.id, nextStatus);
    };
    
    const renderProducingView = () => (
        activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeOrders.map(order => (
                    <div key={order.id} className={`bg-white rounded-lg shadow-md flex flex-col border-t-8 ${getStatusClass(order.status)}`}>
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-brand-orange">Pedido #{order.id}</h2>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${order.status === 'Pendente' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                {getOrderTypeDisplay(order)} - {new Date(order.date).toLocaleTimeString('pt-BR')}
                            </p>
                        </div>
                        <div className="p-4 flex-grow space-y-2">
                            <ul className="space-y-2">
                                {order.items.map((item, index) => (
                                    <li key={`${item.productId}-${index}`}>
                                        <div className="flex">
                                            <span className="font-bold mr-2">{item.quantity}x</span>
                                            <span className="text-gray-700">{item.name}</span>
                                        </div>
                                        {item.addons && item.addons.length > 0 && (
                                            <ul className="text-sm text-blue-700 font-semibold pl-6">
                                                {item.addons.map(addon => <li key={addon.id}>+ {addon.name}</li>)}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {order.observation && (
                                <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                                   <p className="text-sm font-semibold">Observação:</p>
                                   <p className="text-sm text-yellow-800">{order.observation}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 rounded-b-lg">
                            <button 
                                onClick={() => handleUpdateStatus(order)}
                                disabled={currentUser?.role !== 'Cozinha'}
                                className="w-full py-2 px-4 rounded-md text-white font-semibold transition-colors bg-brand-orange hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                title={currentUser?.role !== 'Cozinha' ? 'Apenas a equipe da Cozinha pode alterar o status' : ''}
                            >
                                {order.status === 'Pendente' ? 'Iniciar Preparo' : 'Finalizar Pedido'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bell className="w-24 h-24 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold">Tudo em ordem por aqui!</h2>
                <p>Nenhum pedido pendente ou em preparo no momento.</p>
            </div>
        )
    );

    const renderReadyView = () => (
         readyOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {readyOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow-md flex flex-col border-t-8 border-green-500">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-green-800">{getOrderTypeDisplay(order)}</h2>
                            <p className="text-sm text-gray-500">Pedido #{order.id} - Pronto às {new Date(order.date).toLocaleTimeString('pt-BR')}</p>
                        </div>
                         <div className="p-4 flex-grow">
                             <ul className="space-y-2">
                                {order.items.map((item, index) => (
                                    <li key={`${item.productId}-${index}`}>
                                        <div className="flex">
                                            <span className="font-bold mr-2">{item.quantity}x</span>
                                            <span className="text-gray-700">{item.name}</span>
                                        </div>
                                        {item.addons && item.addons.length > 0 && (
                                            <ul className="text-sm text-blue-700 font-semibold pl-6">
                                                {item.addons.map(addon => <li key={addon.id}>+ {addon.name}</li>)}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setDismissedReadyOrders(prev => [...prev, order.id])}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-green-900 font-bold transition-colors bg-brand-lime hover:bg-green-500"
                            >
                                <Check className="w-4 h-4" /> Marcar como Visto
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Check className="w-24 h-24 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold">Nenhum pedido pronto!</h2>
                <p>Quando um pedido for finalizado, ele aparecerá aqui.</p>
            </div>
        )
    );
    
    const renderHistoryView = () => (
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

            {historyOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {historyOrders.map(order => (
                        <div key={order.id} className={`bg-white rounded-lg shadow-sm flex flex-col border-t-4 ${order.status === 'Concluído' ? 'border-green-400' : 'border-red-400'} opacity-80`}>
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-md font-bold text-gray-700">Pedido #{order.id}</h2>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${order.status === 'Concluído' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {getOrderTypeDisplay(order)} - {new Date(order.date).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="p-4 flex-grow space-y-2 text-sm">
                                <ul className="space-y-1">
                                    {order.items.map((item, index) => (
                                        <li key={`${item.productId}-${index}`}>
                                            <div className="flex">
                                                <span className="font-semibold mr-2">{item.quantity}x</span>
                                                <span className="text-gray-600">{item.name}</span>
                                            </div>
                                             {item.addons && item.addons.length > 0 && (
                                                <ul className="text-xs text-blue-600 font-medium pl-6">
                                                    {item.addons.map(addon => <li key={addon.id}>+ {addon.name}</li>)}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-10">
                    <Check className="w-24 h-24 mb-4 text-gray-300" />
                    <h2 className="text-2xl font-semibold">Sem histórico para o período.</h2>
                    <p>Nenhum pedido foi concluído ou cancelado nas datas selecionadas.</p>
                </div>
            )}
       </>
    );
    
    return (
        <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
             <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200 flex-shrink-0">
                <div>
                     <h1 className="text-xl font-bold text-gray-800">Cozinha - KDS</h1>
                     {currentUser && <p className="text-sm text-gray-500">Operador: {currentUser.name}</p>}
                </div>
                 {onLogout && (
                    <button onClick={onLogout} className="text-gray-500 hover:text-brand-red" title="Sair">
                        <LogoutIcon />
                    </button>
                 )}
            </header>
            
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <TabButton label="Para Fazer" isActive={activeTab === 'producing'} onClick={() => setActiveTab('producing')} count={activeOrders.length} />
                <TabButton label="Prontos" isActive={activeTab === 'ready'} onClick={() => setActiveTab('ready')} count={readyOrders.length} />
                <TabButton label="Histórico" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} count={0} />
            </div>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                 {activeTab === 'producing' && renderProducingView()}
                 {activeTab === 'ready' && renderReadyView()}
                 {activeTab === 'history' && renderHistoryView()}
            </main>
        </div>
    );
};

export default KDS;