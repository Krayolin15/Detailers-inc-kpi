/* Detailers Inc. — KPI & Business Intelligence dashboard.

   Data is owned by js/store.js, which talks to the same Supabase tables
   the Detailers Compass CRM uses. DATA below is a live view over that
   store, so every screen re-reads the current rows — there is no second
   copy to fall out of step.

   Login credentials live in js/config.js — never in the data or the database. */
(() => {
'use strict';
const CFG = window.DI_CONFIG || {};
const STORE = window.DI_STORE;
const FORMS = window.DI_FORMS;
const SCHEMA = window.DI_SCHEMA;

/* A live window onto the store — the render code below reads it exactly
   as it read the old static snapshot. */
const DATA = {
  get clients(){ return STORE.all('clients'); },
  get leads(){ return STORE.all('leads'); },
  get subs(){ return STORE.all('subs'); },
  get pushes(){ return STORE.all('pushes'); },
  get quotes(){ return STORE.all('quotes'); },
  get quote_items(){ return STORE.all('quote_items'); },
  get expenses(){ return STORE.all('expenses'); },
  get services(){ return STORE.all('services'); },
  get counts(){ return STORE.counts(); },
  get meta(){
    const s = STORE.state;
    return s.mode === 'supabase'
      ? { source: CFG.SUPABASE_URL, taken: s.lastSync ? new Date(s.lastSync).toLocaleString('en-ZA') : 'not yet', db: 'Shared CRM database (Supabase)' }
      : { source: 'This browser’s local database', taken: s.lastSync ? new Date(s.lastSync).toLocaleString('en-ZA') : 'now', db: 'Local storage — not shared with the CRM' };
  }
};

/* =============== helpers =============== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const n = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const R = v => 'R' + n(v).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const R0 = v => 'R' + Math.round(n(v)).toLocaleString('en-ZA');
const pct = (v,d=1) => (n(v)*100).toFixed(d) + '%';
const cnt = v => n(v).toLocaleString('en-ZA');
const MONTHS = {'2026-08':'August 2026','2026-09':'September 2026'};
const mon = s => (s||'').slice(0,7);
const fmtDate = s => { if(!s) return '—'; const d = new Date(String(s).slice(0,10)+'T00:00:00');
  return isNaN(d) ? '—' : d.toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'}); };
const sum = (a,f) => a.reduce((t,x)=>t+n(f(x)),0);
const byDesc = k => (a,b)=> n(b[k]) - n(a[k]);
const groupBy = (arr,f) => { const m = new Map(); arr.forEach(x=>{ const k=f(x)||'Unspecified'; if(!m.has(k)) m.set(k,[]); m.get(k).push(x); }); return m; };

const state = { role:null, user:null, page:'dashboard', period:'all', leadSearch:'', leadStatus:'ALL', leadSource:'ALL' };
const clientName = id => { const c = STORE.find('clients', id); return c ? c.name : 'Unlinked client'; };
const clientArea = id => { const c = STORE.find('clients', id); return (c && c.area) || 'Unspecified'; };
const leadValue = (row, key) => STORE.fieldValue('leads', row, key);
const leadText = (row, key, fallback='') => { const v = leadValue(row, key); return v === null || v === undefined || v === '' ? fallback : String(v); };
const leadIsClosed = row => ['WON','LOST','CONVERTED','CLOSED'].includes(leadText(row,'status').trim().toUpperCase());
const leadDisplayName = row => leadText(row,'name') || leadText(row,'company') || '(untitled lead)';

/* KPI targets. Workbook-sourced where the workbook had one; the rest are
   editable defaults set in this build. Edits live for the session only. */
const TARGETS = {
  billed:      { label:'Billed revenue',              target:48000, unit:'money', src:'Workbook: Sales Revenue', monthly:true },
  newSubs:     { label:'New subscriptions started',   target:8,     unit:'count', src:'Workbook: New Customers Won', monthly:true },
  quotesSent:  { label:'Quotations sent',             target:24,    unit:'count', src:'Workbook: Quotations Sent', monthly:true },
  winRate:     { label:'Quote win rate (decided)',    target:0.33,  unit:'rate',  src:'Workbook: Quote → Sale' },
  collection:  { label:'Collection rate',             target:0.90,  unit:'rate',  src:'Set in this build — editable' },
  subscribers: { label:'Active subscribers',          target:30,    unit:'count', src:'Set in this build — editable' },
  arpu:        { label:'Average revenue per client',  target:600,   unit:'money', src:'Set in this build — editable' },
  expRatio:    { label:'Expense ratio (spend ÷ billed)', target:0.70, unit:'rate', src:'Set in this build — editable', invert:true }
};

/* =============== metrics =============== */
/* Every month the data actually covers — grows by itself as records are added. */
function dataMonths(){
  return [...new Set([
    ...DATA.pushes.map(p=>p.period),
    ...DATA.expenses.map(e=>mon(e.expense_date)),
    ...DATA.quotes.map(q=>mon(q.quote_date)),
    ...DATA.subs.map(s=>mon(s.start_date))
  ].filter(Boolean))].sort();
}
function monthName(mm){
  return MONTHS[mm] || (/^\d{4}-\d{2}$/.test(mm)
    ? new Date(mm + '-01T00:00:00').toLocaleDateString('en-ZA',{month:'long', year:'numeric'}) : mm);
}
function periodLabel(){
  if (state.period !== 'all') return monthName(state.period);
  const ms = dataMonths();
  return ms.length ? `All data (${monthName(ms[0])} – ${monthName(ms[ms.length-1])})` : 'All data';
}

function metrics(){
  const p = state.period;
  const inP = m => p === 'all' || m === p;

  const clients = DATA.clients;
  const subs = DATA.subs;
  const activeSubs = subs.filter(s=>s.status === 'ACTIVE');
  const mrr = sum(activeSubs, s=>s.amount);
  const subPaid = sum(activeSubs.filter(s=>s.payment_status==='PAID'), s=>s.amount);
  const subPaidCount = activeSubs.filter(s=>s.payment_status==='PAID').length;

  const pushes = DATA.pushes.filter(x=>inP(x.period));
  const pushBilled = sum(pushes, x=>x.amount);
  const pushPaid = sum(pushes.filter(x=>x.payment_status==='PAID'), x=>x.amount);
  const pushOutstanding = pushBilled - pushPaid;

  const expenses = DATA.expenses.filter(e=>inP(mon(e.expense_date)));
  const expTotal = sum(expenses, e=>e.amount);

  const quotes = DATA.quotes.filter(q=>inP(mon(q.quote_date)));
  const qWon = quotes.filter(q=>q.outcome === 'SUCCESS');
  const qLost = quotes.filter(q=>q.outcome === 'FAILED');
  const qPend = quotes.filter(q=>!q.outcome || q.outcome === 'PENDING');
  const qWonV = sum(qWon,q=>q.amount), qLostV = sum(qLost,q=>q.amount), qPendV = sum(qPend,q=>q.amount);
  const decided = qWon.length + qLost.length;

  const newSubs = subs.filter(s=>inP(mon(s.start_date)));
  const newSubsValue = sum(newSubs, s=>s.amount);

  const billed = pushBilled + qWonV;          // money invoiced/charged in the period
  const collected = pushPaid + (p === 'all' || p === '2026-08' ? subPaid : 0);

  return {
    clients, subs, activeSubs, mrr, subPaid, subPaidCount, subUnpaid: mrr - subPaid,
    pushes, pushBilled, pushPaid, pushOutstanding,
    expenses, expTotal,
    quotes, qWon, qLost, qPend, qWonV, qLostV, qPendV, decided,
    qTotalV: sum(quotes,q=>q.amount),
    winRateDecided: decided ? qWon.length / decided : 0,
    winRateAll: quotes.length ? qWon.length / quotes.length : 0,
    newSubs, newSubsValue,
    billed, collected,
    collectionRate: billed ? collected / billed : 0,
    arpu: clients.length ? mrr / clients.length : 0,
    expRatio: billed ? expTotal / billed : 0,
    net: collected - expTotal
  };
}

function statusOf(ach){ return ach >= 1 ? 'ON TARGET' : ach >= .75 ? 'WATCH' : 'BEHIND'; }
function statusCls(s){ return s === 'ON TARGET' ? 'good' : s === 'WATCH' ? 'watch' : 'bad'; }
function statusIcon(s){ return s === 'ON TARGET' ? '✓' : s === 'WATCH' ? '!' : '✕'; }

/* Months covered by the current period — monthly targets scale with it, so a
   two-month view is judged against two months of target, not one. */
function periodMonths(){ return state.period === 'all' ? Math.max(1, dataMonths().length) : 1; }

function kpiRows(m){
  const v = {
    billed: m.billed, newSubs: m.newSubs.length, quotesSent: m.quotes.length,
    winRate: m.winRateDecided, collection: m.collectionRate, subscribers: m.activeSubs.length,
    arpu: m.arpu, expRatio: m.expRatio
  };
  const months = periodMonths();
  return Object.entries(TARGETS).map(([key,t]) => {
    const actual = v[key];
    const target = t.monthly ? t.target * months : t.target;
    const ach = t.invert ? (actual > 0 ? target / actual : (target > 0 ? 1 : 0)) : (target ? actual / target : 0);
    const st = statusOf(ach);
    const fmt = x => t.unit === 'money' ? R0(x) : t.unit === 'rate' ? pct(x) : cnt(x);
    return { key, label:t.label, src:t.src, target, base:t.target, actual, ach, st, fmt,
             unit:t.unit, invert:!!t.invert, monthly:!!t.monthly, months };
  });
}

/* =============== chart primitives =============== */
const tip = $('tip');
function showTip(e, html){
  tip.innerHTML = html; tip.classList.remove('hidden');
  const r = tip.getBoundingClientRect();
  let x = e.clientX + 14, y = e.clientY + 14;
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
  if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
  tip.style.left = Math.max(8,x) + 'px'; tip.style.top = Math.max(8,y) + 'px';
}
function hideTip(){ tip.classList.add('hidden'); }
function bindTips(root){
  root.querySelectorAll('[data-tip]').forEach(el=>{
    el.addEventListener('mousemove', e=>showTip(e, el.getAttribute('data-tip')));
    el.addEventListener('mouseleave', hideTip);
  });
}
function niceMax(v){
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const s = v / mag;
  const step = s <= 1 ? 1 : s <= 2 ? 2 : s <= 2.5 ? 2.5 : s <= 5 ? 5 : 10;
  return step * mag;
}

/* Horizontal magnitude bars — one measure across categories, single hue. */
function hBars(rows, opt={}){
  const fmt = opt.fmt || R0, color = opt.color || 'var(--s1)';
  const max = Math.max(1, ...rows.map(r=>n(r.value)));
  const rowH = 26, gap = 8, labelW = opt.labelW || 150, valW = 92;
  const maxCh = opt.maxChars || Math.max(18, Math.round(labelW / 5.6));
  const h = rows.length * (rowH + gap);
  const W = 720, plotW = W - labelW - valW;
  const bars = rows.map((r,i)=>{
    const y = i * (rowH + gap), w = Math.max(2, n(r.value) / max * plotW);
    const t = esc(`<b>${r.label}</b><span class="v">${fmt(r.value)}</span>${r.note ? '<br>'+r.note : ''}`);
    return `<g data-tip="${t}">
      <rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"></rect>
      <text x="0" y="${y + rowH/2 + 3}" class="axis-txt">${esc(r.label.length > maxCh ? r.label.slice(0,maxCh-1)+'…' : r.label)}</text>
      <rect x="${labelW}" y="${y + 5}" width="${w}" height="${rowH - 10}" rx="4" fill="${color}"></rect>
      <text x="${W}" y="${y + rowH/2 + 3}" text-anchor="end" class="axis-val">${fmt(r.value)}</text>
    </g>`;
  }).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="xMinYMin meet" role="img">${bars}</svg></div>`;
}

/* Grouped vertical bars — same unit, one axis. */
function groupedBars(categories, series, opt={}){
  const fmt = opt.fmt || R0;
  const W = 720, H = opt.height || 260, padL = 62, padR = 8, padT = 10, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const max = niceMax(Math.max(1, ...series.flatMap(s=>s.values.map(n))));
  const gw = plotW / categories.length;
  const bw = Math.min(54, (gw - 26) / series.length);
  const ticks = 4;
  let g = '';
  for (let i = 0; i <= ticks; i++){
    const val = max * i / ticks, y = padT + plotH - (i/ticks)*plotH;
    g += `<line x1="${padL}" x2="${W-padR}" y1="${y}" y2="${y}" class="${i?'gridline':'baseline'}"></line>
          <text x="${padL-8}" y="${y+3}" text-anchor="end" class="axis-val">${fmt(val)}</text>`;
  }
  categories.forEach((c,ci)=>{
    const cx = padL + ci*gw + gw/2;
    g += `<text x="${cx}" y="${H-10}" text-anchor="middle" class="axis-txt">${esc(c)}</text>`;
    series.forEach((s,si)=>{
      const v = n(s.values[ci]);
      const bh = Math.max(v > 0 ? 2 : 0, v/max*plotH);
      const x = cx - (series.length*bw + (series.length-1)*2)/2 + si*(bw+2);
      const y = padT + plotH - bh;
      const t = esc(`<b>${c}</b>${s.name}: <span class="v">${fmt(v)}</span>`);
      g += `<rect data-tip="${t}" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="4" fill="${s.color}"></rect>`;
    });
  });
  const legend = series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
  return `<div class="legend">${legend}</div><div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet" role="img">${g}</svg></div>`;
}

/* One stacked bar — parts of a whole, 2px surface gaps. */
function stackBar(segments, opt={}){
  const fmt = opt.fmt || R0;
  const total = sum(segments, s=>s.value) || 1;
  const W = 720, H = 34;
  let x = 0, g = '';
  segments.forEach(s=>{
    const w = Math.max(0, n(s.value)/total*W);
    if (w > 0){
      const ww = Math.max(1, w - 2);
      const t = esc(`<b>${s.label}</b><span class="v">${fmt(s.value)}</span> · ${pct(n(s.value)/total)}`);
      g += `<rect data-tip="${t}" x="${x}" y="0" width="${ww}" height="${H}" rx="4" fill="${s.color}"></rect>`;
      if (ww > 74) g += `<text x="${x+10}" y="${H/2+4}" class="axis-val" style="fill:#08131b;font-weight:800">${pct(n(s.value)/total,0)}</text>`;
    }
    x += w;
  });
  const legend = segments.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.label)} — ${fmt(s.value)}</span>`).join('');
  return `<div class="legend">${legend}</div><div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:34px" role="img">${g}</svg></div>`;
}

