# Detailers Inc. — KPI & Operations System

Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no npm install.

**This is a working system, not a report.** You can add, edit and delete clients, subscriptions, billing pushes, quotes (with their line items),
leads, expenses and services, and the KPIs recalculate as you go.

## It shares one database with the CRM

The dashboard reads and writes the **same Supabase tables** the Detailers Compass
CRM uses — project `fudgjjckeqlhpvvnsikm`. There is no copying and no syncing,
because there is only one database:

- capture a quote here → it is in the CRM
- change a client in the CRM → it is here on the next refresh (every 60 seconds, or press Refresh)
- delete an expense in either → it is gone from both

> **Before you start using it in anger, take a backup.** Change History → *Download
> full backup*, or a database backup from the Supabase dashboard. This app writes to
> your live business data.

## Run it

Double-click `index.html`. That is the whole process — it opens in any browser and
works offline, because the CRM snapshot ships inside `js/data.js`.

If your browser blocks local files, serve the folder instead:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Log in

| Role  | User           | Password       | Sees                                          |
|-------|----------------|----------------|-----------------------------------------------|
| Admin | Brenton Naidoo | `Cantona@1234` | All ten pages                                  |
| Staff | Ricks          | `Staff@1234`   | Dashboard, Revenue, Leads, Clients, Quotes, Expenses, History |

Both can add, edit and delete — that was the decision taken. Every change is stamped
with who made it and shows up in Change History.

**Both passwords are hardcoded in `js/config.js`** — in the JavaScript, as requested.
They are not in the data file, not in the database, and nothing is read from a
`users` or `auth` table. To change one, edit the string in `config.js` and save.

Be aware of what this is: anyone who can open these files can read the passwords.
It is a front-door gate for daily use, not real security. Do not put the folder
somewhere public and assume the login protects it.

## Files

```
index.html                  page structure only — no styles, no logic
css/styles.css              all styling, dark theme, print and mobile layouts
js/config.js                PASSWORDS + which database to use
js/data.js                  offline seed data (175 rows). No credentials.
js/schema.js                what each record is: fields, validation, business rules
js/store.js                 reads and writes the shared CRM database; audit trail
js/forms.js                 the add/edit window, including quote line items
js/app.js                   metrics, KPI rules, charts, pages, CSV export
assets/detailers-inc-logo.jpg
supabase/01_schema.sql      the seven tables + kpi_targets
supabase/02_views.sql       the KPI maths as SQL views
supabase/03_rls.sql         grants and row level security (READ ITS HEADER FIRST)
supabase/04_seed.sql        all 175 rows from the backup
supabase/05_audit_log.sql   the shared change trail + updated_at triggers
```

Load order in `index.html` matters:
`config.js` → `data.js` → `schema.js` → `store.js` → `forms.js` → `app.js`.

### Leads — shared CRM pipeline

The **Leads** page is not a separate list. In live mode it reads and writes the CRM's existing `public.leads` table directly, so the same records are visible in both applications. It refreshes with the same 60-second live polling as the other CRM data, and lead creates/edits/deletes are included in Change History and full backups.

The page includes search, status/source filters, estimated opportunity value, follow-up dates, overdue follow-up highlighting, assignment, pipeline status counts and CSV export. The editor uses a compatibility mapper for common CRM column names such as `name`/`lead_name`, `status`/`lead_status`, `source`/`lead_source`, and `follow_up_date`/`next_follow_up`, so it can work with the existing CRM table without creating a second lead database.

The Leads page is available to both Admin and Staff. In Supabase mode, the CRM database remains the source of truth.

## Adding and editing

Every records table has a **+ New** button and ✎ / ✕ on each row.

- **Quotes** open a full editor: pick a line off the price list and the description,
  price, labour and product cost fill themselves in. Subtotal, VAT and total are
  calculated from the lines — never typed. Deleting a quote takes its line items with it.
- **Services**: enter price, labour and product; total cost and profit are worked out.
- **Subscriptions**: changing an active amount updates that client's monthly fee too,
  so the two can't drift apart.
- **Billing pushes**: choose a client and the amount pre-fills from their contract.
  *Mark all shown as paid* clears a whole collection run in one go.
- Required fields, number ranges and email format are checked before anything is saved.

## If something goes wrong

- **Change History** lists every add, edit and delete — who, when, and which fields
  changed from what to what.
- **Deleting is reversible.** The full record is kept, so *Restore* puts it back,
  line items and all.
