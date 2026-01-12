
export enum LeadStatus {
  NUEVO = 'Nuevo',
  CONTACTADO = 'Contactado',
  CALIFICADO = 'Calificado',
  PERDIDO = 'Perdido',
}

export enum TaskStatus {
  PENDIENTE = 'Pendiente',
  EN_PROGRESO = 'En Progreso',
  COMPLETADA = 'Completada',
}

export enum SupportTicketStatus {
    ABIERTO = 'Abierto',
    EN_PROCESO = 'En Proceso',
    CERRADO = 'Cerrado',
}

export enum SupportTicketPriority {
    BAJA = 'Baja',
    MEDIA = 'Media',
    ALTA = 'Alta',
}

export enum InteractionType {
    LLAMADA = 'Llamada',
    EMAIL = 'Email',
    MENSAJE = 'Mensaje',
    REUNION = 'Reunión',
}

export enum OpportunityStage {
  PROSPECCION = 'Prospección',
  PROPUESTA = 'Propuesta',
  NEGOCIACION = 'Negociación',
  GANADA = 'Ganada',
  PERDIDA = 'Perdida',
}

export interface OpportunityProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  title: string;
}

export interface User extends Salesperson {
  role: 'admin' | 'salesperson';
  password_DO_NOT_USE: string;
  mustChangePassword?: boolean;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
}

export interface Interaction {
    id: string;
    leadId?: string;
    opportunityId?: string;
    salespersonId: string;
    type: InteractionType;
    notes: string;
    date: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  origin?: string;
  status: LeadStatus;
  salespersonId: string;
  lastInteractionDate?: string;
  createdAt?: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    salespersonId: string;
    status: TaskStatus;
    clientId?: string;
    leadId?: string;
    associatedName?: string;
    opportunityId?: string;
    opportunityValue?: number;
}

export interface SupportTicket {
    id: string;
    clientId: string;
    clientName: string;
    issue: string;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    createdDate: string;
    assignedTo: string;
}

export interface Opportunity {
  id:string;
  clientId?: string;
  clientName: string;
  products: OpportunityProduct[];
  stage: OpportunityStage;
  value: number;
  closeDate: string;
  salespersonId: string;
  originalLeadId?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    content: string;
}

export interface BackupData {
    clients: Client[];
    leads: Lead[];
    products: Product[];
    opportunities: Opportunity[];
    tasks: Task[];
    supportTickets: SupportTicket[];
    salespeople: Salesperson[];
    interactions: Interaction[];
    whatsappTemplates: WhatsAppTemplate[];
    sourceSalespersonId: string;
}
