import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Paperclip, Smile, Search, MoreVertical, Mic, Send, Crop, Paintbrush, FileVideo, VolumeX, Scissors, Play, Pause, Pencil, X, Reply, Check, CheckCheck } from 'lucide-react';

// --- TYPES ---
interface Message {
    id: number;
    text: string | React.ReactNode;
    sender: 'user' | 'bot';
    timestamp: string;
    status?: 'sent' | 'delivered' | 'seen';
    replyTo?: Omit<Message, 'replyTo'>;
    imageUrl?: string;
    audioInfo?: { url: string; duration: string; };
    transcription?: string;
    edited?: boolean;
}

interface ConversationSession {
    id: string;
    startTime: string;
    summary: string;
    messages: Message[];
}

interface ClientConversation {
    id: string;
    clientName: string;
    clientPhone: string;
    avatarUrl: string;
    sessions: ConversationSession[];
}

interface WhatsappProps {
    chatbotUpsellEnabled: boolean;
    chatbotCouponEnabled: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}


// --- MOCK DATA ---
const MOCK_CONVERSATIONS: ClientConversation[] = [
    {
        id: 'client-1',
        clientName: 'Maria Oliveira',
        clientPhone: '(11) 98765-4321',
        avatarUrl: 'https://i.pravatar.cc/150?u=maria-oliveira',
        sessions: [
            {
                id: 'session-1a',
                startTime: '2024-07-28T20:40:00Z',
                summary: 'Pedido #1235 - Status da Entrega',
                messages: [
                    { id: 1, text: "Olá! Gostaria de consultar o status do meu pedido. Meu nome é Maria Oliveira.", sender: 'user', timestamp: '20:40', status: 'seen' },
                    { id: 2, text: "Olá, Maria! Só um momento, estou verificando seu pedido...", sender: 'bot', timestamp: '20:40' },
                    { id: 3, text: (<div><p>Encontrei seu pedido <span className="font-bold">#1235</span>!</p><p>O status atual é: <span className="font-semibold text-brand-orange">Saiu para Entrega</span>. 🛵</p><p>O motoboy já está a caminho e a estimativa é que chegue em 10-15 minutos no seu endereço.</p></div>), sender: 'bot', timestamp: '20:41' },
                    { id: 4, text: "Ótimo, obrigada!", sender: 'user', timestamp: '20:42', status: 'seen' }
                ]
            },
        ]
    },
    {
        id: 'client-2',
        clientName: 'João Silva',
        clientPhone: '(11) 91234-5678',
        avatarUrl: 'https://i.pravatar.cc/150?u=joao-silva',
        sessions: [
            {
                id: 'session-2a',
                startTime: '2024-07-28T20:25:00Z',
                summary: 'Pedido #1234 - Pizza de Calabresa',
                messages: [
                    { id: 1, text: "Boa noite! Queria uma pizza de calabresa e uma refri 2L", sender: 'user', timestamp: '20:25', status: 'seen' },
                    { id: 2, text: "Boa noite, João! Anotado. Pizza de Calabresa (Grande) e um Refrigerante 2L. É para entrega?", sender: 'bot', timestamp: '20:26' },
                    { id: 3, text: "Isso, entrega.", sender: 'user', timestamp: '20:26', status: 'seen' },
                    { id: 7, text: "Dinheiro. Vou precisar de troco para R$ 100,00.", sender: 'user', timestamp: '20:29', status: 'seen' },
                    { id: 8, text: (<div><p className="font-bold">📄 OK, VAMOS CONFIRMAR:</p><ul className="list-disc list-inside pl-2 text-sm"><li>1 Pizza Grande: Calabresa</li><li>1 Refrigerante 2L</li></ul><p><strong>Total:</strong> R$ 57,00</p><p><strong>Entrega:</strong> Rua das Flores, 123</p><p><strong>Pagamento:</strong> Dinheiro (troco p/ R$ 100)</p><p className="mt-2">Está tudo correto?</p></div>), sender: 'bot', timestamp: "20:30" },
                    { id: 9, text: "Correto.", sender: 'user', timestamp: "20:31", status: 'seen', replyTo: {id: 8, text: "📄 OK, VAMOS CONFIRMAR:", sender: 'bot', timestamp: '20:30'} },
                    { id: 10, text: "Perfeito! Seu pedido #1234 já está na cozinha e chegará em 40-50 min. Obrigado!", sender: 'bot', timestamp: '20:31' }
                ]
            }
        ]
    },
];

const SIMULATION_CLIENT = { id: 'simulation', clientName: 'Simulação de Atendimento', clientPhone: 'Interativo', avatarUrl: 'https://i.ibb.co/M5R9dfRm/logo-funchal.jpg', sessions: [], };
const initialSimulationMessages: Message[] = [
    { id: 1, text: 'Oi', sender: 'user', timestamp: '20:00', status: 'sent' },
    { id: 2, text: (<div><p>Olá! Bem-vindo(a) à Pizzaria Funchal! 🍕</p><p className="mt-2">Como posso te ajudar hoje?</p></div>), sender: 'bot', timestamp: '20:00' },
];
const menuMessage: Message = { id: 3, text: (<div className="space-y-1 text-sm whitespace-pre-wrap font-mono"><p className="font-bold text-center mb-2">🍕 --- NOSSO CARDÁPIO --- 🍕</p><p className="font-semibold">*PIZZAS SALGADAS (Grande)*</p><p>- Calabresa................R$ 45,00</p><p>- Mussarela................R$ 42,00</p><p>- Frango com Catupiry......R$ 50,00</p><p>- Portuguesa...............R$ 52,00</p><p className="font-semibold mt-2">*PIZZAS DOCES (Grande)*</p><p>- Chocolate................R$ 55,00</p><p>- Romeu e Julieta..........R$ 53,00</p><p className="font-semibold mt-2">*BEBIDAS*</p><p>- Refrigerante 2L..........R$ 12,00</p><p>- Refrigerante (Lata)......R$ 7,00</p><p className="text-xs italic mt-3">Para pedir, me diga o tamanho, a quantidade e o(s) sabor(es).</p></div>), sender: 'bot', timestamp: '20:01' };
const flowAfterMenu: Message[] = [
    { id: 4, text: "1 pizza grande, meio frango com catupiry, meio portuguesa. E uma coca 2L (capricha no catupiry, por favor!)", sender: 'user', timestamp: "20:02", status: 'delivered' },
    { id: 5, text: "Anotado! Seu pedido é para retirada no balcão ou para entrega?", sender: 'bot', timestamp: "20:03" },
    { id: 6, text: "Entrega", sender: 'user', timestamp: "20:03", status: 'delivered' },
    { id: 11, text: (<div className="space-y-1"><p className="font-bold">📄 RESUMO DO PEDIDO:</p><ul className="list-disc list-inside pl-2 text-sm"><li>1 Pizza Grande: Meio Frango c/ Catupiry, Meio Portuguesa</li><li>1 Coca-Cola 2L</li><li>Observação: Caprichar no catupiry</li></ul><p><strong>Total:</strong> R$ 64,00</p><p><strong>Entrega:</strong> Rua das Flores, 456, Centro</p><p><strong>Pagamento:</strong> Cartão de Crédito</p><p className="mt-2">Está tudo correto?</p></div>), sender: 'bot', timestamp: "20:07" },
    { id: 12, text: "Confirmar", sender: 'user', timestamp: "20:08", status: 'seen' },
    { id: 13, text: "Maravilha! Seu pedido #1242 foi confirmado e já está sendo preparado! Previsão de entrega: 40-50 minutos. A Pizzaria Funchal agradece a sua preferência! 😊", sender: 'bot', timestamp: "20:08" },
];
const checkStatusFlow: Message[] = [ { id: 14, text: "Gostaria de consultar o status do meu pedido.", sender: 'user', timestamp: '20:15', status: 'delivered' }, { id: 17, text: (<div><p>Encontrei seu pedido <span className="font-bold">#1235</span>!</p><p>O status atual é: <span className="font-semibold text-brand-orange">Saiu para Entrega</span>. 🛵</p><p>O motoboy já está a caminho.</p></div>), sender: 'bot' , timestamp: '20:17'}, ];
const audioFlow: Message[] = [ { id: 20, sender: 'user', text: '', timestamp: '20:20', status: 'delivered', audioInfo: { url: '#', duration: '0:07' } }, { id: 21, text: "Transcrevendo seu áudio... 🎤", sender: 'bot', timestamp: '20:21' }, { id: 22, text: (<div><p>Entendi! Você disse: <i className="text-gray-600">"Boa noite, queria saber se a pizza de abobrinha ainda está disponível."</i></p><p>Sim, está disponível! Deseja adicioná-la ao pedido?</p></div>), sender: 'bot', timestamp: '20:22', transcription: 'Boa noite, queria saber se a pizza de abobrinha ainda está disponível.' } ];

const EMOJIS = ['😀', '😂', '😍', '🤔', '😊', '🥳', '🍕', '🎉', '👍', '🙏', '❤️', '🔥', '💯', '✅', '🛵', '😋'];

const highlightText = (text: string | React.ReactNode, highlight: string): React.ReactNode => {
    if (typeof text !== 'string' || !highlight.trim()) { return text; }
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.split(regex).map((part, index) => regex.test(part) ? <mark key={index} className="bg-yellow-300 rounded">{part}</mark> : part );
};

const SeenStatus: React.FC<{ status?: Message['status'] }> = ({ status }) => {
    if (!status) return null;
    switch(status) {
        case 'sent': return <Check className="text-gray-400" size={16} />;
        case 'delivered': return <CheckCheck className="text-gray-400" size={16} />;
        case 'seen': return <CheckCheck className="text-blue-500" size={16} />;
        default: return null;
    }
}

const Lightbox: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-pulse-bg" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl">&times;</button>
        <img src={imageUrl} alt="Visualização ampliada" className="max-w-[90vw] max-h-[90vh] object-contain" />
    </div>
);

const FilePreviewModal: React.FC<{ file: File; onClose: () => void; onSend: (file: File, caption: string) => void; showToast: WhatsappProps['showToast'] }> = ({ file, onClose, onSend, showToast }) => {
    const [caption, setCaption] = useState('');
    const [isCropping, setIsCropping] = useState(false);
    const [showEmojiPalette, setShowEmojiPalette] = useState(false);
    const [placedEmojis, setPlacedEmojis] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const src = URL.createObjectURL(file);

    const handlePlaceEmoji = (emoji: string) => {
        setPlacedEmojis(prev => [...prev, { id: Date.now(), emoji, x: 50, y: 50 }]);
        setShowEmojiPalette(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
            <header className="flex-shrink-0 h-16 bg-gray-800 text-white flex items-center justify-between px-4">
                <div className="flex items-center gap-4 text-xl">
                    <button onClick={() => isImage && setIsCropping(!isCropping)} title="Cortar" className={isCropping ? 'text-brand-orange' : ''}><Crop /></button>
                    <div className="relative">
                        <button onClick={() => setShowEmojiPalette(!showEmojiPalette)} title="Adicionar Emoji"><Smile /></button>
                        {showEmojiPalette && (
                            <div className="absolute bottom-full left-0 mb-2 bg-gray-700 p-2 rounded-lg grid grid-cols-4 gap-2">
                                {EMOJIS.map(emoji => <button key={emoji} onClick={() => handlePlaceEmoji(emoji)} className="text-2xl hover:bg-gray-600 rounded-md">{emoji}</button>)}
                            </div>
                        )}
                    </div>
                    <button onClick={() => showToast('Ferramenta de desenhar em desenvolvimento.', 'warning')} title="Desenhar"><Paintbrush /></button>
                    {isVideo && <>
                        <button onClick={() => showToast('Ferramenta de cortar vídeo em desenvolvimento.', 'warning')} title="Cortar Vídeo"><Scissors /></button>
                        <button onClick={() => showToast('Ferramenta de silenciar em desenvolvimento.', 'warning')} title="Silenciar Vídeo"><VolumeX /></button>
                    </>}
                </div>
                <button onClick={onClose}><X size={24} /></button>
            </header>
            <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                    {isImage && <img src={src} alt="Preview" className="max-w-full max-h-full object-contain" />}
                    {isVideo && <video src={src} controls className="max-w-full max-h-full" />}
                    {!isImage && !isVideo && <div className="text-white text-center"><FileVideo size={80} className="mx-auto" /><p className="mt-4">{file.name}</p></div>}
                    {isCropping && <div className="absolute inset-4 border-4 border-dashed border-white pointer-events-none"></div>}
                    {placedEmojis.map(item => <div key={item.id} className="absolute text-4xl cursor-move" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}>{item.emoji}</div>)}
                </div>
            </main>
            <footer className="flex-shrink-0 bg-gray-800 p-4 flex items-center gap-4">
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Adicionar legenda..." className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-full focus:ring-brand-orange focus:border-brand-orange" />
                <button onClick={() => onSend(file, caption)} className="bg-brand-orange text-white rounded-full w-12 h-12 flex items-center justify-center text-xl flex-shrink-0"><Send /></button>
            </footer>
        </div>
    );
};

const Whatsapp: React.FC<WhatsappProps> = ({ chatbotUpsellEnabled, chatbotCouponEnabled, showToast }) => {
    const [conversations] = useState([SIMULATION_CLIENT, ...MOCK_CONVERSATIONS]);
    const [selectedId, setSelectedId] = useState<string>(SIMULATION_CLIENT.id);
    const [filter, setFilter] = useState('');
    const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [simMessages, setSimMessages] = useState<Message[]>(initialSimulationMessages);
    const [simOptionsVisible, setSimOptionsVisible] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (messageContainerRef.current) { messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight; }
    }, [simMessages, selectedId, isInfoSidebarOpen, searchTerm, editingMessage]);

    useEffect(() => {
        if (editingMessage && typeof editingMessage.text === 'string') {
            setMessageInput(editingMessage.text);
            messageInputRef.current?.focus();
        }
    }, [editingMessage]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { setPreviewFile(file); }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendFile = (file: File, caption: string) => {
        // FIX: Corrected typo from `replyTo` to `replyingTo` to correctly reference component state.
        const newMessage: Message = { id: Date.now(), text: caption, sender: 'user', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), status: 'sent', imageUrl: URL.createObjectURL(file), ...(replyingTo && { replyTo: { ...replyingTo } }) };
        setSimMessages(prev => [...prev, newMessage]);
        setPreviewFile(null);
        setReplyingTo(null);
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        if (editingMessage) {
            setSimMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text: messageInput, edited: true } : m));
        } else {
            // FIX: Corrected typo from `replyTo` to `replyingTo` to correctly reference component state.
            const newMessage: Message = {
                id: Date.now(),
                text: messageInput,
                sender: 'user',
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
                ...(replyingTo && { replyTo: { ...replyingTo } })
            };
            setSimMessages(prev => [...prev, newMessage]);

            // Simulate status updates for the sent message
            setTimeout(() => {
                setSimMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
            }, 800);
            setTimeout(() => {
                setSimMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'seen' } : m));
            }, 1500);
        }

        setMessageInput('');
        setReplyingTo(null);
        setEditingMessage(null);
    };
    
    const handleOptionClick = (option: 'menu' | 'status' | 'audio') => {
        setSimOptionsVisible(false);
        setIsSimulating(true);
        const flow = option === 'menu' ? [menuMessage, ...flowAfterMenu] : option === 'status' ? checkStatusFlow : audioFlow;
        let finalFlow: Message[] = [...flow];

        if (option === 'menu' && chatbotUpsellEnabled) {
            const summaryIndex = finalFlow.findIndex((msg: Message) => msg.id === 11);
            if (summaryIndex !== -1) {
                const newFlow: Message[] = finalFlow.slice(0, summaryIndex + 1);
                const upsellMessage: Message = { id: 11.1, text: (<div><p>Já que você pediu uma pizza de Frango com Catupiry, que tal adicionar nossa borda recheada por apenas R$8,00? Fica uma delícia! 🧀</p></div>), sender: 'bot', timestamp: "20:07" };
                const userAcceptsUpsell: Message = { id: 11.2, text: "Opa, boa ideia! Pode adicionar.", sender: 'user', timestamp: "20:08", status: 'seen' };
                newFlow.push(upsellMessage, userAcceptsUpsell);
                const finalMessageOriginal = finalFlow.find(msg => msg.id === 13);
                if (finalMessageOriginal) { newFlow.push({ ...finalMessageOriginal, text: "Maravilha! Seu pedido #1242 com borda recheada foi confirmado! O novo total é R$72,00. Previsão de entrega: 40-50 minutos. Obrigado! 😊" }); }
                finalFlow = newFlow;
            }
        }

        let delay = 500;
        finalFlow.forEach(msg => { setTimeout(() => setSimMessages(prev => [...prev, msg]), delay); delay += msg.sender === 'bot' ? 1200 : 800; });
        setTimeout(() => setIsSimulating(false), delay);
    };
    
    const resetSimulation = () => { setSimMessages(initialSimulationMessages); setSimOptionsVisible(true); }

    const filteredConversations = useMemo(() => conversations.filter(c => c.clientName.toLowerCase().includes(filter.toLowerCase()) || c.clientPhone.toLowerCase().includes(filter.toLowerCase())), [filter, conversations]);
    const selectedConversation = conversations.find(c => c.id === selectedId);

    const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => (
        <div className={`flex items-end gap-2 group relative ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-md lg:max-w-2xl px-3 py-2 rounded-lg shadow-sm animate-slide-in-right relative ${msg.sender === 'user' ? 'bg-whatsapp-outgoing' : 'bg-white'}`}>
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.sender === 'user' && typeof msg.text === 'string' && msg.text && (
                        <button onClick={() => setEditingMessage(msg)} className="p-1.5 rounded-full bg-gray-200 text-gray-600" title="Editar"><Pencil size={12} /></button>
                    )}
                    <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-full bg-gray-200 text-gray-600" title="Responder"><Reply size={14} /></button>
                </div>

                {msg.replyTo && (
                    <div className="p-2 mb-1 border-l-2 border-brand-orange bg-black/5 rounded-md">
                        <p className="font-semibold text-brand-orange text-sm">{msg.replyTo.sender === 'user' ? 'Você' : selectedConversation?.clientName}</p>
                        <p className="text-sm text-gray-600 truncate">{typeof msg.replyTo.text === 'string' ? msg.replyTo.text : 'Mensagem complexa'}</p>
                    </div>
                )}
                 {msg.imageUrl && <button onClick={() => setLightboxImage(msg.imageUrl!)} className="w-full"><img src={msg.imageUrl} className="rounded-md max-w-xs w-full cursor-pointer" alt="Imagem enviada" /></button>}
                 {msg.audioInfo && (
                     <div className="flex items-center gap-2 min-w-[250px]">
                         <button className="text-gray-600"><Play /></button>
                         <div className="flex-1 h-1 bg-gray-300 rounded-full"></div>
                         <span className="text-xs text-gray-500">{msg.audioInfo.duration}</span>
                     </div>
                 )}
                <div className="text-gray-900 whitespace-pre-wrap break-words">{highlightText(msg.text, searchTerm)}</div>
                {msg.transcription && <p className="text-xs italic text-gray-500 mt-2 border-t pt-1">Transcrição: "{msg.transcription}"</p>}
                <div className="text-xs text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                    {msg.edited && <span className="italic mr-1">(editado)</span>}
                    {msg.timestamp}
                    {msg.sender === 'user' && <SeenStatus status={msg.status} />}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg flex h-[calc(100vh-10rem)] overflow-hidden border border-gray-200">
            {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
            {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} onSend={handleSendFile} showToast={showToast} />}
            <aside className="w-full md:w-1/3 max-w-sm flex flex-col border-r border-gray-200 bg-white">
                <header className="p-3 border-b border-gray-200 bg-gray-100 flex-shrink-0"><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search /></div><input type="text" placeholder="Buscar ou começar uma nova conversa" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-2 pl-10 bg-white border border-gray-300 rounded-full focus:ring-brand-orange focus:border-brand-orange text-sm"/></div></header>
                <ul className="flex-1 overflow-y-auto">{filteredConversations.map(conv => (<li key={conv.id} onClick={() => setSelectedId(conv.id)} className={`flex items-center p-3 cursor-pointer transition-colors border-l-4 ${selectedId === conv.id ? 'bg-gray-200 border-brand-orange' : 'border-transparent hover:bg-gray-100'}`}><img src={conv.avatarUrl} alt={conv.clientName} className="w-12 h-12 rounded-full mr-4" /><div className="flex-1 overflow-hidden"><h4 className="font-semibold text-gray-800 truncate">{conv.clientName}</h4><p className="text-sm text-gray-500 truncate">{conv.id === 'simulation' ? 'Atendimento Interativo' : conv.clientPhone}</p></div></li>))}</ul>
            </aside>
            <main className="flex-1 flex flex-col bg-whatsapp-bg relative overflow-hidden">
                {!selectedConversation ? (<div className="flex-1 flex items-center justify-center text-gray-400">Selecione uma conversa para ver o histórico.</div>) : (
                    <>
                        <header className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-100 flex-shrink-0">
                            {isSearchVisible ? (
                                <div className="flex items-center w-full bg-white rounded-full"><Search className="text-gray-400 mx-3" /><input type="text" placeholder="Buscar na conversa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 bg-transparent focus:outline-none" autoFocus /><button onClick={() => { setIsSearchVisible(false); setSearchTerm(''); }} className="p-2 text-gray-500 hover:text-gray-800"><X size={20} /></button></div>
                            ) : (
                                <><div onClick={() => setIsInfoSidebarOpen(true)} className="flex items-center cursor-pointer"><img src={selectedConversation.avatarUrl} alt={selectedConversation.clientName} className="w-10 h-10 rounded-full mr-3" /><div><h4 className="font-semibold text-gray-800">{selectedConversation.clientName}</h4><p className="text-xs text-green-600">{selectedConversation.clientPhone}</p></div></div><div className="flex items-center gap-4 text-gray-500"><Search className="cursor-pointer hover:text-gray-800" onClick={() => setIsSearchVisible(true)} /><MoreVertical className="cursor-pointer hover:text-gray-800" /></div></>
                            )}
                        </header>
                        <div ref={messageContainerRef} className="flex-1 p-6 overflow-y-auto chat-bg-pattern space-y-4">
                            {(selectedId === 'simulation' ? simMessages : selectedConversation.sessions.flatMap(s => s.messages)).map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
                            {simOptionsVisible && selectedId === 'simulation' && (<div className="flex justify-center flex-wrap gap-4 animate-slide-in-right pt-4"><button onClick={() => handleOptionClick('menu')} className="bg-brand-orange text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600">Ver Cardápio</button><button onClick={() => handleOptionClick('status')} className="bg-brand-orange text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600">Consultar Entrega</button><button onClick={() => handleOptionClick('audio')} className="bg-brand-orange text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600">Enviar Áudio</button></div>)}
                            {selectedId === 'simulation' && <button onClick={resetSimulation} disabled={isSimulating} className="text-sm bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-700 disabled:bg-gray-400 mx-auto block mt-4">Reiniciar Simulação</button>}
                        </div>
                        <footer className="bg-gray-100 border-t border-gray-200 flex-shrink-0">
                            {(replyingTo || editingMessage) && <div className="p-2 bg-gray-200 flex justify-between items-center text-sm">
                                <div className={`border-l-2 ${editingMessage ? 'border-yellow-500' : 'border-brand-orange'} pl-2`}>
                                    <p className="font-semibold">{editingMessage ? "Editando Mensagem" : `Respondendo a ${replyingTo?.sender === 'user' ? "Você" : selectedConversation.clientName}`}</p>
                                    <p className="text-gray-600 truncate">{typeof (editingMessage?.text || replyingTo?.text) === 'string' ? (editingMessage?.text || replyingTo?.text) : 'Conteúdo complexo'}</p>
                                </div>
                                <button onClick={() => { setReplyingTo(null); setEditingMessage(null); setMessageInput('') }} className="p-1"><X size={18} /></button>
                            </div>}
                            <div className="p-3 flex items-center gap-4 relative">
                                {showEmojiPicker && (
                                    <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-2 bg-white p-2 rounded-lg shadow-lg grid grid-cols-6 gap-1">
                                        {EMOJIS.map(emoji => <button key={emoji} onClick={() => setMessageInput(prev => prev + emoji)} className="text-2xl p-1 hover:bg-gray-200 rounded-md">{emoji}</button>)}
                                    </div>
                                )}
                                <div className="flex text-gray-500 gap-4 text-xl"><button onClick={() => setShowEmojiPicker(p => !p)}><Smile className="cursor-pointer hover:text-gray-800" /></button><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} /><button onClick={() => fileInputRef.current?.click()}><Paperclip className="cursor-pointer hover:text-gray-800" /></button></div>
                                <input ref={messageInputRef} type="text" placeholder="Digite uma mensagem" value={messageInput} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} onChange={e => setMessageInput(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-full focus:ring-brand-orange focus:border-brand-orange text-gray-900" disabled={selectedId === 'simulation' && isSimulating} />
                                <button onClick={handleSendMessage} className="bg-brand-orange text-white rounded-full w-12 h-12 flex items-center justify-center text-xl flex-shrink-0 hover:bg-brand-red transition-colors">{messageInput ? <Send /> : <Mic />}</button>
                            </div>
                        </footer>
                    </>
                )}
                <aside className={`absolute top-0 right-0 h-full w-full md:w-1/3 max-w-sm bg-gray-50 border-l border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out ${isInfoSidebarOpen ? 'translate-x-0' : 'translate-x-full'} z-20 flex flex-col`}><header className="flex items-center p-4 bg-gray-100 border-b border-gray-200 flex-shrink-0"><button onClick={() => setIsInfoSidebarOpen(false)} className="mr-4 text-gray-600 hover:text-gray-900"><X size={24} /></button><h3 className="font-semibold">Dados do contato</h3></header><div className="flex-1 overflow-y-auto"><div className="p-6 flex flex-col items-center bg-white"><img src={selectedConversation?.avatarUrl} alt={selectedConversation?.clientName} className="w-24 h-24 rounded-full mb-4" /><h4 className="text-xl font-semibold">{selectedConversation?.clientName}</h4><p className="text-gray-500">{selectedConversation?.clientPhone}</p></div><div className="p-4"><h5 className="text-sm font-semibold text-brand-orange mb-2">Mídia, links e arquivos</h5><div className="text-center text-gray-400 p-8 bg-white rounded-md">Nenhuma mídia encontrada.</div></div></div></aside>
            </main>
        </div>
    );
};

export default Whatsapp;