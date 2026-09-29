-- =====================================================================
-- Detailers Inc. — 02_views.sql
-- The dashboard's KPI maths, expressed in SQL. The front end computes the
-- same numbers from the snapshot; these views give you identical figures
-- from the database for reporting, exports or a future BI tool.
--
-- security_invoker = true keeps RLS applied as the calling user.
-- Run AFTER 01_schema.sql.
-- =====================================================================

-- ------------------------------------------------- headline KPI snapshot
create or replace view public.v_kpi_summary with (security_invoker = true) as
with recurring as (
  select
    coalesce(sum(amount), 0)                                        as push_billed,
    coalesce(sum(amount) filter (where payment_status = 'PAID'), 0) as push_paid,
    count(*)                                                        as push_count,
    count(*) filter (where payment_status = 'PAID')                 as push_paid_count
  from public.client_pushes
),
subscriptions as (
  select
    coalesce(sum(amount) filter (where status = 'ACTIVE'), 0)                                as mrr,
    coalesce(sum(amount) filter (where status = 'ACTIVE' and payment_status = 'PAID'), 0)    as sub_paid,
    count(*) filter (where status = 'ACTIVE')                                                as active_subs,
    count(*) filter (where status = 'ACTIVE' and payment_status = 'PAID')                    as sub_paid_count
  from public.client_month_subscriptions
),
quoting as (
  select
    count(*)                                                          as quotes,
    count(*) filter (where outcome = 'SUCCESS')                       as won,
    count(*) filter (where outcome = 'FAILED')                        as lost,
    count(*) filter (where outcome is null or outcome = 'PENDING')    as pending,
    coalesce(sum(amount), 0)                                          as quoted_value,
    coalesce(sum(amount) filter (where outcome = 'SUCCESS'), 0)       as won_value,
    coalesce(sum(amount) filter (where outcome = 'FAILED'), 0)        as lost_value,
    coalesce(sum(amount) filter (where outcome is null
                                   or outcome = 'PENDING'), 0)        as pipeline_value
  from public.quotes
),
spend as (
  select coalesce(sum(amount), 0) as expenses, count(*) as expense_count from public.expenses
),
book as (
  select count(*) as clients from public.clients
)
select
  s.mrr,
  s.active_subs,
  s.sub_paid,
  s.mrr - s.sub_paid                                       as sub_outstanding,
  r.push_billed,
  r.push_paid,
  r.push_billed - r.push_paid                              as push_outstanding,
  r.push_count,
  r.push_paid_count,
  r.push_billed + q.won_value                              as billed,
  r.push_paid + s.sub_paid                                 as collected,
  case when (r.push_billed + q.won_value) = 0 then 0
       else (r.push_paid + s.sub_paid) / (r.push_billed + q.won_value) end  as collection_rate,
  e.expenses,
  e.expense_count,
  (r.push_paid + s.sub_paid) - e.expenses                  as cash_position,
  case when (r.push_billed + q.won_value) = 0 then 0
       else e.expenses / (r.push_billed + q.won_value) end as expense_ratio,
  q.quotes, q.won, q.lost, q.pending,
  q.quoted_value, q.won_value, q.lost_value, q.pipeline_value,
  case when (q.won + q.lost) = 0 then 0 else q.won::numeric / (q.won + q.lost) end as win_rate_decided,
  b.clients,
  case when b.clients = 0 then 0 else s.mrr / b.clients end as arpu
from recurring r, subscriptions s, quoting q, spend e, book b;

