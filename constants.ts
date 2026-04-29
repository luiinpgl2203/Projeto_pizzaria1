




// FIX: Corrected typo in import from 'Motoy' to 'Motoboy'
import { Product, Order, Ingredient, FiscalDocument, Recipe, Motoboy, User, FixedCost, Client, Addon } from './types';

export const MOCK_CLIENTS: Client[] = [
    {
        id: 1,
        name: 'Carlos Alberto de Nóbrega',
        phone: '(11) 99999-1234',
        cpf: '123.456.789-00',
        birthDate: '1936-03-12',
        registrationDate: '2024-07-15T10:00:00Z',
        address: {
            type: 'Rua',
            street: 'das Flores',
            number: '123',
            neighborhood: 'Centro',
            complement: 'Apto 101',
        }
    },
    {
        id: 2,
        name: 'Silvio Santos',
        phone: '(11) 98888-5678',
        cpf: '098.765.432-11',
        birthDate: '1930-12-12',
        registrationDate: '2024-07-20T14:30:00Z',
        address: {
            type: 'Avenida',
            street: 'Paulista',
            number: '1578',
            neighborhood: 'Bela Vista',
            complement: '',
        }
    },
     {
        id: 3,
        name: 'Hebe Camargo',
        phone: '(11) 97777-8888',
        cpf: '222.333.444-55',
        birthDate: '1929-03-08',
        registrationDate: '2024-07-28T18:00:00Z',
        address: {
            type: 'Alameda',
            street: 'dos Jardins',
            number: '500',
            neighborhood: 'Jardins',
            complement: 'Casa',
        }
    },
];

export const MOCK_PRODUCTS: Product[] = [
    { id: 1, name: 'Pizza de Calabresa', category: 'Pizzas Salgadas', price: 45.00, imageUrl: '', description: 'Molho de tomate, mussarela, calabresa e cebola.' },
    { id: 2, name: 'Pizza de Mussarela', category: 'Pizzas Salgadas', price: 42.00, imageUrl: '', description: 'Molho de tomate e mussarela.' },
    { id: 3, name: 'Pizza de Frango com Catupiry', category: 'Pizzas Salgadas', price: 50.00, imageUrl: '', description: 'Molho de tomate, mussarela, frango desfiado e catupiry.' },
    { id: 4, name: 'Pizza de Chocolate', category: 'Pizzas Doces', price: 55.00, imageUrl: '', description: 'Chocolate ao leite e granulado.' },
    { id: 5, name: 'Pizza de Abobrinha', category: 'Pizzas Salgadas', price: 48.00, imageUrl: '', description: 'Abobrinha fatiada refogada no alho, azeite e mussarela.' },
    { id: 6, name: 'Pizza Portuguesa', category: 'Pizzas Salgadas', price: 52.00, imageUrl: '', description: 'Molho, mussarela, presunto, ovo, cebola, azeitona.' },
    { id: 8, name: 'Pizza Romeu e Julieta', category: 'Pizzas Doces', price: 53.00, imageUrl: '', description: 'Mussarela e goiabada.' },
    { id: 10, name: 'Refrigerante 2L', category: 'Bebidas', price: 12.00, imageUrl: '', cost: 6.50 },
    { id: 11, name: 'Refrigerante (Lata)', category: 'Bebidas', price: 7.00, imageUrl: '', cost: 3.20 },
];

export const MOCK_ADDONS: Addon[] = [
    { id: 1, name: 'Borda de Catupiry', price: 8.00 },
    { id: 2, name: 'Borda de Cheddar', price: 8.00 },
    { id: 3, name: 'Borda de Chocolate', price: 10.00 },
    { id: 4, name: 'Extra Bacon', price: 6.00 },
    { id: 5, name: 'Extra Mussarela', price: 5.00 },
    { id: 6, name: 'Extra Calabresa', price: 5.00 },
];

// Helper to generate random coordinates around a central point (simulating a city)
const generateRandomCoords = () => {
    const centerLat = -23.5505;
    const centerLng = -46.6333;
    const lat = centerLat + (Math.random() - 0.5) * 0.15; // Spread over ~15km
    const lng = centerLng + (Math.random() - 0.5) * 0.15;
    return { lat, lng };
}


