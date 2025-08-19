import { Client, Product, Lead, Task, SupportTicket, Salesperson, LeadStatus, TaskStatus, SupportTicketStatus, SupportTicketPriority, Interaction, InteractionType, Opportunity, OpportunityStage, User } from './types';

export const DUMMY_SALESPEOPLE: Salesperson[] = [];

export const DUMMY_USERS: User[] = [
  { id: 'ADM', name: 'Admin Manager', role: 'admin', email: 'admin@blackmedical.com', phone: '', address: '', title: 'System Administrator', password_DO_NOT_USE: '18087350', mustChangePassword: false },
  ...DUMMY_SALESPEOPLE.map(sp => ({ ...sp, role: 'salesperson' as const, password_DO_NOT_USE: '18087350', mustChangePassword: false }))
];

export const DUMMY_CLIENTS: Client[] = [];

export const DUMMY_PRODUCTS: Product[] = [];

export const DUMMY_LEADS: Lead[] = [];

export const DUMMY_OPPORTUNITIES: Opportunity[] = [];

export const DUMMY_INTERACTIONS: Interaction[] = [];

export const DUMMY_TASKS: Task[] = [];

export const DUMMY_SUPPORT_TICKETS: SupportTicket[] = [];