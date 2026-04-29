import React from 'react';

const AiqfomeIcon: React.FC<{ isLarge?: boolean }> = ({ isLarge = false }) => (
    <svg 
        className={isLarge ? "w-10 h-10" : "w-6 h-6"} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Aiqfome Logo"
    >
        <rect width="40" height="40" rx="8" fill="#8A3C8B"/>
        <path d="M22.04 26.6667C24.4 26.6667 26.12 25.04 26.12 22.8267C26.12 20.6133 24.4 19 22.04 19C19.68 19 18 20.6133 18 22.8267C18 25.04 19.68 26.6667 22.04 26.6667ZM20.42 13.3333L13.88 26.3733H16.82L17.96 23.4667H24.8L25.94 26.3733H28.88L22.34 13.3333H20.42Z" fill="white"/>
    </svg>
);

export default AiqfomeIcon;