
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GenerateContentResponse } from '@google/genai';
import { getAiAssistantResponse } from '../services/geminiService';
import type { Client, Product, ChatMessage, Lead, Opportunity, Task, SupportTicket, Salesperson, Interaction, User } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import XIcon from './icons/XIcon';

interface AiAssistantProps {
    currentUser: User | null;
    clients: Client[];
    products: Product[];
    leads: Lead[];
    opportunities: Opportunity[];
    tasks: Task[];
    supportTickets: SupportTicket[];
    salespeople: Salesperson[];
    interactions: Interaction[];
    hasPendingTasks: boolean;
}

const AiAssistant: React.FC<AiAssistantProps> = (props) => {
    const { currentUser, clients, products, leads, opportunities, tasks, supportTickets, salespeople, interactions, hasPendingTasks } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleSend = useCallback(async (promptOverride?: string) => {
        const userPrompt = promptOverride || input;
        if (!userPrompt.trim() || isLoading || !currentUser) return;

        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: userPrompt };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        const assistantMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', text: '' }]);
        
        try {
            const context = { currentUser, clients, products, leads, opportunities, tasks, supportTickets, salespeople, interactions };
            const stream = await getAiAssistantResponse(userPrompt, context);

            for await (const chunk of stream) {
                 setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, text: msg.text + chunk.text }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error fetching AI response:', error);
             setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, text: "Lo siento, ha ocurrido un error al contactar a la IA." }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, currentUser, clients, products, leads, opportunities, tasks, supportTickets, salespeople, interactions]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };
    
    const handleToggle = () => {
        const willBeOpen = !isOpen;
        setIsOpen(willBeOpen);
        
        if (willBeOpen && hasPendingTasks && messages.length === 0) {
            handleSend("¿Cuáles son mis tareas pendientes o próximos eventos en el calendario?");
        }
    };
    
    return (
        <>
            <button
                onClick={handleToggle}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-cyan-500 hover:bg-cyan-600 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 z-50 relative"
                aria-label="Toggle AI Assistant"
            >
                 {hasPendingTasks && !isOpen && (
                    <>
                        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
                        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
                    </>
                )}
                {isOpen ? <XIcon className="h-7 w-7 sm:h-8 sm:w-8"/> : <SparklesIcon className="h-7 w-7 sm:h-8 sm:w-8" />}
            </button>
            {isOpen && (
                <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-auto max-w-[90vw] sm:max-w-none sm:w-96 h-[70vh] sm:h-[32rem] bg-slate-800/80 backdrop-blur-md rounded-lg shadow-2xl flex flex-col z-40 border border-slate-700">
                    <div className="p-4 border-b border-slate-700 flex items-center space-x-3">
                        <SparklesIcon className="h-6 w-6 text-cyan-400" />
                        <h3 className="font-bold text-lg text-white">Asistente IA</h3>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 h-full flex flex-col justify-center">
                                <p className="text-lg">¿Cómo puedo ayudarte?</p>
                                <p className="text-sm mt-2">Prueba a preguntar: "¿Qué tengo en mi agenda para hoy?", "¿Resume al cliente 'Hospital Central'", o "Dame una estrategia para responder a un prospecto interesado en el ecógrafo."</p>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text || '...'}</p>
                                </div>
                            </div>
                        ))}
                         <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t border-slate-700">
                        <div className="flex items-center bg-slate-700 rounded-lg">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Pregúntale algo a la IA..."
                                className="w-full bg-transparent p-3 text-slate-200 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="p-3 text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiAssistant;