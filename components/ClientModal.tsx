


import React, { useState, useEffect } from 'react';
import { Client, Address } from '../types';

interface ClientModalProps {
    client: Omit<Client, 'id'> | Client | null;
    onClose: () => void;
    onSave: (client: Omit<Client, 'id'> | Client) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ client, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Client>>({});

    useEffect(() => {
        if (client) {
            setFormData(client);
        } else {
            // Defaults for new client
            setFormData({
                name: '',
                phone: '',
                cpf: '',
                birthDate: '',
                address: {
                    type: 'Rua',
                    street: '',
                    number: '',
                    neighborhood: '',
                    complement: ''
                }
            });
        }
    }, [client]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: {
                ...(prev.address as Address),
                [name]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.address?.street || !formData.address?.number || !formData.address?.neighborhood) {
            alert('Nome, Telefone e Endereço completo são obrigatórios.');
            return;
        }
        onSave(formData as Client);
    };

    const isEditing = client && 'id' in client;
    const addressTypes: Address['type'][] = ['Rua', 'Avenida', 'Alameda', 'Estrada', 'Travessa', 'Outro'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl text-gray-800">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-lg font-bold">{isEditing ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h3>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* DADOS PESSOAIS */}
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-md font-semibold text-gray-700 px-2">Dados Pessoais</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Telefone / WhatsApp</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CPF</label>
                                <input type="text" name="cpf" value={formData.cpf || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                                <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* ENDEREÇO */}
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-md font-semibold text-gray-700 px-2">Endereço de Entrega</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                <div className="relative mt-1">
                                    <select
                                        name="type"
                                        value={formData.address?.type || 'Rua'}
                                        onChange={handleAddressChange}
                                        className="appearance-none block w-full p-2 pr-10 bg-gray-50 border border-gray-300 text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                                    >
                                        {addressTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Logradouro (Rua, Avenida, etc.)</label>
                                <input type="text" name="street" value={formData.address?.street || ''} onChange={handleAddressChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Número</label>
                                <input type="text" name="number" value={formData.address?.number || ''} onChange={handleAddressChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                                <input type="text" name="neighborhood" value={formData.address?.neighborhood || ''} onChange={handleAddressChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Complemento (opcional)</label>
                                <input type="text" name="complement" placeholder="Apto, bloco, etc." value={formData.address?.complement || ''} onChange={handleAddressChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                            </div>
                        </div>
                    </fieldset>

                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Salvar Cliente</button>
                </div>
            </form>
        </div>
    );
};

export default ClientModal;