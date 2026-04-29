import { Order, FiscalDocument, InvalidationRecord } from '../types';
import { generateMockXml, MOCK_PDF_URL, generateAccessKey, generateCancellationXml } from '../constants';

// This is a mock API service to simulate interactions with a real fiscal API provider.
// In a real application, this file would be replaced with actual HTTP calls to an API
// like PlugNotas, TecnoSpeed, etc., and would live on a secure backend server.

const simulateNetworkRequest = <T,>(data: T, delay = 1500): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

const simulatePotentialFailure = <T,>(successData: T, delay = 2500): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate a 20% chance of failure
            if (Math.random() < 0.2) {
                reject(new Error('Rejeição 215: Falha no schema XML. Verifique os dados do produto ou cliente.'));
            } else {
                resolve(successData);
            }
        }, delay);
    });
};


export const fiscalApiService = {
  /**
   * Simulates emitting a new fiscal document (NFC-e).
   */
  emitirNFCe: async (
      order: Order, 
      docId: string, 
      environment: 'Homologação' | 'Produção'
  ): Promise<Partial<FiscalDocument>> => {
    console.log(`[API MOCK] Iniciando emissão da NFC-e ${docId} para o pedido ${order.id} em ${environment}...`);
    
    const accessKey = generateAccessKey(docId);
    
    const successData: Partial<FiscalDocument> = {
        status: 'Autorizado',
        accessKey: accessKey,
        authorizationProtocol: `135${Date.now()}`.slice(0, 15),
        xmlContent: generateMockXml(order.customerName, order.total, accessKey, 'NFC-e'),
        pdfUrl: MOCK_PDF_URL,
        environment: environment,
    };
    
    try {
        const result = await simulatePotentialFailure(successData);
        console.log(`[API MOCK] NFC-e ${docId} autorizada com sucesso.`);
        return result;
    } catch (error: any) {
        console.error(`[API MOCK] Falha ao emitir NFC-e ${docId}:`, error.message);
        throw new Error(error.message);
    }
  },

  /**
   * Simulates canceling an existing fiscal document.
   */
  cancelarNFCe: async (doc: FiscalDocument): Promise<Partial<FiscalDocument>> => {
    console.log(`[API MOCK] Solicitando cancelamento da NFC-e ${doc.id}...`);

    if (!doc.xmlContent) {
        throw new Error("Documento original não possui XML para ser cancelado.");
    }
    
    const protocol = `335${Date.now()}`.slice(0, 15);
    
    const response: Partial<FiscalDocument> = {
        status: 'Cancelado',
        rejectionReason: 'Cancelamento homologado pela SEFAZ.',
        cancellationXmlContent: generateCancellationXml(doc.xmlContent, protocol),
    };
    
    const result = await simulateNetworkRequest(response, 2000);
    console.log(`[API MOCK] NFC-e ${doc.id} cancelada com sucesso.`);
    return result;
  },

  /**
   * Simulates invalidating a range of fiscal document numbers.
   */
  inutilizarNumeracao: async (
      series: number, 
      startNumber: number, 
      endNumber: number, 
      reason: string, 
      environment: 'Homologação' | 'Produção'
  ): Promise<InvalidationRecord> => {
    console.log(`[API MOCK] Solicitando inutilização da série ${series}, números ${startNumber}-${endNumber} em ${environment}...`);
    
    if (startNumber > endNumber) {
        throw new Error("O número inicial não pode ser maior que o final.");
    }

    const response: InvalidationRecord = {
        id: `inut-${Date.now()}`,
        series,
        startNumber,
        endNumber,
        reason,
        protocol: `235${Date.now()}`.slice(0, 15),
        date: new Date().toISOString(),
        environment
    };

    const result = await simulateNetworkRequest(response, 1800);
    console.log(`[API MOCK] Faixa ${startNumber}-${endNumber} inutilizada com sucesso.`);
    return result;
  }
};