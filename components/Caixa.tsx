import React, { useState, useMemo } from 'react';
import { Order, PaymentMethod, User, CashRegisterClosing } from '../types';
import StatCard from './StatCard';
import RevenueIcon from './icons/RevenueIcon';
import TotalOrdersIcon from './icons/TotalOrdersIcon';
import { Banknote, CreditCard, QrCode, Lock, UserCheck, CalendarCheck, AlertTriangle } from 'lucide-react';

// --- MODAL COMPONENT ---
const ReversalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}> = ({ isOpen, onClose, onSubmit, showToast }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (reason.trim() === '') {
            showToast('A justificativa é obrigatória para estornar o fechamento.', 'error');
            return;
        }
        onSubmit(reason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg text-gray-800">
                <div className="p-6 text-center">
                    <AlertTriangle className="text-yellow-500 w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Estornar Fechamento de Caixa</h3>
                    <p className="text-sm text-gray-600 mt-2">
                        Esta ação reabrirá o caixa para a data selecionada, liberando todos os pedidos associados.
                        A ação será registrada para fins de auditoria.
                    </p>
                    <div className="mt-4 text-left">
                        <label htmlFor="reversal-reason" className="block text-sm font-medium text-gray-700">
                            Justificativa (Obrigatório)
                        </label>
                        <textarea
                            id="reversal-reason"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md focus:ring-2 focus:ring-brand-orange"
                            placeholder="Ex: Pedido #1235 foi finalizado incorretamente."
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={reason.trim() === ''}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Confirmar Estorno
                    </button>
                </div>
            </div>
        </div>
    );
};


interface CaixaProps {
    orders: Order[];
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    cashRegisterClosings: CashRegisterClosing[];
    onCloseCashRegister: (date: string, ordersToClose: Order[], totals: { totalRevenue: number, paymentMethodTotals: Record<PaymentMethod, number> }) => void;
    onReverseCashRegister: (date: string, reason: string) => void;
    currentUser: User;
}