-- --------------------------------------------------- month-by-month view
create or replace view public.v_monthly_performance with (security_invoker = true) as
with months as (
  select period as month from public.client_pushes
  union select to_char(quote_date, 'YYYY-MM') from public.quotes
  union select to_char(expense_date, 'YYYY-MM') from public.expenses
)
select
  m.month,
  coalesce((select sum(amount) from public.client_pushes p
            where p.period = m.month), 0)                                          as recurring_billed,
  coalesce((select sum(amount) from public.client_pushes p
            where p.period = m.month and p.payment_status = 'PAID'), 0)            as recurring_collected,
  coalesce((select sum(amount) from public.quotes q
            where to_char(q.quote_date,'YYYY-MM') = m.month and q.outcome = 'SUCCESS'), 0) as quotes_won_value,
  coalesce((select count(*) from public.quotes q
            where to_char(q.quote_date,'YYYY-MM') = m.month), 0)                   as quotes_sent,
  coalesce((select sum(amount) from public.expenses e
            where to_char(e.expense_date,'YYYY-MM') = m.month), 0)                 as expenses
from months m
where m.month is not null
order by m.month;

-- ------------------------------------------------------ area performance
create or replace view public.v_area_performance with (security_invoker = true) as
with push as (
  select client_id,
         sum(amount)                                        as billed,
         sum(amount) filter (where payment_status = 'PAID') as collected
  from public.client_pushes
  group by client_id
)
select
  coalesce(nullif(trim(c.area), ''), 'Unspecified') as area,
  count(*)                                          as clients,
  coalesce(sum(c.monthly_subscription), 0)          as mrr,
  coalesce(avg(c.monthly_subscription), 0)          as avg_subscription,
  coalesce(sum(p.billed), 0)                        as billed,
  coalesce(sum(p.collected), 0)                     as collected
from public.clients c
left join push p on p.client_id = c.id
group by 1
order by mrr desc;

-- ------------------------------------------------------ collections list
-- Everything still owed, oldest first — the chase list.
create or replace view public.v_outstanding with (security_invoker = true) as
select 'BILLING PUSH' as source, p.id, c.name as client, c.area, c.phone,
       p.period, p.push_date as dated, p.amount
from public.client_pushes p
join public.clients c on c.id = p.client_id
where p.payment_status <> 'PAID'
union all
select 'SUBSCRIPTION', s.id, c.name, c.area, c.phone,
       to_char(s.start_date,'YYYY-MM'), s.start_date, s.amount
from public.client_month_subscriptions s
join public.clients c on c.id = s.client_id
where s.status = 'ACTIVE' and s.payment_status <> 'PAID'
order by dated, amount desc;

-- --------------------------------------------------- quote profitability
create or replace view public.v_quote_profitability with (security_invoker = true) as
select
  q.id, q.quote_number, q.quote_date, q.client_name, q.service,
  q.vehicle_type, q.site, q.amount, q.status,
  coalesce(q.outcome, 'PENDING')                                          as outcome,
  count(i.id)                                                             as line_items,
  coalesce(sum(i.total_price), 0)                                         as line_items_total,
  coalesce(sum((i.labour_cost + i.product_cost) * i.quantity), 0)         as direct_cost,
  q.amount - coalesce(sum((i.labour_cost + i.product_cost) * i.quantity), 0) as gross_profit,
  case when q.amount = 0 then 0
       else (q.amount - coalesce(sum((i.labour_cost + i.product_cost) * i.quantity), 0)) / q.amount
  end                                                                     as margin,
  abs(q.amount - coalesce(sum(i.total_price), 0)) < 0.01                  as reconciles
from public.quotes q
left join public.quote_items i on i.quote_id = q.id
group by q.id
order by q.quote_date desc;

-- ------------------------------------------------------- expense summary
create or replace view public.v_expense_summary with (security_invoker = true) as
select
  category,
  to_char(expense_date, 'YYYY-MM') as month,
  count(*)                          as entries,
  sum(amount)                       as total
from public.expenses
group by 1, 2
order by 2, 4 desc;

-- ------------------------------------------------------ service margins
create or replace view public.v_service_margins with (security_invoker = true) as
select
  category, stage, vehicle_type, service_name,
  price, labour_cost, product_cost, total_cost, profit,
  case when price = 0 then 0 else profit / price end as margin
from public.services
order by profit desc;