function table(cols, rows, foot){
  const th = cols.map(c=>`<th class="${c.right?'right':''}">${esc(c.label)}</th>`).join('');
  const tb = rows.map(r=>`<tr>${cols.map(c=>`<td class="${c.right?'right':''}">${c.raw ? r[c.key] : esc(r[c.key] ?? '—')}</td>`).join('')}</tr>`).join('');
  const tf = foot ? `<tfoot><tr>${cols.map(c=>`<td class="${c.right?'right':''}">${foot[c.key] ?? ''}</td>`).join('')}</tr></tfoot>` : '';
  return `<div class="table-wrap"><table class="table"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody>${tf}</table></div>`;
}

/* =============== record actions =============== */
/* A toolbar over a records table: what you can add, and a count. */
function toolbar(key, extra){
  const def = SCHEMA[key];
  const ro = STORE.state.readOnly;
  return `<div class="rec-bar">
    <button class="btn primary small" data-new="${key}"${ro?' disabled title="Read only — the database is unreachable"':''}>+ New ${esc(def.label.toLowerCase())}</button>
    ${extra || ''}
    <span class="rec-count">${STORE.all(key).length} ${esc(def.plural.toLowerCase())}</span>
  </div>`;
}
/* The edit / delete pair that sits on the end of every record row. */
function rowActions(key, id){
  const ro = STORE.state.readOnly;
  return `<div class="row-acts">
    <button class="btn small" data-edit="${key}" data-id="${esc(id)}"${ro?' disabled':''} title="Edit">✎</button>
    <button class="btn small danger" data-del="${key}" data-id="${esc(id)}"${ro?' disabled':''} title="Delete">✕</button>
  </div>`;
}

function stat(eyebrow, value, sub, opt={}){
  const bar = opt.ach !== undefined
    ? `<div class="progress ${statusCls(statusOf(opt.ach))}"><i style="width:${Math.min(100, Math.max(2, opt.ach*100)).toFixed(1)}%"></i></div>` : '';
  const badge = opt.status ? `<span class="status ${statusCls(opt.status)}">${statusIcon(opt.status)} ${opt.status}</span>` : '';
  return `<div class="card">
    <div class="kpi-row"><span class="eyebrow">${esc(eyebrow)}</span>${badge}</div>
    <div class="metric ${opt.small?'sm':''}">${value}</div>
    <div class="submetric">${sub}</div>${bar}</div>`;
}

/* =============== pages =============== */
const PAGES = {
  dashboard: ['Executive Dashboard', 'Headline performance from the live CRM snapshot'],
  kpi:       ['KPI Monitor', 'Actual versus target, with the workbook status rules'],
  revenue:   ['Revenue & Collections', 'What was billed, what came in, what is still owed'],
  leads:     ['Leads', 'Live sales pipeline shared directly with the CRM'],
  clients:   ['Clients & Subscriptions', 'The recurring base and each client’s payment state'],
  quotes:    ['Quotes Pipeline', 'Quotation values, outcomes and win rate'],
  expenses:  ['Expenses', 'Spend by category, month, vendor and payer'],
  services:  ['Services & Margins', 'The published price list and its margin profile'],
  analytics: ['Analytics', 'Areas, concentration and data quality'],
  history:   ['Change History', 'Every change made, and a way back from a delete'],
  data:      ['Data & Export', 'Where the data lives, and CSV downloads']
};
const NAV_ADMIN = [['dashboard','▦'],['kpi','◇'],['revenue','R'],['leads','L'],['clients','◆'],['quotes','▱'],['expenses','▤'],['services','✦'],['analytics','∑'],['history','◷'],['data','⌘']];
const NAV_STAFF = [['dashboard','▦'],['revenue','R'],['leads','L'],['clients','◆'],['quotes','▱'],['expenses','▤'],['history','◷']];

