# research-proxy Edge Function

Authenticated bridge from the Applyra extension to the private Python Research Engine.

Required Supabase secrets:

- `RESEARCH_ENGINE_URL`
- `RESEARCH_ENGINE_SERVICE_SECRET`

The browser never receives the private service secret. The function validates the user's Supabase bearer token before forwarding an allow-listed research action.
