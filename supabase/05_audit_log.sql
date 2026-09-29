-- =====================================================================
-- Detailers Inc. — 05_audit_log.sql
-- The change trail behind the dashboard's Change History page.
--
-- The dashboard always keeps a local trail in the browser, so this table
-- is optional — but with it the trail is shared: a change Ricks makes on
-- his laptop is visible to Brenton on his. Worth having.
--
-- Run AFTER 01_schema.sql. Safe to re-run.
-- =====================================================================

create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  at            timestamptz not null default now(),
  actor         text not null default 'Unknown',
  action        text not null check (action in ('CREATE','UPDATE','DELETE','RESTORE')),
  table_name    text not null,
  record_id     uuid,
  record_label  text,
  note          text,
  before_data   jsonb,
  after_data    jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists audit_at_idx     on public.audit_log (at desc);
create index if not exists audit_table_idx  on public.audit_log (table_name, record_id);
create index if not exists audit_action_idx on public.audit_log (action);

alter table public.audit_log enable row level security;
grant select, insert on public.audit_log to anon, authenticated;
grant all on public.audit_log to service_role;

-- Anyone the app reaches can read the trail and add to it. Nobody can
-- change or remove an entry once written — that is the point of a trail.
drop policy if exists "audit read"   on public.audit_log;
create policy "audit read"   on public.audit_log for select to anon, authenticated using (true);
drop policy if exists "audit append" on public.audit_log;
create policy "audit append" on public.audit_log for insert to anon, authenticated with check (true);

-- Keep updated_at honest on the tables that carry it, no matter which
-- app does the writing.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','client_month_subscriptions','client_pushes','quotes','services']
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'updated_at'
    ) then
      execute format('drop trigger if exists trg_touch_%1$s on public.%1$I', t);
      execute format('create trigger trg_touch_%1$s before update on public.%1$I
                      for each row execute function public.touch_updated_at()', t);
    end if;
  end loop;
end $$;

-- What changed today, newest first.
create or replace view public.v_recent_changes with (security_invoker = true) as
select at, actor, action, table_name, record_label, note
from public.audit_log
order by at desc
limit 200;

grant select on public.v_recent_changes to anon, authenticated;