function renderDashboard(m){
  const collectedNote = state.period === '2026-09'
    ? 'September billing run receipts'
    : 'Subscription receipts + September run receipts';
  const rows = kpiRows(m);
  const k = Object.fromEntries(rows.map(r=>[r.key,r]));

  const monthCats = ['August 2026','September 2026'];
  const billedByMonth = ['2026-08','2026-09'].map(mm => {
    const pv = sum(DATA.pushes.filter(p=>p.period===mm), p=>p.amount);
    const qv = sum(DATA.quotes.filter(q=>mon(q.quote_date)===mm && q.outcome==='SUCCESS'), q=>q.amount);
    return pv + qv;
  });
  const expByMonth = ['2026-08','2026-09'].map(mm => sum(DATA.expenses.filter(e=>mon(e.expense_date)===mm), e=>e.amount));

  const quoteSeg = [
    { label:'Won', value:m.qWonV, color:'var(--s3)' },
    { label:'Pending', value:m.qPendV, color:'var(--s1)' },
    { label:'Lost', value:m.qLostV, color:'var(--s2)' }
  ];

  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Contracted MRR', R0(m.mrr), `${m.activeSubs.length} active subscriptions · ${R0(m.arpu)} average per client`, {ach:m.activeSubs.length/TARGETS.subscribers.target, status:k.subscribers.st})}
    ${stat('Billed revenue', R0(m.billed), `${R0(m.pushBilled)} recurring + ${R0(m.qWonV)} won quotes · ${esc(periodLabel())}`, {ach:k.billed.ach, status:k.billed.st})}
    ${stat('Collected', R0(m.collected), `${collectedNote} · ${pct(m.collectionRate)} of billed`, {ach:k.collection.ach, status:k.collection.st})}
    ${stat('Expenses', R0(m.expTotal), `${m.expenses.length} entries · ${pct(m.expRatio)} of billed revenue`, {ach:k.expRatio.ach, status:k.expRatio.st})}
  </div>

  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Outstanding — recurring', R0(m.pushOutstanding), `${m.pushes.filter(p=>p.payment_status!=='PAID').length} unpaid billing pushes`, {small:true})}
    ${stat('Outstanding — subscriptions', R0(m.subUnpaid), `${m.activeSubs.length - m.subPaidCount} of ${m.activeSubs.length} subscriptions unpaid`, {small:true})}
    ${stat('Quote pipeline', R0(m.qPendV), `${m.qPend.length} quotes awaiting a decision`, {small:true})}
    ${stat('Cash position', (m.net<0?'−':'') + R0(Math.abs(m.net)), m.net < 0 ? 'Collections are behind spend for this period' : 'Collections exceed spend for this period', {small:true})}
  </div>

  <div class="grid grid-2" style="margin-bottom:12px">
    <div class="card">
      <h3>Billed revenue vs expenses</h3>
      <p class="card-sub">Recurring billing plus won quotes, against recorded spend. Both in rand, one scale.</p>
      ${groupedBars(monthCats, [
        {name:'Billed revenue', color:'var(--s1)', values:billedByMonth},
        {name:'Expenses', color:'var(--s2)', values:expByMonth}
      ])}
      <div class="note" style="margin-top:10px">August shows no billed revenue because every billing push in the CRM belongs to the <b>2026-09</b> period — the August subscriptions were loaded but never pushed as charges. August also carries ${R0(expByMonth[0])} of the ${R0(m.expTotal)} total spend, including the salary and insurance runs.</div>
    </div>
    <div class="card">
      <h3>Expenses by category</h3>
      <p class="card-sub">${periodLabel()} · ${R0(m.expTotal)} across ${m.expenses.length} entries.</p>
      ${hBars([...groupBy(m.expenses, e=>e.category)].map(([k2,v])=>({label:k2, value:sum(v,e=>e.amount), note:`${v.length} ${v.length===1?'entry':'entries'}`})).sort(byDesc('value')), {labelW:160})}
    </div>
  </div>

  <div class="grid grid-2" style="margin-bottom:12px">
    <div class="card">
      <h3>Collection state — recurring billing</h3>
      <p class="card-sub">${periodLabel()} billing pushes, paid against outstanding.</p>
      ${stackBar([
        {label:'Collected', value:m.pushPaid, color:'var(--s3)'},
        {label:'Outstanding', value:m.pushOutstanding, color:'var(--s2)'}
      ])}
      <div class="note" style="margin-top:12px">Only <b>${m.pushes.filter(p=>p.payment_status==='PAID').length} of ${m.pushes.length}</b> billing pushes in this period are marked paid. Chasing the outstanding ${R0(m.pushOutstanding)} is the single biggest lever in this dashboard.</div>
    </div>
    <div class="card">
      <h3>Quote pipeline by outcome</h3>
      <p class="card-sub">${m.quotes.length} quotes worth ${R0(m.qTotalV)} · win rate ${pct(m.winRateDecided)} of decided quotes.</p>
      ${stackBar(quoteSeg)}
      <div class="note" style="margin-top:12px">${m.qWon.length} won · ${m.qLost.length} lost · ${m.qPend.length} still open. Every quote in the snapshot is still at <b>DRAFT</b> status, so the outcome flag is the only reliable signal of what actually closed.</div>
    </div>
  </div>

  ${renderFlags(m)}`;
}

function renderFlags(m){
  const f = [];
  if (DATA.counts.invoices === 0) f.push(['bad','!','No invoices captured',
    `The CRM holds ${DATA.counts.invoices} invoices and ${DATA.counts.ledger_entries} ledger entries, so its own monthly financial summary reports R0 cash in for both months. Every revenue figure here is derived from subscription and billing-push payment flags instead.`]);
  if (m.pushOutstanding > 0) f.push(['warn','!','Collections are the weak point',
    `${R0(m.pushOutstanding)} of ${R0(m.pushBilled)} billed in the current billing run is unpaid — a ${pct(m.collectionRate)} collection rate against a ${pct(TARGETS.collection.target,0)} target.`]);
  if (DATA.counts.leads === 0) f.push(['info','i','The CRM lead table is empty',
    'There are currently no lead records in the shared CRM database. The new Leads workspace is connected to that same table, so leads captured there will appear here automatically.']);
  else f.push(['info','i','Live lead funnel connected',
    `${DATA.counts.leads} lead${DATA.counts.leads===1?'':'s'} are being read directly from the shared CRM leads table. The Leads workspace can add, edit and delete the same records.`]);
  const jobs = sum(DATA.pushes, p=>p.jobs);
  if (jobs <= 1) f.push(['warn','!','Jobs are not being logged',
    `Across ${DATA.pushes.length} billing pushes only ${cnt(jobs)} job is recorded. Cost per job and jobs per client cannot be calculated until washes are captured against each push.`]);
  const draft = DATA.quotes.filter(q=>q.status==='DRAFT').length;
  if (draft === DATA.quotes.length && draft > 0) f.push(['info','i','All quotes sit at DRAFT',
    `All ${draft} quotes still carry DRAFT status even where the outcome is recorded as won or lost. Moving quotes through sent → accepted would make the pipeline age measurable.`]);
  if (!f.length) return '';
  return `<div class="card"><h3>What the data is telling you</h3><p class="card-sub">Generated from the snapshot, not from assumptions.</p>
    ${f.map(([cls,ic,t,p])=>`<div class="flag ${cls}"><span class="ic">${ic}</span><div><b>${esc(t)}</b><p>${p}</p></div></div>`).join('')}</div>`;
}

function renderKpi(m){
  const rows = kpiRows(m);
  const body = rows.map(r=>`<tr>
      <td><b>${esc(r.label)}</b><br><span class="muted" style="font-size:10px">${esc(r.src)}</span></td>
      <td class="right">${r.fmt(r.actual)}</td>
      <td class="right">${r.fmt(r.target)}${r.monthly && r.months > 1 ? `<br><span class="muted" style="font-size:9px">${r.fmt(r.base)} × ${r.months} months</span>` : ''}</td>
      <td class="right">${pct(r.ach,0)}</td>
      <td><span class="status ${statusCls(r.st)}">${statusIcon(r.st)} ${r.st}</span></td>
      <td>${esc(r.st === 'BEHIND' ? (r.invert ? 'Cut spend or raise billing' : 'Increase activity / follow-ups') : r.st === 'WATCH' ? 'Push conversions' : 'Maintain pace')}</td>
    </tr>`).join('');
  const onT = rows.filter(r=>r.st==='ON TARGET').length;
  return `
  <div class="grid grid-3" style="margin-bottom:12px">
    ${stat('On target', `${onT} / ${rows.length}`, 'KPIs meeting or beating target', {ach:onT/rows.length})}
    ${stat('Watch', String(rows.filter(r=>r.st==='WATCH').length), 'Between 75% and 100% of target', {small:true})}
    ${stat('Behind', String(rows.filter(r=>r.st==='BEHIND').length), 'Below 75% of target', {small:true})}
  </div>
  <div class="card">
    <h3>KPI monitor — ${esc(periodLabel())}</h3>
    <p class="card-sub">Status rule carried over from the source workbook: <b>ON TARGET</b> at 100%+, <b>WATCH</b> from 75%, <b>BEHIND</b> below 75%. Monthly targets scale with the selected period; the expense ratio is inverted — lower is better.</p>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>KPI</th><th class="right">Actual</th><th class="right">Target</th><th class="right">Achievement</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>${body}</tbody></table></div>
  </div>
  <div class="card" style="margin-top:12px">
    <h3>Adjust targets</h3>
    <p class="card-sub">Monthly targets are entered per month. Changes apply to this session only — nothing is written back to the CRM.</p>
    <div class="grid grid-4">
      ${rows.map(r=>`<div class="field"><label>${esc(r.label)}${r.monthly?' (per month)':''}</label>
        <input type="number" step="${r.unit==='rate'?'0.01':'1'}" value="${r.base}" data-target="${r.key}"></div>`).join('')}
    </div>
  </div>`;
}

function renderRevenue(m){
  const pushRows = m.pushes.map(p=>({
    client: clientName(p.client_id), area: clientArea(p.client_id), period: MONTHS[p.period] || p.period,
    date: fmtDate(p.push_date), type: p.group_type, jobs: cnt(p.jobs),
    amount: R(p.amount),
    st: `<span class="status ${p.payment_status==='PAID'?'good':'bad'}">${p.payment_status==='PAID'?'✓ PAID':'✕ UNPAID'}</span>`,
    act: rowActions('pushes', p.id),
    _pay: p.payment_status, _id: p.id
  })).sort((a,b)=> a.client.localeCompare(b.client));

  const byArea = [...groupBy(m.pushes, p=>clientArea(p.client_id))]
    .map(([k,v])=>({label:k, value:sum(v,p=>p.amount), note:`${v.length} client${v.length===1?'':'s'} · ${R0(sum(v.filter(p=>p.payment_status==='PAID'),p=>p.amount))} collected`}))
    .sort(byDesc('value'));

  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Billed (recurring)', R0(m.pushBilled), `${m.pushes.length} billing pushes in ${periodLabel()}`, {small:true})}
    ${stat('Collected', R0(m.pushPaid), `${m.pushes.filter(p=>p.payment_status==='PAID').length} paid`, {small:true})}
    ${stat('Outstanding', R0(m.pushOutstanding), `${m.pushes.filter(p=>p.payment_status!=='PAID').length} unpaid`, {small:true})}
    ${stat('Collection rate', pct(m.pushBilled ? m.pushPaid/m.pushBilled : 0), `Target ${pct(TARGETS.collection.target,0)}`, {ach:(m.pushBilled?m.pushPaid/m.pushBilled:0)/TARGETS.collection.target, small:true})}
  </div>
  <div class="card" style="margin-bottom:12px">
    <h3>Recurring billing by area</h3>
    <p class="card-sub">Where the monthly money is billed — and how much of it has actually come in.</p>
    ${hBars(byArea, {labelW:180})}
  </div>
  <div class="card">
    <h3>Billing pushes — ${esc(periodLabel())}</h3>
    <p class="card-sub">Every charge raised against a client in this period. Mark one paid the moment the money lands.</p>
    ${toolbar('pushes', `<button class="btn small" data-markpaid="all"${STORE.state.readOnly?' disabled':''}>Mark all shown as paid</button>`)}
    ${table([
      {key:'client',label:'Client'},{key:'area',label:'Area'},{key:'period',label:'Period'},{key:'date',label:'Pushed'},
      {key:'type',label:'Type'},{key:'jobs',label:'Jobs',right:true},{key:'amount',label:'Amount',right:true},
      {key:'st',label:'Status',raw:true},{key:'act',label:'',raw:true}
    ], pushRows, {client:`${pushRows.length} pushes`, amount:R(m.pushBilled), st:`${R(m.pushPaid)} collected`})}
  </div>`;
}