const Caixa: React.FC<CaixaProps> = ({ orders, showToast, cashRegisterClosings, onCloseCashRegister, onReverseCashRegister, currentUser }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);

    const closingForSelectedDate = useMemo(() =>
        cashRegisterClosings.find(c => c.id === selectedDate && c.status !== 'Reversed'),
        [cashRegisterClosings, selectedDate]);

    const openOrdersForDate = useMemo(() => {
        return orders.filter(order => {
            const orderDate = new Date(order.date).toISOString().split('T')[0];
            return orderDate === selectedDate && order.status === 'Concluído' && !order.closedInCashRegisterDate;
        });
    }, [selectedDate, orders]);

    const closedOrdersForDate = useMemo(() => {
        if (!closingForSelectedDate) return [];
        return orders.filter(order => order.closedInCashRegisterDate === selectedDate);
    }, [selectedDate, orders, closingForSelectedDate]);

    // --- Totals for OPEN cash register ---
    const totalRevenueOpen = useMemo(() =>
        openOrdersForDate.reduce((acc, order) => acc + order.total, 0),
        [openOrdersForDate]);

    const paymentMethodTotalsOpen = useMemo(() => {
        const totals: Record<PaymentMethod, number> = { 'Dinheiro': 0, 'Cartão de Crédito': 0, 'Cartão de Débito': 0, 'Pix': 0 };
        for (const order of openOrdersForDate) {
            if (totals[order.paymentMethod] !== undefined) {
                totals[order.paymentMethod] += order.total;
            }
        }
        return totals;
    }, [openOrdersForDate]);

    const handleCloseCashRegister = () => {
        if (openOrdersForDate.length === 0 && totalRevenueOpen === 0) {
            showToast('Não há faturamento a ser fechado para esta data.', 'warning');
            return;
        }
        onCloseCashRegister(selectedDate, openOrdersForDate, { totalRevenue: totalRevenueOpen, paymentMethodTotals: paymentMethodTotalsOpen });
    }

    const handleReverseSubmit = (reason: string) => {
        onReverseCashRegister(selectedDate, reason);
        setIsReversalModalOpen(false);
    };

    return (
        <>
            <div className="space-y-8">
                <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Conferência de Caixa</h3>
                    <div className="flex items-center gap-4">
                        <div>
                            <label htmlFor="cash-date" className="text-sm font-medium text-gray-600 mr-2">Data:</label>
                            <input
                                type="date"
                                id="cash-date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                            />
                        </div>
                        {currentUser.role === 'Admin' && closingForSelectedDate && (
                             <button
                                onClick={() => setIsReversalModalOpen(true)}
                                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors font-semibold"
                            >
                                Estornar Fechamento
                            </button>
                        )}
                        <button
                            onClick={handleCloseCashRegister}
                            disabled={!!closingForSelectedDate}
                            className="bg-brand-red text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {closingForSelectedDate ? 'Caixa Fechado' : 'Fechar Caixa'}
                        </button>
                    </div>
                </div>

                {closingForSelectedDate ? (
                    // --- CAIXA FECHADO VIEW ---
                    <>
                        <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-6 rounded-lg shadow-md flex items-center gap-4">
                            <Lock className="w-12 h-12 text-green-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-xl font-bold text-green-900">Caixa Fechado</h3>
                                <p className="text-green-800">Este caixa foi fechado e não pode ser alterado, a menos que seja estornado por um administrador.</p>
                                <div className="text-sm mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-green-700">
                                    <span className="flex items-center gap-1.5"><UserCheck /> Fechado por: <strong>{closingForSelectedDate.closedByUserName}</strong></span>
                                    <span className="flex items-center gap-1.5"><CalendarCheck /> Em: <strong>{new Date(closingForSelectedDate.closingTime).toLocaleString('pt-BR')}</strong></span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total (Dinheiro)" value={`R$ ${closingForSelectedDate.paymentMethodTotals['Dinheiro'].toFixed(2)}`} change="" changeType="increase" icon={<Banknote className="w-6 h-6 text-brand-orange" />} />
                            <StatCard title="Total (Crédito)" value={`R$ ${closingForSelectedDate.paymentMethodTotals['Cartão de Crédito'].toFixed(2)}`} change="" changeType="increase" icon={<CreditCard className="w-6 h-6 text-brand-orange" />} />
                            <StatCard title="Total (Débito)" value={`R$ ${closingForSelectedDate.paymentMethodTotals['Cartão de Débito'].toFixed(2)}`} change="" changeType="increase" icon={<CreditCard className="w-6 h-6 text-brand-orange" />} />
                            <StatCard title="Total (Pix)" value={`R$ ${closingForSelectedDate.paymentMethodTotals['Pix'].toFixed(2)}`} change="" changeType="increase" icon={<QrCode className="w-6 h-6 text-brand-orange" />} />
                        </div>
                         <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Pedidos Incluídos no Fechamento</h3>
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr><th className="p-3 font-semibold text-sm text-gray-600">ID</th><th className="p-3 font-semibold text-sm text-gray-600">Cliente</th><th className="p-3 font-semibold text-sm text-gray-600">Pagamento</th><th className="p-3 font-semibold text-sm text-gray-600">Valor</th></tr>
                                    </thead>
                                    <tbody>
                                        {closedOrdersForDate.map(order => (
                                            <tr key={order.id} className="border-b"><td className="p-3 font-medium text-brand-orange">#{order.id}</td><td className="p-3">{order.customerName}</td><td className="p-3">{order.paymentMethod}</td><td className="p-3 font-semibold">R$ {order.total.toFixed(2)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    // --- CAIXA ABERTO VIEW ---
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <StatCard title="Faturamento do Dia (Aberto)" value={`R$ ${totalRevenueOpen.toFixed(2)}`} change="" changeType="increase" icon={<RevenueIcon />} />
                            <StatCard title="Pedidos a Fechar" value={openOrdersForDate.length.toString()} change="" changeType="increase" icon={<TotalOrdersIcon />} />
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Totais por Forma de Pagamento (Aberto)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Dinheiro" value={`R$ ${paymentMethodTotalsOpen['Dinheiro'].toFixed(2)}`} change="" changeType="increase" icon={<Banknote className="w-6 h-6 text-brand-orange" />} />
                                <StatCard title="Cartão de Crédito" value={`R$ ${paymentMethodTotalsOpen['Cartão de Crédito'].toFixed(2)}`} change="" changeType="increase" icon={<CreditCard className="w-6 h-6 text-brand-orange" />} />
                                <StatCard title="Cartão de Débito" value={`R$ ${paymentMethodTotalsOpen['Cartão de Débito'].toFixed(2)}`} change="" changeType="increase" icon={<CreditCard className="w-6 h-6 text-brand-orange" />} />
                                <StatCard title="Pix" value={`R$ ${paymentMethodTotalsOpen['Pix'].toFixed(2)}`} change="" changeType="increase" icon={<QrCode className="w-6 h-6 text-brand-orange" />} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Pedidos Concluídos do Dia (Abertos)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="p-3 font-semibold text-sm text-gray-600">ID Pedido</th><th className="p-3 font-semibold text-sm text-gray-600">Cliente/Mesa</th><th className="p-3 font-semibold text-sm text-gray-600">Horário</th><th className="p-3 font-semibold text-sm text-gray-600">Forma Pagamento</th><th className="p-3 font-semibold text-sm text-gray-600">Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {openOrdersForDate.length > 0 ? openOrdersForDate.map(order => (
                                            <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-3 font-medium text-brand-orange">#{order.id}</td><td className="p-3 text-gray-800">{order.customerName}</td><td className="p-3 text-gray-500">{new Date(order.date).toLocaleTimeString('pt-BR')}</td><td className="p-3 text-gray-600">{order.paymentMethod}</td><td className="p-3 font-semibold text-gray-800">R$ {order.total.toFixed(2)}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="text-center p-6 text-gray-500">Nenhum pedido concluído para esta data aguardando fechamento.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <ReversalModal 
                isOpen={isReversalModalOpen}
                onClose={() => setIsReversalModalOpen(false)}
                onSubmit={handleReverseSubmit}
                showToast={showToast}
            />
        </>
    );
};

export default Caixa;