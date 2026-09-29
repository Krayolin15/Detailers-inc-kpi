/* =====================================================================
   Record definitions — what each table holds, how it is edited and how
   it is displayed. The forms, the validation and the tables all read
   from here, so adding a field means editing one place.

   `derive` runs before every save and recalculates the fields the
   business rules own (a service's profit, a quote's VAT), so those can
   never drift from the numbers they come from.
   ===================================================================== */
window.DI_SCHEMA = (() => {
  'use strict';

  const num = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
  const VEHICLES = ['Sedan/Hatch', 'Mini SUV/Cross', 'Large SUV/4x4'];
  const VAT_RATE = 0.15;

  return {
    /* ------------------------------------------------------------ */
    clients: {
      table: 'clients', label: 'Client', plural: 'Clients', icon: '◆',
      titleField: 'name',
      fields: [
        { k:'name', label:'Client name', type:'text', required:true, max:120 },
        { k:'phone', label:'Phone', type:'tel', placeholder:'082 123 4567' },
        { k:'email', label:'Email', type:'email' },
        { k:'area', label:'Area / site', type:'text', suggest:'areas' },
        { k:'client_type', label:'Client type', type:'select', options:['MOBILE','DETAIL'], def:'MOBILE', required:true },
        { k:'monthly_subscription', label:'Monthly fee (R)', type:'money', def:0,
          help:'The recurring amount billed each month.' },
        { k:'jobs_override', label:'Jobs per month override', type:'number', def:0,
          help:'Leave at 0 to use the washes actually logged.' },
        { k:'notes', label:'Notes', type:'textarea' }
      ]
    },

    /* ------------------------------------------------------------ */
    subs: {
      table: 'client_month_subscriptions', label: 'Subscription', plural: 'Subscriptions', icon: '↻',
      titleField: null,
      title: (r, look) => `${look.client(r.client_id)} — R${num(r.amount).toFixed(2)}`,
      fields: [
        { k:'client_id', label:'Client', type:'ref', ref:'clients', required:true },
        { k:'amount', label:'Monthly amount (R)', type:'money', required:true, min:0 },
        { k:'start_date', label:'Start date', type:'date', required:true, def:'today' },
        { k:'end_date', label:'End date', type:'date', help:'Leave blank while the subscription is running.' },
        { k:'status', label:'Status', type:'select', options:['ACTIVE','PAUSED','CANCELLED'], def:'ACTIVE', required:true },
        { k:'payment_status', label:'Payment', type:'select', options:['UNPAID','PAID'], def:'UNPAID', required:true },
        { k:'notes', label:'Notes', type:'textarea' }
      ],
      /* The client's headline fee and their subscription amount are the
         same number in two places — keep them together. */
      after: (row, api) => {
        const c = api.get('clients', row.client_id);
        if (c && row.status === 'ACTIVE' && num(c.monthly_subscription) !== num(row.amount)) {
          return { table:'clients', id: c.id, patch: { monthly_subscription: num(row.amount) },
                   why: `client fee kept in step with the subscription` };
        }
        return null;
      }
    },

    /* ------------------------------------------------------------ */
    pushes: {
      table: 'client_pushes', label: 'Billing push', plural: 'Billing pushes', icon: 'R',
      title: (r, look) => `${look.client(r.client_id)} — ${r.period}`,
      fields: [
        { k:'client_id', label:'Client', type:'ref', ref:'clients', required:true },
        { k:'period', label:'Billing period', type:'month', required:true, def:'thisMonth',
          help:'The month being charged, e.g. 2026-09.' },
        { k:'push_date', label:'Date pushed', type:'date', required:true, def:'today' },
        { k:'group_type', label:'Group', type:'select', options:['MOBILE','DETAIL'], def:'MOBILE', required:true },
        { k:'jobs', label:'Jobs / washes done', type:'number', def:0, min:0 },
        { k:'amount', label:'Amount (R)', type:'money', required:true, min:0 },
        { k:'payment_status', label:'Payment', type:'select', options:['UNPAID','PAID'], def:'UNPAID', required:true },
        { k:'notes', label:'Notes', type:'textarea' }
      ],
      /* Default the amount to whatever the client is contracted for. */
      prefill: (row, api) => {
        if (!row.amount && row.client_id){
          const c = api.get('clients', row.client_id);
          if (c) row.amount = num(c.monthly_subscription);
        }
        return row;
      }
    },

    /* ------------------------------------------------------------ */
    quotes: {
      table: 'quotes', label: 'Quote', plural: 'Quotes', icon: '▱',
      titleField: 'quote_number',
      lineItems: 'quote_items',
      fields: [
        { k:'quote_number', label:'Quote number', type:'text', required:true, def:'nextQuote' },
        { k:'client_name', label:'Client name', type:'text', required:true,
          help:'Typed in free — link it to a client record below if they are on the books.' },
        { k:'client_id', label:'Linked client', type:'ref', ref:'clients', allowBlank:true },
        { k:'service', label:'Service summary', type:'text' },
        { k:'vehicle_type', label:'Vehicle', type:'select', options:VEHICLES, allowBlank:true },
        { k:'site', label:'Site / address', type:'text' },
        { k:'quote_date', label:'Quote date', type:'date', required:true, def:'today' },
        { k:'valid_until', label:'Valid until', type:'date', def:'plus7' },
        { k:'status', label:'Status', type:'select', options:['DRAFT','SENT','ACCEPTED','DECLINED','EXPIRED'], def:'DRAFT', required:true },
        { k:'outcome', label:'Outcome', type:'select', options:['PENDING','SUCCESS','FAILED'], def:'PENDING', required:true,
          help:'SUCCESS counts as won revenue on the dashboard.' },
        { k:'vat_enabled', label:'Add 15% VAT', type:'checkbox', def:false },
        { k:'notes', label:'Notes shown on the quote', type:'textarea' }
      ],
      /* Totals always come from the line items — never typed by hand. */
      derive: (row, items) => {
        const subtotal = (items || []).reduce((t,i)=> t + num(i.total_price), 0);
        row.subtotal = +subtotal.toFixed(2);
        row.vat_amount = row.vat_enabled ? +(subtotal * VAT_RATE).toFixed(2) : 0;
        row.amount = +(row.subtotal + row.vat_amount).toFixed(2);
        return row;
      }
    },

    /* ------------------------------------------------------------ */
    quote_items: {
      table: 'quote_items', label: 'Line item', plural: 'Line items', icon: '·',
      titleField: 'description',
      parent: { key:'quotes', fk:'quote_id' },
      fields: [
        { k:'description', label:'Description', type:'text', required:true },
        { k:'service_id', label:'From price list', type:'ref', ref:'services', allowBlank:true },
        { k:'quantity', label:'Qty', type:'number', def:1, min:0, required:true },
        { k:'unit_price', label:'Unit price (R)', type:'money', def:0, required:true },
        { k:'labour_cost', label:'Labour cost (R)', type:'money', def:0 },
        { k:'product_cost', label:'Product cost (R)', type:'money', def:0 },
        { k:'sort_order', label:'Order', type:'number', def:0 }
      ],
      derive: (row) => { row.total_price = +(num(row.quantity) * num(row.unit_price)).toFixed(2); return row; }
    },

    /* ------------------------------------------------------------ */
    leads: {
      table: 'leads', label: 'Lead', plural: 'Leads', icon: 'L',
      titleField: 'name',
      /* The CRM may use a slightly different historical name for a lead
         column. store.js maps these fields onto the live CRM columns. */
      fields: [
        { k:'name', label:'Lead / contact name', type:'text', required:true, max:120,
          help:'Use the person or lead name. The live CRM mapper also supports first_name + last_name.' },
        { k:'company', label:'Company / business', type:'text', max:160 },
        { k:'phone', label:'Phone', type:'tel', placeholder:'082 123 4567' },
        { k:'email', label:'Email', type:'email' },
        { k:'area', label:'Area / location', type:'text', suggest:'leadAreas' },
        { k:'source', label:'Lead source', type:'select', def:'Other',
           options:['Social Media','Email Marketing','Cold Call','Walk ins','Referral','Google','Other'] },
        { k:'status', label:'Pipeline status', type:'select', required:true, def:'OPEN',
           options:['OPEN','WON','LOST'] },
        { k:'service_interest', label:'Service interested in', type:'text', suggest:'leadServices' },
        { k:'estimated_value', label:'Estimated value (R)', type:'money', def:0, min:0,
          help:'Potential value of the opportunity, not cash collected.' },
        { k:'next_follow_up', label:'Next follow-up', type:'date' },
        { k:'assigned_to', label:'Assigned to', type:'text', suggest:'leadOwners' },
        { k:'notes', label:'Notes', type:'textarea', wide:true }
      ]
    },

    /* ------------------------------------------------------------ */
    expenses: {
      table: 'expenses', label: 'Expense', plural: 'Expenses', icon: '▤',
      titleField: 'description',
      fields: [
        { k:'expense_date', label:'Date', type:'date', required:true, def:'today' },
        { k:'category', label:'Category', type:'select', required:true, def:'Other',
          options:['Salaries / Wages','Fuel','Insurance','Marketing','Vehicle & Maintenance',
                   'Products & Chemicals','Equipment','Airtime & Data','Rent','Other'] },
        { k:'description', label:'Description', type:'text', required:true },
        { k:'vendor', label:'Vendor / supplier', type:'text', suggest:'vendors' },
        { k:'amount', label:'Amount (R)', type:'money', required:true, min:0 },
        { k:'paid_by', label:'Paid by', type:'select', options:['Detailers Inc','Fuel Card','Petty Cash','Owner','Card'], def:'Detailers Inc' },
        { k:'notes', label:'Notes', type:'textarea' }
      ]
    },

    /* ------------------------------------------------------------ */
    services: {
      table: 'services', label: 'Service', plural: 'Services', icon: '✦',
      titleField: 'service_name',
      fields: [
        { k:'service_name', label:'Service name', type:'text', required:true },
        { k:'category', label:'Category', type:'text', required:true, suggest:'serviceCategories' },
        { k:'stage', label:'Stage', type:'text' },
        { k:'vehicle_type', label:'Vehicle', type:'select', options:VEHICLES, required:true, def:'Sedan/Hatch' },
        { k:'price', label:'Price (R)', type:'money', required:true, min:0 },
        { k:'labour_cost', label:'Labour cost (R)', type:'money', def:0, min:0 },
        { k:'product_cost', label:'Product cost (R)', type:'money', def:0, min:0 },
        { k:'sort_order', label:'Sort order', type:'number', def:0 }
      ],
      /* Cost and profit are always price minus inputs. */
      derive: (row) => {
        row.total_cost = +(num(row.labour_cost) + num(row.product_cost)).toFixed(2);
        row.profit = +(num(row.price) - row.total_cost).toFixed(2);
        return row;
      }
    }
  };
})();
