const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const actionMap: Record<string,string> = {
  health: '/v1/health',
  match: '/v1/match',
  rank: '/v1/rank',
  corpus: '/v1/corpus',
  question: '/v1/question',
  onset: '/v1/onset',
};

function json(body: unknown, status=200) {
  return new Response(JSON.stringify(body), {status, headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok',{headers:cors});
  if (req.method !== 'POST') return json({ok:false,error:'Method not allowed'},405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const researchUrl = (Deno.env.get('RESEARCH_ENGINE_URL') || '').replace(/\/$/,'');
  const serviceSecret = Deno.env.get('RESEARCH_ENGINE_SERVICE_SECRET') || '';
  if (!supabaseUrl || !anonKey || !researchUrl || !serviceSecret) return json({ok:false,error:'Research proxy is not configured'},503);

  const authorization = req.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json({ok:false,error:'Authentication required'},401);

  const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {headers:{apikey:anonKey,Authorization:authorization}});
  if (!userResp.ok) return json({ok:false,error:'Invalid or expired session'},401);

  let body: any;
  try { body = await req.json(); } catch { return json({ok:false,error:'Invalid JSON'},400); }
  const action = String(body?.action || '');
  const path = actionMap[action];
  if (!path) return json({ok:false,error:'Unsupported research action'},400);
  const payload = body?.payload ?? {};
  const encoded = JSON.stringify(payload);
  if (encoded.length > 1000000) return json({ok:false,error:'Research payload too large'},413);

  const controller = new AbortController();
  const timeoutMs: Record<string,number> = {health:7000,match:18000,question:18000,rank:30000,onset:30000,corpus:60000};
  const timer = setTimeout(()=>controller.abort(),timeoutMs[action] || 20000);
  try {
    const upstream = await fetch(`${researchUrl}${path}`, {
      method: action === 'health' ? 'GET' : 'POST',
      headers:{'Content-Type':'application/json','X-Applyra-Service-Secret':serviceSecret},
      body: action === 'health' ? undefined : encoded,
      signal: controller.signal,
    });
    const text = await upstream.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = {ok:false,error:'Research engine returned invalid JSON'}; }
    return json(data,upstream.status);
  } catch (error) {
    return json({ok:false,error:error?.name === 'AbortError' ? 'Research engine timed out' : 'Research engine unavailable'},502);
  } finally { clearTimeout(timer); }
});
