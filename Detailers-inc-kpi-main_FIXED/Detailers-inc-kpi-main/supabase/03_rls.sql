-- =====================================================================
-- Detailers Inc. — 03_rls.sql
-- Grants and row level security.
--
-- IMPORTANT — READ BEFORE RUNNING THIS ON THE LIVE CRM DATABASE.
--
-- This file reproduces the policies the Detailers Compass CRM already
-- has ("app access <table>", FOR ALL TO anon, authenticated). It is
-- written that way deliberately: both apps sign in with the publishable
-- key and no Supabase Auth user, so both act as `anon`. Anything
-- stricter would stop the CRM saving, not just this dashboard.
--
-- If your tables already carry those CRM policies, YOU DO NOT NEED THIS
-- FILE — the dashboard will read and write straight away. Run it only on
-- a fresh project created from 01_schema.sql.
--
-- What it means in practice: anyone holding the publishable key can read
-- and change this data. That key sits in browser code, so treat it as
-- semi-public. The honest fix, when you want one, is Supabase Auth
-- accounts for Brenton and Ricks and policies keyed to auth.uid() — a
-- change that has to be made in BOTH apps at the same time, or the CRM
-- stops working.
--
-- Run AFTER 01_schema.sql.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'services','clients','client_month_subscriptions','client_pushes',
    'quotes','quote_items','expenses','kpi_targets'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);

    -- Same shape as the CRM's own policy, so the two apps agree.
    execute format($f$
      drop policy if exists "app access %1$s" on public.%1$I;
      create policy "app access %1$s" on public.%1$I
        for all to anon, authenticated using (true) with check (true);
    $f$, t);
  end loop;
end $$;

-- Sequences and schema access the REST layer needs.
grant usage on schema public to anon, authenticated;

-- Views inherit the policies of their base tables because each one is
-- declared with security_invoker = true in 02_views.sql.
grant select on
  public.v_kpi_summary,
  public.v_monthly_performance,
  public.v_area_performance,
  public.v_outstanding,
  public.v_quote_profitability,
  public.v_expense_summary,
  public.v_service_margins
to anon, authenticated;
