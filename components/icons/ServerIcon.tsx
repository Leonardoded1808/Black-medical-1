import React from 'react';

interface IconProps {
    className?: string;
}

const ServerIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v3.75a3 3 0 0 1-3 3m-13.5 0a3 3 0 0 0-3 3v.75a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-.75a3 3 0 0 0-3-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h.01M7.5 16.5h.01" />
    </svg>
);

export default ServerIcon;
