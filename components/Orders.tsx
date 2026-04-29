



import React, { useState, useMemo } from 'react';
import { Order, Product, NewOrderData, PaymentMethod, OrderItem, User, Addon } from '../types';
import CreateOrderModal from './CreateOrderModal';
import FiscalIcon from './icons/FiscalIcon';
import IfoodIcon from './icons/IfoodIcon';
import AiqfomeIcon from './icons/AiqfomeIcon';
import DeliveryIcon from './icons/DeliveryIcon';
import TableIcon from './icons/TableIcon';
import TakeawayIcon from './icons/TakeawayIcon';
import CloseTableOrderModal from './CloseTableOrderModal';
import { Bell, Check } from 'lucide-react';

interface OrdersProps {
    orders: Order[];
    products: Product[];
    addons: Addon[];
    onCreateOrder: (orderData: NewOrderData) => void;
    onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
    onEmitFiscalDocument: (orderId: string) => void;
    onCancelOrderItem: (orderId: string, itemIndex: number) => void;
    onCloseTableOrder: (orderId: string, paymentMethod: PaymentMethod, changeFor?: number) => void;
    currentUser: User;
}

type Tab = 'Geral' | 'Mesa' | 'Entrega' | 'Retirada' | 'iFood' | 'Aiqfome' | 'Fechados';

