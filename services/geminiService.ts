import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Ingredient } from '../types';

// This is a placeholder for the API key. In a real application,
// this should be handled securely, e.g., via environment variables.
// NOTE: As per instructions, we must assume process.env.GEMINI_API_KEY is available.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

/**
 * A utility function to retry an async operation with exponential backoff.
 * Specifically targets 503 "UNAVAILABLE" errors from the Gemini API.
 */
async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 2000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.toString().toLowerCase();
      // Retry on 503 Unavailable or related overload errors
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("unavailable") ||
        errorMessage.includes("overloaded") ||
        errorMessage.includes("capacity")
      ) {
        console.warn(`Gemini API busy (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        // For other errors (like 400, 401, 403, 404), throw immediately
        throw error;
      }
    }
  }
  // This line is theoretically unreachable due to the throw in the loop, but satisfies TypeScript.
  throw lastError || new Error("Max retries reached without success.");
}


/**
 * Converts a File object to a GoogleGenAI.Part object.
 */
const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64Data, mimeType: file.type } });
    };
    reader.onerror = error => reject(error);
  });
};


/**
 * Analyzes multiple menu files (images or PDFs) and extracts items, descriptions, prices, sizes and ingredients.
 * @param files The array of files of the menu.
 * @param onStatusChange Optional callback to update UI with progress messages.
 * @returns A structured list of menu items.
 */
export const analyzeMenuImage = async (
    files: File[],
    onStatusChange?: (message: string) => void
) => {
  if (!API_KEY) return { success: false, message: "API Key não configurada." };
  if (files.length === 0) return { success: false, message: "Nenhum arquivo selecionado."};

  try {
    onStatusChange?.('Preparando arquivos...');
    const fileParts = await Promise.all(files.map(fileToGenerativePart));

    onStatusChange?.('Analisando arquivo...');

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.ARRAY,
                description: 'Lista de todos os produtos individuais encontrados no cardápio.',
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Nome completo do produto, incluindo tamanho/variação. Ex: 'Pizza de Calabresa (Grande)'." },
                        category: { type: SchemaType.STRING, description: "Categoria EXATA do cardápio. Ex: 'Pizzas Especiais'." },
                        price: { type: SchemaType.NUMBER, description: 'Preço do produto.' },
                        description: { type: SchemaType.STRING, description: "Descrição do item, como aparece no cardápio." },
                        ingredients: {
                            type: SchemaType.ARRAY,
                            description: 'Array de strings with os nomes dos ingredientes. Retornar array vazio se não aplicável.',
                            items: { type: SchemaType.STRING }
                        }
                    },
                    required: ["name", "category", "price", "description"]
                }
            },
        }
    });

    const prompt = `Analise estes arquivos de um cardápio de pizzaria. Sua tarefa é extrair CADA item individualmente, de forma EXTREMAMENTE FIEL ao cardápio.

REGRAS CRÍTICAS:
1.  **ITENS INDIVIDUAIS**: Se um item tem variações (ex: "Vinho taça" e "Vinho garrafa" ou "Pizza grande" e "Pizza pequena"), trate CADA VARIAÇÃO COMO UM PRODUTO SEPARADO. O nome do produto DEVE incluir a variação. Ex: "Vinho Tinto (Taça)", "Vinho Tinto (Garrafa)". NÃO agrupe variações em um único item com múltiplos preços.
2.  **CATEGORIAS EXATAS**: Copie o nome da categoria EXATAMENTE como está no cardápio (ex: "Pizzas Tradicionais", "Bebidas sem Álcool"). NÃO invente ou generalize categorias.
3.  **DESCRIÇÃO FIEL**: Copie a descrição (incluindo a lista de ingredientes para pizzas) EXATAMENTE como está no cardápio para o campo 'description'.
4.  **EXTRAÇÃO DE INGREDIENTES**: A partir da descrição, extraia uma lista dos nomes dos ingredientes individuais para um campo 'ingredients'. Normalize os nomes dos ingredientes para o singular e em minúsculas (ex: 'calabresas' vira 'calabresa', 'ovos' vira 'ovo'). Se um item não tiver ingredientes (como uma bebida), retorne um array vazio.

Para cada item, extraia:
- **name**: O nome completo, incluindo o tamanho/variação.
- **category**: A categoria exata da seção onde o item se encontra.
- **price**: O preço do item.
- **description**: A descrição completa, como está no cardápio.
- **ingredients**: Um array de strings com os nomes dos ingredientes normalizados.

Retorne os dados como um array de objetos JSON, seguindo o schema.`;

    const apiCall = () => model.generateContent([
        ...fileParts,
        { text: prompt }
    ]);
    
    const result = await withRetry(apiCall);
    const text = result.response.text();
    const parsedJson = JSON.parse(text);
    
    return { success: true, data: parsedJson };

  } catch (error: any) {
    console.error("Error analyzing menu image with Gemini:", error);
    if (error.toString().includes('503') || error.toString().includes('UNAVAILABLE')) {
        return { success: false, message: "O serviço de análise está sobrecarregado no momento. Por favor, tente novamente em alguns minutos." };
    }
    return { success: false, message: `Ocorreu um erro ao processar o cardápio: ${error.message || error}` };
  }
};


export const analyzeInvoices = async (
    files: File[],
    onStatusChange?: (message: string) => void
) => {
  if (!API_KEY) return { success: false, message: "API Key não configurada." };
  if (files.length === 0) return { success: false, message: "Nenhum arquivo selecionado."};

  try {
    onStatusChange?.('Preparando arquivos...');
    const fileParts = await Promise.all(files.map(fileToGenerativePart));
    onStatusChange?.('Analisando documentos...');
    
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    parsedIngredients: {
                        type: SchemaType.ARRAY,
                        description: "Lista de todos os ingredientes extraídos das notas fiscais.",
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                detectedName: { type: SchemaType.STRING, description: "Nome exato do produto na nota." },
                                quantity: { type: SchemaType.NUMBER, description: "Quantidade comprada." },
                                unit: { type: SchemaType.STRING, description: "Unidade de medida (kg, L, un, etc.)." },
                                totalPrice: { type: SchemaType.NUMBER, description: "Preço total pago pelo item." },
                                pricePerUnit: { type: SchemaType.NUMBER, description: "Preço por unidade de medida." }
                            },
                            required: ["detectedName", "quantity", "unit", "totalPrice", "pricePerUnit"]
                        }
                    },
                    parsedFixedCosts: {
                        type: SchemaType.ARRAY,
                        description: "Lista de todas as contas de consumo extraídas.",
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                costType: { type: SchemaType.STRING, description: "Tipo de custo (Luz, Água, etc.)." },
                                value: { type: SchemaType.NUMBER, description: "Valor total da conta." }
                            },
                             required: ["costType", "value"]
                        }
                    }
                }
            }
        }
    });

    const prompt = `Você é um assistente para uma pizzaria. Sua tarefa é analisar um lote de documentos (imagens ou PDFs) que podem ser notas fiscais de fornecedores de ingredientes ou contas de consumo (luz, água, internet, etc.).

Para CADA arquivo, faça o seguinte:
1.  **Classifique o documento**: É uma 'nota_fiscal_ingrediente' ou uma 'conta_consumo'?
2.  **Extraia as informações relevantes** com base na classificação.

**Para 'nota_fiscal_ingrediente':**
- Itere sobre CADA item listado.
- Para cada item, extraia:
    - \`detectedName\`: O nome do produto exatamente como está na nota (ex: "QUEIJO MUSSARELA PEÇA 5KG SADIA").
    - \`quantity\`: A quantidade comprada (ex: 5).
    - \`unit\`: A unidade de medida da quantidade (ex: 'kg', 'L', 'un').
    - \`totalPrice\`: O valor total pago pelo conjunto de itens (ex: 194.50 por 5kg).
    - \`pricePerUnit\`: O valor por unidade (calcule se não estiver explícito, dividindo o totalPrice pela quantity).

**Para 'conta_consumo':**
- Extraia:
    - \`costType\`: O tipo de despesa, classificado em uma das seguintes categorias: "Luz", "Água", "Internet", "Gás", "Telefone", "Aluguel", "Contabilidade".
    - \`value\`: O valor total da conta.

**REGRAS FINAIS:**
- Agrupe todos os resultados em um único objeto JSON.
- Se um arquivo não puder ser processado ou não se encaixar nas categorias, ignore-o.
- Seja extremamente preciso com os números. Use ponto como separador decimal.
- Normalize as unidades para 'kg', 'g', 'L', 'ml', 'un'.

Retorne os dados no formato JSON especificado no schema.`;

    const apiCall = () => model.generateContent([
        ...fileParts,
        { text: prompt }
    ]);

    const result = await withRetry(apiCall);
    const text = result.response.text();
    const parsedJson = JSON.parse(text);
    return { success: true, data: parsedJson };

  } catch (error: any) {
    console.error("Error analyzing invoices with Gemini:", error);
    if (error.toString().includes('503') || error.toString().includes('UNAVAILABLE')) {
        return { success: false, message: "O serviço de análise está sobrecarregado no momento. Por favor, tente novamente em alguns minutos." };
    }
    return { success: false, message: `Ocorreu um erro ao processar os documentos: ${error.message || error}` };
  }
};


