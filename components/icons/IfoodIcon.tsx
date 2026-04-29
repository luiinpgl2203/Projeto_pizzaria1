import React from 'react';

const IfoodIcon: React.FC<{ isLarge?: boolean }> = ({ isLarge = false }) => (
    <svg 
        className={isLarge ? "w-10 h-10" : "w-6 h-6"} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="iFood Logo"
    >
        <rect width="40" height="40" rx="8" fill="#EA1D2C"/>
        <path d="M12.5 13.333H15.8333V26.6667H12.5V13.333ZM20.8333 13.333H27.5V16.6667H24.1667V18.8889H26.6667V22.2222H24.1667V26.6667H20.8333V13.333Z" fill="white"/>
    </svg>
);

export default IfoodIcon;