export const MOCK_ORDERS: Order[] = [
  { id: '501', customerName: 'Mesa 05', date: '2024-07-28T21:30:00', total: 107.00, status: 'Em Preparo', items: [{ productId: 1, name: 'Pizza de Calabresa', quantity: 1, price: 45.00 }, { productId: 3, name: 'Pizza de Frango com Catupiry', quantity: 1, price: 50.00 }, { productId: 10, name: 'Refrigerante 2L', quantity: 1, price: 12.00 }], orderType: 'Mesa', source: 'Manual', tableNumber: '05' },
  { id: '502', customerName: 'Mesa 12', date: '2024-07-28T21:35:00', total: 42.00, status: 'Pendente', items: [{ productId: 2, name: 'Pizza de Mussarela', quantity: 1, price: 42.00 }], orderType: 'Mesa', source: 'Manual', tableNumber: '12' },
  { id: '1242', customerName: 'Renata Almeida (iFood)', date: '2024-07-28T21:20:00', total: 59.00, status: 'Pendente', paymentMethod: 'Cartão de Crédito', items: [{ productId: 6, name: 'Pizza Portuguesa', quantity: 1, price: 52.00 }, { productId: 11, name: 'Refrigerante (Lata)', quantity: 1, price: 7.00 }], orderType: 'Entrega', source: 'iFood', address: 'Alameda Santos, 200', coordinates: generateRandomCoords() },
  { id: '1243', customerName: 'Fernando Costa (Aiqfome)', date: '2024-07-28T21:25:00', total: 42.00, status: 'Pronto para Entrega', paymentMethod: 'Pix', items: [{ productId: 2, name: 'Pizza de Mussarela', quantity: 1, price: 42.00 }], orderType: 'Entrega', source: 'Aiqfome', address: 'Rua Haddock Lobo, 595', coordinates: generateRandomCoords() },
  { id: '1244', customerName: 'Cláudia Matos', date: '2024-07-28T21:40:00', total: 55.00, status: 'Pendente', paymentMethod: 'Cartão de Débito', items: [{ productId: 4, name: 'Pizza de Chocolate', quantity: 1, price: 55.00 }], orderType: 'Retirada', source: 'Manual' },
  { id: '1234', customerName: 'João Silva', date: '2024-07-28T20:30:00', total: 57.00, status: 'Concluído', paymentMethod: 'Dinheiro', items: [{ productId: 1, name: 'Pizza de Calabresa', quantity: 1, price: 45.00 }, { productId: 10, name: 'Refrigerante 2L', quantity: 1, price: 12.00 }], orderType: 'Entrega', source: 'Manual', address: 'Rua das Flores, 123', coordinates: generateRandomCoords(), fiscalDocumentId: '1234', changeFor: 100 },
  { id: '1235', customerName: 'Maria Oliveira', date: '2024-07-28T20:45:00', total: 50.00, status: 'Saiu para Entrega', paymentMethod: 'Cartão de Crédito', items: [{ productId: 3, name: 'Pizza de Frango com Catupiry', quantity: 1, price: 50.00 }], orderType: 'Entrega', source: 'Manual', address: 'Avenida Paulista, 1578', coordinates: generateRandomCoords() },
  { id: '1236', customerName: 'Carlos Pereira', date: '2024-07-28T21:00:00', total: 94.00, status: 'Pronto para Entrega', paymentMethod: 'Pix', items: [{ productId: 2, name: 'Pizza de Mussarela', quantity: 1, price: 42.00 }, { productId: 6, name: 'Pizza Portuguesa', quantity: 1, price: 52.00 }], orderType: 'Entrega', source: 'Manual', address: 'Rua Augusta, 456', coordinates: generateRandomCoords() },
  { id: '1237', customerName: 'Ana Costa', date: '2024-07-28T21:15:00', total: 55.00, status: 'Concluído', paymentMethod: 'Cartão de Débito', items: [{ productId: 4, name: 'Pizza de Chocolate', quantity: 1, price: 55.00 }], orderType: 'Entrega', source: 'Manual', address: 'Largo da Batata, 789', coordinates: generateRandomCoords(), fiscalDocumentId: '89' },
  { id: '1238', customerName: 'Lucas Souza', date: '2024-07-27T19:50:00', total: 42.00, status: 'Concluído', paymentMethod: 'Cartão de Crédito', items: [{ productId: 2, name: 'Pizza de Mussarela', quantity: 1, price: 42.00 }], orderType: 'Entrega', source: 'Manual', address: 'Rua Oscar Freire, 1122', coordinates: generateRandomCoords(), fiscalDocumentId: '1238' },
  { id: '1239', customerName: 'Juliana Lima', date: '2024-07-27T20:10:00', total: 60.00, status: 'Cancelado', paymentMethod: 'Pix', items: [{ productId: 8, name: 'Pizza Romeu e Julieta', quantity: 1, price: 53.00 }, { productId: 11, name: 'Refrigerante (Lata)', quantity: 1, price: 7.00 }], orderType: 'Entrega', source: 'Manual', address: 'Avenida Faria Lima, 345', coordinates: generateRandomCoords() },
  { id: '1240', customerName: 'Marcos Rocha', date: '2024-07-26T20:00:00', total: 45.00, status: 'Concluído', paymentMethod: 'Dinheiro', items: [{ productId: 1, name: 'Pizza de Calabresa', quantity: 1, price: 45.00 }], orderType: 'Entrega', source: 'Manual', address: 'Rua das Flores, 123', coordinates: generateRandomCoords(), fiscalDocumentId: '1240', changeFor: 50 },
  { id: '1241', customerName: 'Beatriz Almeida', date: '2024-07-26T20:15:00', total: 52.00, status: 'Concluído', paymentMethod: 'Pix', items: [{ productId: 6, name: 'Pizza Portuguesa', quantity: 1, price: 52.00 }], orderType: 'Entrega', source: 'Manual', address: 'Avenida Ibirapuera, 2021', coordinates: generateRandomCoords() },
];