export interface SupplierInfo {
    name: string;
    specialty: string;
    phone?: string;
    city: string;
    whatsapp?: string;
    website?: string;
    price_info?: string;
}

/**
 * Finds suppliers for a given list of low-stock ingredients.
 * @param lowStockIngredients An array of ingredient names that are low in stock.
 * @returns A structured list of potential suppliers.
 */
export const findSuppliers = async (lowStockIngredients: string[]): Promise<{ success: boolean; data?: SupplierInfo[]; message?: string; }> => {
    if (!API_KEY) return { success: false, message: "API Key não configurada." };
    if (lowStockIngredients.length === 0) return { success: false, message: "Nenhum item com estoque baixo para buscar." };

    const prompt = `Você é um assistente de compras especializado para uma pizzaria em Boituva, SP, Brasil.
Sua tarefa é encontrar fornecedores atacadistas REAIS e verificáveis para os seguintes itens com estoque baixo: ${lowStockIngredients.join(', ')}.

Use a busca para encontrar fornecedores que entregam em Boituva, SP, ou que estão localizados nas proximidades (ex: Sorocaba, Tatuí, Porto Feliz). Priorize fornecedores conhecidos por terem os melhores preços para restaurantes.

Para cada fornecedor encontrado, forneça as seguintes informações em um formato de ARRAY JSON VÁLIDO. Não inclua nenhum texto, explicação ou formatação markdown fora do array JSON.

- name: O nome oficial do fornecedor.
- specialty: A principal área de atuação (ex: "Laticínios e Frios", "Farinhas e Secos", "Distribuidor Geral de Alimentos").
- phone: O número de telefone principal para contato.
- whatsapp: O número de WhatsApp comercial, se disponível.
- website: O site oficial do fornecedor, se disponível.
- city: A cidade onde o fornecedor está localizado.
- price_info: Uma breve nota sobre os preços, se encontrar alguma informação que sugira que são competitivos para empresas (ex: "Foco em atacado", "Preços competitivos para restaurantes").`;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            // @ts-ignore
            tools: [{ googleSearch: {} }],
        });

        const apiCall = () => model.generateContent(prompt);

        const result = await withRetry(apiCall);
        
        let jsonText = result.response.text().trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.substring(7);
        }
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.substring(0, jsonText.length - 3);
        }

        const jsonMatch = jsonText.match(/\[.*\]/s);
        if (jsonMatch) {
            return { success: true, data: JSON.parse(jsonMatch[0]) };
        }
        
        return { success: true, data: JSON.parse(jsonText) };

    } catch (error: any) {
        console.error("Error finding suppliers with Gemini:", error);
        return { success: false, message: `Erro ao buscar fornecedores: ${error.message || error}` };
    }
};

