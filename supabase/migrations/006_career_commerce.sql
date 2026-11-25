-- Gateway checkout sessions: server-managed only. No browser writes to payment state.
create table if not exists public.applyra_checkout_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 plan_id uuid not null references public.applyra_billing_plans(id), provider text not null,
 provider_session_id text not null default '', status text not null default 'creating',
 amount_subunits bigint not null check(amount_subunits>0), currency text not null check(currency ~ '^[A-Z]{3}$'),
 checkout_url text not null default '', metadata jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '1 hour', verified_at timestamptz
);
create index if not exists applyra_checkout_sessions_user on public.applyra_checkout_sessions(user_id,created_at desc);
alter table public.applyra_checkout_sessions enable row level security;
alter table public.applyra_checkout_sessions force row level security;
revoke all on public.applyra_checkout_sessions from public,anon,authenticated;
-- Add supported provider mappings. Shopify is a storefront, UPI is merchant QR/ID.
alter table public.applyra_billing_provider_plans drop constraint if exists applyra_billing_provider_plans_provider_check;
alter table public.applyra_billing_provider_plans add constraint applyra_billing_provider_plans_provider_check check(provider in ('razorpay','stripe','adyen','checkout','paddle','braintree','mollie','paypal','cashfree','upi','shopify'));
-- Serialize active checkouts per account/provider/plan (also blocks simultaneous clicks).
create unique index if not exists applyra_checkout_active_unique on public.applyra_checkout_sessions(user_id,provider,plan_id) where status in ('creating','pending','processing');
