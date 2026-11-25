# Applyra Admin Console Setup Guide

This guide explains how to configure and deploy the Applyra Admin Console backend and connect it securely to your browser extension.

---

## 1. Architecture Overview

Applyra operates on a **zero-extension-secrets** model:
- The browser extension stores **only** public credentials (Supabase project URL and anon/publishable key).
- Privileged operations (user deletion, role assignment, policy configuration, Razorpay billing) require server-verified roles (`super_admin`, `admin`, `support`, `read_only`).
- Secrets (Supabase service-role keys, Razorpay secret keys, webhook secrets, SMTP credentials) remain exclusively inside Supabase Edge Functions / Vault and are never sent to the browser extension.

---

## 2. Prerequisites

1. A [Supabase](https://supabase.com/) project.
2. The Supabase CLI installed locally:
   ```bash
   npm install -g supabase
   ```
3. A deployed Applyra extension (`v2.8.0`+).

---

## 3. Database Schema & Migration

Deploy the core Applyra tables and RPC functions from your project's migration bundle:

```bash
supabase db push
```

Ensure the following tables exist in your Supabase project:
- `applyra_profiles`
- `applyra_applications`
- `applyra_candidates`
- `applyra_audit_logs`
- `applyra_config`
- `applyra_billing_plans`
- `applyra_billing_subscriptions`

---

## 4. Deploying Edge Functions

Deploy the Admin and Billing Edge Functions:

```bash
supabase functions deploy admin-api
supabase functions deploy billing-api
supabase functions deploy delete-account
```

Set required backend secrets in Supabase:
```bash
supabase secrets set RAZORPAY_KEY_ID="rzp_live_..."
supabase secrets set RAZORPAY_KEY_SECRET="..."
supabase secrets set RAZORPAY_WEBHOOK_SECRET="..."
```

---

## 5. Bootstrapping the First Admin User

1. In the Applyra extension, sign up or sign in using your admin email address.
2. In the Supabase Dashboard, navigate to **Table Editor** > `applyra_profiles` (or your user metadata table).
3. Set the `admin_role` column to `'super_admin'` for your user ID.
4. Available roles:
   - `super_admin`: Full access including user role assignments, billing plans, and data deletion.
   - `admin`: Operational management, user bans, configuration policy.
   - `support`: Read-only user lookup, error triage, privacy requests.
   - `read_only`: Audit log inspection and system health monitoring.

---

## 6. Extension Setup

1. Open `admin.html` from the extension or via the browser action menu.
2. Enter your Supabase Project URL (`https://xyzcompany.supabase.co`).
3. Enter your Supabase Anon/Publishable Key.
4. Click **Save public auth configuration**.
5. Once authenticated, refresh the Admin Console to view real-time operations, feature toggles, system health, and billing controls.

---

## 7. Security Best Practices

- **Never** paste service-role keys into the extension UI.
- Ensure Row-Level Security (RLS) is enabled on all tables.
- Regularly review the **Admin audit log** section in `admin.html` to monitor privileged operations.
