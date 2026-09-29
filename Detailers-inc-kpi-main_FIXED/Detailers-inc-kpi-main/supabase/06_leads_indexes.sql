-- =====================================================================
-- Detailers Inc. — 06_leads_indexes.sql
-- Optional performance indexes for the EXISTING CRM leads table.
-- This does NOT create a second leads table or replace CRM RLS policies.
-- It dynamically uses whichever common status/source column already exists.
-- =====================================================================

do $$
declare
  status_col text;
  source_col text;
begin
  if to_regclass('public.leads') is null then
    raise notice 'public.leads does not exist; no leads indexes created.';
    return;
  end if;

  select column_name into status_col
  from information_schema.columns
  where table_schema = 'public' and table_name = 'leads'
    and lower(column_name) in ('status','lead_status','pipeline_stage','stage')
  order by case lower(column_name)
    when 'status' then 1 when 'lead_status' then 2
    when 'pipeline_stage' then 3 when 'stage' then 4 else 99 end
  limit 1;

  select column_name into source_col
  from information_schema.columns
  where table_schema = 'public' and table_name = 'leads'
    and lower(column_name) in ('source','lead_source','origin')
  order by case lower(column_name)
    when 'source' then 1 when 'lead_source' then 2 when 'origin' then 3 else 99 end
  limit 1;

  if status_col is not null then
    execute format('create index if not exists leads_status_idx on public.leads (%I)', status_col);
  end if;

  if source_col is not null then
    execute format('create index if not exists leads_source_idx on public.leads (%I)', source_col);
  end if;
end $$;