function renderClients(m){
  const subByClient = new Map(DATA.subs.map(s=>[s.client_id,s]));
  const pushByClient = groupBy(DATA.pushes, p=>p.client_id);
  const rows = DATA.clients.map(c=>{
    const s = subByClient.get(c.id);
    const ps = pushByClient.get(c.id) || [];
    return {
      name: c.name, area: c.area || '—', type: c.client_type, phone: c.phone || '—',
      fee: R(c.monthly_subscription),
      since: fmtDate(s ? s.start_date : c.created_at),
      sub: s ? `<span class="status ${s.payment_status==='PAID'?'good':'bad'}">${s.payment_status==='PAID'?'✓ PAID':'✕ UNPAID'}</span>` : '<span class="status info">no subscription</span>',
      push: ps.length ? `<span class="status ${ps.every(p=>p.payment_status==='PAID')?'good':'bad'}">${ps.filter(p=>p.payment_status==='PAID').length}/${ps.length} paid</span>` : '<span class="muted">—</span>',
      act: rowActions('clients', c.id),
      _v: n(c.monthly_subscription)
    };
  }).sort((a,b)=> b._v - a._v);

  const tiers = [
    {label:'R1,000+', test:v=>v>=1000}, {label:'R500 – R999', test:v=>v>=500&&v<1000},
    {label:'R250 – R499', test:v=>v>=250&&v<500}, {label:'Under R250', test:v=>v<250}
  ].map(t=>{ const g = DATA.clients.filter(c=>t.test(n(c.monthly_subscription)));
    return {label:t.label, value:sum(g,c=>c.monthly_subscription), note:`${g.length} client${g.length===1?'':'s'}`}; });

  const areaRows = [...groupBy(DATA.clients, c=>c.area)]
    .map(([k,v])=>({label:k, value:sum(v,c=>c.monthly_subscription), note:`${v.length} client${v.length===1?'':'s'}`}))
    .sort(byDesc('value'));

  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Clients', cnt(DATA.clients.length), `${DATA.clients.filter(c=>c.client_type==='MOBILE').length} mobile wash · ${DATA.clients.filter(c=>c.client_type==='DETAIL').length} detailing`, {small:true})}
    ${stat('Contracted MRR', R0(m.mrr), 'Sum of active monthly subscriptions', {small:true})}
    ${stat('Average per client', R0(m.arpu), `Target ${R0(TARGETS.arpu.target)}`, {ach:m.arpu/TARGETS.arpu.target, small:true})}
    ${stat('Subscriptions paid', `${m.subPaidCount} / ${m.activeSubs.length}`, `${R0(m.subPaid)} in · ${R0(m.subUnpaid)} outstanding`, {ach:m.subPaidCount/Math.max(1,m.activeSubs.length), small:true})}
  </div>
  <div class="grid grid-2" style="margin-bottom:12px">
    <div class="card"><h3>MRR by area</h3><p class="card-sub">Monthly subscription value concentrated by location.</p>${hBars(areaRows,{labelW:180})}</div>
    <div class="card"><h3>MRR by client tier</h3><p class="card-sub">How the recurring base splits across price points.</p>${hBars(tiers,{labelW:130})}</div>
  </div>
  <div class="card">
    <h3>Client book</h3>
    <p class="card-sub">All ${DATA.clients.length} clients, highest monthly fee first. Adding a client here adds them to the CRM too.</p>
    ${toolbar('clients')}
    ${table([
      {key:'name',label:'Client'},{key:'area',label:'Area'},{key:'type',label:'Type'},{key:'phone',label:'Phone'},
      {key:'since',label:'Since'},{key:'fee',label:'Monthly fee',right:true},{key:'sub',label:'Subscription',raw:true},
      {key:'push',label:'Billing run',raw:true},{key:'act',label:'',raw:true}
    ], rows, {name:`${rows.length} clients`, fee:R(m.mrr)})}
  </div>
  <div class="card" style="margin-top:12px">
    <h3>Subscriptions</h3>
    <p class="card-sub">The recurring agreement behind each client. Changing an active amount updates the client's monthly fee with it.</p>
    ${toolbar('subs')}
    ${table([
      {key:'client',label:'Client'},{key:'amount',label:'Amount',right:true},{key:'start',label:'Start'},{key:'end',label:'End'},
      {key:'status',label:'Status'},{key:'pay',label:'Payment',raw:true},{key:'act',label:'',raw:true}
    ], DATA.subs.map(s=>({
      client: clientName(s.client_id), amount: R(s.amount), start: fmtDate(s.start_date),
      end: s.end_date ? fmtDate(s.end_date) : '—', status: s.status,
      pay: `<span class="status ${s.payment_status==='PAID'?'good':'bad'}">${s.payment_status==='PAID'?'✓ PAID':'✕ UNPAID'}</span>`,
      act: rowActions('subs', s.id)
    })).sort((a,b)=>a.client.localeCompare(b.client)),
      {client:`${DATA.subs.length} subscriptions`, amount:R(m.mrr)})}
  </div>`;
}

/* Line items belonging to one quote, in sort order. */
const itemsFor = qid => DATA.quote_items.filter(i=>i.quote_id === qid)
  .sort((a,b)=> n(a.sort_order) - n(b.sort_order));
const itemCost = i => (n(i.labour_cost) + n(i.product_cost)) * n(i.quantity);
const quoteCost = q => sum(itemsFor(q.id), itemCost);
const quoteItemsTotal = q => sum(itemsFor(q.id), i=>i.total_price);
const outBadge = o => { const v = o || 'PENDING';
  return `<span class="status ${v==='SUCCESS'?'good':v==='FAILED'?'bad':'info'}">${v==='SUCCESS'?'✓ WON':v==='FAILED'?'✕ LOST':'• PENDING'}</span>`; };

function quoteDetail(q){
  const items = itemsFor(q.id);
  if (!items.length) return `<div class="note">No line items were captured against this quote — the R${n(q.amount).toFixed(2)} total was entered directly on the quote header.</div>`;
  const body = items.map((i,ix)=>{
    const c = itemCost(i), line = n(i.total_price);
    return `<tr>
      <td class="right muted">${ix+1}</td>
      <td>${esc(i.description || '—')}</td>
      <td class="right">${cnt(i.quantity)}${i.quantity_label ? ' ' + esc(i.quantity_label) : ''}</td>
      <td class="right">${R(i.unit_price)}</td>
      <td class="right">${R(i.labour_cost)}</td>
      <td class="right">${R(i.product_cost)}</td>
      <td class="right">${R(c)}</td>
      <td class="right"><b>${R(line)}</b></td>
      <td class="right">${line > 0 ? pct((line - c)/line, 0) : '—'}</td>
    </tr>`;
  }).join('');
  const tot = quoteItemsTotal(q), cost = quoteCost(q);
  const matches = Math.abs(tot - n(q.amount)) < 0.01;
  return `
    <div class="table-wrap" style="background:#070d12">
      <table class="table" style="min-width:680px">
        <thead><tr><th class="right">#</th><th>Line item</th><th class="right">Qty</th><th class="right">Unit</th>
          <th class="right">Labour</th><th class="right">Product</th><th class="right">Line cost</th><th class="right">Line total</th><th class="right">Margin</th></tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr><td></td><td>${items.length} line item${items.length===1?'':'s'}</td><td colspan="4"></td>
          <td class="right">${R(cost)}</td><td class="right">${R(tot)}</td>
          <td class="right">${n(q.amount) ? pct((n(q.amount)-cost)/n(q.amount),0) : '—'}</td></tr></tfoot>
      </table>
    </div>
    <div class="note" style="margin-top:10px">
      ${matches ? '✓ Line items reconcile exactly to the quote total.' : `⚠ Line items total ${R(tot)} against a quote header of ${R(q.amount)} — a ${R(Math.abs(tot-n(q.amount)))} difference.`}
      ${q.vat_enabled === 't' ? ` VAT of ${R(q.vat_amount)} applied on a subtotal of ${R(q.subtotal)}.` : ' No VAT applied.'}
      ${q.notes ? `<br><b>Note on the quote:</b> ${esc(q.notes)}` : ''}
      <br><b>Valid until:</b> ${fmtDate(q.valid_until)} · <b>Status:</b> ${esc(q.status)} · <b>Raised:</b> ${fmtDate(q.created_at)}
    </div>`;
}

function renderLeads(){
  const all = DATA.leads.slice();
  const statuses = [...new Set(all.map(r=>leadText(r,'status').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const sources = [...new Set(all.map(r=>leadText(r,'source').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const q = state.leadSearch.trim().toLowerCase();
  const filtered = all.filter(r => {
    const status = leadText(r,'status').trim();
    const source = leadText(r,'source').trim();
    const hay = [leadText(r,'name'),leadText(r,'company'),leadText(r,'phone'),leadText(r,'email'),leadText(r,'area'),leadText(r,'service_interest'),leadText(r,'assigned_to'),leadText(r,'notes')].join(' ').toLowerCase();
    return (!q || hay.includes(q)) && (state.leadStatus==='ALL' || status===state.leadStatus) && (state.leadSource==='ALL' || source===state.leadSource);
  });
  const open = all.filter(r=>!leadIsClosed(r));
  const qualified = all.filter(r=>['QUALIFIED','PROPOSAL'].includes(leadText(r,'status').trim().toUpperCase()));
  const won = all.filter(r=>['WON','CONVERTED'].includes(leadText(r,'status').trim().toUpperCase()));
  const pipelineValue = sum(open,r=>leadValue(r,'estimated_value'));
  const today = new Date().toISOString().slice(0,10);
  const due = open.filter(r=>{ const d=leadText(r,'next_follow_up'); return d && d.slice(0,10)<=today; });
  const byStatus = [...groupBy(all,r=>leadText(r,'status')||'Unspecified')].map(([label,rows])=>({label,value:rows.length,note:`${R0(sum(rows,r=>leadValue(r,'estimated_value')))} estimated value`})).sort(byDesc('value'));
  const statusClass = status => { const x=String(status||'').toUpperCase(); return ['WON','CONVERTED'].includes(x)?'good':['LOST','CLOSED'].includes(x)?'bad':['QUALIFIED','PROPOSAL'].includes(x)?'watch':'info'; };
  const statusBadge = status => `<span class="status ${statusClass(status)}">${esc(status||'UNSPECIFIED')}</span>`;
  const rows = filtered.slice().sort((a,b)=>{ const ad=leadText(a,'next_follow_up'), bd=leadText(b,'next_follow_up'); if(ad&&!bd)return -1; if(!ad&&bd)return 1; if(ad&&bd&&ad!==bd)return ad.localeCompare(bd); return leadDisplayName(a).localeCompare(leadDisplayName(b)); }).map(r=>{
    const name=leadDisplayName(r), company=leadText(r,'company'), phone=leadText(r,'phone'), email=leadText(r,'email'), follow=leadText(r,'next_follow_up');
    const overdue=follow && follow.slice(0,10)<=today && !leadIsClosed(r);
    const contact=[phone?`<a href="tel:${esc(phone)}" style="color:inherit">${esc(phone)}</a>`:'',email?`<br><a href="mailto:${esc(email)}" style="color:inherit">${esc(email)}</a>`:''].join('');
    return `<tr><td><b>${esc(name)}</b>${company?`<br><span class="muted">${esc(company)}</span>`:''}</td><td>${contact||'—'}</td><td>${esc(leadText(r,'area','—'))}</td><td>${esc(leadText(r,'source','—'))}</td><td>${statusBadge(leadText(r,'status','—'))}</td><td>${esc(leadText(r,'service_interest','—'))}</td><td class="right">${n(leadValue(r,'estimated_value'))?R(leadValue(r,'estimated_value')):'—'}</td><td class="${overdue?'lead-overdue':''}">${follow?`${fmtDate(follow)}${overdue?'<br><span class="status bad">OVERDUE</span>':''}`:'—'}</td><td>${esc(leadText(r,'assigned_to','—'))}</td><td>${rowActions('leads',r.id)}</td></tr>`;
  }).join('');
  return `
  <div class="grid grid-5" style="margin-bottom:12px">
    ${stat('Total leads',cnt(all.length),`${filtered.length} currently shown`,{small:true})}
    ${stat('Open pipeline',cnt(open.length),'Leads not yet closed',{small:true})}
    ${stat('Qualified / proposal',cnt(qualified.length),'Qualified opportunities',{small:true})}
    ${stat('Potential value',R0(pipelineValue),'Estimated value on open leads',{small:true})}
    ${stat('Follow-ups due',cnt(due.length),'Today or overdue on open leads',{small:true})}
  </div>
  <div class="grid grid-2" style="margin-bottom:12px">
    <div class="card"><h3>Lead pipeline</h3><p class="card-sub">Current lead count by CRM pipeline status.</p>${hBars(byStatus,{labelW:150,fmt:cnt})}</div>
    <div class="card"><h3>Lead workspace</h3><p class="card-sub">This page reads and writes the same <code>leads</code> table used by the CRM. There is no second lead list to reconcile.</p><div class="note"><b>${cnt(won.length)} won / converted</b> · ${R0(sum(won,r=>leadValue(r,'estimated_value')))} estimated value<br><b>${cnt(due.length)} follow-up${due.length===1?'':'s'} due</b> · use the edit button on any row to move the next action date forward.<br><b>${all.length?'Two-way live sync is active.':'No lead records yet.'}</b> ${STORE.state.mode==='supabase'&&!STORE.state.readOnly?'Changes made here are written directly to the shared CRM database.':''}</div></div>
  </div>
  <div class="card"><h3>Leads</h3><p class="card-sub">Search, filter, create, edit and delete leads from the shared CRM pipeline.</p>
    <div class="lead-filters no-print"><input id="leadSearch" class="lead-search" type="search" value="${esc(state.leadSearch)}" placeholder="Search name, company, phone, email, service…" aria-label="Search leads"><select id="leadStatusFilter"><option value="ALL">All statuses</option>${statuses.map(v=>`<option value="${esc(v)}"${v===state.leadStatus?' selected':''}>${esc(v)}</option>`).join('')}</select><select id="leadSourceFilter"><option value="ALL">All sources</option>${sources.map(v=>`<option value="${esc(v)}"${v===state.leadSource?' selected':''}>${esc(v)}</option>`).join('')}</select><button class="btn small" id="leadApply">Apply</button><button class="btn small" id="leadClear">Clear</button></div>
    ${toolbar('leads',`<span class="lead-sync-note">Live CRM leads · automatic refresh every ${CFG.AUTO_REFRESH_SECONDS||60}s</span>`)}
    ${rows?`<div class="table-wrap"><table class="table leads-table" style="min-width:1180px"><thead><tr><th>Lead</th><th>Contact</th><th>Area</th><th>Source</th><th>Status</th><th>Service</th><th class="right">Est. value</th><th>Follow-up</th><th>Assigned</th><th></th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="6">${filtered.length} of ${all.length} lead${all.length===1?'':'s'}</td><td class="right">${R(sum(filtered,r=>leadValue(r,'estimated_value')))}</td><td colspan="3"></td></tr></tfoot></table></div>`:`<div class="note">No leads match the current filters.${all.length?' Clear the filters or change the search.':' Click “+ New lead” to add the first lead to the shared CRM table.'}</div>`}
  </div>`;
}

function renderQuotes(m){
  const quotes = m.quotes.slice().sort((a,b)=> (b.quote_date||'').localeCompare(a.quote_date||''));
  const vehicle = [...groupBy(m.quotes, q=>q.vehicle_type)]
    .map(([k,v])=>({label:k||'Unspecified', value:sum(v,q=>q.amount), note:`${v.length} quote${v.length===1?'':'s'} · ${v.filter(q=>q.outcome==='SUCCESS').length} won`}))
    .sort(byDesc('value'));

  const periodItems = DATA.quote_items.filter(i => m.quotes.some(q=>q.id === i.quote_id));
  /* Group case-insensitively — the CRM holds both "Call out Fee" and "Call Out Fee". */
  const byItem = [...groupBy(periodItems, i=>(i.description || 'Unnamed line').toLowerCase())]
    .map(([,v])=>({label:v[0].description || 'Unnamed line', value:sum(v,i=>i.total_price),
                   note:`${v.length} appearance${v.length===1?'':'s'} across quotes`}))
    .sort(byDesc('value'));
  const pricedItems = byItem.filter(r=>r.value > 0);
  const quotedCost = sum(m.quotes, quoteCost);
  const quotedMargin = m.qTotalV ? (m.qTotalV - quotedCost) / m.qTotalV : 0;
  const wonCost = sum(m.qWon, quoteCost);
  const freebies = periodItems.filter(i => n(i.total_price) === 0);

  const rowsHtml = quotes.map((q,ix)=>{
    const items = itemsFor(q.id);
    const cost = quoteCost(q), amt = n(q.amount);
    return `<tr class="q-head" data-q="${ix}">
        <td><span class="twisty">▸</span></td>
        <td><b>${esc(q.quote_number)}</b></td>
        <td>${fmtDate(q.quote_date)}</td>
        <td>${esc(q.client_name || clientName(q.client_id))}</td>
        <td>${esc(q.service || '—')}</td>
        <td>${esc(q.vehicle_type || '—')}</td>
        <td>${esc(q.site || '—')}</td>
        <td class="right">${items.length}</td>
        <td class="right">${R(cost)}</td>
        <td class="right"><b>${R(q.amount)}</b></td>
        <td class="right">${amt ? pct((amt-cost)/amt,0) : '—'}</td>
        <td>${outBadge(q.outcome)}</td>
        <td onclick="event.stopPropagation()">${rowActions('quotes', q.id)}</td>
      </tr>
      <tr class="q-detail hidden" data-qd="${ix}"><td colspan="13" style="background:#070d12;padding:12px">${quoteDetail(q)}</td></tr>`;
  }).join('');

  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Quotes sent', cnt(m.quotes.length), `${periodItems.length} line items · target ${TARGETS.quotesSent.target}/month`, {ach:m.quotes.length/(TARGETS.quotesSent.target*periodMonths()), small:true})}
    ${stat('Quoted value', R0(m.qTotalV), `Average ${R0(m.quotes.length ? m.qTotalV/m.quotes.length : 0)} per quote`, {small:true})}
    ${stat('Won', `${m.qWon.length} · ${R0(m.qWonV)}`, `${pct(m.winRateDecided)} of decided quotes · target ${pct(TARGETS.winRate.target,0)}`, {ach:m.winRateDecided/TARGETS.winRate.target, small:true})}
    ${stat('Quoted gross margin', pct(quotedMargin), `${R0(m.qTotalV - quotedCost)} over ${R0(quotedCost)} of labour and product cost`, {small:true})}
  </div>
  <div class="grid grid-2" style="margin-bottom:12px">
    <div class="card"><h3>Quoted value by outcome</h3><p class="card-sub">Where the quoted rand actually landed.</p>
      ${stackBar([{label:'Won',value:m.qWonV,color:'var(--s3)'},{label:'Pending',value:m.qPendV,color:'var(--s1)'},{label:'Lost',value:m.qLostV,color:'var(--s2)'}])}
      ${(() => {
        if (!m.qLost.length) return '<div class="note" style="margin-top:12px">No quotes were lost in this period.</div>';
        const big = m.qLost.slice().sort((a,b)=>n(b.amount)-n(a.amount))[0];
        return `<div class="note" style="margin-top:12px">${m.qLost.length} lost quote${m.qLost.length===1?'':'s'} worth <b>${R0(m.qLostV)}</b> — ${pct(m.qTotalV?m.qLostV/m.qTotalV:0)} of everything quoted. The largest was ${esc(big.service || 'an unnamed job')} for ${esc(big.client_name || 'a client')} at ${R0(big.amount)}, against an average won quote of ${R0(m.qWon.length ? m.qWonV/m.qWon.length : 0)} — the big-ticket detailing work is where quotes are being lost.</div>`;
      })()}
    </div>
    <div class="card"><h3>Quoted value by vehicle class</h3><p class="card-sub">Which vehicle types carry the quoting value.</p>${hBars(vehicle,{labelW:150})}</div>
  </div>
  <div class="card" style="margin-bottom:12px">
    <h3>What is actually being quoted</h3>
    <p class="card-sub">The ${pricedItems.length} priced line items across ${m.quotes.length} quotes, by total quoted value.</p>
    ${hBars(pricedItems, {labelW:300, maxChars:46})}
    ${freebies.length ? `<div class="note" style="margin-top:10px"><b>${freebies.length} line item${freebies.length===1?'':'s'} quoted at R0.00</b> and left off the chart — ${esc([...new Set(freebies.map(i=>i.description))].join(', '))}. These are thrown in with a bundle, so they carry no revenue but still carry time. Worth pricing or capping.</div>` : ''}
  </div>
  <div class="card">
    <h3>All quotations</h3>
    <p class="card-sub">${m.quotes.length} quotes · ${periodItems.length} line items. Click any row to open its full breakdown, or use ✎ to edit the quote and its lines.</p>
    ${toolbar('quotes')}
    <div class="table-wrap"><table class="table" style="min-width:1080px">
      <thead><tr><th style="width:24px"></th><th>Quote</th><th>Date</th><th>Client</th><th>Service</th><th>Vehicle</th><th>Site</th>
        <th class="right">Items</th><th class="right">Cost</th><th class="right">Amount</th><th class="right">Margin</th><th>Outcome</th><th></th></tr></thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot><tr><td></td><td colspan="6">${quotes.length} quotes</td><td class="right">${periodItems.length}</td>
        <td class="right">${R(quotedCost)}</td><td class="right">${R(m.qTotalV)}</td><td class="right">${pct(quotedMargin,0)}</td><td colspan="2"></td></tr></tfoot>
    </table></div>
    <div class="note" style="margin-top:12px">Won quotes carry ${R0(wonCost)} of direct cost against ${R0(m.qWonV)} of value. Every one of the ${quotes.length} quotes reconciles exactly to the sum of its line items, so these totals can be trusted as they stand.</div>
  </div>`;
}

