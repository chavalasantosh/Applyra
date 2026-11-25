-- Applyra Candidate 4: multi-gateway billing registry.
-- Secrets remain Edge Function environment variables only.

alter table public.applyra_billing_plans drop constraint if exists applyra_billing_plans_provider_check;
alter table public.applyra_billing_subscriptions drop constraint if exists applyra_billing_subscriptions_provider_check;
alter table public.applyra_billing_events drop constraint if exists applyra_billing_events_provider_check;

alter table public.applyra_billing_plans add constraint applyra_billing_plans_provider_check
  check (provider in ('razorpay','adyen','checkout','paddle','braintree','mollie'));
alter table public.applyra_billing_subscriptions add constraint applyra_billing_subscriptions_provider_check
  check (provider in ('razorpay','adyen','checkout','paddle','braintree','mollie'));
alter table public.applyra_billing_events add constraint applyra_billing_events_provider_check
  check (provider in ('razorpay','adyen','checkout','paddle','braintree','mollie'));

create table if not exists public.applyra_billing_provider_plans (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.applyra_billing_plans(id) on delete cascade,
  provider text not null check (provider in ('razorpay','adyen','checkout','paddle','braintree','mollie')),
  provider_price_id text not null,
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id,provider),
  unique(provider,provider_price_id)
);
alter table public.applyra_billing_provider_plans enable row level security;
alter table public.applyra_billing_provider_plans force row level security;
revoke all on public.applyra_billing_provider_plans from public, anon, authenticated;
create index if not exists applyra_billing_provider_plans_lookup_idx on public.applyra_billing_provider_plans(plan_id,provider,enabled);
