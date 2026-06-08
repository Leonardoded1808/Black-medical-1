import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Initialize server-side Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Chat/Assistant streaming endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const model = "gemini-3.5-flash";
      const systemInstruction = `Eres "Black Medical AI", un asistente experto en ventas de equipos médicos para el CRM de la empresa "Black Medical". Eres conciso, profesional, servicial y proactivo. Tu propósito es ayudar al equipo de ventas a ser más eficiente.
      
      Tienes acceso a los siguientes datos del CRM:
      - USUARIO ACTUAL: ${JSON.stringify({id: context.currentUser?.id, name: context.currentUser?.name, role: context.currentUser?.role})}
      - CLIENTES: ${JSON.stringify((context.clients || []).map((c: any) => ({ id: c.id, name: c.name })))}
      - PRODUCTOS: ${JSON.stringify((context.products || []).map((p: any) => ({ id: p.id, name: p.name, price: p.price })))}
      - PROSPECTOS: ${JSON.stringify((context.leads || []).map((l: any) => ({id: l.id, name: l.name, company: l.company, status: l.status})))}
      - OPORTUNIDADES: ${JSON.stringify((context.opportunities || []).map((o: any) => ({id: o.id, clientName: o.clientName, stage: o.stage, value: o.value})))}
      - AGENDA: ${JSON.stringify((context.tasks || []).map((t: any) => ({id: t.id, title: t.title, dueDate: t.dueDate, status: t.status})))}
      - TICKETS: ${JSON.stringify((context.supportTickets || []).map((st: any) => ({id: st.id, clientName: st.clientName, status: st.status})))}
      
      TUS CAPACIDADES:
      1. Análisis de Datos
      2. Gestión de Agenda
      3. Estrategias de Venta y Comunicación
      
      REGLAS DE RESPUESTA:
      - Usa formato Markdown.
      - Basa tus respuestas únicamente en los datos proporcionados.
      - Sé directo y claro. Responde siempre en español.`;

      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          systemInstruction,
        }
      });

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      for await (const chunk of responseStream) {
        res.write(chunk.text);
      }
      res.end();
    } catch (error: any) {
      console.error("Error in /api/gemini/chat:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate campaigns endpoint
  app.post("/api/gemini/campaigns", async (req, res) => {
    try {
      const { products, count, instructions } = req.body;
      
      let prompt = `Actúa como un experto redactor publicitario e ingeniero de prompts para un CRM. 
Estás generando campañas de marketing para los siguientes productos médicos:
${JSON.stringify(products, null, 2)}

Genera ${count || 1} campaña(s) distintas. Para cada campaña, devuelve:
1. "title": Un nombre corto para la campaña.
2. "whatsappMessage": Un mensaje para WhatsApp, persuasivo, usando emojis y un tono casual pero profesional.
3. "emailSubject": Un asunto de correo atractivo.
4. "emailBody": El cuerpo del correo bien estructurado para promover estos productos.

Responde estrictamente con un objeto JSON usando el siguiente esquema (devolviendo un Array de objetos):
[
  {
    "title": "string",
    "whatsappMessage": "string",
    "emailSubject": "string",
    "emailBody": "string"
  }
]`;

      if (instructions) {
          prompt += `\n\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n${instructions}\nAsegúrate de adaptar la campaña a estas instrucciones.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                whatsappMessage: { type: Type.STRING },
                emailSubject: { type: Type.STRING },
                emailBody: { type: Type.STRING }
              },
              required: ["title", "whatsappMessage", "emailSubject", "emailBody"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      let campaigns = [];
      try {
          campaigns = JSON.parse(text);
      } catch(e) {
          console.error("JSON parse error", e, text);
      }
      res.json({ campaigns });
    } catch (error: any) {
      console.error("Error generating campaigns:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate alerts/reminders
  app.post("/api/gemini/alerts", async (req, res) => {
    try {
      const { leads, opportunities, tasks } = req.body;
      
      const prompt = `Actúa como un asistente de ventas de inteligencia artificial en un CRM médico. 
Analiza los datos del usuario y proporciona entre 3 y 5 alertas o recordatorios cruciales para seguimiento inmediato. Que no se pase ningún cliente de ser atendido. Concéntrate en oportunidades de alto valor, prospectos descuidados y tareas vencidas o pendientes de hoy.
Datos:
Prospectos: ${JSON.stringify(leads?.slice(0, 30))}
Oportunidades: ${JSON.stringify(opportunities?.slice(0, 30))}
Tareas: ${JSON.stringify(tasks?.slice(0, 30))}

Genera un arreglo de alertas cortas y accionables. Para cada alerta, proporciona:
1. "type": "warning" | "info" | "success" | "danger"
2. "message": Un mensaje de 1-2 oraciones indicando a qué prospecto/tarea/oportunidad prestarle atención hoy.

Responde estrictamente con un Array en formato JSON, usando esta estructura:
[
  {
    "type": "warning",
    "message": "string"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                message: { type: Type.STRING }
              },
              required: ["type", "message"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      let alerts = [];
      try {
          alerts = JSON.parse(text);
      } catch(e) {
          console.error("JSON parse error", e, text);
      }
      res.json({ alerts });
    } catch (error: any) {
      console.error("Error generating alerts:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:PORT");
  });
}

startServer();
