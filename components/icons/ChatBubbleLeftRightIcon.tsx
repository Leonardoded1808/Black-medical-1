import React from 'react';

interface IconProps {
    className?: string;
}

const ChatBubbleLeftRightIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.234c-.38.019-.744.028-1.124.028h-1.294c-.38 0-.744-.009-1.124-.028l-3.722-.234A2.122 2.122 0 013 14.894V10.608c0-.97.616-1.813 1.5-2.097L6.6 8.174a2.123 2.123 0 011.02-1.833l3.243-2.162a2.123 2.123 0 012.28 0l3.243 2.162a2.123 2.123 0 011.02 1.833l2.1 1.4zM6.6 8.174L3 10.608v4.286c0 .63.429 1.186 1.019 1.354l3.722.234c.38.019.744.028 1.124.028h1.294c.38 0 .744-.009 1.124-.028l3.722-.234c.59-.037 1.019-.724 1.019-1.354V10.608L17.4 8.174m-10.8 0l-2.1-1.4a2.123 2.123 0 01-1.02-1.833L3 2.766a2.123 2.123 0 012.28 0l3.243 2.162a2.123 2.123 0 011.02 1.833l2.1 1.4m-10.8 0h10.8" />
    </svg>
);

export default ChatBubbleLeftRightIcon;
