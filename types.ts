


export interface Address {
  type: 'Rua' | 'Avenida' | 'Estrada' | 'Alameda' | 'Travessa' | 'Outro';
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  cpf: string;
  birthDate: string; // YYYY-MM-DD
  address: Address;
  registrationDate: string; // ISO string
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description?: string;
  cost?: number; // Custo de compra da unidade (ex: lata, garrafa)
  alcoholic?: boolean;
}

export interface Addon {
  id: number;
  name: string;
  price: number;
}

export type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Pix';

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Pendente' | 'Em Preparo' | 'Pronto para Entrega' | 'Saiu para Entrega' | 'Concluído' | 'Cancelado';
  paymentMethod?: PaymentMethod;
  items: OrderItem[];
  orderType: 'Entrega' | 'Mesa' | 'Retirada';
  source: 'Manual' | 'iFood' | 'Aiqfome';
  address?: string;
  postalCode?: string;
  tableNumber?: string;
  coordinates?: { lat: number; lng: number };
  fiscalDocumentId?: string;
  observation?: string;
  changeFor?: number;
  closedInCashRegisterDate?: string;
  deliveredByMotoboyId?: number;
}

export interface OrderItem {
    productId: number;
    name: string;
    quantity: number;
    price: number;
    addons?: Addon[];
}

export interface NewOrderData {
    customerName: string;
    items: OrderItem[];
    paymentMethod?: PaymentMethod;
    observation: string;
    orderType: 'Entrega' | 'Mesa' | 'Retirada';
    address?: string;
    postalCode?: string;
    tableNumber?: string;
    changeFor?: number;
}

export interface Ingredient {
  id: number;
  name: string;
  stock: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'un';
  minStock: number;
  costPerUnit: number;
  pizzeriaId?: string;
  yieldFactor?: number; // 0 to 1, where 1 means no loss (e.g. 0.9 for 10% loss)
}

export interface StockMovement {
  id: string;
  ingredientId: number;
  ingredientName: string;
  type: 'Entrada' | 'Saída' | 'Ajuste';
  quantity: number;
  unit: string;
  reason: string;
  userName: string;
  timestamp: string;
  pizzeriaId: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  category: string;
  pizzeriaId: string;
  purchaseHistory?: {
    date: string;
    total: number;
    description: string;
  }[];
}

export interface FixedCost {
  id: number;
  name: string;
  value: number;
  pizzeriaId?: string;
}

export type SystemRole = 'Admin' | 'Cozinha' | 'Motoboy' | 'Gerente';

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  role: SystemRole;
  avatarUrl?: string;
  salary?: number;
  employmentStatus: 'Ativo' | 'Inativo';
  workload?: string;
  schedule?: string;
  pizzeriaId?: string;
}

export interface InvalidationRecord {
    id: string;
    series: number;
    startNumber: number;
    endNumber: number;
    reason: string;
    protocol: string;
    date: string;
    environment: 'Homologação' | 'Produção';
}

export interface FiscalDocument {
    id: string; // Corresponde ao nNF (Número da Nota Fiscal)
    orderId: string;
    accessKey?: string; // Chave de Acesso (44 dígitos)
    authorizationProtocol?: string;
    type: 'NFC-e' | 'NF-e';
    date: string;
    value: number;
    customer: string;
    status: 'Processando' | 'Autorizado' | 'Rejeitado' | 'Cancelando' | 'Cancelado';
    environment: 'Homologação' | 'Produção';
    rejectionReason?: string;
    xmlContent?: string;
    cancellationXmlContent?: string;
    pdfUrl?: string;
}


export interface PizzeriaInfo {
  name: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface RecipePart {
  ingredientId: number;
  quantity: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'un';
  yieldFactor?: number; // Overrides ingredient yield factor if present
}

export interface Recipe {
  [productId: number]: RecipePart[];
}

export interface AddonRecipe {
  [addonId: number]: RecipePart[];
}

export interface Motoboy {
    id: number;
    name: string;
    avatarUrl: string;
    status: 'Livre' | 'Em Entrega' | 'Retornando';
    location: {
        lat: number;
        lng: number;
    };
    assignedOrderIds: string[];
}

export interface CashRegisterClosing {
    id: string; // 'YYYY-MM-DD'
    date: string;
    totalRevenue: number;
    paymentMethodTotals: Record<PaymentMethod, number>;
    closedByUserId: number;
    closedByUserName: string;
    closingTime: string; // ISO string
    status?: 'Active' | 'Reversed';
    reversedByUserId?: number;
    reversedByUserName?: string;
    reversalTime?: string;
    reversalReason?: string;
}

// Types for Cost Analysis
export interface ParsedIngredient {
    detectedName: string;
    quantity: number;
    unit: 'kg' | 'g' | 'L' | 'ml' | 'un';
    totalPrice: number;
    pricePerUnit: number;
}
export interface ParsedFixedCost {
    costType: string;
    value: number;
}
export interface AnalysisResult {
    parsedIngredients: ParsedIngredient[];
    parsedFixedCosts: ParsedFixedCost[];
}
export interface ConfirmedUpdate {
    ingredientUpdates: {
        systemIngredientId: number;
        newCost: number;
        quantityToAdd: number;
    }[];
    fixedCostUpdates: {
        systemCostId: number;
        newValue: number;
    }[];
}