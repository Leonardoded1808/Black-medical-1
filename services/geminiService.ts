
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Client, Product, Lead, Opportunity, Task, SupportTicket, Salesperson, Interaction, User } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI Assistant will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "fallback_key_if_not_set" });

export interface AiContext {
    currentUser: User;
    clients: Client[];
    products: Product[];
    leads: Lead[];
    opportunities: Opportunity[];
    tasks: Task[];
    supportTickets: SupportTicket[];
    salespeople: Salesperson[];
    interactions: Interaction[];
}

export const getAiAssistantResponse = async (
  prompt: string, 
  context: AiContext
): Promise<AsyncGenerator<GenerateContentResponse>> => {
  if (!process.env.API_KEY) {
    async function* fallbackGenerator() {
      const errorResponse = {
          text: "El servicio de IA no está configurado. Por favor, configure la API_KEY."
      } as GenerateContentResponse;
      yield errorResponse;
      return;
    }
    return fallbackGenerator();
  }

  const model = "gemini-2.5-flash";
  const systemInstruction = `Eres "Black Medical AI", un asistente experto en ventas de equipos médicos para el CRM de la empresa "Black Medical". Eres conciso, profesional, servicial y proactivo. Tu propósito es ayudar al equipo de ventas a ser más eficiente.
  
  Tienes acceso a los siguientes datos del CRM para responder la consulta. Al responder, SÉ CONCISO y ve al grano.
  
  - USUARIO ACTUAL: ${JSON.stringify({id: context.currentUser.id, name: context.currentUser.name, role: context.currentUser.role})}
  - CLIENTES: ${JSON.stringify(context.clients.map(c => ({ id: c.id, name: c.name, contactPerson: c.contactPerson, email: c.email, phone: c.phone, address: c.address })))}
  - PRODUCTOS: ${JSON.stringify(context.products.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, description: p.description})))}
  - PROSPECTOS: ${JSON.stringify(context.leads.map(l => ({id: l.id, name: l.name, company: l.company, status: l.status, salespersonId: l.salespersonId})))}
  - OPORTUNIDADES: ${JSON.stringify(context.opportunities.map(o => ({id: o.id, clientName: o.clientName, stage: o.stage, value: o.value, salespersonId: o.salespersonId})))}
  - AGENDA/TAREAS: ${JSON.stringify(context.tasks.map(t => ({id: t.id, title: t.title, dueDate: t.dueDate, status: t.status, salespersonId: t.salespersonId, associatedName: t.associatedName})))}
  - TICKETS DE SOPORTE: ${JSON.stringify(context.supportTickets.map(st => ({id: st.id, clientName: st.clientName, issue: st.issue, status: st.status})))}
  - INTERACCIONES: ${JSON.stringify(context.interactions.map(i => ({id: i.id, leadId: i.leadId, type: i.type, notes: i.notes, date: i.date, salespersonId: i.salespersonId})))}
  - VENDEDORES: ${JSON.stringify(context.salespeople.map(s => ({id: s.id, name: s.name})))}
  
  TUS CAPACIDADES:
  1.  **Análisis de Datos**: Puedes responder preguntas sobre cualquiera de los datos listados arriba. Por ejemplo: "¿Quién es el cliente X?", "¿Qué oportunidades están en negociación?", "¿Cuántos prospectos tiene Laura Gómez?".
  2.  **Gestión de Agenda**: Si te preguntan sobre "mi agenda", "mis tareas" o "¿qué tengo para hoy?", filtra el listado de AGENDA/TAREAS usando el ID del USUARIO ACTUAL y muestra las tareas pendientes o para la fecha consultada.
  3.  **Estrategias de Venta y Comunicación**: Si el usuario pide ayuda para contactar a un cliente o prospecto, o cómo responder un email, debes generar un borrador de respuesta (email o guion de llamada). Sé proactivo. Si te piden una estrategia, ofrécela en un formato claro y accionable. Usa un tono profesional y persuasivo.
  
  REGLAS DE RESPUESTA:
  - Usa formato Markdown (listas, negritas, etc.) para mejorar la legibilidad.
  - No inventes información. Basa tus respuestas únicamente en los datos proporcionados. Si no tienes la información, indícalo.
  - Sé directo y claro.
  - Responde siempre en español.
  
  Basado en esta información y tus capacidades, responde la siguiente pregunta del usuario.`;

  const response = await ai.models.generateContentStream({
    model,
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  return response;
};