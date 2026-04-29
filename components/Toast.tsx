import React from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    
    const baseClasses = "fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl text-white transition-transform transform animate-slide-in-right max-w-sm";
    
    const typeClasses = {
        success: 'bg-gradient-to-r from-brand-lime to-green-500',
        error: 'bg-gradient-to-r from-brand-red to-red-700',
        warning: 'bg-gradient-to-r from-brand-orange to-yellow-500',
    }[type];

    const icon = {
        success: <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
        error: <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
        warning: <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>,
    }[type];


    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <div className="flex items-center">
                {icon}
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button onClick={onClose} className="ml-4 -mr-2 p-1 font-bold text-lg opacity-70 hover:opacity-100">&times;</button>
            </div>
        </div>
    );
};

export default Toast;