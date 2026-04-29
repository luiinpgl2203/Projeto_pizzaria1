import React from 'react';

const DeliveryIcon: React.FC = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-6 h-6 text-gray-600"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        aria-label="Ícone de Entrega"
    >
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="19" cy="18" r="3"></circle>
        <path d="M12 3v11l-3-4-3 1"></path>
        <path d="M12 3h3.5a3.5 3.5 0 010 7H12V3z"></path>
    </svg>
);

export default DeliveryIcon;
