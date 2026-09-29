/* =====================================================================
   The data layer.

   When DI_CONFIG.USE_SUPABASE is on, this reads and writes the SAME
   Supabase tables the Detailers Compass CRM uses. There is one database
   behind both apps, so a quote captured in the CRM shows up here, and a
   quote captured here shows up in the CRM. No syncing, no copies.

   Safety rules this layer enforces:
     · every create, update and delete is written to an audit trail
     · a delete keeps the full row, so it can be restored afterwards
     · if the database cannot be reached, the app goes READ ONLY rather
       than accepting edits that would quietly disappear
     · a local copy of the last good read is kept so the dashboard still
       opens and shows figures while offline
   ===================================================================== */
window.DI_STORE = (() => {
  'use strict';

  const CFG = window.DI_CONFIG || {};
  const SCHEMA = window.DI_SCHEMA || {};
  const KEYS = Object.keys(SCHEMA);
  const CACHE_KEY = 'di_cache_v1';
  const AUDIT_KEY = 'di_audit_v1';

  /* Columns the database fills in itself — never send them on insert. */
  const GENERATED = ['id', 'created_at', 'updated_at'];

  const state = {
    mode: 'local',          // 'supabase' | 'local'
    online: false,
    readOnly: false,
    lastSync: null,
    lastError: null,
    actor: 'Unknown'
  };

  /* The live CRM has a `leads` table. These aliases let this dashboard work
     with common CRM naming variants without creating a second lead table. */
  const LEAD_ALIASES = {
    name: ['name','lead_name','full_name','contact_name','contact_person'],
    company: ['company','company_name','business_name','organisation','organization'],
    phone: ['phone','phone_number','mobile','cellphone','cell'],
    email: ['email','email_address'],
    area: ['area','location','city','region'],
    source: ['source','lead_source','origin'],
    status: ['status','lead_status','pipeline_stage','stage'],
    service_interest: ['service_interest','service','service_name','interested_service'],
    estimated_value: ['estimated_value','deal_value','value','potential_value','quote_value'],
    next_follow_up: ['next_follow_up','follow_up_date','next_followup','next_follow_up_date'],
    assigned_to: ['assigned_to','owner','salesperson','sales_rep','account_owner'],
    notes: ['notes','description','comments','comment']
  };

  let leadColumns = new Set();
  let data = {};            // key -> array of rows
  let audit = [];           // newest first
  const listeners = [];

  /* ---------------------------------------------------------------- utils */
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      }));
  const nowIso = () => new Date().toISOString();
  const clone = o => JSON.parse(JSON.stringify(o));
  const tableOf = key => (SCHEMA[key] || {}).table || key;
  const keyOfTable = t => KEYS.find(k => tableOf(k) === t) || t;

  function emit(evt){ listeners.forEach(fn => { try { fn(evt, state); } catch(e){ console.error(e); } }); }
  function onChange(fn){ listeners.push(fn); }

  /* ------------------------------------------------------- local storage */
  function saveLocal(){
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: nowIso(), data }));
      localStorage.setItem(AUDIT_KEY, JSON.stringify(audit.slice(0, 500)));
    } catch (e){ /* private mode, quota — the app still works in memory */ }
  }
  function loadLocal(){
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw){ const p = JSON.parse(raw); if (p && p.data) return p; }
    } catch (e){}
    return null;
  }
  function loadAudit(){
    try { const raw = localStorage.getItem(AUDIT_KEY); if (raw) return JSON.parse(raw) || []; } catch (e){}
    return [];
  }

  /* ------------------------------------------------------------- Supabase */
  function url(path){ return String(CFG.SUPABASE_URL).replace(/\/$/, '') + '/rest/v1/' + path; }
  function headers(extra){
    return Object.assign({
      apikey: CFG.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }, extra || {});
  }
  async function rest(path, opts){
    const res = await fetch(url(path), opts);
    if (!res.ok){
      let detail = res.statusText;
      try { const j = await res.json(); detail = j.message || j.hint || detail; } catch (e){}
      throw new Error(`${res.status} ${detail}`);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /* Resolve the live CRM column for one dashboard lead field. */
  function leadColumn(field){
    const cols = [...leadColumns];
    if (!cols.length) return field;
    const aliases = LEAD_ALIASES[field] || [field];
    return aliases.find(a => cols.includes(a)) || null;
  }

  function csvHeaderLine(line){
    const out = [];
    let cur = '', quoted = false;
    for (let i = 0; i < line.length; i++){
      const ch = line[i];
      if (ch === '"'){
        if (quoted && line[i+1] === '"'){ cur += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === ',' && !quoted){ out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out.map(x => x.replace(/^\uFEFF/, '').replace(/^"|"$/g,''));
  }

  async function discoverLeadColumns(){
    try {
      const res = await fetch(url(tableOf('leads') + '?select=*&limit=0'),
        { headers: headers({ Accept:'text/csv' }) });
      if (!res.ok) return;
      const text = await res.text();
      const first = text.split(/\r?\n/)[0] || '';
      if (first) leadColumns = new Set(csvHeaderLine(first).filter(Boolean));
    } catch (e){ /* column discovery is a compatibility aid, not a hard dependency */ }
  }

  function leadFieldValue(row, field){
    if (!row) return null;
    const aliases = LEAD_ALIASES[field] || [field];
    const found = aliases.find(k => Object.prototype.hasOwnProperty.call(row, k));
    if (found) return row[found];
    if (field === 'name'){
      const first = row.first_name || row.firstname || '';
      const last = row.last_name || row.lastname || '';
      if (first || last) return `${first} ${last}`.trim();
    }
    return null;
  }

  function mapLeadPayload(row){
    const out = {};
    const name = String(row.name || '').trim();
    for (const field of Object.keys(LEAD_ALIASES)){
      const col = leadColumn(field);
      if (!col) continue;
      if (field === 'name' && leadColumns.size && !leadColumns.has(col)) continue;
      if (field === 'estimated_value'){
        out[col] = (row[field] === '' || row[field] == null) ? 0 : parseFloat(row[field]) || 0;
      } else {
        out[col] = row[field] === undefined ? null : row[field];
      }
    }
    /* Some CRMs split a lead's name into first/last name rather than one field. */
    if (name && !leadColumn('name') && leadColumns.size){
      const parts = name.split(/\s+/).filter(Boolean);
      if (leadColumns.has('first_name')) out.first_name = parts.shift() || '';
      if (leadColumns.has('last_name')) out.last_name = parts.join(' ');
    }
    return out;
  }

  /* ------------------------------------------------------------- reading */
  async function pull(){
    if (state.mode !== 'supabase') return false;
    const fresh = {};
    for (const key of KEYS){
      if (SCHEMA[key].parent && false) continue;
      fresh[key] = await rest(tableOf(key) + '?select=*', { headers: headers() });
    }
    leadColumns = new Set((fresh.leads || []).flatMap(r => Object.keys(r)));
    if (!leadColumns.size) await discoverLeadColumns();
    data = fresh;
    state.online = true;
    state.readOnly = false;
    state.lastSync = nowIso();
    state.lastError = null;
    saveLocal();
    emit('sync');
    return true;
  }

  async function refresh(){
    try {
      const ok = await pull();
      if (ok) return true;
    } catch (err){
      state.online = false;
      state.readOnly = true;
      state.lastError = err.message;
      emit('offline');
      return false;
    }
    return false;
  }

  /* --------------------------------------------------------------- audit */
  function record(action, key, id, label, before, after, note){
    const entry = {
      id: uuid(), at: nowIso(), actor: state.actor, action,
      table_name: tableOf(key), record_key: key, record_id: id,
      record_label: label || '', note: note || '',
      before: before ? clone(before) : null,
      after: after ? clone(after) : null,
      synced: false
    };
    audit.unshift(entry);
    saveLocal();
    /* Best effort — a missing audit_log table must never block a save. */
    if (state.mode === 'supabase'){
      rest('audit_log', { method:'POST', headers: headers({ Prefer:'return=minimal' }),
        body: JSON.stringify({
          at: entry.at, actor: entry.actor, action: entry.action,
          table_name: entry.table_name, record_id: entry.record_id,
          record_label: entry.record_label, note: entry.note,
          before_data: entry.before, after_data: entry.after
        })
      }).then(() => { entry.synced = true; saveLocal(); })
        .catch(() => { /* keeps the local trail either way */ });
    }
    return entry;
  }

  function labelFor(key, row){
    if (key === 'leads'){
      const nm = leadFieldValue(row, 'name');
      const co = leadFieldValue(row, 'company');
      return nm || co || '(untitled lead)';
    }
    const def = SCHEMA[key] || {};
    if (typeof def.title === 'function') return def.title(row, lookups());
    if (def.titleField) return row[def.titleField] || '(untitled)';
    return def.label || key;
  }
  function lookups(){
    return { client: id => (find('clients', id) || {}).name || 'Unlinked client' };
  }

  /* --------------------------------------------------------------- reads */
  function all(key){ return (data[key] || []).slice(); }
  function find(key, id){ return (data[key] || []).find(r => r.id === id) || null; }
  function childrenOf(key, parentKey, parentId){
    const fk = (SCHEMA[key].parent || {}).fk;
    return (data[key] || []).filter(r => r[fk] === parentId);
  }

  /* -------------------------------------------------------------- writes */
  function guard(){
    if (state.readOnly) throw new Error('The database is unreachable, so the app is read only right now. Reconnect and try again — nothing has been lost.');
  }

  function prepare(key, row){
    const def = SCHEMA[key];
    const out = {};
    def.fields.forEach(f => {
      let v = row[f.k];
      if (f.type === 'money' || f.type === 'number'){
        v = (v === '' || v === null || v === undefined) ? (f.def ?? 0) : parseFloat(v);
        if (!isFinite(v)) v = 0;
      } else if (f.type === 'checkbox'){
        v = !!v;
      } else if (v === '' || v === undefined){
        v = null;
      }
      out[f.k] = v;
    });
    if (def.derive) def.derive(out, row.__items || []);
    return out;
  }

  function validate(key, row){
    const errs = [];
    SCHEMA[key].fields.forEach(f => {
      const v = row[f.k];
      if (f.required && (v === null || v === undefined || v === '' ||
          (f.type === 'ref' && !f.allowBlank && !v))) errs.push(`${f.label} is required.`);
      if ((f.type === 'money' || f.type === 'number') && f.min !== undefined && parseFloat(v) < f.min)
        errs.push(`${f.label} cannot be below ${f.min}.`);
      if (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errs.push(`${f.label} does not look like an email address.`);
      if (f.max && v && String(v).length > f.max) errs.push(`${f.label} is longer than ${f.max} characters.`);
    });
    return errs;
  }

  async function create(key, input, opts){
    guard();
    const row = prepare(key, input);
    const errs = validate(key, row);
    if (errs.length) throw new Error(errs.join(' '));
    if (opts && opts.parentId) row[(SCHEMA[key].parent || {}).fk] = opts.parentId;

    let saved;
    if (state.mode === 'supabase'){
      const dbRow = key === 'leads' ? mapLeadPayload(row) : row;
      const res = await rest(tableOf(key), {
        method: 'POST', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(dbRow)
      });
      saved = Array.isArray(res) ? res[0] : res;
    } else {
      saved = Object.assign({ id: uuid(), created_at: nowIso() }, row);
    }
    (data[key] = data[key] || []).push(saved);
    record('CREATE', key, saved.id, labelFor(key, saved), null, saved, opts && opts.note);
    await cascade(key, saved);
    saveLocal(); emit('write');
    return saved;
  }

  async function update(key, id, input, opts){
    guard();
    const before = find(key, id);
    if (!before) throw new Error('That record no longer exists — it may have been removed in the CRM. Refresh and try again.');
    const row = prepare(key, Object.assign({}, before, input));
    const errs = validate(key, row);
    if (errs.length) throw new Error(errs.join(' '));

    let saved;
    if (state.mode === 'supabase'){
      let patch = Object.assign({}, row);
      GENERATED.forEach(c => delete patch[c]);
      if (key === 'leads') patch = mapLeadPayload(row);
      if ('updated_at' in before && key !== 'leads') patch.updated_at = nowIso();
      const res = await rest(`${tableOf(key)}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(patch)
      });
      saved = Array.isArray(res) ? res[0] : res;
      if (!saved) throw new Error('The database accepted the change but returned nothing — refresh to confirm it saved.');
    } else {
      saved = Object.assign({}, before, row, { updated_at: nowIso() });
    }
    const i = data[key].findIndex(r => r.id === id);
    data[key][i] = saved;
    record('UPDATE', key, id, labelFor(key, saved), before, saved, opts && opts.note);
    await cascade(key, saved);
    saveLocal(); emit('write');
    return saved;
  }

  async function remove(key, id, opts){
    guard();
    const before = find(key, id);
    if (!before) throw new Error('That record has already been removed.');

    /* Take the children with it, and keep them for the restore. */
    const kids = [];
    KEYS.forEach(k => {
      const p = SCHEMA[k].parent;
      if (p && p.key === key) childrenOf(k, key, id).forEach(c => kids.push({ key:k, row:c }));
    });

    if (state.mode === 'supabase'){
      await rest(`${tableOf(key)}?id=eq.${encodeURIComponent(id)}`, { method:'DELETE', headers: headers({ Prefer:'return=minimal' }) });
    }
    data[key] = (data[key] || []).filter(r => r.id !== id);
    kids.forEach(c => { data[c.key] = (data[c.key] || []).filter(r => r.id !== c.row.id); });

    const entry = record('DELETE', key, id, labelFor(key, before), before, null, opts && opts.note);
    entry.children = kids.map(c => ({ key:c.key, row: clone(c.row) }));
    saveLocal(); emit('write');
    return entry;
  }

  /* Put a deleted record back, children and all. */
  async function restore(auditId){
    guard();
    const entry = audit.find(a => a.id === auditId);
    if (!entry || entry.action !== 'DELETE' || !entry.before) throw new Error('There is nothing to restore from that entry.');
    if (find(entry.record_key, entry.record_id)) throw new Error('That record is already back in place.');

    const put = async (key, row) => {
      if (state.mode === 'supabase'){
        await rest(tableOf(key), { method:'POST', headers: headers({ Prefer:'return=minimal' }), body: JSON.stringify(row) });
      }
      (data[key] = data[key] || []).push(clone(row));
    };
    await put(entry.record_key, entry.before);
    for (const c of (entry.children || [])) await put(c.key, c.row);

    record('RESTORE', entry.record_key, entry.record_id, entry.record_label, null, entry.before,
           `restored a record deleted ${new Date(entry.at).toLocaleString('en-ZA')}`);
    saveLocal(); emit('write');
    return entry.before;
  }

  /* A schema may ask for a sibling row to be kept in step. */
  async function cascade(key, row){
    const def = SCHEMA[key];
    if (!def.after) return;
    const act = def.after(row, { get: (k,id) => find(k,id) });
    if (!act) return;
    try {
      const target = KEYS.find(k => tableOf(k) === act.table) || act.table;
      const before = find(target, act.id);
      if (!before) return;
      let saved;
      if (state.mode === 'supabase'){
        const res = await rest(`${act.table}?id=eq.${encodeURIComponent(act.id)}`, {
          method:'PATCH', headers: headers({ Prefer:'return=representation' }), body: JSON.stringify(act.patch)
        });
        saved = Array.isArray(res) ? res[0] : res;
      } else {
        saved = Object.assign({}, before, act.patch);
      }
      if (saved){
        const i = data[target].findIndex(r => r.id === act.id);
        data[target][i] = saved;
        record('UPDATE', target, act.id, labelFor(target, saved), before, saved, act.why);
      }
    } catch (e){ console.warn('follow-up update failed:', e.message); }
  }

  /* ------------------------------------------------------------- backups */
  function backup(){
    return JSON.stringify({
      exported_at: nowIso(),
      exported_by: state.actor,
      source: state.mode === 'supabase' ? CFG.SUPABASE_URL : 'local browser storage',
      tables: Object.fromEntries(KEYS.map(k => [tableOf(k), data[k] || []])),
      audit
    }, null, 1);
  }

  /* ---------------------------------------------------------------- boot */
  async function init(seed){
    audit = loadAudit();
    const cached = loadLocal();

    if (CFG.USE_SUPABASE && CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY){
      state.mode = 'supabase';
      try {
        await pull();
      } catch (err){
        state.online = false;
        state.readOnly = true;
        state.lastError = err.message;
        data = (cached && cached.data) || seed || {};
        if (cached) state.lastSync = cached.at;
      }
    } else {
      state.mode = 'local';
      state.online = true;
      state.readOnly = false;
      if (cached && cached.data){
        data = cached.data;
        state.lastSync = cached.at;
      } else {
        data = seed || {};
        saveLocal();
      }
    }
    emit('init');
    return state;
  }

  function setActor(name){ state.actor = name; }

  /* Poll so a change made in the CRM turns up here without a reload. */
  let timer = null;
  function startPolling(seconds){
    stopPolling();
    if (state.mode !== 'supabase' || !seconds) return;
    timer = setInterval(() => { refresh(); }, Math.max(15, seconds) * 1000);
  }
  function stopPolling(){ if (timer) clearInterval(timer); timer = null; }

  return {
    init, refresh, setActor, startPolling, stopPolling, onChange,
    all, find, childrenOf, create, update, remove, restore,
    validate, prepare, labelFor, backup,
    fieldValue: (key, row, field) => key === 'leads' ? leadFieldValue(row, field) : (row || {})[field],
    leadColumn: field => leadColumn(field),
    get state(){ return state; },
    get audit(){ return audit.slice(); },
    get data(){ return data; },
    counts(){ return Object.fromEntries(KEYS.map(k => [tableOf(k), (data[k] || []).length])); }
  };
})();
