import React from 'react';
import { Page } from '../App';
import { User } from '../types';
import LogoutIcon from './icons/LogoutIcon';


interface HeaderProps {
    currentPage: Page;
    currentUser: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, currentUser, onLogout }) => {
    return (
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">{currentPage}</h2>
            <div className="flex items-center">
                <div className="relative">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    <span className="absolute top-0 right-0 h-2 w-2 bg-brand-red rounded-full"></span>
                </div>
                <div className="flex items-center ml-6">
                    <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={currentUser.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.username}`}
                        alt="User"
                    />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                        <p className="text-xs text-gray-500">{currentUser.role}</p>
                    </div>
                </div>
                 <button onClick={onLogout} className="ml-6 text-gray-500 hover:text-brand-red" title="Sair">
                    <LogoutIcon />
                </button>
            </div>
        </header>
    );
};

export default Header;