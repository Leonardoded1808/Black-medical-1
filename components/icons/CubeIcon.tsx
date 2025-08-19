
import React from 'react';

interface IconProps {
    className?: string;
}

const CubeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 10l8 4m-8-4V7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10l8 4 8-4V7L12 3 4 7z" />
    </svg>
);

export default CubeIcon;
