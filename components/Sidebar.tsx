
import React, { useMemo } from 'react';
import { Page } from '../App';
import DashboardIcon from './icons/DashboardIcon';
import OrdersIcon from './icons/OrdersIcon';
import MenuIcon from './icons/MenuIcon';
import InventoryIcon from './icons/InventoryIcon';
import SuppliersIcon from './icons/SuppliersIcon';
import ClientsIcon from './icons/ClientsIcon';
import FiscalIcon from './icons/FiscalIcon';
import SettingsIcon from './icons/SettingsIcon';
import WhatsappIcon from './icons/WhatsappIcon';
import MapIcon from './icons/MapIcon';
import CaixaIcon from './icons/CaixaIcon';
import LogisticsIcon from './icons/LogisticsIcon';
import CostsIcon from './icons/CostsIcon';
import EmployeesIcon from './icons/EmployeesIcon';
import KitchenIcon from './icons/KitchenIcon';
import { User } from '../types';


interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentUser: User;
}

const NavItem: React.FC<{
  label: Page;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <li
      className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 group ${
        isActive
          ? 'bg-brand-orange text-white shadow-md'
          : 'text-gray-600 hover:bg-brand-orange hover:text-white'
      }`}
      onClick={onClick}
    >
      <div className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
        {icon}
      </div>
      <span className="ml-4 font-medium">{label}</span>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, currentUser }) => {
  const baseNavItems: { label: Page; icon: React.ReactNode }[] = [
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'Caixa', icon: <CaixaIcon /> },
    { label: 'Pedidos', icon: <OrdersIcon /> },
    { label: 'Cozinha', icon: <KitchenIcon /> },
    { label: 'Mapa de Entregas', icon: <MapIcon /> },
    { label: 'Logística', icon: <LogisticsIcon /> },
    { label: 'Atendimento', icon: <WhatsappIcon /> },
    { label: 'Cardápio', icon: <MenuIcon /> },
    { label: 'Estoque', icon: <InventoryIcon /> },
    { label: 'Custos', icon: <CostsIcon /> },
    { label: 'Fornecedores', icon: <SuppliersIcon /> },
    { label: 'Clientes', icon: <ClientsIcon /> },
    { label: 'Funcionários', icon: <EmployeesIcon /> },
    { label: 'Fiscal', icon: <FiscalIcon /> },
    { label: 'Configurações', icon: <SettingsIcon /> },
  ];

  const navItems = useMemo(() => {
    const stockNavItems: { label: Page; icon: React.ReactNode }[] = [
      { label: 'Dashboard', icon: <DashboardIcon /> },
      { label: 'Estoque', icon: <InventoryIcon /> },
      { label: 'Cardápio', icon: <MenuIcon /> },
      { label: 'Fornecedores', icon: <SuppliersIcon /> },
      { label: 'Configurações', icon: <SettingsIcon /> },
    ];
    return stockNavItems;
  }, []);


  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col shadow-lg border-r border-gray-200">
      <div className="flex items-center justify-start h-24 border-b border-gray-200 p-4">
        <img 
          src="https://i.ibb.co/M5R9dfRm/logo-funchal.jpg" 
          alt="Pizzaria Funchal Logo" 
          className="h-12 w-12 rounded-full object-cover shadow-md" 
        />
        <h1 className="ml-3 text-lg font-bold text-gray-800">
            Pizzaria Funchal
        </h1>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              isActive={currentPage === item.label}
              onClick={() => setCurrentPage(item.label)}
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">&copy; 2024 Pizzaria Funchal</p>
      </div>
    </aside>
  );
};

export default Sidebar;