export const MOCK_INGREDIENTS: Ingredient[] = [
    { id: 1, name: 'Farinha de Trigo', stock: 50, unit: 'kg', minStock: 20, costPerUnit: 5.50 },
    { id: 2, name: 'Molho de Tomate', stock: 30, unit: 'L', minStock: 10, costPerUnit: 8.00 },
    { id: 3, name: 'Queijo Mussarela', stock: 45, unit: 'kg', minStock: 15, costPerUnit: 38.90 },
    { id: 4, name: 'Calabresa', stock: 18, unit: 'kg', minStock: 10, costPerUnit: 29.80 },
    { id: 5, name: 'Frango Desfiado', stock: 25, unit: 'kg', minStock: 8, costPerUnit: 22.00 },
    { id: 6, name: 'Catupiry', stock: 4, unit: 'kg', minStock: 5, costPerUnit: 45.00 },
    { id: 7, name: 'Chocolate em Barra', stock: 12, unit: 'kg', minStock: 4, costPerUnit: 55.00 },
    { id: 8, name: 'Massa de Pizza Pré-assada', stock: 150, unit: 'un', minStock: 50, costPerUnit: 2.50 },
    { id: 9, name: 'Presunto', stock: 15, unit: 'kg', minStock: 5, costPerUnit: 25.00 },
    { id: 10, name: 'Ovo', stock: 120, unit: 'un', minStock: 24, costPerUnit: 0.80 },
    { id: 11, name: 'Cebola', stock: 10, unit: 'kg', minStock: 3, costPerUnit: 4.00 },
    { id: 12, name: 'Azeitona', stock: 5, unit: 'kg', minStock: 2, costPerUnit: 18.00 },
    { id: 13, name: 'Goiabada', stock: 8, unit: 'kg', minStock: 2, costPerUnit: 15.00 },
    { id: 14, name: 'Abobrinha', stock: 15, unit: 'kg', minStock: 5, costPerUnit: 7.50 },
    { id: 15, name: 'Alho', stock: 2, unit: 'kg', minStock: 0.5, costPerUnit: 25.00 },
    { id: 16, name: 'Azeite', stock: 5, unit: 'L', minStock: 1, costPerUnit: 40.00 },
    { id: 17, name: 'Cheddar', stock: 5, unit: 'kg', minStock: 2, costPerUnit: 42.00 },
    { id: 18, name: 'Bacon', stock: 10, unit: 'kg', minStock: 3, costPerUnit: 35.00 },
];

