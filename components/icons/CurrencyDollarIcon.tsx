import React from 'react';

interface IconProps {
    className?: string;
}

const CurrencyDollarIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1.5M12 9.5v-1.5M12 14.5v-1.5m-3.001-1.48a6.502 6.502 0 00-2.499 1.48m11.002-1.48a6.5 6.5 0 01-2.5 1.48M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

export default CurrencyDollarIcon;