const getStatusClass = (status: Order['status']) => {
  switch (status) {
    case 'Concluído': return 'bg-brand-lime/30 text-green-800';
    case 'Saiu para Entrega': return 'bg-brand-orange/80 text-white';
    case 'Pronto para Entrega': return 'bg-blue-400/80 text-white';
    case 'Em Preparo': return 'bg-yellow-400/80 text-yellow-900';
    case 'Pendente': return 'bg-yellow-400/80 text-yellow-900';
    case 'Cancelado': return 'bg-brand-red/80 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

const OrderDetailsModal: React.FC<{ 
    order: Order; 
    onClose: () => void; 
    onUpdateStatus: (orderId: string, newStatus: Order['status']) => void; 
    onCancelItem: (orderId: string, itemIndex: number) => void;
}> = ({ order, onClose, onUpdateStatus, onCancelItem }) => {
    
    const handleFinalizeOrder = () => {
        onUpdateStatus(order.id, 'Concluído');
        onClose();
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 text-gray-800">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h3 className="text-xl font-bold text-gray-900">Detalhes do Pedido #{order.id}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div className="mt-4 space-y-1">
                <p><strong>Tipo:</strong> <span className="font-semibold">{order.orderType}</span></p>
                {order.orderType === 'Entrega' ? (
                    <>
                        <p><strong>Cliente:</strong> {order.customerName}</p>
                        <p><strong>Endereço:</strong> {order.address || 'Não informado'}{order.postalCode ? `, CEP: ${order.postalCode}` : ''}</p>
                    </>
                ) : (
                    <p><strong>Cliente / Comanda:</strong> <span className="font-semibold">{order.tableNumber || order.customerName}</span></p>
                )}
                <p><strong>Data:</strong> {new Date(order.date).toLocaleString('pt-BR')}</p>
                <p><strong>Pagamento:</strong> {order.paymentMethod || 'A definir'}</p>
                {order.paymentMethod === 'Dinheiro' && order.changeFor && (
                    <p className="text-brand-red font-semibold"><strong>Troco para:</strong> R$ {order.changeFor.toFixed(2)}</p>
                )}
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>{order.status}</span></p>
                {order.observation && (
                    <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                       <p><strong>Observação:</strong> {order.observation}</p>
                    </div>
                )}
                <h4 className="font-semibold mt-4 mb-2 border-t border-gray-200 pt-2">Itens:</h4>
                <ul className="space-y-1">
                    {order.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`} className="flex justify-between items-center">
                            <div>
                                <span>{item.quantity}x {item.name}</span>
                                {item.addons && item.addons.length > 0 && (
                                    <ul className="text-xs text-blue-600 pl-5">
                                        {item.addons.map(addon => <li key={addon.id}>+ {addon.name}</li>)}
                                    </ul>
                                )}
                            </div>
                            {order.orderType === 'Mesa' && order.status !== 'Concluído' && order.status !== 'Cancelado' && (
                                <button onClick={() => onCancelItem(order.id, index)} className="text-brand-red text-xs hover:underline font-semibold">Remover</button>
                            )}
                        </li>
                    ))}
                </ul>
                <div className="text-right font-bold text-xl text-brand-orange mt-4 border-t border-gray-200 pt-2">
                    Total: R$ {order.total.toFixed(2)}
                </div>
            </div>
            <div className="flex justify-end items-center mt-6 space-x-3">
                 <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                    Voltar
                </button>
                {order.status !== 'Concluído' && order.status !== 'Cancelado' && order.orderType !== 'Mesa' && (
                    <button onClick={handleFinalizeOrder} className="bg-brand-lime text-green-900 font-bold px-4 py-2 rounded-md hover:bg-green-500 transition-colors">
                        Finalizar Pedido
                    </button>
                )}
            </div>
        </div>
    </div>
)};


const Orders: React.FC<OrdersProps> = ({ orders, products, addons, onCreateOrder, onUpdateOrderStatus, onEmitFiscalDocument, onCancelOrderItem, onCloseTableOrder, currentUser }) => {
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Geral');
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const getAvailableStatuses = (order: Order, user: User): Order['status'][] => {
    // Admin has full control on this screen
    if (user.role === 'Admin') {
        return ['Pendente', 'Em Preparo', 'Pronto para Entrega', 'Saiu para Entrega', 'Concluído', 'Cancelado'];
    }
    
    const currentStatus = order.status;
    
    // Final statuses are immutable.
    if (currentStatus === 'Concluído' || currentStatus === 'Cancelado') {
        return [currentStatus];
    }

    const options: Set<Order['status']> = new Set([currentStatus]);

    // Anyone can cancel an active order from this screen.
    options.add('Cancelado');

    // Logic for 'Ready for Pickup' orders.
    if (currentStatus === 'Pronto para Entrega') {
        // Takeaway orders can be marked as 'Concluded' by the cashier/attendant.
        if (order.orderType === 'Retirada') {
            options.add('Concluído');
        }
    }
    
    // Kitchen-controlled statuses ('Pendente', 'Em Preparo') and delivery-controlled statuses
    // ('Saiu para Entrega') do not get progression options here. Only cancellation is possible.
    
    return Array.from(options);
  };

  const readyForPickupOrTableOrders = useMemo(() =>
    orders.filter(o =>
        o.status === 'Pronto para Entrega' &&
        (o.orderType === 'Mesa' || o.orderType === 'Retirada') &&
        !dismissedAlerts.includes(o.id)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [orders, dismissedAlerts]
  );

  const filteredOrders = useMemo(() => {
    let tabFiltered: Order[];

    if (activeTab === 'Fechados') {
        tabFiltered = orders.filter(o => o.status === 'Concluído' || o.status === 'Cancelado');
    } else {
        const activeOrders = orders.filter(o => o.status !== 'Concluído' && o.status !== 'Cancelado');
        switch (activeTab) {
            case 'Mesa':
                tabFiltered = activeOrders.filter(o => o.orderType === 'Mesa');
                break;
            case 'Entrega':
                tabFiltered = activeOrders.filter(o => o.orderType === 'Entrega' && o.source === 'Manual');
                break;
            case 'Retirada':
                tabFiltered = activeOrders.filter(o => o.orderType === 'Retirada' && o.source === 'Manual');
                break;
            case 'iFood':
                tabFiltered = activeOrders.filter(o => o.source === 'iFood');
                break;
            case 'Aiqfome':
                tabFiltered = activeOrders.filter(o => o.source === 'Aiqfome');
                break;
            case 'Geral':
            default:
                tabFiltered = activeOrders;
                break;
        }
    }

    const searchFiltered = tabFiltered.filter(order =>
        order.id.includes(filter) ||
        order.customerName.toLowerCase().includes(filter.toLowerCase()) ||
        (order.orderType === 'Mesa' && order.tableNumber?.includes(filter))
    );
    
    return searchFiltered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, filter, activeTab]);

  const renderOrderIcon = (order: Order) => {
      if (order.source === 'iFood') {
          return <IfoodIcon />;
      }
      if (order.source === 'Aiqfome') {
          return <AiqfomeIcon />;
      }
      if (order.orderType === 'Entrega') {
          return <DeliveryIcon />;
      }
      if (order.orderType === 'Mesa') {
          return <TableIcon />;
      }
      if (order.orderType === 'Retirada') {
          return <TakeawayIcon />;
      }
      return null;
  }
  
  const tabs: Tab[] = ['Geral', 'Mesa', 'Entrega', 'Retirada', 'iFood', 'Aiqfome', 'Fechados'];
  const searchPlaceholder = activeTab === 'Mesa' ? "Buscar por nº da comanda..." : "Filtrar por ID ou nome...";

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Gerenciamento de Pedidos</h3>
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
                Criar Novo Pedido
            </button>
        </div>
        
        {/* NEW ALERT SECTION */}
        {readyForPickupOrTableOrders.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md shadow-md mb-6 animate-pulse-bg">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-6 w-6">
                        <Bell className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-red"></span>
                        </span>
                    </div>
                    <h4 className="font-bold text-lg text-blue-900">Pedidos Prontos Aguardando Ação</h4>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {readyForPickupOrTableOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg p-3 shadow border border-blue-200 flex flex-col justify-between relative group">
                             <button
                                onClick={() => setDismissedAlerts(prev => [...prev, order.id])}
                                className="absolute top-1 right-1 bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300 transition-all opacity-0 group-hover:opacity-100"
                                title="Marcar como visto"
                            >
                                <Check size={12} />
                            </button>
                            <div>
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-blue-900">{order.orderType === 'Mesa' ? `Mesa ${order.tableNumber}` : `Retirada #${order.id}`}</p>
                                    <p className="text-xs text-gray-500 pr-6">{new Date(order.date).toLocaleTimeString('pt-BR')}</p>
                                </div>
                                <ul className="text-xs text-gray-600 mt-1 list-disc list-inside">
                                    {order.items.slice(0, 2).map(item => <li key={item.productId} className="truncate">{item.quantity}x {item.name}</li>)}
                                    {order.items.length > 2 && <li className="italic">...e mais {order.items.length - 2} item(ns).</li>}
                                </ul>
                            </div>
                            <div className="mt-3">
                                {order.orderType === 'Retirada' && (
                                    <button
                                        onClick={() => onUpdateOrderStatus(order.id, 'Concluído')}
                                        className="w-full bg-brand-lime text-green-900 font-bold px-3 py-1.5 rounded-md hover:bg-green-500 transition-colors text-sm"
                                    >
                                        Finalizar Retirada
                                    </button>
                                )}
                                {order.orderType === 'Mesa' && (
                                    <button
                                        onClick={() => setClosingOrder(order)}
                                        className="w-full bg-brand-lime text-green-900 font-bold px-3 py-1.5 rounded-md hover:bg-green-500 transition-colors text-sm"
                                    >
                                        Fechar Conta
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        <div className="flex justify-between items-center mb-4 border-b border-gray-200">
             <div className="flex">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-semibold text-sm focus:outline-none transition-colors duration-200 ${activeTab === tab ? 'border-b-2 border-brand-orange text-brand-orange' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="w-full md:w-1/3">
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                />
            </div>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="p-3 font-semibold text-sm text-gray-600">ID / Origem</th>
                <th className="p-3 font-semibold text-sm text-gray-600">Cliente/Mesa</th>
                <th className="p-3 font-semibold text-sm text-gray-600">Data</th>
                <th className="p-3 font-semibold text-sm text-gray-600">Pagamento</th>
                <th className="p-3 font-semibold text-sm text-gray-600">Total</th>
                <th className="p-3 font-semibold text-sm text-gray-600">Status</th>
                <th className="p-3 font-semibold text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const availableOptions = getAvailableStatuses(order, currentUser);
                const isStatusLocked = currentUser.role !== 'Admin' && availableOptions.length <= 1;

                return (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                          <span title={order.source === 'Manual' ? order.orderType : order.source}>{renderOrderIcon(order)}</span>
                          <span className="font-medium text-brand-orange">#{order.id}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-800">{order.orderType === 'Mesa' ? `Mesa ${order.tableNumber}` : order.customerName}</td>
                    <td className="p-3 text-gray-500">{new Date(order.date).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-gray-500 text-sm">
                      {order.paymentMethod || 'A definir'}
                      {order.paymentMethod === 'Dinheiro' && order.changeFor && (
                          <span className="block text-xs text-brand-red italic">Troco p/ R$ {order.changeFor.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-gray-800">R$ {order.total.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="relative">
                        <select
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                            disabled={isStatusLocked}
                            className={`appearance-none w-full px-3 py-1 pr-8 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange ${getStatusClass(order.status)} ${isStatusLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        >
                            {availableOptions.map(status => (
                                <option key={status} value={status} className="bg-white text-gray-800">
                                    {status}
                                </option>
                            ))}
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 ${isStatusLocked ? 'hidden' : ''}`}>
                           <svg className="h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 space-x-3 whitespace-nowrap">
                      {activeTab === 'Mesa' && order.status !== 'Concluído' && order.status !== 'Cancelado' && (
                          <button 
                              onClick={() => setClosingOrder(order)}
                              className="bg-brand-lime text-green-900 font-bold px-3 py-1 rounded-md hover:bg-green-500 transition-colors text-xs"
                          >
                              Fechar Conta
                          </button>
                      )}
                      <button onClick={() => setSelectedOrder(order)} className="text-brand-orange hover:underline">Detalhes</button>
                      {order.status === 'Concluído' && !order.fiscalDocumentId && (
                         <button 
                           onClick={() => onEmitFiscalDocument(order.id)} 
                           className="bg-gray-700 text-white px-3 py-1 rounded-md hover:bg-gray-800 transition-colors text-xs inline-flex items-center"
                           title="Emitir Nota Fiscal de Consumidor Eletrônica"
                         >
                           <FiscalIcon />
                           <span className="ml-1">Emitir NFC-e</span>
                         </button>
                      )}
                      {order.fiscalDocumentId && (
                           <span className="text-xs text-gray-400 italic">NFC-e emitida</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={onUpdateOrderStatus} onCancelItem={onCancelOrderItem} />}
      {closingOrder && <CloseTableOrderModal order={closingOrder} onClose={() => setClosingOrder(null)} onConfirmClose={onCloseTableOrder} />}
      {isCreateModalOpen && <CreateOrderModal products={products} addons={addons} onClose={() => setIsCreateModalOpen(false)} onCreateOrder={onCreateOrder} />}
    </>
  );
};

export default Orders;