export const MOCK_RECIPES: Recipe = {
    1: [ // Pizza de Calabresa
        { ingredientId: 8, quantity: 1, unit: 'un' }, // Massa
        { ingredientId: 2, quantity: 150, unit: 'ml' }, // Molho de tomate
        { ingredientId: 3, quantity: 200, unit: 'g' }, // Mussarela
        { ingredientId: 4, quantity: 120, unit: 'g' }, // Calabresa
        { ingredientId: 11, quantity: 50, unit: 'g' }, // Cebola
    ],
    2: [ // Pizza de Mussarela
        { ingredientId: 8, quantity: 1, unit: 'un' }, // Massa
        { ingredientId: 2, quantity: 150, unit: 'ml' }, // Molho de tomate
        { ingredientId: 3, quantity: 250, unit: 'g' }, // Mussarela
    ],
    3: [ // Pizza de Frango com Catupiry
        { ingredientId: 8, quantity: 1, unit: 'un' }, // Massa
        { ingredientId: 2, quantity: 150, unit: 'ml' }, // Molho de tomate
        { ingredientId: 3, quantity: 200, unit: 'g' }, // Mussarela
        { ingredientId: 5, quantity: 180, unit: 'g' }, // Frango
        { ingredientId: 6, quantity: 100, unit: 'g' }, // Catupiry
    ],
    4: [ // Pizza de Chocolate
        { ingredientId: 8, quantity: 1, unit: 'un' }, // Massa
        { ingredientId: 7, quantity: 250, unit: 'g' }, // Chocolate
    ],
    5: [ // Pizza de Abobrinha
        { ingredientId: 8, quantity: 1, unit: 'un' }, // Massa
        { ingredientId: 3, quantity: 220, unit: 'g' }, // Mussarela
        { ingredientId: 14, quantity: 180, unit: 'g' }, // Abobrinha
        { ingredientId: 15, quantity: 10, unit: 'g' }, // Alho
        { ingredientId: 16, quantity: 20, unit: 'ml' }, // Azeite
    ],
     6: [ // Pizza Portuguesa
        { ingredientId: 8, quantity: 1, unit: 'un' }, // Massa
        { ingredientId: 2, quantity: 150, unit: 'ml' }, // Molho
        { ingredientId: 3, quantity: 200, unit: 'g' }, // Mussarela
        { ingredientId: 9, quantity: 100, unit: 'g' }, // Presunto
        { ingredientId: 10, quantity: 2, unit: 'un' }, // Ovo
        { ingredientId: 11, quantity: 50, unit: 'g' }, // Cebola
        { ingredientId: 12, quantity: 30, unit: 'g' }, // Azeitona
    ],
    8: [ // Pizza Romeu e Julieta
        { ingredientId: 8, quantity: 1, unit: 'un' }, // Massa
        { ingredientId: 3, quantity: 200, unit: 'g' }, // Mussarela
        { ingredientId: 13, quantity: 150, unit: 'g' }, // Goiabada
    ]
};

export const MOCK_ADDON_RECIPES: Recipe = {
    1: [ // Borda de Catupiry
        { ingredientId: 6, quantity: 80, unit: 'g' }, // Catupiry
    ],
    2: [ // Borda de Cheddar
        { ingredientId: 17, quantity: 80, unit: 'g' }, // Cheddar
    ],
    3: [ // Borda de Chocolate
        { ingredientId: 7, quantity: 100, unit: 'g' }, // Chocolate em Barra
    ],
    4: [ // Extra Bacon
        { ingredientId: 18, quantity: 50, unit: 'g' }, // Bacon
    ],
    5: [ // Extra Mussarela
        { ingredientId: 3, quantity: 80, unit: 'g' }, // Queijo Mussarela
    ],
    6: [ // Extra Calabresa
        { ingredientId: 4, quantity: 60, unit: 'g' }, // Calabresa
    ],
};

