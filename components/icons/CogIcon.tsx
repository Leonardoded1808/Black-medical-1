
import React from 'react';

interface IconProps {
    className?: string;
}

const CogIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.11a12.004 12.004 0 013.086 0c.55.103 1.02.568 1.11 1.11a12.004 12.004 0 010 3.086c-.09.542-.56 1.007-1.11 1.11a12.004 12.004 0 01-3.086 0c-.55-.103-1.02-.568-1.11-1.11a12.004 12.004 0 010-3.086zM12 6a6 6 0 100 12 6 6 0 000-12zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
    </svg>
);

export default CogIcon;
