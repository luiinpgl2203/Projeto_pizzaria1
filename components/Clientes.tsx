

import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import ClientModal from './ClientModal';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

interface ClientesProps {
    clients: Client[];
    onAddClient: (clientData: Omit<Client, 'id' | 'registrationDate'>) => void;
    onUpdateClient: (clientId: number, updatedData: Partial<Client>) => void;
    onRemoveClient: (clientId: number) => void;
}

const Clientes: React.FC<ClientesProps> = ({ clients, onAddClient, onUpdateClient, onRemoveClient }) => {
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.name.toLowerCase().includes(filter.toLowerCase()) ||
            client.phone.replace(/\D/g, '').includes(filter.replace(/\D/g, ''))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [clients, filter]);

    const handleOpenModal = (client: Client | null = null) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingClient(null);
        setIsModalOpen(false);
    };

    const handleSaveClient = (clientData: Omit<Client, 'id'> | Client) => {
        if ('id' in clientData) {
            onUpdateClient(clientData.id, clientData);
        } else {
            onAddClient(clientData as Omit<Client, 'id' | 'registrationDate'>);
        }
        handleCloseModal();
    };
    
    const handleDeleteClient = (client: Client) => {
        if (window.confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
            onRemoveClient(client.id);
        }
    };

    const formatAddress = (address: Client['address']) => {
        let fullAddress = `${address.type} ${address.street}, ${address.number} - ${address.neighborhood}`;
        if (address.complement) {
            fullAddress += `, ${address.complement}`;
        }
        return fullAddress;
    }

    return (
        <>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Gerenciamento de Clientes</h3>
                            <p className="text-sm text-gray-500">Adicione, edite e consulte as informações dos seus clientes.</p>
                        </div>
                        <button onClick={() => handleOpenModal()} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
                            Adicionar Cliente
                        </button>
                    </div>
                    <div className="w-full md:w-1/2">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou telefone..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 text-gray-800 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClients.map(client => (
                        <div key={client.id} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col transition-shadow hover:shadow-xl group">
                            <div className="p-4 flex-grow">
                                <h4 className="font-bold text-lg text-gray-800">{client.name}</h4>
                                <div className="mt-2 space-y-2 text-sm text-gray-600">
                                    <p><strong>Telefone:</strong> {client.phone}</p>
                                    <p><strong>Endereço:</strong> {formatAddress(client.address)}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 flex justify-end items-center gap-3 border-t border-gray-200 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button onClick={() => handleOpenModal(client)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors" title="Editar">
                                    <EditIcon />
                                </button>
                                <button onClick={() => handleDeleteClient(client)} className="text-brand-red hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors" title="Excluir">
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                     {filteredClients.length === 0 && (
                        <div className="col-span-full text-center p-8 text-gray-500 bg-white rounded-lg shadow-md">
                            <p>Nenhum cliente encontrado com os critérios de busca.</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <ClientModal
                    client={editingClient}
                    onClose={handleCloseModal}
                    onSave={handleSaveClient}
                />
            )}
        </>
    );
};

export default Clientes;