export const MOCK_FIXED_COSTS: FixedCost[] = [
    { id: 1, name: "Aluguel", value: 4500.00 },
    { id: 2, name: "Salários (CLT)", value: 12500.00 },
    { id: 3, name: "Luz", value: 850.75 },
    { id: 4, name: "Água", value: 330.50 },
    { id: 5, name: "Internet", value: 199.90 },
    { id: 6, name: "Sistema de Gestão", value: 250.00 },
    { id: 7, name: "Marketing e Anúncios", value: 600.00 },
    { id: 8, name: "Telefone", value: 120.00 },
    { id: 9, name: "Contabilidade", value: 550.00 },
    { id: 10, name: "Materiais de Limpeza", value: 280.00 },
    { id: 11, name: "Gás", value: 700.00 },
];


export const MOCK_APP_USERS: User[] = [
    { id: 1, name: 'Dono da Pizzaria Funchal', username: 'admin', password: '123', role: 'Admin', avatarUrl: 'https://i.ibb.co/M5R9dfRm/logo-funchal.jpg', employmentStatus: 'Ativo' },
    { id: 2, name: 'Roberto Carlos', username: 'cozinha', password: '123', role: 'Cozinha', salary: 2800.00, employmentStatus: 'Ativo', workload: '36h/semana', schedule: '18:00 - 00:00' },
    { id: 3, name: 'Gilberto Gil', username: 'gil', password: '123', role: 'Motoboy', avatarUrl: 'https://i.pravatar.cc/150?u=motoboy-1', salary: 1800.00, employmentStatus: 'Ativo', workload: 'Escala 12x36', schedule: '19:00 - 01:00 (sex-dom)' },
    { id: 4, name: 'Caetano Veloso', username: 'caetano', password: '123', role: 'Motoboy', avatarUrl: 'https://i.pravatar.cc/150?u=motoboy-2', salary: 1800.00, employmentStatus: 'Ativo', workload: 'Escala 12x36', schedule: '19:00 - 01:00 (sex-dom)' },
    { id: 5, name: 'Maria Bethânia', username: 'bethania', password: '123', role: 'Motoboy', avatarUrl: 'https://i.pravatar.cc/150?u=motoboy-3', salary: 1800.00, employmentStatus: 'Ativo', workload: 'Escala 12x36', schedule: '19:00 - 01:00 (qui-sab)' },
    { id: 7, name: 'Gerente Geral', username: 'gerente', password: '123', role: 'Gerente', salary: 4500.00, employmentStatus: 'Ativo', workload: '44h/semana', schedule: '17:00 - 01:00' },
];


export const MOCK_MOTOBOYS: Motoboy[] = [
    { id: 3, name: 'Gilberto Gil', avatarUrl: 'https://i.pravatar.cc/150?u=motoboy-1', status: 'Livre', location: { lat: -23.5505, lng: -46.6333 }, assignedOrderIds: [] },
    { id: 4, name: 'Caetano Veloso', avatarUrl: 'https://i.pravatar.cc/150?u=motoboy-2', status: 'Livre', location: { lat: -23.5515, lng: -46.6343 }, assignedOrderIds: [] },
    { id: 5, name: 'Maria Bethânia', avatarUrl: 'https://i.pravatar.cc/150?u=motoboy-3', status: 'Em Entrega', location: { lat: -23.5610, lng: -46.6500 }, assignedOrderIds: ['1235'] },
];


// --- FISCAL MOCK DATA ENHANCEMENTS ---

export const MOCK_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

/** Generates a realistic (but fake) 44-digit access key. */
export const generateAccessKey = (docId: string): string => {
    const uf = '35'; // SP
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const cnpj = '12345678000199';
    const model = '65'; // NFC-e
    const series = '001';
    const nfNum = docId.padStart(9, '0');
    const type = '1'; // Emissão Normal
    const randomCode = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const keyWithoutDV = `${uf}${year}${month}${cnpj}${model}${series}${nfNum}${type}${randomCode}`;
    const dv = Math.floor(Math.random() * 10); // Mock DV
    return `${keyWithoutDV}${dv}`;
};


export const generateMockXml = (customerName: string, total: number, accessKey: string, docType: 'NFC-e' | 'NF-e' = 'NFC-e') => `<?xml version="1.0" encoding="UTF-8"?>
<${docType === 'NFC-e' ? 'NFCe' : 'NFe'} xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${accessKey}" versao="4.00">
    <ide></ide>
  </infNFe>
</${docType === 'NFC-e' ? 'NFCe' : 'NFe'}>`;

