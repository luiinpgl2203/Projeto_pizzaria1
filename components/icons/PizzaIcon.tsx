import React from 'react';

const PizzaIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-orange" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15.41,8.51,10.2,3.3a.5.5,0,0,0-.82,0L4.59,8.51a.5.5,0,0,0,.41.8H15A.5.5,0,0,0,15.41,8.51Z"/>
        <path d="M4.24,10.74,9.5,16.05a.5.5,0,0,0,.82,0l5.43-5.43a.5.5,0,0,0-.32-.86H4.55A.5.5,0,0,0,4.24,10.74Z"/>
        <path fillRule="evenodd" d="M10,18a8,8,0,1,0-8-8A8,8,0,0,0,10,18ZM3,10a7,7,0,1,1,8.23,6.91L10,15.45,8.77,16.91A7,7,0,0,1,3,10Z" clipRule="evenodd"/>
        <circle cx="7" cy="12" r="1"/>
        <circle cx="13" cy="12" r="1"/>
        <circle cx="10" cy="8" r="1"/>
    </svg>
);

export default PizzaIcon;