export interface PredictionResult {
    success: boolean;
    data?: {
        ingredientName: string;
        predictedNeed: number;
        reason: string;
        urgency: "baixa" | "media" | "alta";
    }[];
    message?: string;
}

export async function predictInventoryNeeds(
    ingredients: any[],
    orders: any[],
    stockMovements: any[]
): Promise<PredictionResult> {
    if (!API_KEY) return { success: false, message: "API Key não configurada." };
    
    // Using model for analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analise os dados de estoque e vendas de uma pizzaria para prever necessidades de compra:
    ESTOQUE ATUAL: ${JSON.stringify(ingredients.map(i => ({ name: i.name, stock: i.stock, unit: i.unit, minStock: i.minStock })))}
    VENDAS RECENTES (Últimos 50 pedidos): ${JSON.stringify(orders.slice(-50).map(o => ({ date: o.date, items: o.items.map((it:any) => it.name) })))}
    MOVIMENTAÇÕES RECENTES: ${JSON.stringify(stockMovements.slice(-50))}
    
    Sua tarefa é prever quais ingredientes precisarão ser repostos nos próximos 7 dias com base na velocidade de saída e estoque atual.
    Considere que o estoque mínimo (minStock) é o limite de segurança.
    
    Retorne APENAS um array JSON válido de objetos com:
    - ingredientName: nome do ingrediente
    - predictedNeed: quantidade estimada a comprar (número)
    - reason: justificativa baseada nos dados (ex: "Consumo alto nos últimos 3 dias")
    - urgency: "baixa", "media" ou "alta"
    
    Não inclua explicações fora do JSON.`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        
        // Sanitize response
        if (text.startsWith('```json')) text = text.substring(7);
        if (text.endsWith('```')) text = text.substring(0, text.length - 3);
        
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            return { success: true, data: JSON.parse(jsonMatch[0]) };
        }
        
        return { success: true, data: JSON.parse(text) };

    } catch (error: any) {
        console.error("Error predicting inventory needs with Gemini:", error);
        return { success: false, message: `Erro na previsão: ${error.message || error}` };
    }
}