// FIX: Added missing generateCancellationXml function
export const generateCancellationXml = (originalXml: string, protocol: string): string => {
    const chNFe = originalXml.match(/<infNFe Id="NFe(\d+)"/)?.[1] || '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<procEventoNFe versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <evento versao="1.00">
    <infEvento Id="ID110111${chNFe}01">
      <cOrgao>35</cOrgao>
      <tpAmb>2</tpAmb>
      <CNPJ>12345678000199</CNPJ>
      <chNFe>${chNFe}</chNFe>
      <dhEvento>${new Date().toISOString()}</dhEvento>
      <tpEvento>110111</tpEvento>
      <nSeqEvento>1</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>Cancelamento</descEvento>
        <nProt>${protocol}</nProt>
        <xJust>Cancelamento solicitado pelo emissor.</xJust>
      </detEvento>
    </infEvento>
  </evento>
  <retEvento versao="1.00">
    <infEvento>
      <tpAmb>2</tpAmb>
      <verAplic>MockAPI 1.0</verAplic>
      <cOrgao>35</cOrgao>
      <cStat>135</cStat>
      <xMotivo>Evento registrado e vinculado a NF-e</xMotivo>
      <chNFe>${chNFe}</chNFe>
      <tpEvento>110111</tpEvento>
      <xEvento>Cancelamento</xEvento>
      <nSeqEvento>1</nSeqEvento>
      <dhRegEvento>${new Date().toISOString()}</dhRegEvento>
      <nProt>${protocol}</nProt>
    </infEvento>
  </retEvento>
</procEventoNFe>`;
};

// FIX: Added missing MOCK_FISCAL_DOCS constant
export const MOCK_FISCAL_DOCS: FiscalDocument[] = [
    {
        id: '1234',
        orderId: '1234',
        accessKey: generateAccessKey('1234'),
        authorizationProtocol: '135240728203000',
        type: 'NFC-e',
        date: '2024-07-28T20:30:15Z',
        value: 57.00,
        customer: 'João Silva',
        status: 'Autorizado',
        environment: 'Homologação',
        xmlContent: generateMockXml('João Silva', 57.00, generateAccessKey('1234')),
        pdfUrl: MOCK_PDF_URL,
    },
    {
        id: '89',
        orderId: '1237',
        accessKey: generateAccessKey('89'),
        authorizationProtocol: '135240728211500',
        type: 'NFC-e',
        date: '2024-07-28T21:15:20Z',
        value: 55.00,
        customer: 'Ana Costa',
        status: 'Cancelado',
        rejectionReason: 'Cancelamento homologado pela SEFAZ.',
        environment: 'Produção',
        xmlContent: generateMockXml('Ana Costa', 55.00, generateAccessKey('89')),
        cancellationXmlContent: generateCancellationXml(generateMockXml('Ana Costa', 55.00, generateAccessKey('89')), '335240728211530'),
        pdfUrl: MOCK_PDF_URL,
    },
    {
        id: '1238',
        orderId: '1238',
        accessKey: generateAccessKey('1238'),
        authorizationProtocol: '135240727195000',
        type: 'NFC-e',
        date: '2024-07-27T19:50:30Z',
        value: 42.00,
        customer: 'Lucas Souza',
        status: 'Autorizado',
        environment: 'Produção',
        xmlContent: generateMockXml('Lucas Souza', 42.00, generateAccessKey('1238')),
        pdfUrl: MOCK_PDF_URL,
    },
    {
        id: '1240',
        orderId: '1240',
        accessKey: generateAccessKey('1240'),
        authorizationProtocol: '135240726200000',
        type: 'NFC-e',
        date: '2024-07-26T20:00:45Z',
        value: 45.00,
        customer: 'Marcos Rocha',
        status: 'Rejeitado',
        rejectionReason: '215: Falha no schema XML.',
        environment: 'Homologação',
        xmlContent: generateMockXml('Marcos Rocha', 45.00, generateAccessKey('1240')),
    }
];