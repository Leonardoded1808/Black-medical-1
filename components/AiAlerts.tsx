import React, { useState, useEffect } from 'react';
import type { Lead, Opportunity, Task } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface AiAlertsProps {
    leads: Lead[];
    opportunities: Opportunity[];
    tasks: Task[];
}

const AiAlerts: React.FC<AiAlertsProps> = ({ leads, opportunities, tasks }) => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAlerts = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/gemini/alerts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ leads, opportunities, tasks }),
                });
                if (!response.ok) throw new Error("Error fetching AI alerts");
                const data = await response.json();
                setAlerts(data.alerts || []);
            } catch (err) {
                console.error(err);
                setError('No se pudieron cargar las alertas inteligentes.');
            } finally {
                setLoading(false);
            }
        };

        // Delay fetch slightly so it doesn't block UI rendering immediately
        const timer = setTimeout(fetchAlerts, 2000);
        return () => clearTimeout(timer);
    }, [leads.length, opportunities.length, tasks.length]);

    if (loading) {
        return (
            <div className="bg-slate-800 p-6 rounded-lg animate-pulse flex items-center space-x-4 mb-8">
                <SparklesIcon className="h-6 w-6 text-cyan-400 opacity-50" />
                <span className="text-slate-400">Analizando datos para alertas inteligentes...</span>
            </div>
        );
    }

    if (error || alerts.length === 0) {
        return null; // hide quietly if no alerts
    }

    const typeThemes: Record<string, string> = {
        warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        danger: 'bg-red-500/20 text-red-300 border-red-500/50',
        info: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        success: 'bg-green-500/20 text-green-300 border-green-500/50',
    };

    return (
        <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-lg mb-8 shadow-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-cyan-600/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-cyan-400" />
                Alertas Inteligentes Prioritarias
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {alerts.map((alert, idx) => {
                    const theme = typeThemes[alert.type] || typeThemes.info;
                    return (
                        <div key={idx} className={`p-4 rounded-md border-l-4 ${theme} shadow-sm flex items-start space-x-3`}>
                            <p className="text-sm font-medium leading-relaxed">{alert.message}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AiAlerts;
