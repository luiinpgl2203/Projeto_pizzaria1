import React, { useState, useRef } from 'react';
import AiqfomeIcon from './icons/AiqfomeIcon';
import IfoodIcon from './icons/IfoodIcon';
import UploadIcon from './icons/UploadIcon';
import { PizzeriaInfo } from '../types';
import { FileText, Trash2, Plus } from 'lucide-react';

// Reusable Toggle Switch Component
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-brand-lime/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-lime"></div>
    </label>
);

interface SettingsProps {
    chatbotUpsellEnabled: boolean;
    setChatbotUpsellEnabled: (enabled: boolean) => void;
    chatbotCouponEnabled: boolean;
    setChatbotCouponEnabled: (enabled: boolean) => void;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    pizzeriaInfo: PizzeriaInfo;
    onUpdatePizzeriaInfo: (info: Partial<PizzeriaInfo>) => void;
    currentUser: any;
}


const Settings: React.FC<SettingsProps> = ({ chatbotUpsellEnabled, setChatbotUpsellEnabled, chatbotCouponEnabled, setChatbotCouponEnabled, showToast, pizzeriaInfo, onUpdatePizzeriaInfo, currentUser }) => {
    const [instructions, setInstructions] = useState('');
    const [ifoodConnected, setIfoodConnected] = useState(true);
    const [aiqfomeConnected, setAiqfomeConnected] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [menuFile, setMenuFile] = useState<{ file: File, previewUrl: string | null } | null>(null);
    const [savedMenuFileName, setSavedMenuFileName] = useState<string | null>("cardapio_padrao.pdf"); // Default menu


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 8 && hour < 12) return 'Bom dia!';
        if (hour >= 12 && hour < 18) return 'Boa tarde!';
        return 'Boa noite!';
    }

    const handleSaveInstructions = () => {
        if(instructions.trim() === '') {
            showToast("Por favor, digite alguma instrução para salvar.", 'warning');
            return;
        }
        showToast(`Instruções salvas! O chatbot agora seguirá a nova diretriz.`, 'success');
    };

     const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setMenuFile({ file, previewUrl: URL.createObjectURL(file) });
            } else {
                setMenuFile({ file, previewUrl: null });
            }
        }
    };

    const handleSaveMenu = () => {
        if (menuFile) {
            setSavedMenuFileName(menuFile.file.name);
            setMenuFile(null); // Clear selection after saving
            showToast('Novo cardápio salvo! O chatbot usará este arquivo a partir de agora.', 'success');
        }
    };

    const removeSelectedFile = () => {
        if(menuFile?.previewUrl) {
            URL.revokeObjectURL(menuFile.previewUrl);
        }
        setMenuFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }


    const handleInviteEmployee = async (email: string) => {
        if (!email.trim() || !email.includes('@')) {
            showToast("Digite um e-mail válido.", 'warning');
            return;
        }
        
        if (!currentUser?.pizzeriaId) return;

        try {
            // Save invite globally so we can find it when the user logs in
            // Using setDoc on email as ID (sanitized) or just a collection
            // Firestore IDs can't contain certain characters, but emails usually are fine except maybe some symbols
            const inviteId = email.toLowerCase().replace(/[#$\[\].]/g, '_');
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            await setDoc(doc(db, 'invites', inviteId), {
                email: email.toLowerCase(),
                pizzeriaId: currentUser.pizzeriaId,
                role: 'Funcionário',
                invitedBy: currentUser.email,
                createdAt: new Date().toISOString()
            });

            showToast(`Convite enviado para ${email}!`, 'success');
        } catch (error) {
            console.error(error);
            showToast("Erro ao enviar convite.", 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Configurações Gerais</h3>
            
            <div className="space-y-8 divide-y divide-gray-200">

                {/* Perfil da Pizzaria Section */}
                <div className="pb-6">
                    <h4 className="text-lg font-bold text-gray-900">Perfil da Pizzaria</h4>
                    <p className="text-sm text-gray-500 mb-4">Essas informações serão usadas em relatórios e no contato com clientes.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome da Pizzaria</label>
                            <input 
                                type="text" 
                                value={pizzeriaInfo.name} 
                                onChange={(e) => onUpdatePizzeriaInfo({ name: e.target.value })}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">CNPJ (Opcional)</label>
                            <input 
                                type="text" 
                                value={pizzeriaInfo.cnpj || ''} 
                                onChange={(e) => onUpdatePizzeriaInfo({ cnpj: e.target.value })}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Telefone de Contato</label>
                            <input 
                                type="text" 
                                value={pizzeriaInfo.phone || ''} 
                                onChange={(e) => onUpdatePizzeriaInfo({ phone: e.target.value })}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Endereço Completo</label>
                            <input 
                                type="text" 
                                value={pizzeriaInfo.address || ''} 
                                onChange={(e) => onUpdatePizzeriaInfo({ address: e.target.value })}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                            />
                        </div>
                    </div>
                </div>

                {/* Gestão de Funcionários Section */}
                <div className="pt-6">
                    <h4 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Gestão de Funcionários</h4>
                    <p className="text-sm text-gray-500 mb-4">Adicione os e-mails dos funcionários que podem acessar o sistema desta unidade.</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex gap-2">
                            <input 
                                id="employee-email"
                                type="email" 
                                placeholder="e-mail do funcionário"
                                className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                            />
                            <button 
                                onClick={() => {
                                    const input = document.getElementById('employee-email') as HTMLInputElement;
                                    handleInviteEmployee(input.value);
                                    input.value = '';
                                }}
                                className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 font-bold"
                            >
                                Convidar
                            </button>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between bg-white p-3 rounded shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold">
                                        {(currentUser?.displayName || currentUser?.name || 'U')[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{currentUser?.displayName || currentUser?.name || 'Proprietário'}</p>
                                        <p className="text-xs text-gray-500">{currentUser?.email || 'admin@pizzaria.com'}</p>
                                    </div>
                                </div>
                                <span className="bg-brand-orange/10 text-brand-orange text-[10px] uppercase font-black px-2 py-1 rounded">Admin / Dono</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic">* O funcionário deve fazer login via Google com o e-mail convidado.</p>
                </div>

                {/* Atendente Virtual Section */}
                <div className="pt-6">
                    <h4 className="text-lg font-bold text-gray-900">Atendente Virtual (Gemini)</h4>
                    <div className="space-y-6 mt-4">
                        <div>
                            <h4 className="font-semibold text-gray-900">Status do Chatbot</h4>
                            <div className="flex items-center mt-2">
                                <span className="h-3 w-3 rounded-full bg-brand-lime mr-2"></span>
                                <p className="text-gray-700">Ativo e operando 24/7 no WhatsApp Business.</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 pl-5">A integração com o WhatsApp é realizada através de uma API não oficial.</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900">Mensagem de Saudação Dinâmica</h4>
                            <p className="text-gray-600 mt-1">O chatbot adapta a saudação com base no horário do dia.</p>
                            <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <p className="italic text-gray-700">"{getGreeting()} Bem-vindo(a) à Pizzaria Funchal! Como posso ajudar a montar seu pedido hoje?"</p>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-900">Personalização Avançada (System Instruction)</h4>
                            <textarea 
                                rows={4}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                className="w-full mt-2 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                                placeholder="Adicione instruções personalizadas para o Gemini aqui. Ex: 'Sempre ofereça a promoção do dia no final do pedido.' ou 'Use um tom mais divertido e informal.'"
                            />
                            <button onClick={handleSaveInstructions} className="mt-2 bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
                                Salvar Instruções
                            </button>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Inteligência Proativa do Chatbot</h4>
                            <p className="text-gray-600 mt-1 mb-4">Permita que o Gemini tome iniciativas para aumentar as vendas e reengajar clientes.</p>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                                    <div>
                                        <h5 className="font-medium text-gray-800">Oferecer produtos adicionais (Upsell)</h5>
                                        <p className="text-sm text-gray-500">O bot sugerirá itens extras ou bordas recheadas com base no pedido do cliente.</p>
                                    </div>
                                    <ToggleSwitch checked={chatbotUpsellEnabled} onChange={setChatbotUpsellEnabled} />
                                </div>

                                <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                                    <div>
                                        <h5 className="font-medium text-gray-800">Oferecer cupons para reengajamento</h5>
                                        <p className="text-sm text-gray-500">O bot poderá enviar cupons para clientes que não compram há algum tempo (simulado).</p>
                                    </div>
                                    <ToggleSwitch checked={chatbotCouponEnabled} onChange={setChatbotCouponEnabled} />
                                </div>
                            </div>
                             <div className="mt-6">
                                <button
                                    onClick={() => showToast('Funcionalidade para adicionar novas inteligências em desenvolvimento.', 'warning')}
                                    className="flex items-center gap-2 text-sm font-semibold text-brand-orange border-2 border-dashed border-gray-300 rounded-lg px-4 py-2 hover:bg-orange-50 hover:border-brand-orange transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Nova Inteligência
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                 {/* Integrations Section */}
                <div className="pt-8">
                     <h4 className="text-lg font-bold text-gray-900">Integrações de Pedidos</h4>
                     <p className="text-gray-600 mt-1 mb-4">Centralize os pedidos de outras plataformas diretamente no seu sistema.</p>
                     <div className="space-y-4">
                        {/* iFood Integration */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 rounded-lg bg-gray-50 gap-4">
                           <div className="flex items-center gap-4">
                               <IfoodIcon isLarge={true} />
                               <div>
                                    <h5 className="font-bold text-lg text-gray-800">iFood</h5>
                                    <p className="text-sm text-gray-500">Sincronize pedidos do iFood diretamente na sua tela de Pedidos.</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${ifoodConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    <span className="text-sm font-semibold">{ifoodConnected ? 'Conectado' : 'Desconectado'}</span>
                                </div>
                                <button onClick={() => setIfoodConnected(!ifoodConnected)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${ifoodConnected ? 'bg-red-100 text-brand-red hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                    {ifoodConnected ? 'Desconectar' : 'Conectar'}
                                </button>
                           </div>
                        </div>
                         {/* Aiqfome Integration */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 rounded-lg bg-gray-50 gap-4">
                           <div className="flex items-center gap-4">
                               <AiqfomeIcon isLarge={true} />
                               <div>
                                    <h5 className="font-bold text-lg text-gray-800">Aiqfome</h5>
                                    <p className="text-sm text-gray-500">Receba e gerencie pedidos do Aiqfome sem sair do sistema.</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${aiqfomeConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    <span className="text-sm font-semibold">{aiqfomeConnected ? 'Conectado' : 'Desconectado'}</span>
                                </div>
                                <button onClick={() => setAiqfomeConnected(!aiqfomeConnected)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${aiqfomeConnected ? 'bg-red-100 text-brand-red hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                    {aiqfomeConnected ? 'Desconectar' : 'Conectar'}
                                </button>
                           </div>
                        </div>
                     </div>
                </div>

                {/* Chatbot Menu Upload Section */}
                <div className="pt-8">
                    <h4 className="text-lg font-bold text-gray-900">Cardápio do Chatbot</h4>
                    <p className="text-gray-600 mt-1 mb-4">Carregue o arquivo (PDF ou imagem) do cardápio que será enviado para os clientes pelo atendente virtual.</p>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h5 className="font-semibold text-gray-800">Cardápio Ativo</h5>
                                <p className="text-sm text-gray-500">{savedMenuFileName || "Nenhum cardápio carregado."}</p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,image/jpeg,image/png"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                            >
                                <UploadIcon /> Alterar Cardápio
                            </button>
                        </div>

                        {menuFile && (
                            <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-in-right">
                                <h6 className="text-sm font-semibold text-gray-700 mb-2">Novo cardápio pronto para salvar:</h6>
                                <div className="bg-white p-3 rounded-md border border-gray-300 flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {menuFile.previewUrl ? (
                                            <img src={menuFile.previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        ) : (
                                            <FileText className="w-10 h-10 text-red-500 flex-shrink-0" />
                                        )}
                                        <span className="text-sm font-medium text-gray-800 truncate">{menuFile.file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <button
                                            onClick={handleSaveMenu}
                                            className="bg-brand-lime text-green-900 font-bold px-4 py-2 rounded-md hover:bg-green-500 transition-colors text-sm"
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            onClick={removeSelectedFile}
                                            className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                                            title="Remover seleção"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;