import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Lead, Salesperson, Interaction, Opportunity } from '../types';
import { LeadStatus, OpportunityStage } from '../types';
import UserGroupIcon from './icons/UserGroupIcon';
import TagIcon from './TagIcon';
import UserIcon from './icons/UserIcon';
import CubeIcon from './icons/CubeIcon';
import AnnotationIcon from './icons/AnnotationIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';

interface PanelProps {
    clientsCount: number;
    leadsCount: number;
    salespeopleCount: number;
    productsCount: number;
    leads: Lead[];
    salespeople: Salesperson[];
    interactions: Interaction[];
    opportunities: Opportunity[];
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#10b981'];

const Panel: React.FC<PanelProps> = ({ clientsCount, leadsCount, salespeopleCount, productsCount, leads, salespeople, interactions, opportunities }) => {
    
    const [dateRange, setDateRange] = useState('all');

    const { startDate, titleSuffix } = useMemo(() => {
        const now = new Date();
        switch (dateRange) {
            case '7d': {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                sevenDaysAgo.setHours(0, 0, 0, 0);
                return { startDate: sevenDaysAgo, titleSuffix: '(Últimos 7 Días)' };
            }
            case '30d': {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                thirtyDaysAgo.setHours(0, 0, 0, 0);
                return { startDate: thirtyDaysAgo, titleSuffix: '(Últimos 30 Días)' };
            }
            case 'month': {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                startOfMonth.setHours(0, 0, 0, 0);
                return { startDate: startOfMonth, titleSuffix: '(Este Mes)' };
            }
            default:
                return { startDate: null, titleSuffix: '' };
        }
    }, [dateRange]);
    
    const filteredLeads = useMemo(() => {
        if (!startDate) return leads;
        // NOTE: We're using `lastInteractionDate` as a proxy for lead activity date.
        return leads.filter(lead => 
            lead.lastInteractionDate && new Date(lead.lastInteractionDate) >= startDate
        );
    }, [leads, startDate]);

    const filteredOpportunities = useMemo(() => {
        if (!startDate) return opportunities;
        return opportunities.filter(opp => new Date(opp.closeDate) >= startDate);
    }, [opportunities, startDate]);

    const filteredInteractions = useMemo(() => {
        if (!startDate) return interactions;
        return interactions.filter(i => new Date(i.date) >= startDate);
    }, [interactions, startDate]);

    const leadsBySalesperson = useMemo(() => salespeople.map(sp => ({
        name: sp.name.split(' ')[0],
        leads: filteredLeads.filter(lead => lead.salespersonId === sp.id).length,
    })), [salespeople, filteredLeads]);
    
    const leadsBySourceData = useMemo(() => Object.entries(
        filteredLeads.reduce((acc, lead) => {
            acc[lead.source] = (acc[lead.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value })), [filteredLeads]);

    const interactionsBySalesperson = useMemo(() => salespeople.map(sp => ({
        name: sp.name.split(' ')[0],
        Interacciones: filteredInteractions.filter(i => i.salespersonId === sp.id).length,
    })), [salespeople, filteredInteractions]);

    const opportunitiesBySalesperson = useMemo(() => salespeople.map(sp => {
        const totalOpps = filteredOpportunities.filter(
            opp => opp.salespersonId === sp.id
        ).length;
        return {
            name: sp.name.split(' ')[0],
            'Oportunidades': totalOpps,
        };
    }).filter(data => data['Oportunidades'] > 0), [salespeople, filteredOpportunities]);

    const securedClientsBySalesperson = useMemo(() => salespeople.map(sp => {
        const wonOppClientIds = new Set(
            filteredOpportunities
                .filter(opp => opp.salespersonId === sp.id && opp.stage === OpportunityStage.GANADA && opp.clientId)
                .map(opp => opp.clientId!)
        );
        return {
            name: sp.name.split(' ')[0],
            'Clientes Concretados': wonOppClientIds.size,
        };
    }).filter(data => data['Clientes Concretados'] > 0), [salespeople, filteredOpportunities]);


    return (
        <div className="p-4 sm:p-6 md:p-8 text-white space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Panel</h1>

             <div className="flex flex-wrap items-center justify-start gap-2">
                {
                  [
                    {key: 'all', label: 'Todo el tiempo'},
                    {key: 'month', label: 'Este Mes'},
                    {key: '30d', label: 'Últimos 30 Días'},
                    {key: '7d', label: 'Últimos 7 Días'},
                  ].map(({key, label}) => (
                  <button
                    key={key}
                    onClick={() => setDateRange(key)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      dateRange === key
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 p-6 rounded-lg flex items-center space-x-4">
                    <div className="bg-blue-500/20 p-3 rounded-full"><UserGroupIcon className="h-6 w-6 text-blue-400" /></div>
                    <div>
                        <p className="text-slate-400 text-sm">Total de Clientes</p>
                        <p className="text-2xl font-bold">{clientsCount}</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg flex items-center space-x-4">
                     <div className="bg-cyan-500/20 p-3 rounded-full"><TagIcon className="h-6 w-6 text-cyan-400" /></div>
                    <div>
                        <p className="text-slate-400 text-sm">Prospectos Activos</p>
                        <p className="text-2xl font-bold">{filteredLeads.filter(l => l.status !== LeadStatus.PERDIDO).length}</p>
                    </div>
                </div>
                 <div className="bg-slate-800 p-6 rounded-lg flex items-center space-x-4">
                     <div className="bg-purple-500/20 p-3 rounded-full"><UserIcon className="h-6 w-6 text-purple-400" /></div>
                    <div>
                        <p className="text-slate-400 text-sm">Vendedores</p>
                        <p className="text-2xl font-bold">{salespeopleCount}</p>
                    </div>
                </div>
                 <div className="bg-slate-800 p-6 rounded-lg flex items-center space-x-4">
                    <div className="bg-green-500/20 p-3 rounded-full"><CubeIcon className="h-6 w-6 text-green-400" /></div>
                    <div>
                        <p className="text-slate-400 text-sm">Total de Productos</p>
                        <p className="text-2xl font-bold">{productsCount}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-slate-800 p-4 sm:p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-200">Prospectos por Vendedor <span className="text-base font-normal text-slate-400">{titleSuffix}</span></h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={leadsBySalesperson} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#cbd5e1' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number) => [`${value} prospectos`, 'Total']}
                            />
                            <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                                {leadsBySalesperson.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-slate-800 p-4 sm:p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-200">Prospectos por Origen <span className="text-base font-normal text-slate-400">{titleSuffix}</span></h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={leadsBySourceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    if (percent === 0) return null;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                    return (
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="14">
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}
                            >
                                {leadsBySourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}/>
                            <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-4 sm:p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
                        <BriefcaseIcon className="h-5 w-5 text-purple-400" />
                        Oportunidades por Vendedor <span className="text-base font-normal text-slate-400">{titleSuffix}</span>
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={opportunitiesBySalesperson} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#cbd5e1' }}
                            />
                            <Bar dataKey="Oportunidades" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                 <div className="bg-slate-800 p-4 sm:p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
                        <UserGroupIcon className="h-5 w-5 text-blue-400" />
                        Clientes Concretados por Vendedor <span className="text-base font-normal text-slate-400">{titleSuffix}</span>
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={securedClientsBySalesperson} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#cbd5e1' }}
                            />
                            <Bar dataKey="Clientes Concretados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-slate-800 p-4 sm:p-6 rounded-lg">
                     <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
                        <AnnotationIcon className="h-5 w-5 text-cyan-400" />
                        Interacciones por Vendedor <span className="text-base font-normal text-slate-400">{titleSuffix}</span>
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={interactionsBySalesperson} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#cbd5e1' }}
                            />
                            <Bar dataKey="Interacciones" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default Panel;