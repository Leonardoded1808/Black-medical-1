
export interface AiContext {
    currentUser: any;
    clients: any[];
    products: any[];
    leads: any[];
    opportunities: any[];
    tasks: any[];
    supportTickets: any[];
    salespeople: any[];
    interactions: any[];
}

export const getAiAssistantResponse = async function*(
  prompt: string, 
  context: AiContext
): AsyncGenerator<{text: string}> {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    yield { text: "Error: " + (err.error || response.statusText) };
    return;
  }

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield { text: decoder.decode(value, { stream: true }) };
  }
};
