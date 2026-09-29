-- =====================================================================
-- Detailers Inc. — 01_schema.sql
-- The seven tables the KPI dashboard reads. Column names and types match
-- the detailers-compass CRM exactly, so the restored data loads as-is and
-- the existing CRM keeps working against the same shape.
--
-- Run order:  01_schema.sql → 02_views.sql → 03_rls.sql → 04_seed.sql
-- Safe to re-run: every object is created only if missing.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- services
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  category      text not null,
  stage         text,
  vehicle_type  text not null,
  service_name  text not null,
  price         numeric not null default 0,
  labour_cost   numeric not null default 0,
  product_cost  numeric not null default 0,
  total_cost    numeric not null default 0,
  profit        numeric not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- clients
create table if not exists public.clients (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text,
  phone                text,
  area                 text,
  notes                text,
  created_at           timestamptz not null default now(),
  monthly_subscription numeric(12,2) not null default 0,
  client_type          text not null default 'MOBILE' check (client_type in ('MOBILE','DETAIL')),
  jobs_override        numeric not null default 0
);
create index if not exists clients_area_idx on public.clients (area);
create index if not exists clients_type_idx on public.clients (client_type);

-- ------------------------------------------- monthly subscription records
create table if not exists public.client_month_subscriptions (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  amount         numeric(12,2) not null default 0 check (amount >= 0),
  start_date     date not null default current_date,
  end_date       date,
  status         text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','CANCELLED')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  payment_status text not null default 'UNPAID' check (payment_status in ('PAID','UNPAID'))
);
create index if not exists cms_client_idx  on public.client_month_subscriptions (client_id);
create index if not exists cms_status_idx  on public.client_month_subscriptions (status, payment_status);

-- ------------------------------------------------- monthly billing pushes
create table if not exists public.client_pushes (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  group_type     text not null default 'MOBILE',
  push_date      date not null default current_date,
  period         text not null,                    -- 'YYYY-MM'
  jobs           numeric not null default 0,
  amount         numeric(12,2) not null default 0,
  payment_status text not null default 'UNPAID' check (payment_status in ('PAID','UNPAID')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists pushes_client_idx on public.client_pushes (client_id);
create index if not exists pushes_period_idx on public.client_pushes (period, payment_status);

-- ---------------------------------------------------------------- quotes
create table if not exists public.quotes (
  id           uuid primary key default gen_random_uuid(),
  quote_number text,
  client_id    uuid references public.clients(id),
  client_name  text not null,
  service      text,
  vehicle_type text,
  site         text,
  quote_date   date not null default current_date,
  valid_until  date,
  subtotal     numeric not null default 0,
  vat_enabled  boolean not null default false,
  vat_amount   numeric not null default 0,
  amount       numeric not null default 0,
  status       text not null default 'DRAFT',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  outcome      text check (outcome in ('PENDING','SUCCESS','FAILED'))
);
create index if not exists quotes_date_idx    on public.quotes (quote_date);
create index if not exists quotes_outcome_idx on public.quotes (outcome);

-- ------------------------------------------------------------ quote items
create table if not exists public.quote_items (
  id             uuid primary key default gen_random_uuid(),
  quote_id       uuid not null references public.quotes(id) on delete cascade,
  service_id     uuid references public.services(id),
  description    text not null,
  quantity       numeric not null default 1,
  quantity_label text,
  unit_price     numeric not null default 0,
  total_price    numeric not null default 0,
  labour_cost    numeric not null default 0,
  product_cost   numeric not null default 0,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists quote_items_quote_idx on public.quote_items (quote_id);

-- --------------------------------------------------------------- expenses
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  category     text not null default 'Other',
  description  text,
  vendor       text,
  amount       numeric(12,2) not null default 0 check (amount >= 0),
  expense_date date not null default current_date,
  paid_by      text,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_date_idx     on public.expenses (expense_date);
create index if not exists expenses_category_idx on public.expenses (category);

-- ------------------------------------------------------------ KPI targets
-- The dashboard ships with its targets in js/app.js. This table lets you
-- move them into the database later without touching the front end.
create table if not exists public.kpi_targets (
  id           uuid primary key default gen_random_uuid(),
  metric       text not null unique,
  label        text not null,
  target_value numeric not null default 0,
  unit         text not null default 'count' check (unit in ('count','money','rate')),
  is_monthly   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

insert into public.kpi_targets (metric, label, target_value, unit, is_monthly) values
  ('billed',      'Billed revenue',             48000, 'money', true),
  ('newSubs',     'New subscriptions started',      8, 'count', true),
  ('quotesSent',  'Quotations sent',               24, 'count', true),
  ('winRate',     'Quote win rate (decided)',    0.33, 'rate',  false),
  ('collection',  'Collection rate',             0.90, 'rate',  false),
  ('subscribers', 'Active subscribers',            30, 'count', false),
  ('arpu',        'Average revenue per client',   600, 'money', false),
  ('expRatio',    'Expense ratio (spend / billed)', 0.70, 'rate', false)
on conflict (metric) do nothing;