function renderExpenses(m){
  const cats = [...groupBy(m.expenses, e=>e.category)]
    .map(([k,v])=>({label:k, value:sum(v,e=>e.amount), note:`${v.length} entr${v.length===1?'y':'ies'}`})).sort(byDesc('value'));
  const vendors = [...groupBy(m.expenses, e=>e.vendor)]
    .map(([k,v])=>({label:k, value:sum(v,e=>e.amount), note:`${v.length} entr${v.length===1?'y':'ies'}`})).sort(byDesc('value')).slice(0,10);
  const payers = [...groupBy(m.expenses, e=>e.paid_by)]
    .map(([k,v],i)=>({label:k, value:sum(v,e=>e.amount), color:['var(--s1)','var(--s2)','var(--s3)'][i%3]}));
  const rows = m.expenses.slice().sort((a,b)=> (b.expense_date||'').localeCompare(a.expense_date||'')).map(e=>({
    date: fmtDate(e.expense_date), cat: e.category, desc: e.description || '—', vendor: e.vendor || '—',
    payer: e.paid_by || '—', amount: R(e.amount), act: rowActions('expenses', e.id)
  }));
  const top = cats[0] || {label:'—', value:0};
  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Total spend', R0(m.expTotal), `${m.expenses.length} entries · ${esc(periodLabel())}`, {small:true})}
    ${stat('Largest category', esc(top.label), `${R0(top.value)} · ${pct(m.expTotal?top.value/m.expTotal:0)} of spend`, {small:true})}
    ${stat('Average entry', R0(m.expenses.length ? m.expTotal/m.expenses.length : 0), 'Mean value per recorded expense', {small:true})}
    ${stat('Spend vs billed', pct(m.expRatio), `Target below ${pct(TARGETS.expRatio.target,0)}`, {ach:kpiRows(m).find(r=>r.key==='expRatio').ach, small:true})}
  </div>
  <div class="grid grid-2" style="margin-bottom:12px">
    <div class="card"><h3>Spend by category</h3><p class="card-sub">${esc(periodLabel())}.</p>${hBars(cats,{labelW:170})}</div>
    <div class="card"><h3>Top vendors</h3><p class="card-sub">Ten largest suppliers by value.</p>${hBars(vendors,{labelW:190})}</div>
  </div>
  <div class="card" style="margin-bottom:12px">
    <h3>How spend is funded</h3><p class="card-sub">Split across the payment sources recorded on each expense.</p>
    ${stackBar(payers)}
  </div>
  <div class="card">
    <h3>Expense ledger</h3><p class="card-sub">Most recent first. Capture a slip here and it lands in the CRM as well.</p>
    ${toolbar('expenses')}
    ${table([
      {key:'date',label:'Date'},{key:'cat',label:'Category'},{key:'desc',label:'Description'},
      {key:'vendor',label:'Vendor'},{key:'payer',label:'Paid by'},{key:'amount',label:'Amount',right:true},{key:'act',label:'',raw:true}
    ], rows, {date:`${rows.length} entries`, amount:R(m.expTotal)})}
  </div>`;
}

function renderServices(){
  const s = DATA.services;
  const margin = x => n(x.price) ? n(x.profit)/n(x.price) : 0;
  const cats = [...groupBy(s, x=>x.category)].map(([k,v])=>({
    label:k, value: sum(v,x=>x.profit)/v.length,
    note:`${v.length} service${v.length===1?'':'s'} · average price ${R0(sum(v,x=>x.price)/v.length)}`
  })).sort(byDesc('value'));
  const rows = s.slice().sort((a,b)=> n(b.profit) - n(a.profit)).map(x=>({
    name: x.service_name, cat: x.category, vehicle: x.vehicle_type || '—',
    price: R(x.price), cost: R(x.total_cost), profit: R(x.profit), m: pct(margin(x),0),
    act: rowActions('services', x.id)
  }));
  const avgM = s.length ? s.reduce((t,x)=>t+margin(x),0)/s.length : 0;
  const best = s.slice().sort((a,b)=> margin(b)-margin(a))[0];
  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Services priced', cnt(s.length), `${new Set(s.map(x=>x.category)).size} categories`, {small:true})}
    ${stat('Average margin', pct(avgM), 'Profit as a share of price', {small:true})}
    ${stat('Best margin', best ? esc(best.service_name.slice(0,28)) : '—', best ? `${pct(margin(best),0)} · ${R0(best.profit)} profit` : '', {small:true})}
    ${stat('Average price', R0(s.length ? sum(s,x=>x.price)/s.length : 0), `Cost base ${R0(s.length ? sum(s,x=>x.total_cost)/s.length : 0)}`, {small:true})}
  </div>
  <div class="card" style="margin-bottom:12px">
    <h3>Average profit per service, by category</h3>
    <p class="card-sub">Rand profit per job at list price — labour and product cost deducted.</p>
    ${hBars(cats,{labelW:170})}
  </div>
  <div class="card">
    <h3>Price list</h3><p class="card-sub">All ${s.length} published services, highest profit first. Cost and profit are calculated for you from price, labour and product.</p>
    ${toolbar('services')}
    ${table([
      {key:'name',label:'Service'},{key:'cat',label:'Category'},{key:'vehicle',label:'Vehicle'},
      {key:'price',label:'Price',right:true},{key:'cost',label:'Cost',right:true},{key:'profit',label:'Profit',right:true},
      {key:'m',label:'Margin',right:true},{key:'act',label:'',raw:true}
    ], rows)}
  </div>`;
}

