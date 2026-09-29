/* =====================================================================
   Modal record editor.

   Builds an add/edit form from js/schema.js, validates before it saves,
   and for a quote also edits its line items in the same window, keeping
   the subtotal, VAT and total calculated rather than typed.
   ===================================================================== */
window.DI_FORMS = (() => {
  'use strict';

  const S = () => window.DI_SCHEMA;
  const store = () => window.DI_STORE;
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const num = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
  const money = v => 'R' + num(v).toLocaleString('en-ZA',{minimumFractionDigits:2, maximumFractionDigits:2});
  const today = () => new Date().toISOString().slice(0,10);
  const plusDays = d => new Date(Date.now() + d*864e5).toISOString().slice(0,10);
  const thisMonth = () => new Date().toISOString().slice(0,7);

  let host = null, onDone = null, ctx = null;

  function mount(){
    if (host) return host;
    host = document.createElement('div');
    host.id = 'formModal';
    host.className = 'modal hidden';
    document.body.appendChild(host);
    return host;
  }

  function defaultFor(f, key){
    if (f.def === 'today') return today();
    if (f.def === 'plus7') return plusDays(7);
    if (f.def === 'thisMonth') return thisMonth();
    if (f.def === 'nextQuote') return nextQuoteNumber();
    return f.def !== undefined ? f.def : (f.type === 'checkbox' ? false : '');
  }

  function nextQuoteNumber(){
    const yr = new Date().getFullYear();
    const nums = store().all('quotes')
      .map(q => /QTE-(\d{4})-(\d+)/.exec(q.quote_number || ''))
      .filter(m => m && m[1] === String(yr))
      .map(m => parseInt(m[2], 10));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `QTE-${yr}-${String(next).padStart(4,'0')}`;
  }

  function suggestions(name){
    const st = store();
    if (name === 'areas') return [...new Set(st.all('clients').map(c=>c.area).filter(Boolean))].sort();
    if (name === 'vendors') return [...new Set(st.all('expenses').map(e=>e.vendor).filter(Boolean))].sort();
    if (name === 'serviceCategories') return [...new Set(st.all('services').map(s=>s.category).filter(Boolean))].sort();
    if (name === 'leadAreas') return [...new Set(st.all('leads').map(r=>st.fieldValue('leads',r,'area')).filter(Boolean))].sort();
    if (name === 'leadServices') return [...new Set(st.all('leads').map(r=>st.fieldValue('leads',r,'service_interest')).filter(Boolean))].sort();
    if (name === 'leadOwners') return [...new Set(st.all('leads').map(r=>st.fieldValue('leads',r,'assigned_to')).filter(Boolean))].sort();
    return [];
  }

  function refOptions(refKey){
    const def = S()[refKey];
    return store().all(refKey)
      .map(r => ({ id:r.id, label: store().labelFor(refKey, r) }))
      .sort((a,b)=> a.label.localeCompare(b.label));
  }

  function fieldHtml(f, value, key){
    const id = 'f_' + f.k;
    const req = f.required ? ' <span style="color:var(--critical)">*</span>' : '';
    const help = f.help ? `<small class="fhelp">${esc(f.help)}</small>` : '';
    let input;

    switch (f.type){
      case 'textarea':
        input = `<textarea id="${id}" name="${f.k}" rows="2" placeholder="${esc(f.placeholder||'')}">${esc(value ?? '')}</textarea>`;
        break;
      case 'select': {
        const rawOptions = typeof f.options === 'function' ? f.options() : (f.options || []);
        const options = [...rawOptions.map(String)];
        if (value !== null && value !== undefined && value !== '' && !options.includes(String(value))) options.unshift(String(value));
        input = `<select id="${id}" name="${f.k}">${f.allowBlank ? '<option value="">—</option>' : ''}` +
          options.map(o=>`<option value="${esc(o)}"${String(value)===String(o)?' selected':''}>${esc(o)}</option>`).join('') + '</select>';
        break;
      }
      case 'ref': {
        const opts = refOptions(f.ref);
        input = `<select id="${id}" name="${f.k}"><option value="">${f.allowBlank ? '— none —' : '— choose —'}</option>` +
          opts.map(o=>`<option value="${esc(o.id)}"${value===o.id?' selected':''}>${esc(o.label)}</option>`).join('') + '</select>';
        break;
      }
      case 'checkbox':
        input = `<label class="cbx"><input type="checkbox" id="${id}" name="${f.k}"${value?' checked':''}> <span>${esc(f.label)}</span></label>`;
        return `<div class="field ${f.wide?'full':''}">${input}${help}</div>`;
      case 'money':
        input = `<input type="number" step="0.01" id="${id}" name="${f.k}" value="${value ?? ''}" placeholder="0.00">`;
        break;
      case 'number':
        input = `<input type="number" step="1" id="${id}" name="${f.k}" value="${value ?? ''}">`;
        break;
      case 'date':
        input = `<input type="date" id="${id}" name="${f.k}" value="${(value||'').slice(0,10)}">`;
        break;
      case 'month':
        input = `<input type="month" id="${id}" name="${f.k}" value="${(value||'').slice(0,7)}">`;
        break;
      default: {
        const list = f.suggest ? ` list="dl_${f.k}"` : '';
        const dl = f.suggest ? `<datalist id="dl_${f.k}">${suggestions(f.suggest).map(s=>`<option value="${esc(s)}">`).join('')}</datalist>` : '';
        input = `<input type="${f.type==='email'?'email':f.type==='tel'?'tel':'text'}" id="${id}" name="${f.k}" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder||'')}"${list}>${dl}`;
      }
    }
    return `<div class="field ${f.type==='textarea'||f.wide?'full':''}"><label for="${id}">${esc(f.label)}${req}</label>${input}${help}</div>`;
  }

  /* ------------------------------------------------------ line items UI */
  function itemsTable(items){
    const rows = items.map((it,i)=>`
      <tr data-i="${i}">
        <td><input class="li" data-f="description" value="${esc(it.description||'')}" placeholder="Description"></td>
        <td><select class="li" data-f="service_id"><option value="">— price list —</option>${
          store().all('services').sort((a,b)=>(a.service_name||'').localeCompare(b.service_name||''))
            .map(s=>`<option value="${esc(s.id)}"${it.service_id===s.id?' selected':''}>${esc(s.service_name)} · R${num(s.price).toFixed(0)}</option>`).join('')
        }</select></td>
        <td><input class="li num" data-f="quantity" type="number" step="1" min="0" value="${it.quantity ?? 1}"></td>
        <td><input class="li num" data-f="unit_price" type="number" step="0.01" value="${it.unit_price ?? 0}"></td>
        <td><input class="li num" data-f="labour_cost" type="number" step="0.01" value="${it.labour_cost ?? 0}"></td>
        <td><input class="li num" data-f="product_cost" type="number" step="0.01" value="${it.product_cost ?? 0}"></td>
        <td class="right lt">${money(num(it.quantity)*num(it.unit_price))}</td>
        <td><button type="button" class="btn small danger" data-del-item="${i}">✕</button></td>
      </tr>`).join('');
    return `
    <div class="table-wrap" style="margin-top:6px">
      <table class="table items-table" style="min-width:780px">
        <thead><tr><th>Description</th><th>From price list</th><th class="right">Qty</th><th class="right">Unit R</th>
          <th class="right">Labour R</th><th class="right">Product R</th><th class="right">Line total</th><th></th></tr></thead>
        <tbody id="itemsBody">${rows || '<tr><td colspan="8" class="muted" style="text-align:center;padding:16px">No line items yet — add one below.</td></tr>'}</tbody>
      </table>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <button type="button" class="btn small" id="addItem">+ Add line item</button>
      <span class="muted" style="font-size:11px">Totals below are calculated from these lines — they are never typed in.</span>
    </div>
    <div class="totals" id="quoteTotals"></div>`;
  }

  function recalcTotals(){
    if (!ctx || ctx.key !== 'quotes') return;
    const sub = ctx.items.reduce((t,i)=> t + num(i.quantity)*num(i.unit_price), 0);
    const vatOn = !!(host.querySelector('[name="vat_enabled"]') || {}).checked;
    const vat = vatOn ? sub*0.15 : 0;
    const cost = ctx.items.reduce((t,i)=> t + (num(i.labour_cost)+num(i.product_cost))*num(i.quantity), 0);
    const total = sub + vat;
    const el = host.querySelector('#quoteTotals');
    if (el) el.innerHTML = `
      <div class="trow"><span>Subtotal</span><b>${money(sub)}</b></div>
      <div class="trow"><span>VAT ${vatOn?'(15%)':'(off)'}</span><b>${money(vat)}</b></div>
      <div class="trow big"><span>Quote total</span><b>${money(total)}</b></div>
      <div class="trow muted"><span>Direct cost / margin</span><b>${money(cost)} · ${total?((total-cost)/total*100).toFixed(0):0}%</b></div>`;
    host.querySelectorAll('#itemsBody tr[data-i]').forEach(tr=>{
      const it = ctx.items[+tr.dataset.i];
      const cell = tr.querySelector('.lt');
      if (it && cell) cell.textContent = money(num(it.quantity)*num(it.unit_price));
    });
  }

  function readItemsFromDom(){
    if (!ctx || ctx.key !== 'quotes') return;
    host.querySelectorAll('#itemsBody tr[data-i]').forEach(tr=>{
      const i = +tr.dataset.i;
      tr.querySelectorAll('.li').forEach(inp=>{ ctx.items[i][inp.dataset.f] = inp.value; });
    });
  }

  /* ------------------------------------------------------------- open it */
  function open(key, id, done){
    mount();
    const def = S()[key];
    const existing = id ? store().find(key, id) : null;
    const values = {};
    def.fields.forEach(f => { values[f.k] = existing ? store().fieldValue(key, existing, f.k) : defaultFor(f, key); });

    ctx = { key, id, values, items: [] };
    if (key === 'quotes'){
      ctx.items = id
        ? store().childrenOf('quote_items', 'quotes', id)
            .sort((a,b)=>num(a.sort_order)-num(b.sort_order))
            .map(r => Object.assign({}, r))
        : [];
    }
    onDone = done;

    const isEdit = !!id;
    host.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <h3>${isEdit ? 'Edit' : 'New'} ${esc(def.label.toLowerCase())}${isEdit ? ` — ${esc(store().labelFor(key, existing))}` : ''}</h3>
          <button class="btn" id="formClose" aria-label="Close">✕</button>
        </div>
        <form id="recForm" novalidate>
          <div class="form-grid">${def.fields.map(f=>fieldHtml(f, values[f.k], key)).join('')}</div>
          ${key === 'quotes' ? `<div class="full" style="margin-top:14px"><h4 style="margin:0 0 2px;font-size:12px">Line items</h4>${itemsTable(ctx.items)}</div>` : ''}
          <div class="form-error" id="formError"></div>
          <div class="actions">
            ${isEdit ? `<button type="button" class="btn danger" id="formDelete">Delete</button>` : ''}
            <span style="flex:1"></span>
            <button type="button" class="btn" id="formCancel">Cancel</button>
            <button type="submit" class="btn primary" id="formSave">${isEdit ? 'Save changes' : 'Create ' + esc(def.label.toLowerCase())}</button>
          </div>
        </form>
      </div>`;
    host.classList.remove('hidden');
    wire(key, id, def);
    const first = host.querySelector('input:not([type=checkbox]), select, textarea');
    if (first) first.focus();
    recalcTotals();
  }

  function wire(key, id, def){
    const close = () => { host.classList.add('hidden'); host.innerHTML = ''; ctx = null; };
    host.querySelector('#formClose').addEventListener('click', close);
    host.querySelector('#formCancel').addEventListener('click', close);
    host.addEventListener('mousedown', e => { if (e.target === host) close(); });
    document.addEventListener('keydown', function onEsc(e){
      if (e.key === 'Escape' && host && !host.classList.contains('hidden')){ close(); document.removeEventListener('keydown', onEsc); }
    });

    if (key === 'quotes'){
      const vat = host.querySelector('[name="vat_enabled"]');
      if (vat) vat.addEventListener('change', recalcTotals);

      host.addEventListener('input', e => {
        if (e.target.classList.contains('li')){ readItemsFromDom(); recalcTotals(); }
      });
      host.addEventListener('change', e => {
        if (e.target.classList.contains('li') && e.target.dataset.f === 'service_id'){
          const svc = store().find('services', e.target.value);
          const tr = e.target.closest('tr'); const i = +tr.dataset.i;
          if (svc){
            ctx.items[i].description = svc.service_name;
            ctx.items[i].unit_price = num(svc.price);
            ctx.items[i].labour_cost = num(svc.labour_cost);
            ctx.items[i].product_cost = num(svc.product_cost);
            tr.querySelector('[data-f="description"]').value = svc.service_name;
            tr.querySelector('[data-f="unit_price"]').value = num(svc.price);
            tr.querySelector('[data-f="labour_cost"]').value = num(svc.labour_cost);
            tr.querySelector('[data-f="product_cost"]').value = num(svc.product_cost);
          }
          recalcTotals();
        }
      });
      host.querySelector('#addItem').addEventListener('click', ()=>{
        readItemsFromDom();
        ctx.items.push({ description:'', service_id:'', quantity:1, unit_price:0, labour_cost:0, product_cost:0, sort_order:ctx.items.length });
        redrawItems();
      });
      host.addEventListener('click', e => {
        const b = e.target.closest('[data-del-item]');
        if (!b) return;
        readItemsFromDom();
        ctx.items.splice(+b.dataset.delItem, 1);
        redrawItems();
      });
    }

    const del = host.querySelector('#formDelete');
    if (del) del.addEventListener('click', async ()=>{
      const label = store().labelFor(key, store().find(key, id));
      if (!confirm(`Delete this ${def.label.toLowerCase()}?\n\n${label}\n\nIt is recorded in the change history and can be restored from the Change History page.`)) return;
      try {
        await store().remove(key, id);
        close();
        if (onDone) onDone('deleted', null);
      } catch (err){ showError(err.message); }
    });

    host.querySelector('#recForm').addEventListener('submit', async e => {
      e.preventDefault();
      showError('');
      const btn = host.querySelector('#formSave');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const vals = collect(def);
        if (key === 'quotes'){ readItemsFromDom(); vals.__items = ctx.items.map(i => ({ total_price: num(i.quantity)*num(i.unit_price) })); }
        const saved = id ? await store().update(key, id, vals) : await store().create(key, vals);
        if (key === 'quotes') await syncItems(saved.id);
        close();
        if (onDone) onDone(id ? 'updated' : 'created', saved);
      } catch (err){
        showError(err.message);
        btn.disabled = false; btn.textContent = id ? 'Save changes' : 'Create ' + def.label.toLowerCase();
      }
    });
  }

  function redrawItems(){
    const wrap = host.querySelector('#itemsBody').closest('.table-wrap').parentElement;
    const scroll = host.querySelector('.modal-card').scrollTop;
    wrap.innerHTML = `<h4 style="margin:0 0 2px;font-size:12px">Line items</h4>` + itemsTable(ctx.items);
    host.querySelector('#addItem').addEventListener('click', ()=>{
      readItemsFromDom();
      ctx.items.push({ description:'', service_id:'', quantity:1, unit_price:0, labour_cost:0, product_cost:0, sort_order:ctx.items.length });
      redrawItems();
    });
    host.querySelector('.modal-card').scrollTop = scroll;
    recalcTotals();
  }

  /* Write the line items back: update what changed, add what is new,
     remove what was taken off the quote. */
  async function syncItems(quoteId){
    const existing = store().childrenOf('quote_items', 'quotes', quoteId);
    const keep = new Set();
    for (let i = 0; i < ctx.items.length; i++){
      const it = ctx.items[i];
      if (!String(it.description || '').trim()) continue;
      const payload = {
        description: it.description, service_id: it.service_id || null,
        quantity: num(it.quantity), unit_price: num(it.unit_price),
        labour_cost: num(it.labour_cost), product_cost: num(it.product_cost),
        sort_order: i
      };
      if (it.id && existing.some(e => e.id === it.id)){
        keep.add(it.id);
        await store().update('quote_items', it.id, payload, { note:'edited with its quote' });
      } else {
        const made = await store().create('quote_items', payload, { parentId: quoteId, note:'added with its quote' });
        keep.add(made.id);
      }
    }
    for (const e of existing){
      if (!keep.has(e.id)) await store().remove('quote_items', e.id, { note:'removed from its quote' });
    }
    /* Totals follow the lines. */
    const items = store().childrenOf('quote_items', 'quotes', quoteId);
    const q = store().find('quotes', quoteId);
    const sub = items.reduce((t,i)=> t + num(i.total_price), 0);
    const vat = q.vat_enabled ? +(sub*0.15).toFixed(2) : 0;
    if (num(q.subtotal) !== +sub.toFixed(2) || num(q.amount) !== +(sub+vat).toFixed(2)){
      await store().update('quotes', quoteId,
        { subtotal:+sub.toFixed(2), vat_amount:vat, amount:+(sub+vat).toFixed(2) },
        { note:'totals recalculated from the line items' });
    }
  }

  function collect(def){
    const out = {};
    def.fields.forEach(f => {
      const el = host.querySelector(`[name="${f.k}"]`);
      if (!el) return;
      out[f.k] = f.type === 'checkbox' ? el.checked : el.value;
    });
    return out;
  }

  function showError(msg){
    const el = host.querySelector('#formError');
    if (el){ el.textContent = msg || ''; el.style.display = msg ? 'block' : 'none'; }
  }

  return { open, nextQuoteNumber };
})();
