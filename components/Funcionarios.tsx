import React, { useState, useEffect, useRef } from 'react';
import { User, SystemRole } from '../types';
import { FaUserCheck, FaUserSlash } from 'react-icons/fa6';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

// --- MODAL COMPONENT ---
interface UserModalProps {
    user: Omit<User, 'id' | 'employmentStatus'> | User | null;
    onClose: () => void;
    onSave: (user: Omit<User, 'id' | 'employmentStatus'> | User) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
    const [userData, setUserData] = useState<Partial<User>>({});
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (user) {
            setUserData({
                ...user,
                salary: user.salary || 0,
                workload: user.workload || '',
                schedule: user.schedule || '',
            });
        } else {
            // Defaults for new user
            setUserData({ name: '', username: '', role: 'Gerente', salary: 0, workload: '', schedule: '' });
        }
    }, [user]);

    // Close dropdown on outside click
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
                setIsRoleDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [roleDropdownRef]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'salary') {
            // Ensure salary is stored as a number, defaulting to 0 for empty/invalid input
            setUserData(prev => ({ ...prev, salary: parseFloat(value) || 0 }));
        } else {
            setUserData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleRoleSelect = (role: SystemRole) => {
        setUserData(prev => ({ ...prev, role }));
        setIsRoleDropdownOpen(false);
    };

    const handleSubmit = () => {
        if (!userData.name || !userData.username) {
            alert('Nome e usuário são obrigatórios.');
            return;
        }

        const isNewUser = !('id' in userData);

        if (password || isNewUser) {
            if (password !== confirmPassword) {
                alert('As senhas não coincidem.');
                return;
            }
            if (isNewUser && password.length < 3) {
                alert('A senha deve ter pelo menos 3 caracteres.');
                return;
            }
             if (password) {
                 userData.password = password;
            }
        } else {
            delete userData.password;
        }
        
        onSave(userData as User);
    };
    
    const isEditing = user && 'id' in user;
    const roles: SystemRole[] = ['Admin', 'Cozinha', 'Gerente', 'Motoboy'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl text-gray-800">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-lg font-bold">{isEditing ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <input type="text" name="name" value={userData.name || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                        </div>
                         <div className="relative" ref={roleDropdownRef}>
                            <label className="block text-sm font-medium text-gray-700">Cargo</label>
                            <button
                                type="button"
                                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                className="mt-1 w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-brand-orange"
                            >
                                <span>{userData.role}</span>
                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isRoleDropdownOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {isRoleDropdownOpen && (
                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    {roles.map(role => (
                                        <li
                                            key={role}
                                            onClick={() => handleRoleSelect(role)}
                                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${userData.role === role ? 'text-brand-orange bg-orange-50' : 'text-gray-900'} hover:bg-orange-50`}
                                        >
                                            <span className={`font-normal block truncate ${userData.role === role ? 'font-semibold' : ''}`}>
                                                {role}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Salário (R$)</label>
                            <input type="number" name="salary" value={userData.salary || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Carga Horária</label>
                            <input type="text" name="workload" value={userData.workload || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" placeholder="Ex: 44h/semana" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Horário</label>
                            <input type="text" name="schedule" value={userData.schedule || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" placeholder="Ex: 18:00 - 00:00" />
                        </div>
                    </div>
                     <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-md font-semibold text-gray-700 mb-2">Credenciais de Acesso</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Usuário de Acesso</label>
                                <input type="text" name="username" value={userData.username || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                            </div>
                         </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{isEditing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'}</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 bg-gray-50 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600">Salvar</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
interface FuncionariosProps {
    users: User[];
    onAddUser: (user: Omit<User, 'id' | 'employmentStatus'>) => void;
    onUpdateUser: (userId: number, updatedData: Partial<User>) => void;
    onToggleStatus: (userId: number) => void;
    onRemoveUser: (userId: number) => void;
}

const Funcionarios: React.FC<FuncionariosProps> = ({ users, onAddUser, onUpdateUser, onToggleStatus, onRemoveUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };
    
    const handleSaveUser = (userData: Omit<User, 'id' | 'employmentStatus'> | User) => {
        if ('id' in userData) {
            onUpdateUser(userData.id, userData);
        } else {
            onAddUser(userData as Omit<User, 'id' | 'employmentStatus'>);
        }
        handleCloseModal();
    };

    const handleDelete = (userToDelete: User) => {
        if (window.confirm(`Tem certeza que deseja excluir permanentemente o funcionário ${userToDelete.name}? Esta ação não pode ser desfeita.`)) {
            onRemoveUser(userToDelete.id);
        }
    };

    const getEmploymentStatusClass = (status: User['employmentStatus']) => {
        return status === 'Ativo' ? 'bg-brand-lime/30 text-green-800' : 'bg-red-200 text-red-800';
    }

    return (
        <>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Quadro de Funcionários</h3>
                            <p className="text-sm text-gray-500">Gerencie todos os usuários com acesso ao sistema.</p>
                        </div>
                        <button onClick={() => handleOpenModal()} className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
                            Adicionar Funcionário
                        </button>
                    </div>
                </div>

                {/* New Card Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col transition-shadow hover:shadow-xl">
                            <div className="p-4 flex-grow">
                                {/* Card Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <img 
                                        src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.username}`} 
                                        alt={user.name}
                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-offset-2 ring-brand-orange"
                                    />
                                    <div>
                                        <p className="font-bold text-lg text-gray-800">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.role}</p>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-600">Contrato:</span>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getEmploymentStatusClass(user.employmentStatus)}`}>
                                            {user.employmentStatus}
                                        </span>
                                    </div>
                                    {user.role !== 'Admin' && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-600">Salário:</span>
                                                <span className="font-bold text-gray-800">R$ {(user.salary ?? 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-600">Carga Horária:</span>
                                                <span className="font-medium text-gray-800">{user.workload || 'N/A'}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-600">Horário:</span>
                                        <span className="font-medium text-gray-800">{user.schedule || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer - Actions */}
                            <div className="bg-gray-50 p-3 flex justify-around items-center border-t border-gray-200 rounded-b-lg">
                                <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors" title="Editar">
                                    <EditIcon />
                                </button>
                                <button onClick={() => onToggleStatus(user.id)} className="text-orange-600 hover:text-orange-800 p-2 rounded-full hover:bg-orange-100 transition-colors" title={user.employmentStatus === 'Ativo' ? 'Inativar' : 'Ativar'}>
                                    {user.employmentStatus === 'Ativo' ? <FaUserSlash size={20} /> : <FaUserCheck size={20} />}
                                </button>
                                <button 
                                    onClick={() => handleDelete(user)}
                                    className="text-brand-red hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors"
                                    title="Excluir"
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {isModalOpen && <UserModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} />}
        </>
    );
};

export default Funcionarios;