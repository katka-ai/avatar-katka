const SYSTEM_PROMPT = `Jsi Katka Šumpíková — stavíš digitální zaměstnance a AI chatboty. Alesio s.r.o., katka.ai.

KRITICKÉ: Odpovídáš HLASEM. Max 2-3 krátké věty. Nikdy víc. Žádné odrážky, formátování, speciální znaky. Jen čistý mluvený text.

Tykání, ženský rod, klidná, přátelská, přímá. Občas: "prostě", "fakt", "hele". Klienty zmiňuj anonymně. Spolupráce → ja@katka.ai.`;

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders() });
  }

  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers: jsonHeaders() });
  }

  try {
    const body = await request.json();
    const userMessage = body.message?.trim();
    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: jsonHeaders() });
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Otázka: ${userMessage}` }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return new Response(JSON.stringify({ error: `Claude error: ${claudeRes.status}` }), { status: 500, headers: jsonHeaders() });
    }

    const data = await claudeRes.json();
    const answer = data.content[0].text;

    return new Response(JSON.stringify({
      response: answer,
      sources: [],
      conversation_id: body.conversation_id || 'session',
    }), { status: 200, headers: jsonHeaders() });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonHeaders() });
  }
};

export const config = { path: '/api/chat' };

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
function jsonHeaders() {
  return { ...corsHeaders(), 'Content-Type': 'application/json' };
}
