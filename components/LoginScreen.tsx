import React, { useState } from 'react';
import UserIcon from './icons/UserIcon';
import KeyIcon from './icons/KeyIcon';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const success = await onLogin(username, password);
        if (!success) {
            setError('Usuário ou senha inválidos.');
        }
    } catch (err: any) {
        setError(err.message || 'Erro ao realizar login.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="flex items-center mb-8">
             <img 
                src="https://i.ibb.co/M5R9dfRm/logo-funchal.jpg" 
                alt="Pizzaria Funchal Logo" 
                className="h-16 w-16 rounded-full object-cover shadow-lg" 
            />
            <h1 className="ml-4 text-3xl font-bold text-gray-800">
                Pizzaria Funchal
            </h1>
        </div>
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Acesso ao Sistema</h2>
            <p className="text-center text-gray-500 mb-6">Por favor, insira suas credenciais.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className="text-sm font-semibold text-gray-600">Usuário</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon />
                        </div>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full p-3 pl-10 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent transition text-gray-800"
                            placeholder="ex: admin"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password-input" className="text-sm font-semibold text-gray-600">Senha</label>
                     <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                           <KeyIcon />
                        </div>
                        <input
                            id="password-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 pl-10 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent transition text-gray-800"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                
                {error && <p className="text-sm text-center text-brand-red">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100"
                    >
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                </div>

            </form>
        </div>
        <p className="text-xs text-gray-400 mt-8">&copy; 2024 Pizzaria Funchal - Plataforma de Gestão</p>
    </div>
  );
};

export default LoginScreen;
