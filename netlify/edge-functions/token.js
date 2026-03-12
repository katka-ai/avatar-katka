export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders() });
  }

  const apiKey = Deno.env.get('LIVEAVATAR_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No API key' }), { status: 500, headers: jsonHeaders() });
  }

  try {
    const res = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey, 'Accept': 'application/json' },
      body: JSON.stringify({
        mode: 'FULL',
        is_sandbox: false,
        avatar_id: Deno.env.get('KATKA_AVATAR_ID') || '0bab2095-15b0-44ce-bc00-6c40d2d8d5f6',
        avatar_persona: {
          language: 'cs',
          voice_settings: { model: 'eleven_flash_v2_5', stability: 0.7, similarity_boost: 0.8, speed: 1.0 },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: 'LiveAvatar error', details: data }), { status: res.status, headers: jsonHeaders() });
    return new Response(JSON.stringify(data), { status: 200, headers: jsonHeaders() });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonHeaders() });
  }
};

export const config = { path: '/api/token' };

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
function jsonHeaders() {
  return { ...corsHeaders(), 'Content-Type': 'application/json' };
}
