import React from 'react';

const TableIcon: React.FC = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-6 h-6 text-gray-600"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        aria-label="Ícone de Mesa"
    >
        <path d="M16 2L12.7 5.3a2.76 2.76 0 000 3.9l3.6 3.6a2.76 2.76 0 003.9 0L23 9.2"></path>
        <path d="M16 12.7L22 7"></path>
        <path d="M2 16l3.3 3.3a2.76 2.76 0 003.9 0l3.6-3.6a2.76 2.76 0 000-3.9L9.2 8"></path>
        <path d="M12.7 16L7 22"></path>
    </svg>
);

export default TableIcon;
