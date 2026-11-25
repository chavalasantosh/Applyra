# Applyra Supabase deployment

This folder is deployable backend code. It is **not automatically live** just because it exists in the extension ZIP.

1. Create the production Supabase project.
2. Run `migrations/001_applyra_production_foundation.sql` in the SQL editor/migration pipeline.
3. Verify every `applyra_*` table has RLS enabled and the four own-row policies.
4. Deploy `functions/delete-account/index.ts` as the `delete-account` Edge Function.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` only in Supabase/Edge Function secrets. Never place it in the extension.
6. Configure Google and LinkedIn OIDC in Supabase Auth.
7. Configure production SMTP and email verification in Supabase Auth.
8. Enter only the project URL and publishable/anon key in Applyra.

The extension's Cloud Migration controls remain `Not configured` or return a backend error until these deployment steps are complete.
