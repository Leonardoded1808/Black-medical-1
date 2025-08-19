
import React from 'react';

interface IconProps {
    className?: string;
}

const WrenchScrewdriverIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l-.318-.318a2.652 2.652 0 00-3.75 0l-.707.707a2.652 2.652 0 01-3.75 0l-3.182-3.182a2.652 2.652 0 010-3.75l.707-.707a2.652 2.652 0 000-3.75L.318.318S2.437 2.437 5.18 5.18m6.24 10l-1.414-1.414" />
    </svg>
);

export default WrenchScrewdriverIcon;