- **Download full backup** gives you every table plus the history as JSON.
- If the database cannot be reached the app goes **read only** — buttons disable and
  it says so, rather than accepting edits that would quietly vanish.

## Adding a new month

Nothing to configure. The period buttons build themselves from the dates in the data,
so the first record dated October makes an October button appear, and the monthly KPI
targets scale to the months in view.

## The data

Restored from `detailers-compass-rebuilt_260918.backup` (18 September 2026) and
cross-checked against the CSV exports. Total expenses reconcile exactly to the
CRM's own `monthly_financial_summary` view: R39,070.52 for August plus R3,345.38
for September.

| Table                     | Rows |
|---------------------------|------|
| clients                   | 26   |
| client_month_subscriptions| 26   |
| client_pushes             | 26   |
| quotes                    | 11   |
| quote_items               | 21   |
| expenses                  | 32   |
| services                  | 33   |

`invoices`, `invoice_items`, `leads`, `ledger_entries`, `messages` and
`business_targets` were **empty** in the backup. That is why the dashboard has no
lead funnel, and why the CRM's own summary reports R0 cash in — revenue here is
derived from subscription and billing-push payment flags instead. The dashboard
says so on its face rather than inventing numbers.

## The SQL files — what you actually need to run

Against the **live CRM project**, the tables already exist with the right columns and
the right policies. You only need one file:

- `05_audit_log.sql` — creates the shared change trail. Run it in the Supabase SQL
  editor. Everything else works without it (the trail is kept in the browser regardless).
- `02_views.sql` — optional, gives you the KPI maths as SQL views for reporting.

**Do not run `01_schema.sql`, `03_rls.sql` or `04_seed.sql` against the live CRM.**
The schema file is for standing up a fresh project, the seed would re-insert the
September rows, and the RLS file rewrites policies the CRM depends on. Their headers
say the same thing.

Only ever put the **publishable (anon)** key in `config.js`. A service-role key in
front-end code hands over the whole database.

### Working offline instead

Set `USE_SUPABASE: false` in `js/config.js`. The app then uses this browser's own
storage, seeded from `js/data.js`. Useful for training Ricks or trying something out —
**nothing written in that mode reaches the CRM.** The sidebar says which mode you are in.

## The SQL views

`02_views.sql` reproduces the dashboard's maths in SQL, so reports built elsewhere
match the screen exactly:

| View                     | Gives you                                                 |
|--------------------------|-----------------------------------------------------------|
| `v_kpi_summary`          | every headline figure in one row                          |
| `v_monthly_performance`  | billed, collected and spent per month                     |
| `v_area_performance`     | clients, MRR and collections by area                      |
| `v_outstanding`          | the chase list — everything still owed, oldest first      |
| `v_quote_profitability`  | per-quote cost, margin and a line-item reconciliation flag |
| `v_expense_summary`      | spend by category and month                               |
| `v_service_margins`      | the price list ranked by profit                           |

Verified against a live PostgreSQL 16 instance: `v_kpi_summary` returns MRR
R12,443.75, billed R15,957.28, collected R5,267.25, expenses R42,415.90 and a
50% decided win rate — identical to what the dashboard renders.

## KPI targets

Targets live in `TARGETS` at the top of `js/app.js`, and can be edited on screen
from the KPI Monitor page (session only — nothing is written back). Four came from
the original source workbook; four are defaults set in this build and marked as
such in the table. Monthly targets scale with the period you select, so a two-month
view is judged against two months of target.

Status rule, carried over from the workbook: **ON TARGET** at 100%+, **WATCH** from
75%, **BEHIND** below 75%. The expense ratio is inverted — lower is better.

`01_schema.sql` also creates a `kpi_targets` table, pre-filled with the same eight
values, if you would rather manage targets in the database later.

## Regenerating the seed

`js/data.js` and `supabase/04_seed.sql` are generated from the Postgres backup.
Nothing else is generated — every other file is hand-written and safe to edit.

## Known limits, stated plainly

- **The publishable key is in browser code.** Anyone with these files can read and
  change the data through it. That is already true of the CRM; this app does not make
  it worse, but it does not fix it either. The proper answer is Supabase Auth accounts
  with policies keyed to `auth.uid()` — and it has to be done in both apps together.
- **The password gate is a front door, not a lock.** Same as before.
- **Two people editing the same record** — last save wins. With two users this is
  unlikely to bite; the change history will show what happened if it does.
- **Changes from the CRM appear on a 60-second poll**, not instantly. Press Refresh
  when you need it now.