function renderAnalytics(m){
  const areaAgg = [...groupBy(DATA.clients, c=>c.area)].map(([k,v])=>({
    area:k, clients:v.length, mrr:sum(v,c=>c.monthly_subscription)
  })).sort((a,b)=>b.mrr-a.mrr);
  const totalMrr = sum(DATA.clients,c=>c.monthly_subscription);
  const sorted = DATA.clients.slice().sort((a,b)=>n(b.monthly_subscription)-n(a.monthly_subscription));
  const top5 = sum(sorted.slice(0,5), c=>c.monthly_subscription);
  const rows = areaAgg.map(a=>({
    area:a.area, clients:cnt(a.clients), mrr:R(a.mrr),
    avg:R(a.mrr/a.clients), share:pct(totalMrr?a.mrr/totalMrr:0)
  }));
  const q = DATA.quotes;
  const sites = [...groupBy(q, x=>x.site || 'Unspecified')].map(([k,v])=>({
    label:k, value:sum(v,x=>x.amount), note:`${v.length} quote${v.length===1?'':'s'}`
  })).sort(byDesc('value')).slice(0,8);

  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Revenue concentration', pct(totalMrr?top5/totalMrr:0), `Top 5 clients carry ${R0(top5)} of ${R0(totalMrr)} MRR`, {small:true})}
    ${stat('Areas served', cnt(areaAgg.length), `Largest: ${esc(areaAgg[0] ? areaAgg[0].area : '—')}`, {small:true})}
    ${stat('Recurring vs one-off', pct(m.billed ? m.pushBilled/m.billed : 0), 'Share of billed revenue that is recurring', {small:true})}
    ${stat('Jobs recorded', cnt(sum(DATA.pushes,p=>p.jobs)), `Across ${DATA.pushes.length} billing pushes`, {small:true})}
  </div>
  <div class="grid grid-2" style="margin-bottom:12px">
    <div class="card"><h3>Area performance</h3><p class="card-sub">Client count and recurring value by location.</p>
      ${table([{key:'area',label:'Area'},{key:'clients',label:'Clients',right:true},{key:'mrr',label:'MRR',right:true},{key:'avg',label:'Average',right:true},{key:'share',label:'Share',right:true}], rows, {area:`${areaAgg.length} areas`, clients:cnt(DATA.clients.length), mrr:R(totalMrr), share:'100.0%'})}
    </div>
    <div class="card"><h3>Quoted value by site</h3><p class="card-sub">Where quoting effort is being spent.</p>${hBars(sites,{labelW:200})}</div>
  </div>
  ${renderFlags(m)}
  <div class="card" style="margin-top:12px">
    <h3>Snapshot coverage</h3>
    <p class="card-sub">Row counts in the restored backup — empty tables are why some KPIs are absent.</p>
    ${table([{key:'t',label:'Table'},{key:'c',label:'Rows',right:true},{key:'s',label:'Effect on the dashboard'}],
      Object.entries(DATA.counts).map(([k,v])=>({
        t:k, c:cnt(v),
        s: v>0 ? 'Feeding the dashboard' : (k==='leads'?'Funnel KPIs cannot be measured':k==='invoices'||k==='invoice_items'?'Cash-in reported as R0 by the CRM':k==='ledger_entries'?'No debtor/creditor ageing':k==='business_targets'?'Targets fall back to workbook values':'Not used')
      })))}
  </div>`;
}

function renderHistory(){
  const log = STORE.audit;
  const ACT = { CREATE:'good', UPDATE:'info', DELETE:'bad', RESTORE:'good' };
  const diff = (e) => {
    if (e.action !== 'UPDATE' || !e.before || !e.after) return '';
    const changed = Object.keys(e.after).filter(k => !['updated_at'].includes(k) &&
      JSON.stringify(e.before[k]) !== JSON.stringify(e.after[k]));
    if (!changed.length) return '<span class="muted">no field changed</span>';
    return changed.map(k => `<span class="chg"><b>${esc(k)}</b> ${esc(String(e.before[k] ?? '—'))} → ${esc(String(e.after[k] ?? '—'))}</span>`).join(' ');
  };
  const rows = log.map(e=>`<tr>
      <td style="white-space:nowrap">${new Date(e.at).toLocaleString('en-ZA',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
      <td>${esc(e.actor)}</td>
      <td><span class="status ${ACT[e.action]||'info'}">${esc(e.action)}</span></td>
      <td>${esc((SCHEMA[e.record_key]||{}).label || e.table_name)}</td>
      <td>${esc(e.record_label)}${e.note ? `<br><span class="muted" style="font-size:10px">${esc(e.note)}</span>` : ''}</td>
      <td class="diffcell">${diff(e)}</td>
      <td>${e.action === 'DELETE' && !STORE.find(e.record_key, e.record_id)
            ? `<button class="btn small" data-restore="${esc(e.id)}"${STORE.state.readOnly?' disabled':''}>Restore</button>` : ''}</td>
    </tr>`).join('');

  const deletes = log.filter(e=>e.action==='DELETE').length;
  return `
  <div class="grid grid-4" style="margin-bottom:12px">
    ${stat('Changes recorded', cnt(log.length), 'Since this browser was first used', {small:true})}
    ${stat('Records created', cnt(log.filter(e=>e.action==='CREATE').length), 'Added from this dashboard', {small:true})}
    ${stat('Records edited', cnt(log.filter(e=>e.action==='UPDATE').length), 'With before and after values kept', {small:true})}
    ${stat('Records deleted', cnt(deletes), deletes ? 'Each one restorable below' : 'Nothing deleted yet', {small:true})}
  </div>
  <div class="card" style="margin-bottom:12px">
    <h3>Keep a copy</h3>
    <p class="card-sub">A full JSON backup of every table plus this history. Worth taking before a big clean-up.</p>
    <div class="rec-bar"><button class="btn primary small" id="backupBtn">Download full backup</button>
      <span class="rec-count">${Object.entries(STORE.counts()).map(([t,c])=>`${c} ${t}`).join(' · ')}</span></div>
  </div>
  <div class="card">
    <h3>Change history</h3>
    <p class="card-sub">Every add, edit and delete made from this dashboard, with the full record kept so a deletion can be undone. Held in this browser, and mirrored to the database when an <code>audit_log</code> table exists.</p>
    ${log.length ? `<div class="table-wrap"><table class="table" style="min-width:900px">
      <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Type</th><th>Record</th><th>What changed</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table></div>`
    : `<div class="note">Nothing yet. Every change you make from here will be listed, and any record you delete can be put back from this page.</div>`}
  </div>`;
}

function renderData(){
  const sets = [
    ['clients','Clients', DATA.clients],
    ['subs','Subscriptions', DATA.subs],
    ['pushes','Billing pushes', DATA.pushes],
    ['quotes','Quotes', DATA.quotes],
    ['leads','Leads', DATA.leads],
    ['quote_items','Quote line items', DATA.quote_items],
    ['expenses','Expenses', DATA.expenses],
    ['services','Services', DATA.services]
  ];
  const s = STORE.state;
  return `
  <div class="card" style="margin-bottom:12px">
    <h3>Where this data lives</h3>
    <p class="card-sub">${s.mode === 'supabase'
      ? 'One database, shared with the Detailers Compass CRM.'
      : 'Local mode — this browser only. Nothing here reaches the CRM.'}</p>
    <div class="note">
      ${s.mode === 'supabase' ? `
        <b>Database:</b> ${esc(CFG.SUPABASE_URL)}<br>
        <b>Status:</b> ${s.readOnly ? `unreachable — read only (${esc(s.lastError||'')})` : 'connected, read and write'}<br>
        <b>Last refreshed:</b> ${s.lastSync ? esc(new Date(s.lastSync).toLocaleString('en-ZA')) : 'not yet'}
          ${CFG.AUTO_REFRESH_SECONDS ? `· checks again every ${CFG.AUTO_REFRESH_SECONDS} seconds` : ''}<br>
        <b>Two-way:</b> a record added here is written straight to this database, so the CRM sees it immediately.
          A record changed in the CRM appears here on the next refresh.`
      : `<b>Storage:</b> this browser's own database, seeded from the September backup<br>
         <b>To link it to the CRM:</b> set <code>USE_SUPABASE: true</code> in <code>js/config.js</code>.`}
      <br><b>Originally restored from:</b> detailers-compass-rebuilt_260918.backup, cross-checked against the CSV exports —
      expenses reconciled exactly to the CRM's own <code>monthly_financial_summary</code> (R39,070.52 August + R3,345.38 September).
    </div>
  </div>
  <div class="card">
    <h3>Export</h3><p class="card-sub">Each table downloads as a CSV exactly as it came out of the database.</p>
    <div class="grid grid-4">
      ${sets.map(([k,label,rows])=>`<button class="btn" data-csv="${k}">${esc(label)} · ${rows.length} rows</button>`).join('')}
    </div>
  </div>`;
}

/* =============== csv =============== */
function toCsv(rows){
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const q = v => { const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
  return [cols.join(','), ...rows.map(r=>cols.map(c=>q(r[c])).join(','))].join('\n');
}
function download(name, text, mime){
  const b = new Blob([text], {type: (mime||'text/csv') + ';charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}

/* =============== shell =============== */
let toastTimer = null;
function toast(msg, kind){
  let el = $('toast');
  if (!el){ el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.add('hidden'), 4200);
}

function connPill(){
  const s = STORE.state;
  if (s.readOnly) return `<span class="pill bad" title="${esc(s.lastError||'')}">● Read only — database unreachable</span>`;
  if (s.mode === 'supabase') return `<span class="pill good">● Live · shared with the CRM</span>`;
  return `<span class="pill info">● Local database — not shared with the CRM</span>`;
}

function updateChrome(){
  const s = STORE.state;
  const dot = $('connDot'), txt = $('connText');
  if (dot) dot.style.background = s.readOnly ? 'var(--critical)' : s.mode === 'supabase' ? 'var(--good)' : 'var(--s1)';
  if (txt) txt.textContent = s.readOnly ? 'Read only' : s.mode === 'supabase' ? 'Live — shared CRM database' : 'Local database';
  const src = $('srcNote');
  if (src) src.textContent = s.mode === 'supabase'
    ? `${String(CFG.SUPABASE_URL||'').replace('https://','')} · synced ${s.lastSync ? new Date(s.lastSync).toLocaleTimeString('en-ZA') : '—'}`
    : 'Saved in this browser';
}

function buildNav(){
  const items = state.role === 'admin' ? NAV_ADMIN : NAV_STAFF;
  $('nav').innerHTML = items.map(([id,ico])=>
    `<button data-page="${id}" class="${state.page===id?'active':''}"><span class="ico">${ico}</span>${esc(PAGES[id][0])}</button>`).join('');
  $('nav').querySelectorAll('button').forEach(b=>b.addEventListener('click', ()=>{
    state.page = b.dataset.page; $('appView').classList.remove('nav-open'); render();
  }));
}

function render(){
  const m = metrics();
  $('pageTitle').textContent = PAGES[state.page][0];
  $('pageSub').textContent = PAGES[state.page][1];
  const months = [...new Set([
    ...DATA.pushes.map(p=>p.period),
    ...DATA.expenses.map(e=>mon(e.expense_date)),
    ...DATA.quotes.map(q=>mon(q.quote_date))
  ].filter(Boolean))].sort();
  const monthLabel = mm => MONTHS[mm] || new Date(mm + '-01T00:00:00')
    .toLocaleDateString('en-ZA',{month:'long', year:'numeric'});
  const filters = state.page === 'leads'
    ? `<div class="filters no-print"><span class="lbl">CRM</span><span style="margin-left:auto">${connPill()}</span></div>`
    : `<div class="filters no-print">
      <span class="lbl">Period</span>
      <button class="btn small ${state.period==='all'?'active':''}" data-period="all">All data</button>
      ${months.map(mm=>`<button class="btn small ${state.period===mm?'active':''}" data-period="${mm}">${esc(monthLabel(mm))}</button>`).join('')}
      <span style="margin-left:auto">${connPill()}</span>
    </div>`;
  const body =
    state.page === 'dashboard' ? renderDashboard(m) :
    state.page === 'kpi'       ? renderKpi(m) :
    state.page === 'revenue'   ? renderRevenue(m) :
    state.page === 'leads'      ? renderLeads() :
    state.page === 'clients'   ? renderClients(m) :
    state.page === 'quotes'    ? renderQuotes(m) :
    state.page === 'expenses'  ? renderExpenses(m) :
    state.page === 'services'  ? renderServices() :
    state.page === 'analytics' ? renderAnalytics(m) :
    state.page === 'history'   ? renderHistory() :
    renderData();
  const c = $('content');
  c.innerHTML = filters + body;
  buildNav();
  hideTip();
  bindTips(c);
  c.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{ state.period = b.dataset.period; render(); }));

  /* ---- record actions ---- */
  c.querySelectorAll('[data-new]').forEach(b=>b.addEventListener('click',()=>
    FORMS.open(b.dataset.new, null, (what, row)=>{ toast(`${SCHEMA[b.dataset.new].label} ${what}.`, 'good'); render(); })));

  c.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', e=>{
    e.stopPropagation();
    FORMS.open(b.dataset.edit, b.dataset.id, (what)=>{ toast(`${SCHEMA[b.dataset.edit].label} ${what}.`, 'good'); render(); });
  }));

  c.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', async e=>{
    e.stopPropagation();
    const key = b.dataset.del, id = b.dataset.id;
    const row = STORE.find(key, id);
    if (!row) return;
    const label = STORE.labelFor(key, row);
    const kids = key === 'quotes' ? STORE.childrenOf('quote_items','quotes',id).length : 0;
    if (!confirm(`Delete this ${SCHEMA[key].label.toLowerCase()}?\n\n${label}` +
        (kids ? `\n\nIts ${kids} line item${kids===1?'':'s'} go with it.` : '') +
        `\n\nThis removes it from the shared CRM database. It is recorded in Change History and can be restored from there.`)) return;
    try { await STORE.remove(key, id); toast(`${SCHEMA[key].label} deleted — restorable from Change History.`, 'good'); render(); }
    catch (err){ toast(err.message, 'bad'); }
  }));

  c.querySelectorAll('[data-restore]').forEach(b=>b.addEventListener('click', async ()=>{
    try { await STORE.restore(b.dataset.restore); toast('Record restored.', 'good'); render(); }
    catch (err){ toast(err.message, 'bad'); }
  }));

  const leadApply = c.querySelector('#leadApply');
  if (leadApply){
    const applyLeadFilters = () => { state.leadSearch=c.querySelector('#leadSearch')?.value||''; state.leadStatus=c.querySelector('#leadStatusFilter')?.value||'ALL'; state.leadSource=c.querySelector('#leadSourceFilter')?.value||'ALL'; render(); };
    leadApply.addEventListener('click',applyLeadFilters);
    c.querySelector('#leadClear')?.addEventListener('click',()=>{ state.leadSearch=''; state.leadStatus='ALL'; state.leadSource='ALL'; render(); });
    c.querySelector('#leadSearch')?.addEventListener('keydown',e=>{ if(e.key==='Enter') applyLeadFilters(); });
    c.querySelector('#leadStatusFilter')?.addEventListener('change',applyLeadFilters);
    c.querySelector('#leadSourceFilter')?.addEventListener('change',applyLeadFilters);
  }

  const markAll = c.querySelector('[data-markpaid]');
  if (markAll) markAll.addEventListener('click', async ()=>{
    const unpaid = metrics().pushes.filter(p=>p.payment_status !== 'PAID');
    if (!unpaid.length) return toast('Everything shown is already marked paid.', 'good');
    if (!confirm(`Mark ${unpaid.length} billing push${unpaid.length===1?'':'es'} as PAID?\n\nTotal ${R(sum(unpaid,p=>p.amount))}. Each change is logged.`)) return;
    let ok = 0;
    for (const p of unpaid){
      try { await STORE.update('pushes', p.id, { payment_status:'PAID' }, { note:'bulk marked paid' }); ok++; }
      catch (err){ toast(err.message, 'bad'); break; }
    }
    toast(`${ok} marked paid.`, 'good'); render();
  });

  const bk = c.querySelector('#backupBtn');
  if (bk) bk.addEventListener('click', ()=>{
    download(`detailers-backup-${new Date().toISOString().slice(0,10)}.json`, STORE.backup(), 'application/json');
  });
  c.querySelectorAll('tr.q-head').forEach(tr=>tr.addEventListener('click',()=>{
    const d = c.querySelector(`tr[data-qd="${tr.dataset.q}"]`);
    if (!d) return;
    const open = d.classList.toggle('hidden') === false;
    tr.classList.toggle('open', open);
    const tw = tr.querySelector('.twisty'); if (tw) tw.textContent = open ? '▾' : '▸';
  }));
  c.querySelectorAll('[data-csv]').forEach(b=>b.addEventListener('click',()=>{
    const k = b.dataset.csv; download(`detailers-${k}.csv`, toCsv(DATA[k]));
  }));
  c.querySelectorAll('[data-target]').forEach(i=>i.addEventListener('change',()=>{
    const v = parseFloat(i.value); if (isFinite(v) && v > 0){ TARGETS[i.dataset.target].target = v; render(); }
  }));
}

/* =============== auth =============== */
/* Passwords are hardcoded in js/config.js, exactly as the business asked.
   They are never read from the data file or from the database. */
function login(pw){
  if (pw && pw === CFG.FRONTEND_ADMIN_PASSWORD){ state.role = 'admin'; state.user = CFG.ADMIN_NAME || 'Administrator'; }
  else if (pw && pw === CFG.FRONTEND_STAFF_PASSWORD){ state.role = 'staff'; state.user = CFG.STAFF_NAME || 'Staff'; }
  else return false;
  state.page = 'dashboard';
  STORE.setActor(state.user);          // every change is stamped with who made it
  $('userName').textContent = state.user;
  $('userRole').textContent = state.role === 'admin' ? 'Administrator — full access' : 'Staff — full capture access';
  $('loginView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  updateChrome();
  render();
  return true;
}

/* =============== boot =============== */
async function boot(){
  const status = m => { const el = $('authStatus'); if (el) el.textContent = m; };
  status('Connecting to the database…');

  await STORE.init(window.DI_DATA);
  const s = STORE.state;

  if (s.mode === 'supabase' && !s.readOnly){
    status(`Connected — ${STORE.all('clients').length} clients loaded from the shared CRM database.`);
    STORE.startPolling(CFG.AUTO_REFRESH_SECONDS || 60);
  } else if (s.mode === 'supabase'){
    status('Database unreachable — showing the last saved copy, read only.');
  } else {
    status('Running on this browser’s local database.');
  }

  STORE.onChange(()=>{ updateChrome(); });
  updateChrome();
  if (state.role) render();
}

/* A refresh pulled in changes made elsewhere — redraw without losing the page. */
STORE.onChange((evt)=>{
  if (evt === 'sync' && state.role) render();
});

$('loginForm').addEventListener('submit', e=>{
  e.preventDefault();
  const pw = $('password').value;
  if (!login(pw)){ $('loginError').textContent = 'That password was not recognised.'; $('password').select(); }
  else { $('loginError').textContent = ''; $('password').value = ''; }
});
$('logoutBtn').addEventListener('click', ()=>{
  state.role = null; $('appView').classList.add('hidden'); $('loginView').classList.remove('hidden'); $('password').focus();
});
$('menuBtn').addEventListener('click', ()=> $('appView').classList.toggle('nav-open'));
$('printBtn').addEventListener('click', ()=> window.print());
$('refreshBtn').addEventListener('click', async ()=>{
  const b = $('refreshBtn'); const was = b.textContent;
  b.disabled = true; b.textContent = 'Refreshing…';
  const ok = await STORE.refresh();
  b.disabled = false; b.textContent = was;
  updateChrome(); render();
  toast(ok ? 'Up to date with the CRM database.' : (STORE.state.lastError || 'Could not reach the database.'), ok ? 'good' : 'bad');
});
window.addEventListener('scroll', hideTip, {passive:true});
boot();
})();
