import React, { useState, useMemo } from 'react';
import { FiscalDocument, InvalidationRecord, Order, Client, Ingredient, FixedCost, Product, Recipe } from '../types';
import StatCard from './StatCard';
import FiscalIcon from './icons/FiscalIcon';
import TicketIcon from './icons/TicketIcon';

// --- HELPER COMPONENTS ---

const getStatusClass = (status: FiscalDocument['status']) => {
    switch (status) {
        case 'Autorizado': return 'bg-brand-lime/30 text-green-800';
        case 'Processando': return 'bg-yellow-400/80 text-yellow-900 animate-pulse';
        case 'Cancelando': return 'bg-yellow-400/80 text-yellow-900 animate-pulse';
        case 'Rejeitado': return 'bg-brand-red/30 text-red-800';
        case 'Cancelado': return 'bg-gray-200 text-gray-600';
        default: return 'bg-gray-200 text-gray-600';
    }
};

const DetailsModal: React.FC<{ doc: FiscalDocument; onClose: () => void; onCancel: (id: string) => void; }> = ({ doc, onClose, onCancel }) => {
    
    const handleDownloadXml = (xmlContent: string, fileName: string) => {
        if (!xmlContent) return;
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl text-gray-800">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-lg font-bold text-gray-900">Detalhes do Documento Fiscal</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="col-span-1 md:col-span-2"><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(doc.status)}`}>{doc.status}</span></div>
                    <div><strong>ID do Documento (nNF):</strong> {doc.id}</div>
                    <div><strong>ID do Pedido:</strong> {doc.orderId}</div>
                    <div><strong>Cliente:</strong> {doc.customer}</div>
                    <div><strong>Valor:</strong> <span className="font-semibold">R$ {doc.value.toFixed(2)}</span></div>
                    <div className="col-span-1 md:col-span-2 break-all"><strong>Chave de Acesso:</strong> {doc.accessKey || 'N/A'}</div>
                    <div><strong>Protocolo Autorização:</strong> {doc.authorizationProtocol || 'N/A'}</div>
                    <div><strong>Data Emissão:</strong> {new Date(doc.date).toLocaleString('pt-BR')}</div>
                    {doc.rejectionReason && <div className="col-span-2 text-red-600"><strong>Motivo Rejeição/Cancelamento:</strong> {doc.rejectionReason}</div>}
                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg flex-wrap gap-2">
                    {doc.xmlContent && <button onClick={() => handleDownloadXml(doc.xmlContent!, `NFe-${doc.accessKey || doc.id}.xml`)} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">Baixar XML</button>}
                    {doc.cancellationXmlContent && <button onClick={() => handleDownloadXml(doc.cancellationXmlContent!, `Cancelamento-NFe-${doc.accessKey || doc.id}.xml`)} className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 text-sm">Baixar XML Cancel.</button>}
                    {doc.pdfUrl && <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm">Baixar DANFCE</a>}
                    {doc.status === 'Autorizado' && <button onClick={() => { onCancel(doc.id); onClose(); }} className="bg-brand-red text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">Cancelar</button>}
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">Fechar</button>
                </div>
            </div>
        </div>
    );
}

const InvalidationModal: React.FC<{ onClose: () => void; onInvalidate: (series: number, start: number, end: number, reason: string) => void }> = ({ onClose, onInvalidate }) => {
    const [series, setSeries] = useState('1');
    const [startNum, setStartNum] = useState('');
    const [endNum, setEndNum] = useState('');
    const [reason, setReason] = useState('Falha na sequência da numeração.');

    const handleSubmit = () => {
        if (!startNum || !endNum || !reason) {
            alert('Preencha todos os campos.');
            return;
        }
        onInvalidate(parseInt(series), parseInt(startNum), parseInt(endNum), reason);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg text-gray-800">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-lg font-bold">Inutilizar Faixa de Numeração</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                     <div className="grid grid-cols-3 gap-4">
                         <div><label className="block text-sm font-medium text-gray-700">Série</label><input type="number" value={series} onChange={e => setSeries(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" /></div>
                         <div><label className="block text-sm font-medium text-gray-700">Número Inicial</label><input type="number" value={startNum} onChange={e => setStartNum(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" /></div>
                         <div><label className="block text-sm font-medium text-gray-700">Número Final</label><input type="number" value={endNum} onChange={e => setEndNum(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" /></div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Justificativa</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md"></textarea>
                     </div>
                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-brand-red text-white px-4 py-2 rounded-md hover:bg-red-700">Solicitar Inutilização</button>
                </div>
            </div>
        </div>
    )
};

const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for BOM
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const convertUnits = (quantity: number, fromUnit: 'g' | 'ml' | 'un' | 'kg' | 'L', toUnit: 'g' | 'ml' | 'un' | 'kg' | 'L'): number => {
    if (fromUnit === toUnit) return quantity;
    if (fromUnit === 'g' && toUnit === 'kg') return quantity / 1000;
    if (fromUnit === 'kg' && toUnit === 'g') return quantity * 1000;
    if (fromUnit === 'ml' && toUnit === 'L') return quantity / 1000;
    if (fromUnit === 'L' && toUnit === 'ml') return quantity * 1000;
    if (fromUnit === 'g' && toUnit === 'L') return quantity / 1000;
    if (fromUnit === 'ml' && toUnit === 'kg') return quantity / 1000;
    if (fromUnit === 'kg' && toUnit === 'ml') return quantity * 1000;
    if (fromUnit === 'L' && toUnit === 'g') return quantity * 1000;
    return quantity;
}

// --- MAIN COMPONENT ---

interface FiscalProps {
    documents: FiscalDocument[];
    onCancelDocument: (docId: string) => void;
    environment: 'Homologação' | 'Produção';
    invalidationRecords: InvalidationRecord[];
    onInvalidateRange: (series: number, start: number, end: number, reason: string) => void;
    orders: Order[];
    clients: Client[];
    ingredients: Ingredient[];
    fixedCosts: FixedCost[];
    products: Product[];
    recipes: Recipe;
}

const Fiscal: React.FC<FiscalProps> = ({ documents, onCancelDocument, environment, invalidationRecords, onInvalidateRange, orders, clients, ingredients, fixedCosts, products, recipes }) => {
    const [filter, setFilter] = useState('');
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [isInvalidationModalOpen, setIsInvalidationModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<FiscalDocument | null>(null);

    const [reportType, setReportType] = useState<'pedidos' | 'clientes' | 'estoque' | 'documentos' | 'custos'>('pedidos');
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

     const calculatePizzaCost = useMemo(() => (productId: number): number => {
        const recipe = recipes[productId];
        if (!recipe) return 0;

        return recipe.reduce((totalCost, recipePart) => {
            const ingredient = ingredients.find(i => i.id === recipePart.ingredientId);
            if (!ingredient) return totalCost;
            
            const quantityInPurchaseUnit = convertUnits(recipePart.quantity, recipePart.unit, ingredient.unit);
            return totalCost + (ingredient.costPerUnit * quantityInPurchaseUnit);
        }, 0);
    }, [ingredients, recipes]);

    const handleGenerateReport = () => {
        let data: any[][] = [];
        let headers: string[] = [];
        let fileName = `relatorio_${reportType}`;
        
        const isDateFilterApplicable = reportType !== 'estoque';

        const dateFilter = (item: { date: string }) => {
            if (!isDateFilterApplicable) return true;
            const itemDate = new Date(item.date);
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            return itemDate >= start && itemDate <= end;
        };

        const dateFilterClient = (item: { registrationDate: string }) => {
            if (!isDateFilterApplicable) return true;
            const itemDate = new Date(item.registrationDate);
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            return itemDate >= start && itemDate <= end;
        };
        
        switch (reportType) {
            case 'pedidos':
                headers = ["ID", "Cliente", "Data", "Tipo", "Origem", "Status", "Itens (Qtd)", "Total (R$)", "Pagamento"];
                data = orders.filter(dateFilter).map(o => ([
                    o.id,
                    o.customerName,
                    new Date(o.date).toLocaleString('pt-BR'),
                    o.orderType,
                    o.source,
                    o.status,
                    o.items.reduce((acc, item) => acc + item.quantity, 0),
                    o.total.toFixed(2).replace('.',','),
                    o.paymentMethod || 'N/A'
                ]));
                fileName += `_de_${startDate}_a_${endDate}`;
                break;
            case 'clientes':
                headers = ["ID", "Nome", "Telefone", "CPF", "Data Nasc.", "Data Cadastro", "Endereco"];
                data = clients.filter(dateFilterClient).map(c => ([
                    c.id,
                    c.name,
                    c.phone,
                    c.cpf,
                    c.birthDate ? new Date(c.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : '',
                    new Date(c.registrationDate).toLocaleString('pt-BR'),
                    `${c.address.type} ${c.address.street}, ${c.address.number}, ${c.address.neighborhood}${c.address.complement ? ` - ${c.address.complement}` : ''}`
                ]));
                fileName += `_de_${startDate}_a_${endDate}`;
                break;
            case 'estoque':
                headers = ["ID", "Ingrediente", "Estoque Atual", "Unidade", "Estoque Minimo", "Custo p/ Unidade (R$)"];
                data = ingredients.map(i => ([
                    i.id,
                    i.name,
                    i.stock.toFixed(2).replace('.',','),
                    i.unit,
                    i.minStock.toFixed(2).replace('.',','),
                    i.costPerUnit.toFixed(2).replace('.',',')
                ]));
                break;
            case 'documentos':
                headers = ["ID (nNF)", "ID Pedido", "Cliente", "Data", "Valor (R$)", "Status", "Chave de Acesso"];
                data = documents.filter(dateFilter).map(d => ([
                    d.id,
                    d.orderId,
                    d.customer,
                    new Date(d.date).toLocaleString('pt-BR'),
                    d.value.toFixed(2).replace('.',','),
                    d.status,
                    d.accessKey || 'N/A'
                ]));
                fileName += `_de_${startDate}_a_${endDate}`;
                break;
            case 'custos':
                const start = new Date(startDate + 'T00:00:00');
                const end = new Date(endDate + 'T23:59:59');
                const numberOfDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
                const avgDaysInMonth = 30.44;

                headers = ["Data", "Tipo de Custo", "Descrição", "Valor (R$)"];
                data = [];

                // 1. Add pro-rated fixed costs
                fixedCosts.forEach(cost => {
                    const proratedValue = (cost.value / avgDaysInMonth) * numberOfDays;
                    data.push([
                        `${startDate} a ${endDate}`,
                        "Fixo",
                        cost.name,
                        proratedValue.toFixed(2).replace('.',',')
                    ]);
                });

                // 2. Add variable costs from orders
                const ordersInPeriod = orders.filter(o => {
                    const orderDate = new Date(o.date);
                    return o.status === 'Concluído' && orderDate >= start && orderDate <= end;
                });

                ordersInPeriod.forEach(order => {
                    order.items.forEach(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (product) {
                            let itemCost = 0;
                            let description = '';
                            if (product.category.includes('Pizza')) {
                                itemCost = calculatePizzaCost(product.id) * item.quantity;
                                description = `${item.quantity}x ${item.name}`;
                            } else if (product.cost) { // For beverages etc.
                                itemCost = product.cost * item.quantity;
                                description = `${item.quantity}x ${item.name}`;
                            }
                            
                            if (itemCost > 0) {
                                data.push([
                                    new Date(order.date).toLocaleDateString('pt-BR'),
                                    "Variável (Matéria-Prima)",
                                    description,
                                    itemCost.toFixed(2).replace('.',',')
                                ]);
                            }
                        }
                    });
                });
                
                fileName += `_de_${startDate}_a_${endDate}`;
                break;
        }
        
        if (data.length === 0) {
            alert('Nenhum dado encontrado para o relatório selecionado.');
            return;
        }

        const csvContent = [
            headers.join(';'),
            ...data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');
        
        downloadCSV(csvContent, `${fileName}.csv`);
    };

    const filteredDocs = useMemo(() =>
        documents.filter(doc =>
            doc.id.toLowerCase().includes(filter.toLowerCase()) ||
            doc.customer.toLowerCase().includes(filter.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [documents, filter]
    );

    const nfeCount = useMemo(() => documents.filter(d => d.type === 'NF-e' && d.status === 'Autorizado').length, [documents]);
    const nfceCount = useMemo(() => documents.filter(d => d.type === 'NFC-e' && d.status === 'Autorizado').length, [documents]);

    return (
        <>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Exportação de Relatórios</h3>
                    <div className="flex flex-col md:flex-row md:items-end gap-4 flex-wrap">
                        <div>
                            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">Tipo de Relatório</label>
                            <div className="relative mt-1">
                                <select
                                    id="report-type"
                                    value={reportType}
                                    onChange={e => setReportType(e.target.value as any)}
                                    className="appearance-none block w-full md:w-auto p-2 pr-10 bg-gray-50 border border-gray-300 text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                                >
                                    <option value="pedidos">Pedidos</option>
                                    <option value="clientes">Clientes</option>
                                    <option value="estoque">Estoque Atual</option>
                                    <option value="documentos">Documentos Fiscais</option>
                                    <option value="custos">Custos</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">De:</label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={reportType === 'estoque'}
                                className="mt-1 p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange disabled:bg-gray-200 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Até:</label>
                            <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                disabled={reportType === 'estoque'}
                                className="mt-1 p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange disabled:bg-gray-200 disabled:cursor-not-allowed"
                            />
                        </div>
                        <button
                            onClick={handleGenerateReport}
                            className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors h-fit"
                        >
                            Gerar Relatório (CSV)
                        </button>
                    </div>
                     {reportType === 'estoque' && (
                        <p className="text-xs text-gray-500 mt-2">O relatório de 'Estoque Atual' é um retrato do momento e não pode ser filtrado por data.</p>
                    )}
                </div>

                {/* Environment Banner */}
                <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-md">
                    <p className="font-bold">Atenção: Você está operando em ambiente de <span className="uppercase">{environment}</span>.</p>
                    <p className="text-sm">Documentos emitidos neste ambiente não possuem valor fiscal real.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Cupons Fiscais (NFC-e) Autorizados" value={nfceCount.toString()} change="" changeType="increase" icon={<TicketIcon />} />
                    <StatCard title="Notas Fiscais (NF-e) Autorizadas" value={nfeCount.toString()} change="" changeType="increase" icon={<FiscalIcon />} />
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Configurações e Ações Fiscais</h3>
                        <div className="space-x-2">
                             <button onClick={() => setIsCertModalOpen(true)} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm">Configurar Certificado</button>
                             <button onClick={() => setIsInvalidationModalOpen(true)} className="bg-brand-red text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm">Inutilizar Numeração</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerenciador de Documentos Fiscais</h3>
                    <input
                    type="text"
                    placeholder="Filtrar por ID do documento ou nome do cliente..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full md:w-1/2 p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange mb-4"
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-3 font-semibold text-sm text-gray-600">ID (nNF)</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Cliente</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Data</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Valor</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Status</th>
                                    <th className="p-3 font-semibold text-sm text-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocs.map(doc => (
                                    <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-3 font-medium text-brand-orange">{doc.id}</td>
                                        <td className="p-3 text-gray-800">{doc.customer}</td>
                                        <td className="p-3 text-gray-500">{new Date(doc.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-3 font-semibold text-gray-800">R$ {doc.value.toFixed(2)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(doc.status)}`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                           <button onClick={() => setSelectedDoc(doc)} className="text-brand-orange hover:underline text-sm font-semibold">Detalhes</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                 {invalidationRecords.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Registros de Inutilização de Numeração</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="p-3 font-semibold text-sm text-gray-600">Protocolo</th>
                                        <th className="p-3 font-semibold text-sm text-gray-600">Faixa Inutilizada</th>
                                        <th className="p-3 font-semibold text-sm text-gray-600">Data</th>
                                        <th className="p-3 font-semibold text-sm text-gray-600">Justificativa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invalidationRecords.map(rec => (
                                        <tr key={rec.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="p-3 font-mono text-xs text-gray-500">{rec.protocol}</td>
                                            <td className="p-3 font-semibold text-gray-800">Série {rec.series}: {rec.startNumber} a {rec.endNumber}</td>
                                            <td className="p-3 text-gray-600">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-3 italic text-gray-500">"{rec.reason}"</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
            </div>
            {selectedDoc && <DetailsModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} onCancel={onCancelDocument} />}
            {isInvalidationModalOpen && <InvalidationModal onClose={() => setIsInvalidationModalOpen(false)} onInvalidate={onInvalidateRange} />}
        </>
    );
};

export default Fiscal;