export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'LiveAvatar API key not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        mode: 'FULL',
        is_sandbox: false,
        avatar_id: process.env.KATKA_AVATAR_ID || '0bab2095-15b0-44ce-bc00-6c40d2d8d5f6',
        avatar_persona: {
          language: 'cs',
          voice_settings: {
            model: 'eleven_flash_v2_5',
            stability: 0.7,
            similarity_boost: 0.8,
            speed: 1.0,
          },
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[token] LiveAvatar error:', res.status, data);
      return new Response(JSON.stringify({ error: 'Failed to create session token', details: data }), {
        status: res.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[token] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
